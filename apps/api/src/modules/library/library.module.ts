import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infrastructure/persistence/prisma.module.js";
import { PrivateLocalStorage } from "../../storage/private-local.storage.js";
import { AuditModule } from "../audit/audit.module.js";
import { IdentityModule } from "../identity/identity.module.js";
import { DownloadLinkTokenService } from "./download-link-token.service.js";
import { LibraryController, LibraryDownloadController } from "./library.controller.js";
import { LibraryService } from "./library.service.js";
import { WatermarkService } from "../watermark/watermark.service.js";

@Module({
  imports: [PrismaModule, IdentityModule, AuditModule],
  controllers: [LibraryController, LibraryDownloadController],
  providers: [
    LibraryService,
    PrivateLocalStorage,
    WatermarkService,
    DownloadLinkTokenService,
  ],
})
export class LibraryModule {}
