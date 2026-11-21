import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EditionFormat, FulfillmentStatus, OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { Role } from "../identity/domain/role.enum.js";
import { NotificationEventType } from "../notifications/notification-event.js";
import { NotificationService } from "../notifications/notification.service.js";
import { AuditService } from "../audit/application/services/audit.service.js";
import { parseFulfillmentStatus, validateTrackingCode, validateTransition } from "./logistics.rules.js";

const transitionInclude = {
  user: { select: { email: true } },
  items: {
    where: { format: EditionFormat.PHYSICAL },
    include: {
      edition: { select: { work: { select: { releaseDate: true } } } },
      refunds: { where: { status: "PROCESSED" as const }, select: { id: true } },
    },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class LogisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  async transition(orderId: string, statusInput: unknown, trackingInput: unknown, actorId: string, actorRole: Role) {
    const targetStatus = parseFulfillmentStatus(statusInput);
    const logisticsStatuses = new Set<FulfillmentStatus>([
      FulfillmentStatus.PICKING,
      FulfillmentStatus.SHIPPED,
      FulfillmentStatus.DELIVERED,
    ]);
    if (!logisticsStatuses.has(targetStatus)) {
      throw new ConflictException("Este status não pode ser definido pela logística");
    }
    const trackingCode = validateTrackingCode(trackingInput, targetStatus === FulfillmentStatus.SHIPPED);

    let result: Awaited<ReturnType<typeof this.runTransition>>;
    try {
      result = await this.runTransition(orderId, targetStatus, trackingCode, actorId, actorRole);
    } catch (error) {
      if (this.prismaCode(error) === "P2034") {
        throw new ConflictException("O pedido foi atualizado por outra operação; tente novamente");
      }
      throw error;
    }

    if (result.changed) {
      const label = this.statusLabel(targetStatus);
      await this.notifications.dispatchSimulatedEmail({
        eventKey: `order:${result.order.id}:fulfillment:${targetStatus}`,
        eventType: NotificationEventType.ORDER_FULFILLMENT_UPDATED,
        toEmail: result.order.user.email,
        subject: "Lumina Livros - Atualização do pedido",
        body: `O status logístico do seu pedido foi atualizado para: ${label}.${trackingCode ? ` Rastreio: ${trackingCode}.` : ""}`,
      });
    }
    return this.trackingView(result.order.id, result.order.fulfillmentStatus);
  }

  private runTransition(orderId: string, targetStatus: FulfillmentStatus, trackingCode: string | null, actorId: string, actorRole: Role) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId }, include: transitionInclude });
      if (!order || order.items.length === 0) throw new NotFoundException("Pedido físico não encontrado");
      if (order.status === OrderStatus.REFUNDED) throw new ConflictException("Pedido reembolsado não pode avançar na logística");
      validateTransition(order.fulfillmentStatus, targetStatus);
      if (order.fulfillmentStatus === targetStatus) {
        return { order, changed: false, trackingCode: null as string | null };
      }

      const activePhysicalItems = order.items.filter((item) => item.refunds.length === 0);
      if (activePhysicalItems.length === 0) throw new ConflictException("Pedido sem itens físicos elegíveis para envio");
      if (targetStatus === FulfillmentStatus.SHIPPED) {
        const now = new Date();
        if (activePhysicalItems.some((item) => item.edition.work.releaseDate > now)) {
          throw new ConflictException("Pré-venda física só pode ser enviada na data de lançamento");
        }
      }

      const updated = await tx.order.updateMany({
        where: { id: order.id, fulfillmentStatus: order.fulfillmentStatus },
        data: { fulfillmentStatus: targetStatus },
      });
      if (updated.count !== 1) throw new ConflictException("O pedido foi atualizado por outra operação; tente novamente");

      await this.audit.logActionInTransaction(tx, {
        actorId,
        actorRole,
        action: "ORDER_FULFILLMENT_UPDATED",
        targetType: "ORDER",
        targetId: order.id,
        reason: "Transição logística registrada",
        metadata: {
          fromStatus: order.fulfillmentStatus,
          toStatus: targetStatus,
          ...(trackingCode ? { trackingCode } : {}),
        },
      });
      return {
        order: { ...order, fulfillmentStatus: targetStatus },
        changed: true,
        trackingCode,
      };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async getForCustomer(orderId: string, customerId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId: customerId },
      select: { id: true, fulfillmentStatus: true },
    });
    if (!order) throw new NotFoundException("Pedido não encontrado");
    return this.trackingView(order.id, order.fulfillmentStatus);
  }

  async listForStaff(pageInput: unknown, limitInput: unknown) {
    const page = this.parsePage(pageInput, 1, 100);
    const limit = this.parsePage(limitInput, 20, 100);
    const where: Prisma.OrderWhereInput = {
      fulfillmentStatus: { in: [FulfillmentStatus.PENDING, FulfillmentStatus.PICKING, FulfillmentStatus.SHIPPED] },
      status: { not: OrderStatus.REFUNDED },
      items: { some: { format: EditionFormat.PHYSICAL, refunds: { none: { status: "PROCESSED" } } } },
    };
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: {
          id: true,
          fulfillmentStatus: true,
          createdAt: true,
          shippingAddress: {
            select: {
              recipientName: true,
              phone: true,
              postalCode: true,
              street: true,
              number: true,
              complement: true,
              district: true,
              city: true,
              state: true,
            },
          },
          items: {
            where: { format: EditionFormat.PHYSICAL, refunds: { none: { status: "PROCESSED" } } },
            select: {
              workTitle: true,
              quantity: true,
              edition: { select: { work: { select: { releaseDate: true } } } },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    const orderIds = orders.map((order) => order.id);
    const logs = orderIds.length === 0 ? [] : await this.prisma.auditLog.findMany({
      where: { targetType: "ORDER", targetId: { in: orderIds }, action: "ORDER_FULFILLMENT_UPDATED" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { targetId: true, createdAt: true, metadata: true },
    });
    const latestTracking = new Map<string, string>();
    for (const log of logs) {
      if (!log.targetId || latestTracking.has(log.targetId)) continue;
      try {
        const metadata = JSON.parse(log.metadata ?? "{}") as Record<string, unknown>;
        if (typeof metadata.trackingCode === "string") latestTracking.set(log.targetId, metadata.trackingCode);
      } catch { /* ignore malformed historical metadata */ }
    }
    return {
      items: orders.map((order) => ({
        id: order.id,
        fulfillmentStatus: order.fulfillmentStatus,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        items: order.items.map((item) => ({
          workTitle: item.workTitle,
          quantity: item.quantity,
          releaseAt: item.edition.work.releaseDate,
        })),
        trackingCode: latestTracking.get(order.id) ?? null,
      })),
      page,
      limit,
      total,
    };
  }

  private async trackingView(orderId: string, status: FulfillmentStatus) {
    const changes = await this.prisma.auditLog.findMany({
      where: { targetType: "ORDER", targetId: orderId, action: "ORDER_FULFILLMENT_UPDATED" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 20,
      select: { createdAt: true, metadata: true },
    });
    const history = changes.reverse().map((change) => {
      let metadata: Record<string, unknown> = {};
      try { metadata = JSON.parse(change.metadata ?? "{}") as Record<string, unknown>; } catch { /* ignore malformed historical metadata */ }
      return {
        status: metadata.toStatus,
        trackingCode: typeof metadata.trackingCode === "string" ? metadata.trackingCode : null,
        occurredAt: change.createdAt,
      };
    });
    const trackingCode = [...history].reverse().find((event) => event.trackingCode)?.trackingCode ?? null;
    return { orderId, fulfillmentStatus: status, trackingCode, history };
  }

  private statusLabel(status: FulfillmentStatus): string {
    const labels: Record<FulfillmentStatus, string> = {
      [FulfillmentStatus.NOT_REQUIRED]: "não aplicável",
      [FulfillmentStatus.PENDING]: "aguardando separação",
      [FulfillmentStatus.PICKING]: "em separação",
      [FulfillmentStatus.SHIPPED]: "enviado",
      [FulfillmentStatus.DELIVERED]: "entregue",
      [FulfillmentStatus.CANCELLED]: "cancelado",
    };
    return labels[status];
  }

  private parsePage(value: unknown, fallback: number, maximum: number): number {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) {
      throw new BadRequestException("Parâmetro de paginação inválido");
    }
    return parsed;
  }

  private prismaCode(error: unknown): string | undefined {
    return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : undefined;
  }
}
