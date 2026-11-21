import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { EditionFormat, OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../infrastructure/persistence/prisma.service.js";
import { AuditService } from "../audit/application/services/audit.service.js";
import { Role } from "../identity/domain/role.enum.js";
import { PrivateLocalStorage } from "../../storage/private-local.storage.js";
import {
  DownloadLinkTokenService,
  DownloadMimeType,
  InvalidDownloadLinkError,
} from "./download-link-token.service.js";
import {
  WatermarkIdentity,
  WatermarkProcessingError,
  WatermarkService,
} from "../watermark/watermark.service.js";
import { assertPreorderReleased, preorderAvailability, PreorderReleaseError } from "../preorders/preorder.rules.js";

const purchaseInclude = {
  order: {
    select: {
      id: true,
      createdAt: true,
      user: { select: { email: true } },
    },
  },
  edition: {
    select: {
      id: true,
      format: true,
      work: { select: { title: true, releaseDate: true } },
      digitalAsset: {
        select: {
          versions: {
            where: { isOriginal: true },
            orderBy: { version: "desc" as const },
            take: 1,
            select: {
              id: true,
              version: true,
              storageKey: true,
              mimeType: true,
              createdAt: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.OrderItemInclude;

type LibraryPurchase = Prisma.OrderItemGetPayload<{
  include: typeof purchaseInclude;
}>;

export interface LibraryItemView {
  purchaseId: string;
  purchaseItemId: string;
  editionId: string;
  title: string;
  purchasedAt: Date;
  releaseAt: Date;
  downloadAvailable: boolean;
}

export interface DownloadResult {
  content: Buffer;
  mimeType: DownloadMimeType;
  fileName: string;
  userId: string;
  orderItemId: string;
  orderId: string;
  editionId: string;
  assetVersionId: string;
}

@Injectable()
export class LibraryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: PrivateLocalStorage,
    private readonly watermark: WatermarkService,
    private readonly linkTokens: DownloadLinkTokenService,
    private readonly audit: AuditService,
  ) {}

  async list(userId: string, now = new Date()): Promise<LibraryItemView[]> {
    const purchases = await this.prisma.orderItem.findMany({
      where: {
        format: EditionFormat.DIGITAL,
        order: { userId, status: OrderStatus.CONFIRMED },
      },
      include: purchaseInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    return purchases.map((purchase) => {
      const original = this.latestOriginal(purchase);
      const releaseAt = purchase.edition.work.releaseDate;
      return {
        purchaseId: purchase.order.id,
        purchaseItemId: purchase.id,
        editionId: purchase.edition.id,
        title: purchase.edition.work.title,
        purchasedAt: purchase.order.createdAt,
        releaseAt,
        downloadAvailable:
          preorderAvailability(releaseAt, now) === "RELEASED" &&
          original !== null &&
          this.isSupportedMimeType(original.mimeType),
      };
    });
  }

  async createDownloadLink(
    userId: string,
    editionId: string,
    requestedName: unknown,
    now = new Date(),
  ) {
    const name = this.validateName(requestedName);
    const purchase = await this.prisma.orderItem.findFirst({
      where: {
        editionId,
        format: EditionFormat.DIGITAL,
        order: { userId, status: OrderStatus.CONFIRMED },
      },
      include: purchaseInclude,
    });
    if (!purchase || purchase.edition.format !== EditionFormat.DIGITAL) {
      throw new NotFoundException("E-book adquirido não encontrado");
    }
    try { assertPreorderReleased(purchase.edition.work.releaseDate, now); }
    catch (error) {
      if (error instanceof PreorderReleaseError) throw new ConflictException("O e-book ainda não foi liberado");
      throw error;
    }

    const original = this.latestOriginal(purchase);
    if (!original) {
      await this.recordFailure(userId, purchase, "ORIGINAL_UNAVAILABLE");
      throw new NotFoundException("Arquivo digital indisponível");
    }

    const identity: WatermarkIdentity = {
      name,
      email: purchase.order.user.email,
      purchaseId: purchase.order.id,
    };

    let personalized;
    try {
      const source = await this.storage.read("original", original.storageKey);
      personalized = await this.watermark.personalize(
        source,
        original.mimeType,
        identity,
      );
    } catch (error) {
      const code =
        error instanceof WatermarkProcessingError
          ? error.code
          : "SOURCE_READ_OR_PROCESSING_FAILED";
      await this.recordFailure(userId, purchase, code);
      if (error instanceof WatermarkProcessingError && error.code === "UNSUPPORTED_FORMAT") {
        throw new ConflictException("Formato digital não suportado para download");
      }
      throw new InternalServerErrorException(
        "Não foi possível preparar a cópia personalizada",
      );
    }

    let stored: { storageKey: string };
    try {
      stored = await this.storage.put(
        "derived",
        personalized.content,
        personalized.extension,
      );
    } catch {
      await this.recordFailure(userId, purchase, "DERIVED_STORAGE_FAILED");
      throw new InternalServerErrorException(
        "Não foi possível preparar a cópia personalizada",
      );
    }

    const issued = this.linkTokens.issue({
      userId,
      orderItemId: purchase.id,
      orderId: purchase.order.id,
      editionId: purchase.edition.id,
      assetVersionId: original.id,
      storageKey: stored.storageKey,
      extension: personalized.extension,
      mimeType: personalized.mimeType,
    }, now.getTime());
    await this.audit.logAction({
      actorId: userId,
      actorRole: Role.CUSTOMER,
      action: "DIGITAL_DOWNLOAD_LINK_ISSUED",
      targetType: "DIGITAL_DOWNLOAD",
      targetId: purchase.id,
      metadata: {
        orderId: purchase.order.id,
        editionId: purchase.edition.id,
        assetVersionId: original.id,
        format: personalized.extension,
        expiresAt: issued.expiresAt.toISOString(),
      },
    });

    return {
      downloadUrl: `/library/download/${issued.token}`,
      expiresAt: issued.expiresAt,
      expiresInSeconds: 900,
    };
  }

  async download(token: string): Promise<DownloadResult> {
    let claims;
    try {
      claims = this.linkTokens.verify(token);
    } catch (error) {
      if (error instanceof InvalidDownloadLinkError) {
        throw new UnauthorizedException("Link de download inválido ou expirado");
      }
      throw error;
    }

    let content: Buffer;
    try {
      content = await this.storage.read("derived", claims.storageKey);
    } catch {
      await this.audit.logAction({
        actorId: claims.userId,
        actorRole: Role.CUSTOMER,
        action: "DIGITAL_DOWNLOAD_FAILED",
        targetType: "DIGITAL_DOWNLOAD",
        targetId: claims.orderItemId,
        metadata: { errorCode: "DERIVED_FILE_UNAVAILABLE" },
      });
      throw new NotFoundException("Cópia digital indisponível");
    }

    await this.audit.logAction({
      actorId: claims.userId,
      actorRole: Role.CUSTOMER,
      action: "DIGITAL_DOWNLOAD_COMPLETED",
      targetType: "DIGITAL_DOWNLOAD",
      targetId: claims.orderItemId,
      metadata: {
        orderId: claims.orderId,
        editionId: claims.editionId,
        assetVersionId: claims.assetVersionId,
        format: claims.extension,
      },
    });
    return {
      content,
      mimeType: claims.mimeType,
      fileName: `lumina-${claims.editionId.slice(0, 8)}.${claims.extension}`,
      userId: claims.userId,
      orderItemId: claims.orderItemId,
      orderId: claims.orderId,
      editionId: claims.editionId,
      assetVersionId: claims.assetVersionId,
    };
  }

  private latestOriginal(purchase: LibraryPurchase) {
    return purchase.edition.digitalAsset?.versions[0] ?? null;
  }

  private isSupportedMimeType(value: string): value is DownloadMimeType {
    return value === "application/pdf" || value === "application/epub+zip";
  }

  private validateName(value: unknown): string {
    if (typeof value !== "string") {
      throw new BadRequestException("Informe o nome para personalizar a cópia");
    }
    const name = value.trim();
    if (
      name.length === 0 ||
      [...name].length > 120 ||
      // eslint-disable-next-line no-control-regex -- reject control characters in user-supplied watermark text
      /[\u0000-\u001f\u007f]/u.test(name)
    ) {
      throw new BadRequestException("Nome inválido para personalizar a cópia");
    }
    return name;
  }

  private async recordFailure(
    userId: string,
    purchase: LibraryPurchase,
    errorCode: string,
  ): Promise<void> {
    await this.audit.logAction({
      actorId: userId,
      actorRole: Role.CUSTOMER,
      action: "DIGITAL_COPY_PROCESSING_FAILED",
      targetType: "DIGITAL_DOWNLOAD",
      targetId: purchase.id,
      metadata: {
        orderId: purchase.order.id,
        editionId: purchase.edition.id,
        errorCode: errorCode.slice(0, 60),
      },
    });
  }
}
