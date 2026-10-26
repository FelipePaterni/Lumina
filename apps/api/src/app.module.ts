import { Module } from "@nestjs/common";
import { PrismaModule } from "./infrastructure/persistence/prisma.module.js";
import { IdentityModule } from "./modules/identity/identity.module.js";

@Module({
  imports: [PrismaModule, IdentityModule],
})
export class AppModule {}
