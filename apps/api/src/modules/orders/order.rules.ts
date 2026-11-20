import { BadRequestException } from "@nestjs/common";

export function validateIdempotencyKey(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(value)) {
    throw new BadRequestException("Cabeçalho Idempotency-Key inválido");
  }
  return value;
}

export function sumOrderTotals(
  subtotalCents: number,
  discountCents: number,
  shippingCents: number,
): number {
  if (![subtotalCents, discountCents, shippingCents].every(Number.isSafeInteger) ||
      subtotalCents < 0 || discountCents < 0 || discountCents > subtotalCents || shippingCents < 0) {
    throw new BadRequestException("Valores do pedido inválidos");
  }
  const total = subtotalCents - discountCents + shippingCents;
  if (!Number.isSafeInteger(total)) throw new BadRequestException("Total do pedido inválido");
  return total;
}
