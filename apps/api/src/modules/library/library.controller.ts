import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  Param,
  Post,
  Req,
  StreamableFile,
  UseGuards,
} from "@nestjs/common";
import { Role } from "../identity/domain/role.enum.js";
import { Roles } from "../identity/presentation/decorators/roles.decorator.js";
import { JwtAuthGuard } from "../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../identity/presentation/guards/roles.guard.js";
import { LibraryService } from "./library.service.js";

interface CustomerRequest {
  user: { sub: string; role: Role; isEmailConfirmed: boolean };
}

interface DownloadLinkBody {
  name?: unknown;
}

@Controller("library")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class LibraryController {
  constructor(private readonly library: LibraryService) {}

  @Get()
  list(@Req() request: CustomerRequest) {
    return this.library.list(this.customerId(request));
  }

  @Post(":editionId/download")
  createDownloadLink(
    @Param("editionId") editionId: string,
    @Body() body: DownloadLinkBody,
    @Req() request: CustomerRequest,
  ) {
    return this.library.createDownloadLink(
      this.customerId(request),
      editionId,
      body?.name,
    );
  }

  private customerId(request: CustomerRequest): string {
    if (!request.user.isEmailConfirmed) {
      throw new ForbiddenException(
        "Confirme seu e-mail para acessar a biblioteca",
      );
    }
    return request.user.sub;
  }
}

@Controller("library/download")
export class LibraryDownloadController {
  constructor(private readonly library: LibraryService) {}

  @Get(":token")
  @Header("Cache-Control", "private, no-store")
  @Header("X-Content-Type-Options", "nosniff")
  async download(@Param("token") token: string): Promise<StreamableFile> {
    const result = await this.library.download(token);
    return new StreamableFile(result.content, {
      type: result.mimeType,
      disposition: `attachment; filename="${result.fileName}"`,
      length: result.content.length,
    });
  }
}
