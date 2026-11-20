import { BadRequestException } from "@nestjs/common";

export interface ShippingAddressInput {
  recipientName: string;
  cpf: string;
  phone: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
}

export function normalizePostalCode(value: string): string {
  const postalCode = String(value ?? "").replace(/\D/g, "");
  if (!/^\d{8}$/.test(postalCode)) throw new BadRequestException("CEP inválido");
  return postalCode;
}

export function isValidCpf(value: string): boolean {
  const cpf = String(value ?? "").replace(/\D/g, "");
  if (!/^\d{11}$/.test(cpf) || /^([0-9])\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let index = 0; index < length; index += 1) {
      sum += Number(cpf[index]) * (length + 1 - index);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export function validateShippingAddress(input: ShippingAddressInput): string {
  if (!input || typeof input !== "object") throw new BadRequestException("Endereço de entrega obrigatório");
  const required = [input.recipientName, input.phone, input.street, input.number, input.district, input.city, input.state];
  if (required.some((value) => typeof value !== "string" || value.trim().length === 0)) {
    throw new BadRequestException("Endereço de entrega incompleto");
  }
  if (input.recipientName.trim().length > 120 || input.street.trim().length > 160 || input.number.trim().length > 20 || input.district.trim().length > 100 || input.city.trim().length > 100 || !/^[A-Za-z]{2}$/.test(input.state.trim())) {
    throw new BadRequestException("Endereço de entrega inválido");
  }
  if (!isValidCpf(input.cpf)) throw new BadRequestException("CPF inválido");
  if (!/^\d{10,11}$/.test(String(input.phone).replace(/\D/g, ""))) {
    throw new BadRequestException("Telefone inválido");
  }
  return normalizePostalCode(input.postalCode);
}

export function matchesShippingRule(
  rule: { postalCodeStart: string; postalCodeEnd: string; minPhysicalQuantity: number; maxPhysicalQuantity: number | null; isActive: boolean },
  postalCode: string,
  quantity: number,
): boolean {
  return rule.isActive &&
    postalCode >= rule.postalCodeStart &&
    postalCode <= rule.postalCodeEnd &&
    quantity >= rule.minPhysicalQuantity &&
    (rule.maxPhysicalQuantity === null || quantity <= rule.maxPhysicalQuantity);
}
