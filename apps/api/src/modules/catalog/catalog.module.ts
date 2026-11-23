import { Module } from "@nestjs/common";
import { CatalogController } from "./presentation/catalog.controller.js";
import { CatalogService } from "./application/catalog.service.js";
import { IdentityModule } from "../identity/identity.module.js";
import { AuditModule } from "../audit/audit.module.js";
import { CatalogSearchService } from "./search/catalog-search.service.js";
import { AdminCatalogController } from "./presentation/admin-catalog.controller.js";

@Module({
  imports: [IdentityModule, AuditModule],
  controllers: [CatalogController, AdminCatalogController],
  providers: [CatalogService, CatalogSearchService],
})
export class CatalogModule {}
