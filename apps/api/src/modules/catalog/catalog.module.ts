import { Module } from "@nestjs/common";
import { CatalogController } from "./presentation/catalog.controller.js";
import { CatalogService } from "./application/catalog.service.js";
import { IdentityModule } from "../identity/identity.module.js";
import { AuditModule } from "../audit/audit.module.js";

@Module({ imports: [IdentityModule, AuditModule], controllers: [CatalogController], providers: [CatalogService] })
export class CatalogModule {}
