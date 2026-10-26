import { Module } from "@nestjs/common";
import { PasswordHasherService } from "./application/services/password-hasher.service.js";
import { TokenService } from "./application/services/token.service.js";
import { JwtTokenService } from "./application/services/jwt-token.service.js";
import { EmailDispatcherService } from "./application/services/email-dispatcher.service.js";
import { AuthService } from "./application/services/auth.service.js";
import { AdminSeedService } from "./application/services/admin-seed.service.js";
import { AuthController } from "./presentation/auth.controller.js";
import { JwtAuthGuard } from "./presentation/guards/jwt-auth.guard.js";

@Module({
  controllers: [AuthController],
  providers: [
    PasswordHasherService,
    TokenService,
    JwtTokenService,
    EmailDispatcherService,
    AuthService,
    AdminSeedService,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtTokenService, JwtAuthGuard, PasswordHasherService],
})
export class IdentityModule {}
