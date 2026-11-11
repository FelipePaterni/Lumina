import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { AssetsService } from "./assets.service.js";
import { JwtAuthGuard } from "../../identity/presentation/guards/jwt-auth.guard.js";
import { RolesGuard } from "../../identity/presentation/guards/roles.guard.js";
import { Roles } from "../../identity/presentation/decorators/roles.decorator.js";
import { Role } from "../../identity/domain/role.enum.js";

@Controller("catalog/assets")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.CATALOG)
export class AssetsController {
  constructor(private readonly service: AssetsService) {}
  @Get(":editionId") list(@Param("editionId") editionId: string) {
    return this.service.list(editionId);
  }
  @Post(":editionId/versions") addVersion(
    @Param("editionId") editionId: string,
    @Body()
    body: {
      contentBase64: string;
      extension: string;
      mimeType: string;
      isOriginal?: boolean;
      reason: string;
    },
    @Req() req: { user: { sub: string; role: Role } },
  ) {
    return this.service.addVersion(
      editionId,
      body,
      req.user.sub,
      req.user.role,
    );
  }
}
