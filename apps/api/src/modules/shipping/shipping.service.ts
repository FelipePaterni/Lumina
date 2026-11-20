import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { normalizePostalCode, matchesShippingRule } from "./shipping.rules.js";

export interface CreateShippingRuleInput {
  postalCodeStart: string;
  postalCodeEnd: string;
  minPhysicalQuantity: number;
  maxPhysicalQuantity?: number | null;
  priceCents: number;
  priority?: number;
}

@Injectable()
export class ShippingService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.shippingRule.findMany({ orderBy: [{ priority: "desc" }, { createdAt: "asc" }] });
  }

  async create(input: CreateShippingRuleInput) {
    const postalCodeStart = normalizePostalCode(input.postalCodeStart);
    const postalCodeEnd = normalizePostalCode(input.postalCodeEnd);
    if (postalCodeStart > postalCodeEnd) throw new BadRequestException("Faixa de CEP inválida");
    if (!Number.isInteger(input.minPhysicalQuantity) || input.minPhysicalQuantity < 1 || (input.maxPhysicalQuantity != null && (!Number.isInteger(input.maxPhysicalQuantity) || input.maxPhysicalQuantity < input.minPhysicalQuantity))) {
      throw new BadRequestException("Faixa de quantidade física inválida");
    }
    if (!Number.isSafeInteger(input.priceCents) || input.priceCents < 1) throw new BadRequestException("Frete deve ser maior que zero, em centavos");
    const priority = input.priority ?? 0;
    if (!Number.isInteger(priority) || priority < 0 || priority > 1000) throw new BadRequestException("Prioridade inválida");
    return this.prisma.shippingRule.create({
      data: {
        postalCodeStart,
        postalCodeEnd,
        minPhysicalQuantity: input.minPhysicalQuantity,
        maxPhysicalQuantity: input.maxPhysicalQuantity ?? null,
        priceCents: input.priceCents,
        priority,
      },
    });
  }

  async setActive(id: string, isActive: boolean) {
    if (typeof isActive !== "boolean") throw new BadRequestException("Estado da regra inválido");
    try {
      return await this.prisma.shippingRule.update({ where: { id }, data: { isActive } });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
        throw new NotFoundException("Regra de frete não encontrada");
      }
      throw error;
    }
  }

  async quote(postalCodeInput: string, physicalQuantity: number): Promise<{ priceCents: number }> {
    const postalCode = normalizePostalCode(postalCodeInput);
    if (!Number.isInteger(physicalQuantity) || physicalQuantity < 1) throw new BadRequestException("Quantidade física inválida");
    const rules = await this.prisma.shippingRule.findMany({
      where: { isActive: true },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });
    const rule = rules.find((candidate) => matchesShippingRule(candidate, postalCode, physicalQuantity));
    if (!rule) throw new NotFoundException("Não há regra de frete para este CEP e quantidade");
    return { priceCents: rule.priceCents };
  }
}
