import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { AuditService } from "../audit/application/services/audit.service.js";
import { Role } from "../identity/domain/role.enum.js";

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async adjustPhysical(
    editionId: string,
    stock: number,
    reason: string,
    actorId: string,
    actorRole: Role,
  ) {
    if (!Number.isInteger(stock) || stock < 0)
      throw new BadRequestException(
        "Estoque físico deve ser um inteiro não negativo",
      );
    if (!reason?.trim()) throw new BadRequestException("Motivo é obrigatório");
    const result = await this.prisma.$transaction(async (tx) => {
      const edition = await tx.edition.findUnique({ where: { id: editionId } });
      if (!edition) throw new NotFoundException("Edição não encontrada");
      const inventory = await tx.inventory.upsert({
        where: { editionId },
        update: { physicalStock: stock },
        create: { editionId, physicalStock: stock },
      });
      await tx.inventoryMovement.create({
        data: {
          inventoryId: inventory.id,
          type: "PHYSICAL_ADJUSTMENT",
          quantity: stock,
          reason,
          actorId,
        },
      });
      return inventory;
    });
    await this.audit.logAction({
      actorId,
      actorRole,
      action: "INVENTORY_PHYSICAL_ADJUSTED",
      targetType: "EDITION",
      targetId: editionId,
      reason,
      metadata: { stock },
    });
    return result;
  }

  async setDigitalLimit(
    editionId: string,
    limit: number | null,
    reason: string,
    actorId: string,
    actorRole: Role,
  ) {
    if (limit !== null && (!Number.isInteger(limit) || limit < 0))
      throw new BadRequestException(
        "Licença digital deve ser nula (ilimitada) ou um inteiro não negativo",
      );
    if (!reason?.trim()) throw new BadRequestException("Motivo é obrigatório");
    const result = await this.prisma.$transaction(async (tx) => {
      const edition = await tx.edition.findUnique({ where: { id: editionId } });
      if (!edition) throw new NotFoundException("Edição não encontrada");
      const inventory = await tx.inventory.upsert({
        where: { editionId },
        update: { digitalLicenseLimit: limit },
        create: { editionId, digitalLicenseLimit: limit },
      });
      if (limit !== null && inventory.digitalAllocated > limit)
        throw new BadRequestException(
          "Limite não pode ser menor que licenças alocadas",
        );
      return inventory;
    });
    await this.audit.logAction({
      actorId,
      actorRole,
      action: "INVENTORY_DIGITAL_LIMIT_CHANGED",
      targetType: "EDITION",
      targetId: editionId,
      reason,
      metadata: { limit },
    });
    return result;
  }

  get(editionId: string) {
    return this.prisma.inventory.findUnique({
      where: { editionId },
      include: { movements: { orderBy: { createdAt: "desc" } } },
    });
  }
}
