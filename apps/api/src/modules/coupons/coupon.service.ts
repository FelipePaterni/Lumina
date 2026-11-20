import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CouponDiscountType } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import {
  calculateCouponDiscount,
  normalizeCouponCode,
  validateCouponAvailability,
} from "./coupon.rules.js";

export interface CreateCouponInput {
  code: string;
  discountType: CouponDiscountType;
  fixedAmountCents?: number;
  percentageBasisPoints?: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
}

@Injectable()
export class CouponService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.coupon.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        code: true,
        discountType: true,
        fixedAmountCents: true,
        percentageBasisPoints: true,
        validFrom: true,
        validUntil: true,
        maxUses: true,
        usageCount: true,
        isActive: true,
      },
    });
  }

  async create(input: CreateCouponInput) {
    const code = normalizeCouponCode(input.code);
    const validFrom = new Date(input.validFrom);
    const validUntil = new Date(input.validUntil);
    if (!Number.isFinite(validFrom.getTime()) || !Number.isFinite(validUntil.getTime()) || validUntil <= validFrom) {
      throw new BadRequestException("Período do cupom inválido");
    }
    if (!Number.isSafeInteger(input.maxUses) || input.maxUses < 1) {
      throw new BadRequestException("A cota do cupom deve ser um inteiro positivo");
    }
    if (input.discountType === CouponDiscountType.FIXED) {
      if (!Number.isSafeInteger(input.fixedAmountCents) || (input.fixedAmountCents ?? 0) < 1 || input.percentageBasisPoints !== undefined) {
        throw new BadRequestException("Informe somente um desconto fixo válido em centavos");
      }
    } else if (input.discountType === CouponDiscountType.PERCENTAGE) {
      if (!Number.isInteger(input.percentageBasisPoints) || (input.percentageBasisPoints ?? 0) < 1 || (input.percentageBasisPoints ?? 0) > 10_000 || input.fixedAmountCents !== undefined) {
        throw new BadRequestException("Informe somente um percentual entre 0,01% e 100%");
      }
    } else {
      throw new BadRequestException("Tipo de desconto inválido");
    }

    try {
      return await this.prisma.coupon.create({
        data: {
          code,
          discountType: input.discountType,
          fixedAmountCents: input.fixedAmountCents,
          percentageBasisPoints: input.percentageBasisPoints,
          validFrom,
          validUntil,
          maxUses: input.maxUses,
        },
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        throw new ConflictException("Já existe um cupom com este código");
      }
      throw error;
    }
  }

  async setActive(id: string, isActive: boolean) {
    if (typeof isActive !== "boolean") throw new BadRequestException("Estado do cupom inválido");
    try {
      return await this.prisma.coupon.update({ where: { id }, data: { isActive } });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
        throw new NotFoundException("Cupom não encontrado");
      }
      throw error;
    }
  }

  async preview(code: string, subtotalCents: number) {
    const normalized = normalizeCouponCode(code);
    const coupon = await this.prisma.coupon.findUnique({ where: { code: normalized } });
    if (!coupon) throw new NotFoundException("Cupom não encontrado");
    validateCouponAvailability(coupon);
    return {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountCents: calculateCouponDiscount(coupon, subtotalCents),
    };
  }
}
