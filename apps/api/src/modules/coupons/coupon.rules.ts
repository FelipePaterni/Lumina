import { BadRequestException, ConflictException } from "@nestjs/common";
import { Coupon, CouponDiscountType } from "@prisma/client";

export function normalizeCouponCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(normalized)) {
    throw new BadRequestException("Código de cupom inválido");
  }
  return normalized;
}

export function validateCouponAvailability(
  coupon: Pick<Coupon, "isActive" | "validFrom" | "validUntil" | "usageCount" | "maxUses">,
  now = new Date(),
): void {
  if (!coupon.isActive || now < coupon.validFrom || now >= coupon.validUntil) {
    throw new ConflictException("Cupom indisponível ou fora da validade");
  }
  if (coupon.usageCount >= coupon.maxUses) {
    throw new ConflictException("Cupom atingiu o limite de utilizações");
  }
}

export function calculateCouponDiscount(
  coupon: Pick<Coupon, "discountType" | "fixedAmountCents" | "percentageBasisPoints">,
  subtotalCents: number,
): number {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
    throw new BadRequestException("Subtotal inválido");
  }
  if (coupon.discountType === CouponDiscountType.FIXED) {
    return Math.min(subtotalCents, coupon.fixedAmountCents ?? 0);
  }
  return Math.min(
    subtotalCents,
    Math.floor((subtotalCents * (coupon.percentageBasisPoints ?? 0)) / 10_000),
  );
}
