import { createHash } from "node:crypto";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class BundleRuleError extends Error {
  constructor(readonly code: "INVALID_COMPOSITION" | "INVALID_PRICE" | "ALL_ITEMS_OWNED") {
    super(code);
    this.name = "BundleRuleError";
  }
}

export function normalizeComposition(input: unknown): string[] {
  if (!Array.isArray(input) || input.length < 2 ||
      input.some((id) => typeof id !== "string" || !UUID_PATTERN.test(id))) {
    throw new BundleRuleError("INVALID_COMPOSITION");
  }
  const normalized = input.map((id: string) => id.toLowerCase()).sort();
  if (new Set(normalized).size !== normalized.length) {
    throw new BundleRuleError("INVALID_COMPOSITION");
  }
  return normalized;
}

export function compositionKey(workIds: string[]): string {
  return createHash("sha256").update([...workIds].sort().join("\n")).digest("hex");
}

export interface BundlePriceItem {
  editionId: string;
  currentPriceCents: number;
  owned: boolean;
}

export function calculateBundlePrice(priceCents: number, items: BundlePriceItem[]) {
  if (!Number.isSafeInteger(priceCents) || priceCents < 0 || items.length < 2 ||
      items.some((item) => !Number.isSafeInteger(item.currentPriceCents) || item.currentPriceCents < 0)) {
    throw new BundleRuleError("INVALID_PRICE");
  }
  const ownedItems = items.filter((item) => item.owned);
  if (ownedItems.length === items.length) throw new BundleRuleError("ALL_ITEMS_OWNED");
  const ownedValueCents = ownedItems.reduce((sum, item) => sum + item.currentPriceCents, 0);
  if (!Number.isSafeInteger(ownedValueCents)) throw new BundleRuleError("INVALID_PRICE");
  const ownershipAdjustmentCents = Math.min(priceCents, ownedValueCents);
  return {
    itemCount: items.length,
    ownedItemCount: ownedItems.length,
    ownershipAdjustmentCents,
    chargedPriceCents: Math.max(0, priceCents - ownedValueCents),
    itemsToGrant: items.filter((item) => !item.owned).sort((a, b) => a.editionId.localeCompare(b.editionId)),
  };
}

export function allocateBundlePrice(totalCents: number, count: number): number[] {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0 || !Number.isSafeInteger(count) || count < 1) {
    throw new BundleRuleError("INVALID_PRICE");
  }
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}
