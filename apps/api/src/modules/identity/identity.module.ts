import { Module, forwardRef } from "@nestjs/common";
import { PasswordHasherService } from "./application/services/password-hasher.service.js";
import { TokenService } from "./application/services/token.service.js";
import { JwtTokenService } from "./application/services/jwt-token.service.js";
import { AuthService } from "./application/services/auth.service.js";
import { AdminSeedService } from "./application/services/admin-seed.service.js";
import { LocalCustomerSeedService } from "./application/services/local-customer-seed.service.js";
import { AccountService } from "./application/services/account.service.js";
import { AccountDeletionGracePeriod } from "./application/services/account-deletion-grace-period.js";
import { AuthController } from "./presentation/auth.controller.js";
import { AccountController } from "./presentation/account.controller.js";
import { UserManagementController } from "./presentation/user-management.controller.js";
import { JwtAuthGuard } from "./presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "./presentation/guards/roles.guard.js";
import { AuditModule } from "../audit/audit.module.js";
import { NotificationModule } from "../notifications/notification.module.js";

@Module({
  imports: [forwardRef(() => AuditModule), NotificationModule],
  controllers: [AuthController, AccountController, UserManagementController],
  providers: [
    PasswordHasherService,
    TokenService,
    JwtTokenService,
    AuthService,
    AdminSeedService,
    LocalCustomerSeedService,
    AccountService,
    AccountDeletionGracePeriod,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    AccountService,
    JwtTokenService,
    JwtAuthGuard,
    RolesGuard,
    PasswordHasherService,
  ],
})
export class IdentityModule {}
