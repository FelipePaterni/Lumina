import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  EditionFormat,
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
  RefundStatus,
} from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { AuditService } from "../audit/application/services/audit.service.js";
import { Role } from "../identity/domain/role.enum.js";
import { validateIdempotencyKey } from "../orders/order.rules.js";
import {
  allocateOrderDiscount,
  calculateRefundAmountCents,
  canAutomaticallyRefundDigital,
  canCancelPreorder,
  RefundLine,
  validateRefundReason,
} from "./refund.rules.js";

const refundInclude = {
  orderItem: {
    include: {
      edition: {
        include: {
          inventory: true,
          work: { select: { title: true, releaseDate: true } },
        },
      },
      order: { include: { payment: true } },
    },
  },
  requester: { select: { id: true } },
  decider: { select: { id: true } },
} satisfies Prisma.RefundInclude;

type RefundView = Prisma.RefundGetPayload<{ include: typeof refundInclude }>;

@Injectable()
export class RefundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async requestCancellation(
    orderId: string,
    orderItemId: string,
    requesterId: string,
    idempotencyKeyInput: unknown,
    requestReasonInput: unknown,
  ) {
    if (!this.isUuid(orderId) || !this.isUuid(orderItemId)) {
      throw new NotFoundException("Pedido ou item não encontrado");
    }
    const idempotencyKey = validateIdempotencyKey(idempotencyKeyInput);
    const requestReason = validateRefundReason(
      requestReasonInput,
      "Motivo da solicitação",
    );

    return this.serializable(async (tx) => {
      const prior = await tx.refund.findUnique({
        where: { requesterId_idempotencyKey: { requesterId, idempotencyKey } },
        include: refundInclude,
      });
      if (prior) {
        if (
          prior.orderItemId !== orderItemId ||
          prior.orderItem.orderId !== orderId
        ) {
          throw new ConflictException(
            "A chave de idempotência já foi usada em outra solicitação",
          );
        }
        return this.present(prior);
      }

      const lockedOrder = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM orders WHERE id = ${orderId} AND user_id = ${requesterId} FOR UPDATE
      `;
      if (lockedOrder.length === 0)
        throw new NotFoundException("Pedido não encontrado");
      await tx.$queryRaw`
        SELECT id FROM order_items WHERE id = ${orderItemId} AND order_id = ${orderId} FOR UPDATE
      `;

      const item = await tx.orderItem.findFirst({
        where: { id: orderItemId, orderId },
        include: {
          edition: {
            include: {
              inventory: true,
              work: { select: { title: true, releaseDate: true } },
            },
          },
          order: {
            include: {
              payment: true,
              items: {
                select: { id: true, unitPriceCents: true, quantity: true },
              },
            },
          },
          refunds: {
            where: {
              status: {
                in: [
                  RefundStatus.PENDING_REVIEW,
                  RefundStatus.AWAITING_RETURN,
                  RefundStatus.PROCESSED,
                ],
              },
            },
          },
        },
      });
      if (!item) throw new NotFoundException("Item do pedido não encontrado");
      if (
        item.refunds.some((refund) => refund.status === RefundStatus.PROCESSED)
      ) {
        throw new ConflictException("Este item já foi reembolsado");
      }
      if (item.refunds.length > 0) {
        throw new ConflictException(
          "Já existe uma solicitação ativa para este item",
        );
      }
      if (!item.edition.inventory)
        throw new ConflictException("Disponibilidade do item não configurada");

      const now = new Date();
      const lines: RefundLine[] = item.order.items.map((line) => ({
        id: line.id,
        unitPriceCents: line.unitPriceCents,
        quantity: line.quantity,
      }));
      const discounts = allocateOrderDiscount(lines, item.order.discountCents);
      const amountCents = calculateRefundAmountCents(
        {
          id: item.id,
          unitPriceCents: item.unitPriceCents,
          quantity: item.quantity,
        },
        discounts.get(item.id) ?? 0,
      );
      const digital = item.format === EditionFormat.DIGITAL;
      const preorderAllowed =
        item.edition.work.releaseDate <= now ||
        canCancelPreorder(item.edition.work.releaseDate, now);
      let automatic = false;
      if (digital && preorderAllowed) {
        const [firstLink, downloaded] = await Promise.all([
          tx.auditLog.findFirst({
            where: {
              action: "DIGITAL_DOWNLOAD_LINK_ISSUED",
              targetType: "DIGITAL_DOWNLOAD",
              targetId: item.id,
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: { createdAt: true },
          }),
          tx.auditLog.findFirst({
            where: {
              action: "DIGITAL_DOWNLOAD_COMPLETED",
              targetType: "DIGITAL_DOWNLOAD",
              targetId: item.id,
            },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            select: { createdAt: true },
          }),
        ]);
        automatic = canAutomaticallyRefundDigital({
          purchasedAt: item.order.createdAt,
          firstLinkIssuedAt: firstLink?.createdAt ?? null,
          downloadedAt: downloaded?.createdAt ?? null,
          now,
        });
      }

      const refund = await tx.refund.create({
        data: {
          orderItemId: item.id,
          requesterId,
          idempotencyKey,
          quantity: item.quantity,
          amountCents,
          requestReason,
          status: RefundStatus.PENDING_REVIEW,
        },
        include: refundInclude,
      });
      await this.audit.logActionInTransaction(tx, {
        actorId: requesterId,
        actorRole: Role.CUSTOMER,
        action: "REFUND_REQUESTED",
        targetType: "REFUND",
        targetId: refund.id,
        reason: "Solicitação de reembolso registrada",
        metadata: {
          orderId,
          orderItemId,
          quantity: item.quantity,
          amountCents,
        },
      });

      if (digital && automatic) {
        const processed = await this.processRefund(
          tx,
          refund.id,
          item,
          requesterId,
          Role.CUSTOMER,
          now,
        );
        await this.audit.logActionInTransaction(tx, {
          actorId: requesterId,
          actorRole: Role.CUSTOMER,
          action: "REFUND_PROCESSED",
          targetType: "REFUND",
          targetId: refund.id,
          reason: "Reembolso automático dentro da janela",
          metadata: { orderId, orderItemId, amountCents, automated: true },
        });
        return this.present(processed);
      }
      return this.present(refund);
    });
  }

  async listPending() {
    const refunds = await this.prisma.refund.findMany({
      where: {
        status: {
          in: [RefundStatus.PENDING_REVIEW, RefundStatus.AWAITING_RETURN],
        },
      },
      include: {
        ...refundInclude,
        orderItem: {
          include: {
            edition: {
              select: { format: true, work: { select: { title: true } } },
            },
            order: { select: { id: true, fulfillmentStatus: true } },
          },
        },
      },
      orderBy: [{ requestedAt: "asc" }, { id: "asc" }],
    });
    return refunds.map((refund) => this.present(refund));
  }

  async decide(
    refundId: string,
    adminId: string,
    decisionInput: unknown,
    reasonInput: unknown,
    returnConfirmedInput?: unknown,
  ) {
    if (!this.isUuid(refundId))
      throw new NotFoundException("Solicitação de reembolso não encontrada");
    if (decisionInput !== "APPROVE" && decisionInput !== "REJECT") {
      throw new BadRequestException("Decisão inválida");
    }
    if (
      returnConfirmedInput !== undefined &&
      typeof returnConfirmedInput !== "boolean"
    ) {
      throw new BadRequestException("Confirmação de devolução inválida");
    }
    const reason = validateRefundReason(reasonInput, "Motivo administrativo");

    return this.serializable(async (tx) => {
      const refund = await this.lockRefund(tx, refundId);
      if (
        refund.status === RefundStatus.PROCESSED ||
        refund.status === RefundStatus.REJECTED
      ) {
        return this.present(refund);
      }
      if (
        returnConfirmedInput === true &&
        refund.orderItem.format !== EditionFormat.PHYSICAL
      ) {
        throw new BadRequestException(
          "Confirmação de devolução só se aplica a itens físicos",
        );
      }
      if (decisionInput === "REJECT") {
        const rejected = await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: RefundStatus.REJECTED,
            deciderId: adminId,
            decisionReason: reason,
            decidedAt: new Date(),
          },
          include: refundInclude,
        });
        await this.audit.logActionInTransaction(tx, {
          actorId: adminId,
          actorRole: Role.ADMIN,
          action: "REFUND_DECISION",
          targetType: "REFUND",
          targetId: refund.id,
          reason: "Decisão administrativa registrada",
          metadata: { decision: "REJECTED", amountCents: refund.amountCents },
        });
        return this.present(rejected);
      }

      const item = refund.orderItem;
      const now = new Date();
      const decidedAt = refund.decidedAt ?? now;
      if (
        item.format === EditionFormat.PHYSICAL &&
        new Set<FulfillmentStatus>([
          FulfillmentStatus.SHIPPED,
          FulfillmentStatus.DELIVERED,
        ]).has(item.order.fulfillmentStatus) &&
        returnConfirmedInput !== true
      ) {
        const waiting = await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: RefundStatus.AWAITING_RETURN,
            deciderId: adminId,
            decisionReason: reason,
            decidedAt,
          },
          include: refundInclude,
        });
        await this.audit.logActionInTransaction(tx, {
          actorId: adminId,
          actorRole: Role.ADMIN,
          action: "REFUND_DECISION",
          targetType: "REFUND",
          targetId: refund.id,
          reason: "Aprovação aguarda devolução física",
          metadata: {
            decision: "AWAITING_RETURN",
            amountCents: refund.amountCents,
          },
        });
        return this.present(waiting);
      }
      if (
        item.format === EditionFormat.PHYSICAL &&
        returnConfirmedInput === true &&
        item.order.fulfillmentStatus !== FulfillmentStatus.DELIVERED
      ) {
        throw new ConflictException(
          "Confirme a devolução somente após entrega registrada",
        );
      }
      if (
        item.format === EditionFormat.PHYSICAL &&
        !new Set<FulfillmentStatus>([
          FulfillmentStatus.PENDING,
          FulfillmentStatus.PICKING,
          FulfillmentStatus.SHIPPED,
          FulfillmentStatus.DELIVERED,
        ]).has(item.order.fulfillmentStatus)
      ) {
        throw new ConflictException(
          "Estado de fulfillment não permite reembolso físico",
        );
      }

      const processed = await this.processRefund(
        tx,
        refund.id,
        item,
        adminId,
        Role.ADMIN,
        now,
        {
          deciderId: adminId,
          decisionReason: reason,
          decidedAt,
          returnConfirmed: returnConfirmedInput === true,
        },
      );
      await this.audit.logActionInTransaction(tx, {
        actorId: adminId,
        actorRole: Role.ADMIN,
        action:
          returnConfirmedInput === true
            ? "REFUND_RETURN_CONFIRMED"
            : "REFUND_PROCESSED",
        targetType: "REFUND",
        targetId: refund.id,
        reason:
          returnConfirmedInput === true
            ? "Devolução física confirmada pelo Admin"
            : "Reembolso decidido pelo Admin",
        metadata: {
          amountCents: refund.amountCents,
          override: true,
          returnConfirmed: returnConfirmedInput === true,
        },
      });
      return this.present(processed);
    });
  }

  async confirmReturn(refundId: string, adminId: string, reasonInput: unknown) {
    if (!this.isUuid(refundId))
      throw new NotFoundException("Solicitação de reembolso não encontrada");
    const reason = validateRefundReason(reasonInput, "Motivo da confirmação");
    return this.serializable(async (tx) => {
      const refund = await this.lockRefund(tx, refundId);
      if (refund.status === RefundStatus.PROCESSED) return this.present(refund);
      if (refund.status !== RefundStatus.AWAITING_RETURN) {
        throw new ConflictException(
          "Solicitação não está aguardando devolução",
        );
      }
      if (
        refund.orderItem.format !== EditionFormat.PHYSICAL ||
        refund.orderItem.order.fulfillmentStatus !== FulfillmentStatus.DELIVERED
      ) {
        throw new ConflictException(
          "A devolução física só pode ser confirmada após entrega",
        );
      }
      const processed = await this.processRefund(
        tx,
        refund.id,
        refund.orderItem,
        adminId,
        Role.ADMIN,
        new Date(),
        {
          deciderId: adminId,
          decisionReason: reason,
          decidedAt: refund.decidedAt ?? new Date(),
          returnConfirmed: true,
        },
      );
      await this.audit.logActionInTransaction(tx, {
        actorId: adminId,
        actorRole: Role.ADMIN,
        action: "REFUND_RETURN_CONFIRMED",
        targetType: "REFUND",
        targetId: refund.id,
        reason: "Devolução física confirmada pelo Admin",
        metadata: { amountCents: refund.amountCents },
      });
      return this.present(processed);
    });
  }

  private async processRefund(
    tx: Prisma.TransactionClient,
    refundId: string,
    item: RefundView["orderItem"],
    actorId: string,
    actorRole: Role,
    now: Date,
    adminDecision?: {
      deciderId: string;
      decisionReason: string;
      decidedAt: Date;
      returnConfirmed: boolean;
    },
  ) {
    const inventory = item.edition.inventory;
    if (!inventory)
      throw new ConflictException("Disponibilidade do item não configurada");
    await tx.$queryRaw`SELECT id FROM inventories WHERE id = ${inventory.id} FOR UPDATE`;
    const isDigital = item.format === EditionFormat.DIGITAL;
    if (isDigital) {
      const updated = await tx.inventory.updateMany({
        where: { id: inventory.id, digitalAllocated: { gte: item.quantity } },
        data: { digitalAllocated: { decrement: item.quantity } },
      });
      if (updated.count !== 1)
        throw new ConflictException("Não há licença alocada para restaurar");
      await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          type: "DIGITAL_RELEASE",
          quantity: item.quantity,
          reason: "Reembolso processado",
          actorId,
        },
      });
    } else {
      const restoredStock = inventory.physicalStock + item.quantity;
      if (
        !Number.isSafeInteger(restoredStock) ||
        restoredStock > 2_147_483_647
      ) {
        throw new ConflictException("Reposição excede a capacidade de estoque");
      }
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { physicalStock: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          type: "PHYSICAL_RESTOCK",
          quantity: item.quantity,
          reason:
            item.order.fulfillmentStatus === FulfillmentStatus.PENDING ||
            item.order.fulfillmentStatus === FulfillmentStatus.PICKING
              ? "Cancelamento físico antes do envio"
              : "Devolução física confirmada",
          actorId,
        },
      });
    }

    const payment = item.order.payment;
    if (!payment)
      throw new ConflictException("Pagamento do pedido não encontrado");
    const refundAmountCents = await this.getRefundAmount(tx, refundId);
    const refundedCents = payment.refundedCents + refundAmountCents;
    if (
      !Number.isSafeInteger(refundedCents) ||
      refundedCents > payment.amountCents
    ) {
      throw new ConflictException("Reembolso excede o total efetivamente pago");
    }
    const paymentStatus =
      payment.status === PaymentStatus.NOT_REQUIRED
        ? PaymentStatus.NOT_REQUIRED
        : refundedCents >= payment.amountCents
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;
    await tx.payment.update({
      where: { id: payment.id },
      data: { refundedCents, status: paymentStatus },
    });

    const processed = await tx.refund.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.PROCESSED,
        deciderId: adminDecision?.deciderId,
        decisionReason: adminDecision?.decisionReason,
        decidedAt: adminDecision?.decidedAt ?? now,
        returnConfirmedAt: adminDecision?.returnConfirmed ? now : undefined,
        processedAt: now,
      },
      include: refundInclude,
    });
    const [
      orderItemCount,
      processedLineCount,
      physicalItemCount,
      processedPhysicalLineCount,
    ] = await Promise.all([
      tx.orderItem.count({ where: { orderId: item.orderId } }),
      tx.orderItem.count({
        where: {
          orderId: item.orderId,
          refunds: { some: { status: RefundStatus.PROCESSED } },
        },
      }),
      tx.orderItem.count({
        where: { orderId: item.orderId, format: EditionFormat.PHYSICAL },
      }),
      tx.orderItem.count({
        where: {
          orderId: item.orderId,
          format: EditionFormat.PHYSICAL,
          refunds: { some: { status: RefundStatus.PROCESSED } },
        },
      }),
    ]);
    await tx.order.update({
      where: { id: item.orderId },
      data: {
        status:
          processedLineCount === orderItemCount
            ? OrderStatus.REFUNDED
            : OrderStatus.PARTIALLY_REFUNDED,
        ...(physicalItemCount > 0 &&
        processedPhysicalLineCount === physicalItemCount &&
        new Set<FulfillmentStatus>([
          FulfillmentStatus.PENDING,
          FulfillmentStatus.PICKING,
        ]).has(item.order.fulfillmentStatus)
          ? { fulfillmentStatus: FulfillmentStatus.CANCELLED }
          : {}),
      },
    });
    return processed;
  }

  private async getRefundAmount(
    tx: Prisma.TransactionClient,
    refundId: string,
  ) {
    const refund = await tx.refund.findUnique({
      where: { id: refundId },
      select: { amountCents: true },
    });
    if (!refund)
      throw new NotFoundException("Solicitação de reembolso não encontrada");
    return refund.amountCents;
  }

  private async lockRefund(
    tx: Prisma.TransactionClient,
    refundId: string,
  ): Promise<RefundView> {
    const hint = await tx.refund.findUnique({
      where: { id: refundId },
      select: { orderItem: { select: { id: true, orderId: true } } },
    });
    if (!hint)
      throw new NotFoundException("Solicitação de reembolso não encontrada");
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${hint.orderItem.orderId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM order_items WHERE id = ${hint.orderItem.id} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM refunds WHERE id = ${refundId} FOR UPDATE`;
    const refund = await tx.refund.findUnique({
      where: { id: refundId },
      include: refundInclude,
    });
    if (!refund)
      throw new NotFoundException("Solicitação de reembolso não encontrada");
    return refund;
  }

  private async serializable<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15_000,
        });
      } catch (error) {
        const code = this.prismaCode(error);
        if (code === "P2034" && attempt < 2) continue;
        if (code === "P2034")
          throw new ConflictException(
            "A solicitação mudou durante o reembolso; tente novamente",
          );
        throw error;
      }
    }
    throw new ConflictException(
      "Não foi possível concluir o reembolso; tente novamente",
    );
  }

  private present(refund: RefundView) {
    return {
      id: refund.id,
      orderId: refund.orderItem.orderId,
      orderItemId: refund.orderItemId,
      workTitle: refund.orderItem.edition.work.title,
      format: refund.orderItem.edition.format,
      fulfillmentStatus: refund.orderItem.order.fulfillmentStatus,
      quantity: refund.quantity,
      amountCents: refund.amountCents,
      status: refund.status,
      requestReason: refund.requestReason,
      decisionReason: refund.decisionReason,
      requestedAt: refund.requestedAt,
      decidedAt: refund.decidedAt,
      processedAt: refund.processedAt,
      returnConfirmedAt: refund.returnConfirmedAt,
    };
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private prismaCode(error: unknown): string | undefined {
    return typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof error.code === "string"
      ? error.code
      : undefined;
  }
}
