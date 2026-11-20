import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EditionFormat, OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { calculateCouponDiscount, validateCouponAvailability } from "../coupons/coupon.rules.js";
import { ShippingAddressInput, matchesShippingRule, validateShippingAddress } from "../shipping/shipping.rules.js";
import { SimulatedPaymentService } from "../payments/simulated-payment.service.js";
import { formatBrl } from "../cart/money.js";
import { sumOrderTotals, validateIdempotencyKey } from "./order.rules.js";

const orderInclude = {
  items: { orderBy: { createdAt: "asc" as const } },
  shippingAddress: true,
  payment: true,
} satisfies Prisma.OrderInclude;

const cartInclude = {
  coupon: true,
  items: {
    include: { edition: { include: { work: true, inventory: true } } },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.CartInclude;

type OrderView = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: SimulatedPaymentService,
  ) {}

  async checkout(userId: string, idempotencyKeyInput: unknown, addressInput?: ShippingAddressInput) {
    const idempotencyKey = validateIdempotencyKey(idempotencyKeyInput);
    const existing = await this.findByKey(userId, idempotencyKey);
    if (existing) return this.present(existing);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const order = await this.prisma.$transaction(
          (tx) => this.createOrder(tx, userId, idempotencyKey, addressInput),
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15_000 },
        );
        return this.present(order);
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
  ): Promise<OrderView> {
    const prior = await tx.order.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: orderInclude,
    });
    if (prior) return prior;

    const carts = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM carts WHERE user_id = ${userId} FOR UPDATE
    `;
    if (carts.length === 0) throw new ConflictException("Carrinho vazio");

    const cart = await tx.cart.findUnique({ where: { userId }, include: cartInclude });
    if (!cart || cart.items.length === 0) throw new ConflictException("Carrinho vazio");

    const editionIds = [...new Set(cart.items.map((item) => item.editionId))].sort();
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
    if (!lockedCart || lockedCart.items.length === 0) throw new ConflictException("Carrinho vazio");
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
      if (!item.edition.inventory) throw new ConflictException("Disponibilidade da edição não configurada");
      if (item.edition.format === EditionFormat.DIGITAL) {
        const [ownedLibrary, previousPurchase] = await Promise.all([
          tx.libraryItem.findFirst({ where: { userId, editionId: item.editionId }, select: { id: true } }),
          tx.orderItem.findFirst({
            where: { editionId: item.editionId, format: EditionFormat.DIGITAL, order: { userId, status: OrderStatus.CONFIRMED } },
            select: { id: true },
          }),
        ]);
        if (ownedLibrary || previousPurchase) throw new ConflictException("Você já possui este e-book");
      }
    }

    const subtotalCents = lockedCart.items.reduce(
      (sum, item) => sum + item.edition.priceCents * item.quantity,
      0,
    );
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

    for (const item of lockedCart.items) {
      const inventory = item.edition.inventory!;
      if (item.edition.format === EditionFormat.PHYSICAL) {
        if (inventory.physicalStock < item.quantity) throw new ConflictException("Estoque físico insuficiente");
        const updated = await tx.inventory.updateMany({
          where: { editionId: item.editionId, physicalStock: { gte: item.quantity } },
          data: { physicalStock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) throw new ConflictException("Estoque físico insuficiente");
        await tx.inventoryMovement.create({
          data: { inventoryId: inventory.id, type: "PHYSICAL_SALE", quantity: item.quantity, reason: "Pedido confirmado", actorId: userId },
        });
      } else {
        if (inventory.digitalLicenseLimit !== null && inventory.digitalAllocated >= inventory.digitalLicenseLimit) {
          throw new ConflictException("Licença digital indisponível");
        }
        const updated = await tx.inventory.updateMany({
          where: { editionId: item.editionId, digitalAllocated: inventory.digitalAllocated },
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

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    return order;
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
        editionId: item.editionId,
        workTitle: item.workTitle,
        format: item.format,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        lineTotalCents: item.unitPriceCents * item.quantity,
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
