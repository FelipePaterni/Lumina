import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";

export const DOWNLOAD_LINK_TTL_SECONDS = 15 * 60;

export type DownloadMimeType = "application/pdf" | "application/epub+zip";
export type DownloadExtension = "pdf" | "epub";

export interface DownloadLinkClaims {
  userId: string;
  orderItemId: string;
  orderId: string;
  editionId: string;
  assetVersionId: string;
  storageKey: string;
  extension: DownloadExtension;
  mimeType: DownloadMimeType;
  expiresAt: number;
}

export class InvalidDownloadLinkError extends Error {
  constructor(readonly code: "DOWNLOAD_LINK_INVALID" | "DOWNLOAD_LINK_EXPIRED") {
    super("Link de download inválido ou expirado");
    this.name = "InvalidDownloadLinkError";
  }
}

@Injectable()
export class DownloadLinkTokenService {
  issue(
    claims: Omit<DownloadLinkClaims, "expiresAt">,
    now = Date.now(),
  ): { token: string; expiresAt: Date } {
    const expiresAtSeconds = Math.floor(now / 1000) + DOWNLOAD_LINK_TTL_SECONDS;
    const payload: DownloadLinkClaims = {
      ...claims,
      expiresAt: expiresAtSeconds,
    };
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key(), iv);
    cipher.setAAD(this.aad);
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(payload), "utf8"),
      cipher.final(),
    ]);
    const token = [
      iv.toString("base64url"),
      cipher.getAuthTag().toString("base64url"),
      ciphertext.toString("base64url"),
    ].join(".");

    return {
      token,
      expiresAt: new Date(expiresAtSeconds * 1000),
    };
  }

  verify(token: string, now = Date.now()): DownloadLinkClaims {
    try {
      if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
        throw new Error("Malformed token");
      }
      const [ivText, tagText, ciphertextText] = token.split(".");
      const iv = Buffer.from(ivText, "base64url");
      const tag = Buffer.from(tagText, "base64url");
      const ciphertext = Buffer.from(ciphertextText, "base64url");
      if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) {
        throw new Error("Malformed token");
      }

      const decipher = createDecipheriv("aes-256-gcm", this.key(), iv);
      decipher.setAAD(this.aad);
      decipher.setAuthTag(tag);
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString("utf8");
      const payload: unknown = JSON.parse(plaintext);
      if (!this.isClaims(payload)) throw new Error("Invalid claims");
      if (payload.expiresAt <= Math.floor(now / 1000)) {
        throw new InvalidDownloadLinkError("DOWNLOAD_LINK_EXPIRED");
      }
      return payload;
    } catch (error) {
      if (error instanceof InvalidDownloadLinkError) throw error;
      throw new InvalidDownloadLinkError("DOWNLOAD_LINK_INVALID");
    }
  }

  private readonly aad = Buffer.from("lumina:temporary-library-download:v1", "utf8");

  private key(): Buffer {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET não configurado");
    }
    return createHash("sha256")
      .update(`lumina:temporary-library-download:v1:${secret ?? "local-development-secret-key-min-32-chars-long"}`)
      .digest();
  }

  private isClaims(value: unknown): value is DownloadLinkClaims {
    if (typeof value !== "object" || value === null) return false;
    const claims = value as Record<string, unknown>;
    return (
      typeof claims.userId === "string" &&
      typeof claims.orderItemId === "string" &&
      typeof claims.orderId === "string" &&
      typeof claims.editionId === "string" &&
      typeof claims.assetVersionId === "string" &&
      typeof claims.storageKey === "string" &&
      /^derived\/[a-f0-9]{64}\.(?:pdf|epub)$/i.test(claims.storageKey) &&
      (claims.extension === "pdf" || claims.extension === "epub") &&
      (claims.mimeType === "application/pdf" ||
        claims.mimeType === "application/epub+zip") &&
      ((claims.extension === "pdf" &&
        claims.mimeType === "application/pdf" &&
        claims.storageKey.endsWith(".pdf")) ||
        (claims.extension === "epub" &&
          claims.mimeType === "application/epub+zip" &&
          claims.storageKey.endsWith(".epub"))) &&
      typeof claims.expiresAt === "number" &&
      Number.isSafeInteger(claims.expiresAt)
    );
  }
}
