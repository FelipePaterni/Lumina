import { BadRequestException } from "@nestjs/common";

const TWO_HOURS_MS = 2 * 60 * 60 * 1_000;
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1_000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1_000;

export interface RefundLine {
  id: string;
  unitPriceCents: number;
  quantity: number;
}

// eslint-disable-next-line no-control-regex -- reject control characters in customer supplied reasons
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;

export function validateRefundReason(value: unknown, label = "Motivo") {
  if (typeof value !== "string")
    throw new BadRequestException(`${label} é obrigatório`);
  const reason = value.trim();
  if (
    reason.length < 5 ||
    [...reason].length > 500 ||
    CONTROL_CHARACTERS.test(reason)
  ) {
    throw new BadRequestException(`${label} inválido`);
  }
  return reason;
}

export function canCancelPreorder(releaseAt: Date, now = new Date()): boolean {
  const deadline = releaseAt.getTime() - ONE_WEEK_MS;
  return now.getTime() <= deadline;
}

export function canAutomaticallyRefundDigital(input: {
  purchasedAt: Date;
  firstLinkIssuedAt: Date | null;
  downloadedAt: Date | null;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  const withinLinkWindow =
    input.firstLinkIssuedAt !== null &&
    now.getTime() <= input.firstLinkIssuedAt.getTime() + TWO_HOURS_MS;
  const withinUndownloadedWindow =
    input.downloadedAt === null &&
    now.getTime() <= input.purchasedAt.getTime() + TWO_WEEKS_MS;
  return withinLinkWindow || withinUndownloadedWindow;
}

/** Allocates a global coupon discount by line value while preserving the exact order discount. */
export function allocateOrderDiscount(
  lines: RefundLine[],
  discountCents: number,
): Map<string, number> {
  if (
    !Array.isArray(lines) ||
    lines.length === 0 ||
    new Set(lines.map((line) => line.id)).size !== lines.length ||
    lines.some(
      (line) =>
        !line.id ||
        !Number.isSafeInteger(line.unitPriceCents) ||
        line.unitPriceCents < 0 ||
        !Number.isSafeInteger(line.quantity) ||
        line.quantity < 1,
    )
  ) {
    throw new BadRequestException(
      "Linhas do pedido inválidas para calcular reembolso",
    );
  }
  const lineTotals = lines.map((line) => ({
    id: line.id,
    total: line.unitPriceCents * line.quantity,
  }));
  if (lineTotals.some(({ total }) => !Number.isSafeInteger(total))) {
    throw new BadRequestException("Valor da linha excede o limite seguro");
  }
  const subtotal = lineTotals.reduce((sum, line) => sum + line.total, 0);
  if (
    !Number.isSafeInteger(subtotal) ||
    !Number.isSafeInteger(discountCents) ||
    discountCents < 0 ||
    discountCents > subtotal
  ) {
    throw new BadRequestException(
      "Desconto do pedido inválido para calcular reembolso",
    );
  }
  if (subtotal === 0) return new Map(lineTotals.map(({ id }) => [id, 0]));

  const denominator = BigInt(subtotal);
  const shares = lineTotals.map(({ id, total }) => {
    const numerator = BigInt(discountCents) * BigInt(total);
    return {
      id,
      cents: Number(numerator / denominator),
      remainder: numerator % denominator,
    };
  });
  let remaining =
    discountCents - shares.reduce((sum, share) => sum + share.cents, 0);
  const ranked = [...shares].sort((a, b) => {
    if (a.remainder !== b.remainder) return a.remainder > b.remainder ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
  for (let index = 0; remaining > 0; index += 1, remaining -= 1) {
    ranked[index].cents += 1;
  }
  return new Map(shares.map(({ id, cents }) => [id, cents]));
}

export function calculateRefundAmountCents(
  line: RefundLine,
  allocatedDiscountCents: number,
): number {
  const gross = line.unitPriceCents * line.quantity;
  if (
    !Number.isSafeInteger(gross) ||
    !Number.isSafeInteger(allocatedDiscountCents) ||
    allocatedDiscountCents < 0 ||
    allocatedDiscountCents > gross
  ) {
    throw new BadRequestException("Valor do item inválido para reembolso");
  }
  return gross - allocatedDiscountCents;
}

export const refundWindowMs = {
  twoHours: TWO_HOURS_MS,
  twoWeeks: TWO_WEEKS_MS,
  oneWeek: ONE_WEEK_MS,
} as const;
