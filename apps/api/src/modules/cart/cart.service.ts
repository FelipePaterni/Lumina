import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EditionFormat, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { CouponService } from "../coupons/coupon.service.js";
import { LibraryOwnershipService } from "../library/ownership/library-ownership.service.js";
import { ShippingService } from "../shipping/shipping.service.js";
import { formatBrl } from "./money.js";
import {
  ShippingAddressInput,
  validateShippingAddress,
} from "../shipping/shipping.rules.js";

const cartInclude = {
  coupon: true,
  items: {
    include: {
      edition: {
        include: {
          work: true,
          inventory: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.CartInclude;

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coupons: CouponService,
    private readonly shipping: ShippingService,
    private readonly ownership: LibraryOwnershipService,
  ) {}

  private ensureCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  async get(userId: string) {
    const cart = await this.ensureCart(userId);
    const result = await this.prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: cartInclude,
    });
    return this.present(result);
  }

  async add(userId: string, editionId: string, quantity: number) {
    this.validateQuantity(quantity);
    const edition = await this.getAvailableEdition(editionId);
    if (edition.format === EditionFormat.DIGITAL) {
      if (quantity !== 1) throw new BadRequestException("E-book aceita somente uma unidade");
      if (await this.ownership.ownsEdition(userId, editionId)) {
        throw new ConflictException("Você já possui este e-book");
      }
    } else {
      const cart = await this.ensureCart(userId);
      const current = await this.prisma.cartItem.findUnique({
        where: { cartId_editionId: { cartId: cart.id, editionId } },
      });
      this.assertPhysicalStock(edition, (current?.quantity ?? 0) + quantity);
    }

    const cart = await this.ensureCart(userId);
    try {
      if (edition.format === EditionFormat.DIGITAL) {
        await this.prisma.cartItem.create({ data: { cartId: cart.id, editionId, quantity: 1 } });
      } else {
        await this.prisma.cartItem.upsert({
          where: { cartId_editionId: { cartId: cart.id, editionId } },
          update: { quantity: { increment: quantity } },
          create: { cartId: cart.id, editionId, quantity },
        });
      }
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        throw new ConflictException("Este e-book já está no carrinho");
      }
      throw error;
    }
    return this.get(userId);
  }

  async setQuantity(userId: string, editionId: string, quantity: number) {
    this.validateQuantity(quantity);
    const edition = await this.getAvailableEdition(editionId);
    if (edition.format === EditionFormat.DIGITAL && quantity !== 1) {
      throw new BadRequestException("E-book aceita somente uma unidade");
    }
    if (edition.format === EditionFormat.DIGITAL && await this.ownership.ownsEdition(userId, editionId)) {
      throw new ConflictException("Você já possui este e-book");
    }
    if (edition.format === EditionFormat.PHYSICAL) this.assertPhysicalStock(edition, quantity);
    const cart = await this.ensureCart(userId);
    const result = await this.prisma.cartItem.updateMany({
      where: { cartId: cart.id, editionId },
      data: { quantity },
    });
    if (result.count === 0) throw new NotFoundException("Edição não encontrada no carrinho");
    return this.get(userId);
  }

  async remove(userId: string, editionId: string) {
    const cart = await this.ensureCart(userId);
    const result = await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, editionId },
    });
    if (result.count === 0) throw new NotFoundException("Edição não encontrada no carrinho");
    return this.get(userId);
  }

  async applyCoupon(userId: string, code: string) {
    const cart = await this.ensureCart(userId);
    const current = await this.prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
    const subtotalCents = this.subtotal(current);
    const preview = await this.coupons.preview(code, subtotalCents);
    await this.prisma.cart.update({ where: { id: cart.id }, data: { couponId: preview.id } });
    return this.get(userId);
  }

  async removeCoupon(userId: string) {
    const cart = await this.ensureCart(userId);
    await this.prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    return this.get(userId);
  }

  async quoteShipping(userId: string, address: ShippingAddressInput) {
    const cart = await this.load(userId);
    const physicalQuantity = cart.items
      .filter((item) => item.edition.isVisible && item.edition.work.isVisible && item.edition.format === EditionFormat.PHYSICAL)
      .reduce((sum, item) => sum + item.quantity, 0);
    if (physicalQuantity === 0) {
      return { physicalQuantity: 0, shippingCents: 0, shippingAmount: formatBrl(0), message: "Carrinho sem itens físicos" };
    }
    const postalCode = validateShippingAddress(address);
    const quote = await this.shipping.quote(postalCode, physicalQuantity);
    const discountCents = cart.coupon
      ? (await this.coupons.preview(cart.coupon.code, this.subtotal(cart))).discountCents
      : 0;
    const totals = this.totals(cart, quote.priceCents, discountCents);
    return {
      physicalQuantity,
      ...totals,
    };
  }

  private async load(userId: string) {
    const cart = await this.ensureCart(userId);
    return this.prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
  }

  private async present(cart: Prisma.CartGetPayload<{ include: typeof cartInclude }>) {
    const subtotalCents = this.subtotal(cart);
    let discountCents = 0;
    let coupon: { code: string; discountCents: number } | null = null;
    let couponError: string | null = null;
    if (cart.coupon) {
      try {
        const preview = await this.coupons.preview(cart.coupon.code, subtotalCents);
        discountCents = preview.discountCents;
        coupon = { code: preview.code, discountCents };
      } catch (error) {
        if (!(error instanceof HttpException)) throw error;
        couponError = error.message;
      }
    }
    const items = cart.items.map((item) => {
      const edition = item.edition;
      const available = edition.isVisible && edition.work.isVisible;
      const unitPriceCents = available ? edition.priceCents : 0;
      return {
        editionId: edition.id,
        workTitle: available ? edition.work.title : "Edição indisponível",
        format: edition.format,
        quantity: item.quantity,
        available,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
        unitPriceAmount: formatBrl(unitPriceCents),
        lineTotalAmount: formatBrl(unitPriceCents * item.quantity),
      };
    });
    const totals = this.totals(cart, 0, discountCents);
    return { items, coupon, couponError, ...totals };
  }

  private subtotal(cart: Prisma.CartGetPayload<{ include: typeof cartInclude }>): number {
    return cart.items.reduce((sum, item) =>
      item.edition.isVisible && item.edition.work.isVisible
        ? sum + item.edition.priceCents * item.quantity
        : sum,
    0);
  }

  private totals(
    cart: Prisma.CartGetPayload<{ include: typeof cartInclude }>,
    shippingCents: number,
    knownDiscountCents?: number,
  ) {
    const subtotalCents = this.subtotal(cart);
    const discountCents = knownDiscountCents ?? 0;
    const totalCents = subtotalCents - discountCents + shippingCents;
    return {
      subtotalCents,
      subtotalAmount: formatBrl(subtotalCents),
      discountCents,
      discountAmount: formatBrl(discountCents),
      shippingCents,
      shippingAmount: formatBrl(shippingCents),
      totalCents,
      totalAmount: formatBrl(totalCents),
    };
  }

  private validateQuantity(quantity: number) {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new BadRequestException("Quantidade deve ser um inteiro entre 1 e 100");
    }
  }

  private async getAvailableEdition(editionId: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(editionId)) {
      throw new BadRequestException("Identificador de edição inválido");
    }
    const edition = await this.prisma.edition.findUnique({
      where: { id: editionId },
      include: { work: true, inventory: true },
    });
    if (!edition || !edition.isVisible || !edition.work.isVisible) {
      throw new NotFoundException("Edição não encontrada");
    }
    if (edition.format === EditionFormat.DIGITAL && edition.inventory?.digitalLicenseLimit != null && edition.inventory.digitalAllocated >= edition.inventory.digitalLicenseLimit) {
      throw new ConflictException("Não há licença digital disponível");
    }
    return edition;
  }

  private assertPhysicalStock(
    edition: Awaited<ReturnType<CartService["getAvailableEdition"]>>,
    requestedQuantity: number,
  ) {
    if (edition.format !== EditionFormat.PHYSICAL) return;
    if ((edition.inventory?.physicalStock ?? 0) < requestedQuantity) {
      throw new ConflictException("Quantidade indisponível no estoque físico");
    }
  }
}
