export type PreorderAvailability = "PREORDER" | "RELEASED";

export class PreorderReleaseError extends Error {
  constructor() {
    super("Preorder fulfillment is not available before the release date");
    this.name = "PreorderReleaseError";
  }
}

export function preorderAvailability(releaseAt: Date, now = new Date()): PreorderAvailability {
  return releaseAt.getTime() > now.getTime() ? "PREORDER" : "RELEASED";
}

export function canFulfillPreorder(releaseAt: Date, now = new Date()): boolean {
  return preorderAvailability(releaseAt, now) === "RELEASED";
}

export function assertPreorderReleased(releaseAt: Date, now = new Date()): void {
  if (!canFulfillPreorder(releaseAt, now)) throw new PreorderReleaseError();
}
