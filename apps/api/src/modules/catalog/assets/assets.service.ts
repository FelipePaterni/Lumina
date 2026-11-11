import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/persistence/prisma.service.js";
import { AuditService } from "../../audit/application/services/audit.service.js";
import { Role } from "../../identity/domain/role.enum.js";
import { PrivateLocalStorage } from "../../../storage/private-local.storage.js";

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: PrivateLocalStorage,
    private readonly audit: AuditService,
  ) {}

  async addVersion(
    editionId: string,
    body: {
      contentBase64: string;
      extension: string;
      mimeType: string;
      isOriginal?: boolean;
      reason: string;
    },
    actorId: string,
    actorRole: Role,
  ) {
    if (!body.contentBase64 || !body.mimeType || !body.reason?.trim())
      throw new BadRequestException(
        "Conteúdo, tipo MIME e motivo são obrigatórios",
      );
    if (
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        body.contentBase64,
      )
    )
      throw new BadRequestException("Conteúdo inválido");
    const content = Buffer.from(body.contentBase64, "base64");
    if (content.length === 0) throw new BadRequestException("Conteúdo vazio");
    const edition = await this.prisma.edition.findUnique({
      where: { id: editionId },
    });
    if (!edition || edition.format !== "DIGITAL")
      throw new NotFoundException("Edição digital não encontrada");
    const asset = await this.prisma.digitalAsset.upsert({
      where: { editionId },
      update: {},
      create: { editionId },
    });
    const last = await this.prisma.digitalAssetVersion.findFirst({
      where: { assetId: asset.id },
      orderBy: { version: "desc" },
    });
    const stored = await this.storage.put(
      body.isOriginal ? "original" : "derived",
      content,
      body.extension,
    );
    const version = await this.prisma.digitalAssetVersion.create({
      data: {
        assetId: asset.id,
        version: (last?.version || 0) + 1,
        storageKey: stored.storageKey,
        checksum: stored.checksum,
        mimeType: body.mimeType,
        isOriginal: body.isOriginal === true,
        createdById: actorId,
      },
    });
    await this.audit.logAction({
      actorId,
      actorRole,
      action: "DIGITAL_ASSET_VERSION_CREATED",
      targetType: "DIGITAL_ASSET",
      targetId: asset.id,
      reason: body.reason,
      metadata: { version: version.version, isOriginal: version.isOriginal },
    });
    return {
      id: version.id,
      version: version.version,
      checksum: version.checksum,
      mimeType: version.mimeType,
      isOriginal: version.isOriginal,
    };
  }

  async list(editionId: string) {
    const asset = await this.prisma.digitalAsset.findUnique({
      where: { editionId },
      include: {
        versions: {
          orderBy: { version: "desc" },
          select: {
            id: true,
            version: true,
            checksum: true,
            mimeType: true,
            isOriginal: true,
            createdAt: true,
          },
        },
      },
    });
    if (!asset) throw new NotFoundException("Ativo digital não encontrado");
    return asset;
  }
}
