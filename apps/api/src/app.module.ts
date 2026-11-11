import { Module } from "@nestjs/common";
import { PrismaModule } from "./infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "./modules/identity/identity.module.js";
import { AuditModule } from "./modules/audit/audit.module.js";
import { CatalogModule } from "./modules/catalog/catalog.module.js";
import { InventoryModule } from "./modules/inventory/inventory.module.js";
import { AssetsModule } from "./modules/catalog/assets/assets.module.js";

@Module({
  imports: [
    PrismaModule,
    IdentityModule,
    AuditModule,
    CatalogModule,
    InventoryModule,
    AssetsModule,
  ],
})
export class AppModule {}
