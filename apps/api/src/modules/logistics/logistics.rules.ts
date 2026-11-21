import { BadRequestException, ConflictException } from "@nestjs/common";
import { FulfillmentStatus } from "@prisma/client";

const nextStatus: Partial<Record<FulfillmentStatus, FulfillmentStatus>> = {
  [FulfillmentStatus.PENDING]: FulfillmentStatus.PICKING,
  [FulfillmentStatus.PICKING]: FulfillmentStatus.SHIPPED,
  [FulfillmentStatus.SHIPPED]: FulfillmentStatus.DELIVERED,
};

export function parseFulfillmentStatus(value: unknown): FulfillmentStatus {
  if (typeof value !== "string" || !Object.values(FulfillmentStatus).includes(value as FulfillmentStatus)) {
    throw new BadRequestException("Status logístico inválido");
  }
  return value as FulfillmentStatus;
}

export function validateTransition(current: FulfillmentStatus, target: FulfillmentStatus): void {
  if (current === target) return;
  if (nextStatus[current] !== target) {
    throw new ConflictException("Transição logística inválida");
  }
}

export function validateTrackingCode(value: unknown, required: boolean): string | null {
  if (value === undefined || value === null || value === "") {
    if (required) throw new BadRequestException("Código de rastreio é obrigatório para envio");
    return null;
  }
  const hasControlCharacter = typeof value === "string" && Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });
  if (typeof value !== "string" || value.trim().length < 1 || value.trim().length > 120 || hasControlCharacter) {
    throw new BadRequestException("Código de rastreio inválido");
  }
  return value.trim();
}
