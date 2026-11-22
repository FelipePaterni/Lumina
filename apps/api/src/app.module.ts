import { Module } from "@nestjs/common";
import { PrismaModule } from "./infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "./modules/identity/identity.module.js";
import { AuditModule } from "./modules/audit/audit.module.js";
import { CatalogModule } from "./modules/catalog/catalog.module.js";
import { InventoryModule } from "./modules/inventory/inventory.module.js";
import { AssetsModule } from "./modules/catalog/assets/assets.module.js";
import { WishlistModule } from "./modules/wishlist/wishlist.module.js";
import { CartModule } from "./modules/cart/cart.module.js";
import { OrderModule } from "./modules/orders/order.module.js";
import { LibraryModule } from "./modules/library/library.module.js";
import { BundleModule } from "./modules/bundles/bundle.module.js";
import { ReviewsModule } from "./modules/reviews/reviews.module.js";
import { DashboardReportingModule } from "./modules/reporting/dashboard-reporting.module.js";
import { ObservabilityModule } from "./modules/observability/observability.module.js";

@Module({
  imports: [
    PrismaModule,
    IdentityModule,
    AuditModule,
    CatalogModule,
    InventoryModule,
    AssetsModule,
    WishlistModule,
    CartModule,
    OrderModule,
    LibraryModule,
    BundleModule,
    ReviewsModule,
    DashboardReportingModule,
    ObservabilityModule,
  ],
})
export class AppModule {}
