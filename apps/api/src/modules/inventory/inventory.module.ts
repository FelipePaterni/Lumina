import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller.js";
import { InventoryService } from "./inventory.service.js";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { AuditModule } from "../audit/audit.module.js";

@Module({ imports: [PrismaModule, IdentityModule, AuditModule], controllers: [InventoryController], providers: [InventoryService] })
export class InventoryModule {}
