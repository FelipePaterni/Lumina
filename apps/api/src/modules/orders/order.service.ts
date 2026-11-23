import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { EditionFormat, OrderStatus, PaymentMethod, Prisma, RefundStatus } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { calculateCouponDiscount, validateCouponAvailability } from "../coupons/coupon.rules.js";
import { ShippingAddressInput, matchesShippingRule, validateShippingAddress } from "../shipping/shipping.rules.js";
import { SimulatedPaymentService } from "../payments/simulated-payment.service.js";
import { NotificationEventType } from "../notifications/notification-event.js";
import { NotificationService } from "../notifications/notification.service.js";
import { formatBrl } from "../cart/money.js";
import { sumOrderTotals, validateIdempotencyKey } from "./order.rules.js";
import { allocateBundlePrice, BundleRuleError, calculateBundlePrice } from "../bundles/bundle.rules.js";
import { preorderAvailability } from "../preorders/preorder.rules.js";

const orderInclude = {
  items: {
    orderBy: { createdAt: "asc" as const },
    include: {
      edition: { select: { work: { select: { releaseDate: true } } } },
      refunds: { orderBy: { requestedAt: "asc" as const } },
    },
  },
  bundlePurchases: {
    orderBy: { createdAt: "asc" as const },
    include: {
      items: {
        orderBy: { createdAt: "asc" as const },
        include: { edition: { select: { work: { select: { releaseDate: true } } } } },
      },
    },
  },
  shippingAddress: true,
  payment: true,
  user: { select: { email: true } },
} satisfies Prisma.OrderInclude;

const cartInclude = {
  coupon: true,
  items: {
    include: { edition: { include: { work: true, inventory: true } } },
    orderBy: { createdAt: "asc" as const },
  },
  bundles: {
    include: {
      bundle: {
        include: {
          items: {
            orderBy: { workId: "asc" as const },
            include: {
              work: {
                include: {
                  editions: {
                    where: { format: EditionFormat.DIGITAL },
                    include: { inventory: true },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.CartInclude;

type OrderView = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: SimulatedPaymentService,
    private readonly notifications: NotificationService,
  ) {}

  async checkout(userId: string, idempotencyKeyInput: unknown, addressInput?: ShippingAddressInput) {
    const idempotencyKey = validateIdempotencyKey(idempotencyKeyInput);
    const existing = await this.findByKey(userId, idempotencyKey);
    if (existing) return this.present(existing);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const result = await this.prisma.$transaction(
          (tx) => this.createOrder(tx, userId, idempotencyKey, addressInput),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 },
        );
        if (result.created) {
          await this.notifications.dispatchSimulatedEmail({
            eventKey: `order:${result.order.id}:confirmed`,
            eventType: NotificationEventType.ORDER_CONFIRMED,
            toEmail: result.order.user.email,
            subject: "Lumina Livros - Pedido confirmado",
            body: `Seu pedido foi confirmado. Identificador: ${result.order.id}. Total: ${formatBrl(result.order.totalCents)}.`,
          }).catch(() => {
            this.logger.warn("notification persistence failed event=ORDER_CONFIRMED");
          });
        }
        return this.present(result.order);
      } catch (error) {
        if (this.isTransactionConflict(error) && attempt < 2) continue;
        if (this.prismaCode(error) === "P2002") {
          const idempotentOrder = await this.findByKey(userId, idempotencyKey);
          if (idempotentOrder) return this.present(idempotentOrder);
        }
        if (this.isTransactionConflict(error)) {
          throw new ConflictException("O carrinho mudou durante a confirmação; tente novamente");
        }
        throw error;
      }
    }
    throw new ConflictException("Não foi possível confirmar o pedido; tente novamente");
  }

  async get(userId: string, orderId: string) {
    if (!this.isUuid(orderId)) throw new NotFoundException("Pedido não encontrado");
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException("Pedido não encontrado");
    return this.present(order);
  }

  private async createOrder(
    tx: Prisma.TransactionClient,
    userId: string,
    idempotencyKey: string,
    addressInput?: ShippingAddressInput,
  ): Promise<{ order: OrderView; created: boolean }> {
    const prior = await tx.order.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: orderInclude,
    });
    if (prior) return { order: prior, created: false };

    const carts = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM carts WHERE user_id = ${userId} FOR UPDATE
    `;
    if (carts.length === 0) throw new ConflictException("Carrinho vazio");

    const cart = await tx.cart.findUnique({ where: { userId }, include: cartInclude });
    if (!cart || (cart.items.length === 0 && cart.bundles.length === 0)) throw new ConflictException("Carrinho vazio");
    const bundleIds = cart.bundles.map((entry) => entry.bundleId).sort();
    if (bundleIds.length > 0) {
      await tx.$queryRaw(Prisma.sql`
        SELECT id FROM bundles WHERE id IN (${Prisma.join(bundleIds)}) ORDER BY id FOR UPDATE
      `);
    }
    const bundleEditionIds = cart.bundles.flatMap((entry) => entry.bundle.items.map((item) => item.work.editions[0]?.id).filter((id): id is string => Boolean(id)));
    const editionIds = [...new Set([...cart.items.map((item) => item.editionId), ...bundleEditionIds])].sort();
    if (editionIds.length === 0) throw new ConflictException("Bundle sem edições digitais disponíveis");
    await tx.$queryRaw(Prisma.sql`
      SELECT edition_id FROM inventories
      WHERE edition_id IN (${Prisma.join(editionIds)})
      ORDER BY edition_id
      FOR UPDATE
    `);
    if (cart.couponId) {
      await tx.$queryRaw`SELECT id FROM coupons WHERE id = ${cart.couponId} FOR UPDATE`;
    }

    const lockedCart = await tx.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
    if (!lockedCart || (lockedCart.items.length === 0 && lockedCart.bundles.length === 0)) throw new ConflictException("Carrinho vazio");
    const now = new Date();
    const physicalItems = lockedCart.items.filter((item) => item.edition.format === EditionFormat.PHYSICAL);
    const physicalQuantity = physicalItems.reduce((sum, item) => sum + item.quantity, 0);

    for (const item of lockedCart.items) {
      if (!item.edition.isVisible || !item.edition.work.isVisible) {
        throw new ConflictException("Uma edição do carrinho não está mais disponível");
      }
      if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 ||
          (item.edition.format === EditionFormat.DIGITAL && item.quantity !== 1)) {
        throw new ConflictException("A quantidade de uma edição do carrinho é inválida");
      }
      if (item.edition.format === EditionFormat.PHYSICAL && !item.edition.inventory) {
        throw new ConflictException("Disponibilidade da edição não configurada");
      }
    }

    const [ownedLibraryItems, previousPurchases] = await Promise.all([
      tx.libraryItem.findMany({ where: { userId, editionId: { in: editionIds } }, select: { editionId: true } }),
      tx.orderItem.findMany({
        where: {
          editionId: { in: editionIds },
          format: EditionFormat.DIGITAL,
          refunds: { none: { status: RefundStatus.PROCESSED } },
          order: { userId, status: { in: [OrderStatus.CONFIRMED, OrderStatus.PARTIALLY_REFUNDED] } },
        },
        select: { editionId: true },
      }),
    ]);
    const ownedEditionIds = new Set([...ownedLibraryItems, ...previousPurchases].map((item) => item.editionId));
    const directDigitalIds = lockedCart.items.filter((item) => item.edition.format === EditionFormat.DIGITAL).map((item) => item.editionId);
    if (directDigitalIds.some((editionId) => ownedEditionIds.has(editionId))) {
      throw new ConflictException("Você já possui um e-book do carrinho");
    }

    const bundleQuotes = lockedCart.bundles.map((entry) => {
      const bundle = entry.bundle;
      if (!bundle.isActive || bundle.items.length < 2 || bundle.items.some((item) => !item.work.isVisible || !item.work.editions[0]?.isVisible)) {
        throw new ConflictException("O bundle não está mais disponível");
      }
      const items = bundle.items.map((item) => {
        const edition = item.work.editions[0];
        if (!edition) throw new ConflictException("Edição digital do bundle indisponível");
        if (
          edition.inventory?.digitalLicenseLimit != null &&
          edition.inventory.digitalAllocated >= edition.inventory.digitalLicenseLimit
        ) {
          throw new ConflictException("Licença digital indisponível");
        }
        return { editionId: edition.id, currentPriceCents: edition.priceCents, owned: ownedEditionIds.has(edition.id) };
      });
      try {
        return { bundle, quote: calculateBundlePrice(bundle.priceCents, items) };
      } catch (error) {
        if (error instanceof BundleRuleError && error.code === "ALL_ITEMS_OWNED") {
          throw new ConflictException("Você já possui todos os e-books deste bundle");
        }
        throw error;
      }
    });

    const grantEditionIds = [...directDigitalIds, ...bundleQuotes.flatMap(({ quote }) => quote.itemsToGrant.map((item) => item.editionId))];
    if (new Set(grantEditionIds).size !== grantEditionIds.length) {
      throw new ConflictException("O carrinho contém o mesmo e-book mais de uma vez");
    }

    const directSubtotalCents = lockedCart.items.reduce((sum, item) => sum + item.edition.priceCents * item.quantity, 0);
    const bundlesSubtotalCents = bundleQuotes.reduce((sum, entry) => sum + entry.quote.chargedPriceCents, 0);
    const subtotalCents = directSubtotalCents + bundlesSubtotalCents;
    if (!Number.isSafeInteger(subtotalCents)) throw new ConflictException("Subtotal do pedido inválido");

    let discountCents = 0;
    let couponCode: string | null = null;
    if (lockedCart.coupon) {
      validateCouponAvailability(lockedCart.coupon, now);
      discountCents = calculateCouponDiscount(lockedCart.coupon, subtotalCents);
      const consumed = await tx.coupon.updateMany({
        where: {
          id: lockedCart.coupon.id,
          isActive: true,
          validFrom: { lte: now },
          validUntil: { gt: now },
          usageCount: { lt: lockedCart.coupon.maxUses },
        },
        data: { usageCount: { increment: 1 } },
      });
      if (consumed.count !== 1) throw new ConflictException("Cupom indisponível ou sem utilizações restantes");
      couponCode = lockedCart.coupon.code;
    }

    let normalizedAddress: ShippingAddressInput | undefined;
    let shippingCents = 0;
    if (physicalQuantity > 0) {
      const postalCode = validateShippingAddress(addressInput as ShippingAddressInput);
      if (addressInput!.complement !== undefined &&
          (typeof addressInput!.complement !== "string" || addressInput!.complement.trim().length > 120)) {
        throw new BadRequestException("Complemento do endereço inválido");
      }
      normalizedAddress = {
        ...(addressInput as ShippingAddressInput),
        recipientName: addressInput!.recipientName.trim(),
        phone: addressInput!.phone.replace(/\D/g, ""),
        postalCode,
        street: addressInput!.street.trim(),
        number: addressInput!.number.trim(),
        complement: addressInput!.complement?.trim() || undefined,
        district: addressInput!.district.trim(),
        city: addressInput!.city.trim(),
        state: addressInput!.state.trim().toUpperCase(),
      };
      const rules = await tx.shippingRule.findMany({
        where: { isActive: true },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      });
      const rule = rules.find((candidate) => matchesShippingRule(candidate, postalCode, physicalQuantity));
      if (!rule) throw new NotFoundException("Não há regra de frete para este CEP e quantidade");
      shippingCents = rule.priceCents;
    }

    const totalCents = sumOrderTotals(subtotalCents, discountCents, shippingCents);
    const payment = this.payments.confirm(totalCents);

    const allocationLines = [
      ...lockedCart.items.map((item) => ({ edition: item.edition, editionId: item.editionId, quantity: item.quantity })),
      ...bundleQuotes.flatMap(({ bundle, quote }) => quote.itemsToGrant.map((item) => {
        const edition = bundle.items.find((entry) => entry.work.editions[0]?.id === item.editionId)?.work.editions[0];
        if (!edition) throw new ConflictException("Edição digital do bundle indisponível");
        return { edition, editionId: item.editionId, quantity: 1 };
      })),
    ];
    for (const line of allocationLines) {
      if (line.edition.format === EditionFormat.PHYSICAL) {
        const inventory = line.edition.inventory;
        if (!inventory) throw new ConflictException("Disponibilidade da edição não configurada");
        if (inventory.physicalStock < line.quantity) throw new ConflictException("Estoque físico insuficiente");
        const updated = await tx.inventory.updateMany({
          where: { editionId: line.editionId, physicalStock: { gte: line.quantity } },
          data: { physicalStock: { decrement: line.quantity } },
        });
        if (updated.count !== 1) throw new ConflictException("Estoque físico insuficiente");
        await tx.inventoryMovement.create({
          data: { inventoryId: inventory.id, type: "PHYSICAL_SALE", quantity: line.quantity, reason: "Pedido confirmado", actorId: userId },
        });
      } else {
        const inventory = line.edition.inventory ?? await tx.inventory.upsert({
          where: { editionId: line.editionId },
          update: {},
          create: { editionId: line.editionId, digitalLicenseLimit: null },
        });
        if (inventory.digitalLicenseLimit !== null && inventory.digitalAllocated >= inventory.digitalLicenseLimit) {
          throw new ConflictException("Licença digital indisponível");
        }
        const updated = await tx.inventory.updateMany({
          where: { editionId: line.editionId, digitalAllocated: inventory.digitalAllocated },
          data: { digitalAllocated: { increment: 1 } },
        });
        if (updated.count !== 1) throw new ConflictException("Licença digital indisponível");
        await tx.inventoryMovement.create({
          data: { inventoryId: inventory.id, type: "DIGITAL_ALLOCATION", quantity: 1, reason: "Pedido confirmado", actorId: userId },
        });
      }
    }

    const order = await tx.order.create({
      data: {
        userId,
        idempotencyKey,
        status: OrderStatus.CONFIRMED,
        fulfillmentStatus: physicalQuantity > 0 ? "PENDING" : "NOT_REQUIRED",
        subtotalCents,
        discountCents,
        shippingCents,
        totalCents,
        couponCode,
        items: {
          create: lockedCart.items.map((item) => ({
            editionId: item.editionId,
            workTitle: item.edition.work.title,
            format: item.edition.format,
            unitPriceCents: item.edition.priceCents,
            quantity: item.quantity,
          })),
        },
        ...(normalizedAddress ? {
          shippingAddress: {
            create: {
              recipientName: normalizedAddress.recipientName,
              phone: normalizedAddress.phone,
              postalCode: normalizedAddress.postalCode,
              street: normalizedAddress.street,
              number: normalizedAddress.number,
              complement: normalizedAddress.complement,
              district: normalizedAddress.district,
              city: normalizedAddress.city,
              state: normalizedAddress.state,
            },
          },
        } : {}),
        payment: {
          create: { method: PaymentMethod.SIMULATED, status: payment.status, amountCents: payment.amountCents },
        },
      },
      include: orderInclude,
    });

    for (const { bundle, quote } of bundleQuotes) {
      const purchase = await tx.orderBundle.create({
        data: {
          orderId: order.id,
          bundleId: bundle.id,
          bundleName: bundle.name,
          listPriceCents: bundle.priceCents,
          ownershipAdjustmentCents: quote.ownershipAdjustmentCents,
          chargedPriceCents: quote.chargedPriceCents,
        },
      });
      const allocatedPrices = allocateBundlePrice(quote.chargedPriceCents, quote.itemsToGrant.length);
      await tx.orderItem.createMany({
        data: quote.itemsToGrant.map((item, index) => {
          const source = bundle.items.find((entry) => entry.work.editions[0]?.id === item.editionId);
          if (!source) throw new ConflictException("Composição do bundle inválida");
          return {
            orderId: order.id,
            bundlePurchaseId: purchase.id,
            editionId: item.editionId,
            workTitle: source.work.title,
            format: EditionFormat.DIGITAL,
            unitPriceCents: allocatedPrices[index],
            quantity: 1,
          };
        }),
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cartBundle.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    const completedOrder = await tx.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
    return { order: completedOrder, created: true };
  }

  private findByKey(userId: string, idempotencyKey: string) {
    return this.prisma.order.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: orderInclude,
    });
  }

  private present(order: OrderView) {
    return {
      id: order.id,
      status: order.status,
      fulfillmentStatus: order.fulfillmentStatus,
      createdAt: order.createdAt,
      subtotalCents: order.subtotalCents,
      subtotalAmount: formatBrl(order.subtotalCents),
      discountCents: order.discountCents,
      discountAmount: formatBrl(order.discountCents),
      shippingCents: order.shippingCents,
      shippingAmount: formatBrl(order.shippingCents),
      totalCents: order.totalCents,
      totalAmount: formatBrl(order.totalCents),
      couponCode: order.couponCode,
      items: order.items.map((item) => ({
        id: item.id,
        editionId: item.editionId,
        bundlePurchaseId: item.bundlePurchaseId,
        workTitle: item.workTitle,
        format: item.format,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        lineTotalCents: item.unitPriceCents * item.quantity,
        releaseAt: item.edition.work.releaseDate,
        preorderStatus: preorderAvailability(item.edition.work.releaseDate),
        refunds: item.refunds.map((refund) => ({
          id: refund.id,
          status: refund.status,
          quantity: refund.quantity,
          amountCents: refund.amountCents,
          requestReason: refund.requestReason,
          decisionReason: refund.decisionReason,
          requestedAt: refund.requestedAt,
          decidedAt: refund.decidedAt,
          processedAt: refund.processedAt,
          returnConfirmedAt: refund.returnConfirmedAt,
        })),
      })),
      bundles: order.bundlePurchases.map((purchase) => ({
        id: purchase.id,
        name: purchase.bundleName,
        listPriceCents: purchase.listPriceCents,
        ownershipAdjustmentCents: purchase.ownershipAdjustmentCents,
        chargedPriceCents: purchase.chargedPriceCents,
        items: purchase.items.map((item) => ({
          editionId: item.editionId,
          workTitle: item.workTitle,
          unitPriceCents: item.unitPriceCents,
          releaseAt: item.edition.work.releaseDate,
          preorderStatus: preorderAvailability(item.edition.work.releaseDate),
        })),
      })),
      shippingAddress: order.shippingAddress,
      payment: order.payment,
    };
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private prismaCode(error: unknown): string | undefined {
    return typeof error === "object" && error !== null && "code" in error &&
      typeof error.code === "string" ? error.code : undefined;
  }

  private prismaMetaCode(error: unknown): string | undefined {
    if (typeof error !== "object" || error === null || !("meta" in error) ||
        typeof error.meta !== "object" || error.meta === null || !("code" in error.meta)) return undefined;
    return String(error.meta.code);
  }

  private isTransactionConflict(error: unknown): boolean {
    const code = this.prismaCode(error);
    const metaCode = this.prismaMetaCode(error);
    return code === "P2034" || (code === "P2010" && (metaCode === "40001" || metaCode === "40P01"));
  }
}
