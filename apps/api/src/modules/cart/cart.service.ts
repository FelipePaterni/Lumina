import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EditionFormat, OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { CouponService } from "../coupons/coupon.service.js";
import { LibraryOwnershipService } from "../library/ownership/library-ownership.service.js";
import { ShippingService } from "../shipping/shipping.service.js";
import { BundleRuleError, calculateBundlePrice } from "../bundles/bundle.rules.js";
import { preorderAvailability } from "../preorders/preorder.rules.js";
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
    return this.present(result, userId);
  }

  async add(userId: string, editionId: string, quantity: number) {
    this.validateQuantity(quantity);
    const edition = await this.getAvailableEdition(editionId);
    if (edition.format === EditionFormat.DIGITAL) {
      if (quantity !== 1) throw new BadRequestException("E-book aceita somente uma unidade");
      if (await this.ownership.ownsEdition(userId, editionId)) {
        throw new ConflictException("Você já possui este e-book");
      }
      const currentCart = await this.prisma.cart.findUnique({ where: { id: (await this.ensureCart(userId)).id }, include: cartInclude });
      if (currentCart?.bundles.some((entry) => entry.bundle.items.some((item) => item.work.editions[0]?.id === editionId))) {
        throw new ConflictException("Este e-book já está incluído em um bundle do carrinho");
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

  async addBundle(userId: string, bundleId: string) {
    if (!this.isUuid(bundleId)) throw new BadRequestException("Identificador de bundle inválido");
    const cart = await this.ensureCart(userId);
    const current = await this.prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
    const bundle = current.bundles.find((entry) => entry.bundleId === bundleId)?.bundle ??
      await this.prisma.bundle.findFirst({
        where: { id: bundleId, isActive: true },
        include: cartInclude.bundles.include.bundle.include,
      });
    if (!bundle || !bundle.isActive || bundle.items.length < 2) throw new NotFoundException("Bundle não encontrado");

    const bundleEditionIds = bundle.items.map((item) => item.work.editions[0]?.id).filter((id): id is string => Boolean(id));
    if (bundleEditionIds.length !== bundle.items.length || bundle.items.some((item) => !item.work.isVisible || !item.work.editions[0]?.isVisible)) {
      throw new ConflictException("O bundle não está mais disponível");
    }
    if (current.items.some((item) => bundleEditionIds.includes(item.editionId))) {
      throw new ConflictException("Um e-book do bundle já está no carrinho");
    }
    try {
      await this.bundleQuote(userId, bundle);
    } catch (error) {
      if (error instanceof BundleRuleError && error.code === "ALL_ITEMS_OWNED") {
        throw new ConflictException("Você já possui todos os e-books deste bundle");
      }
      throw error;
    }
    try {
      await this.prisma.cartBundle.create({ data: { cartId: cart.id, bundleId } });
    } catch (error) {
      if (this.prismaCode(error) === "P2002") throw new ConflictException("Este bundle já está no carrinho");
      throw error;
    }
    return this.get(userId);
  }

  async removeBundle(userId: string, bundleId: string) {
    const cart = await this.ensureCart(userId);
    const result = await this.prisma.cartBundle.deleteMany({ where: { cartId: cart.id, bundleId } });
    if (result.count === 0) throw new NotFoundException("Bundle não encontrado no carrinho");
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
    const subtotalCents = await this.subtotal(current, userId);
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
      ? (await this.coupons.preview(cart.coupon.code, await this.subtotal(cart, userId))).discountCents
      : 0;
    const totals = this.totals(await this.subtotal(cart, userId), quote.priceCents, discountCents);
    return {
      physicalQuantity,
      ...totals,
    };
  }

  private async load(userId: string) {
    const cart = await this.ensureCart(userId);
    return this.prisma.cart.findUniqueOrThrow({ where: { id: cart.id }, include: cartInclude });
  }

  private async present(cart: Prisma.CartGetPayload<{ include: typeof cartInclude }>, userId: string) {
    const bundleLines = await Promise.all(cart.bundles.map(async (entry) => {
      if (!entry.bundle.isActive || entry.bundle.items.some((item) => !item.work.isVisible || !item.work.editions[0]?.isVisible)) {
        return { bundleId: entry.bundle.id, name: entry.bundle.name, available: false, items: [], listPriceCents: entry.bundle.priceCents, ownershipAdjustmentCents: 0, priceCents: 0 };
      }
      try {
        const quote = await this.bundleQuote(userId, entry.bundle);
        return {
          bundleId: entry.bundle.id,
          name: entry.bundle.name,
          available: entry.bundle.isActive,
          items: entry.bundle.items.map((item) => ({
            workId: item.workId,
            title: item.work.title,
            editionId: item.work.editions[0]?.id ?? null,
            releaseAt: item.work.releaseDate,
            preorderStatus: preorderAvailability(item.work.releaseDate),
          })),
          listPriceCents: entry.bundle.priceCents,
          ownershipAdjustmentCents: quote.ownershipAdjustmentCents,
          priceCents: quote.chargedPriceCents,
        };
      } catch (error) {
        if (!(error instanceof BundleRuleError) || error.code !== "ALL_ITEMS_OWNED") throw error;
        return { bundleId: entry.bundle.id, name: entry.bundle.name, available: false, items: [], listPriceCents: entry.bundle.priceCents, ownershipAdjustmentCents: 0, priceCents: 0 };
      }
    }));
    const subtotalCents = await this.subtotal(cart, userId);
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
        releaseAt: edition.work.releaseDate,
        preorderStatus: preorderAvailability(edition.work.releaseDate),
        quantity: item.quantity,
        available,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
        unitPriceAmount: formatBrl(unitPriceCents),
        lineTotalAmount: formatBrl(unitPriceCents * item.quantity),
      };
    });
    const totals = this.totals(subtotalCents, 0, discountCents);
    return { items, bundles: bundleLines, coupon, couponError, ...totals };
  }

  private async subtotal(cart: Prisma.CartGetPayload<{ include: typeof cartInclude }>, userId: string): Promise<number> {
    const itemSubtotal = cart.items.reduce((sum, item) =>
      item.edition.isVisible && item.edition.work.isVisible
        ? sum + item.edition.priceCents * item.quantity
        : sum,
    0);
    let bundleSubtotal = 0;
    for (const entry of cart.bundles) {
      if (!entry.bundle.isActive || entry.bundle.items.some((item) => !item.work.isVisible || !item.work.editions[0]?.isVisible)) continue;
      try { bundleSubtotal += (await this.bundleQuote(userId, entry.bundle)).chargedPriceCents; }
      catch (error) { if (!(error instanceof BundleRuleError && error.code === "ALL_ITEMS_OWNED")) throw error; }
    }
    return itemSubtotal + bundleSubtotal;
  }

  private totals(
    subtotalCents: number,
    shippingCents: number,
    knownDiscountCents?: number,
  ) {
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

  private async bundleQuote(userId: string, bundle: Prisma.BundleGetPayload<{ include: typeof cartInclude.bundles.include.bundle.include }>) {
    const items = bundle.items.map((item) => {
      const edition = item.work.editions[0];
      if (!edition) throw new ConflictException("Uma edição digital do bundle não está disponível");
      if (
        edition.inventory?.digitalLicenseLimit != null &&
        edition.inventory.digitalAllocated >= edition.inventory.digitalLicenseLimit
      ) {
        throw new ConflictException("Licença digital do bundle indisponível");
      }
      return { editionId: edition.id, currentPriceCents: edition.priceCents, owned: false };
    });
    const ownedLibraryIds = this.prisma.libraryItem.findMany({
      where: { userId, editionId: { in: items.map((item) => item.editionId) } },
      select: { editionId: true },
    });
    const ownedPurchaseIds = this.prisma.orderItem.findMany({
      where: { editionId: { in: items.map((item) => item.editionId) }, format: EditionFormat.DIGITAL, order: { userId, status: OrderStatus.CONFIRMED } },
      select: { editionId: true },
    });
    const [libraryItems, purchases] = await Promise.all([ownedLibraryIds, ownedPurchaseIds]);
    const owned = new Set([...libraryItems.map((item) => item.editionId), ...purchases.map((item) => item.editionId)]);
    return calculateBundlePrice(bundle.priceCents, items.map((item) => ({ ...item, owned: owned.has(item.editionId) })));
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private prismaCode(error: unknown): string | undefined {
    return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : undefined;
  }
}
