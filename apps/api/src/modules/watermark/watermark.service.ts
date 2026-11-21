import { Injectable } from "@nestjs/common";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";

export interface WatermarkIdentity {
  name: string;
  email: string;
  purchaseId: string;
}

export interface PersonalizedCopy {
  content: Uint8Array;
  extension: "pdf" | "epub";
  mimeType: "application/pdf" | "application/epub+zip";
}

export class WatermarkProcessingError extends Error {
  constructor(
    readonly code: "UNSUPPORTED_FORMAT" | "INVALID_FILE" | "FILE_TOO_LARGE",
  ) {
    super("A cópia digital não pôde ser personalizada");
    this.name = "WatermarkProcessingError";
  }
}

const MAX_PDF_BYTES = 25 * 1024 * 1024;
const MAX_EPUB_BYTES = 25 * 1024 * 1024;
const MAX_EPUB_EXPANDED_BYTES = 100 * 1024 * 1024;
const MAX_EPUB_ENTRIES = 10_000;

@Injectable()
export class WatermarkService {
  async personalize(
    source: Uint8Array,
    mimeType: string,
    identity: WatermarkIdentity,
  ): Promise<PersonalizedCopy> {
    if (mimeType === "application/pdf") {
      return this.personalizePdf(source, identity);
    }
    if (mimeType === "application/epub+zip") {
      return this.personalizeEpub(source, identity);
    }
    throw new WatermarkProcessingError("UNSUPPORTED_FORMAT");
  }

  private async personalizePdf(
    source: Uint8Array,
    identity: WatermarkIdentity,
  ): Promise<PersonalizedCopy> {
    if (source.byteLength > MAX_PDF_BYTES) {
      throw new WatermarkProcessingError("FILE_TOO_LARGE");
    }
    if (!Buffer.from(source).subarray(0, 5).equals(Buffer.from("%PDF-"))) {
      throw new WatermarkProcessingError("INVALID_FILE");
    }

    try {
      const document = await PDFDocument.load(source, {
        throwOnInvalidObject: true,
        updateMetadata: false,
      });
      const font = await document.embedFont(StandardFonts.Helvetica);
      document.setKeywords([
        identity.name,
        identity.email,
        identity.purchaseId,
      ]);

      for (const page of document.getPages()) {
        const { width, height } = page.getSize();
        const margin = Math.min(18, Math.max(8, width * 0.04));
        const availableWidth = width - margin * 2;
        if (availableWidth < 60 || height < 80) {
          throw new WatermarkProcessingError("INVALID_FILE");
        }
        const lines = [
          ...this.wrapText(`Nome: ${identity.name}`, font, 7, availableWidth),
          ...this.wrapText(`E-mail: ${identity.email}`, font, 7, availableWidth),
          ...this.wrapText(`Compra: ${identity.purchaseId}`, font, 7, availableWidth),
        ];
        const lineHeight = 9;
        const blockHeight = lines.length * lineHeight + margin;
        if (blockHeight > height * 0.45) {
          throw new WatermarkProcessingError("INVALID_FILE");
        }
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height: blockHeight + margin / 2,
          color: rgb(1, 1, 1),
          opacity: 0.72,
        });
        lines.forEach((line, index) => {
          page.drawText(line, {
            x: margin,
            y: margin / 2 + (lines.length - index - 1) * lineHeight,
            size: 7,
            font,
            color: rgb(0.25, 0.25, 0.25),
          });
        });
      }

      return {
        content: await document.save({ useObjectStreams: false }),
        extension: "pdf",
        mimeType: "application/pdf",
      };
    } catch (error) {
      if (error instanceof WatermarkProcessingError) throw error;
      throw new WatermarkProcessingError("INVALID_FILE");
    }
  }

  private async personalizeEpub(
    source: Uint8Array,
    identity: WatermarkIdentity,
  ): Promise<PersonalizedCopy> {
    if (source.byteLength > MAX_EPUB_BYTES) {
      throw new WatermarkProcessingError("FILE_TOO_LARGE");
    }

    try {
      const input = await JSZip.loadAsync(source);
      const entries = Object.values(input.files).filter((entry) => !entry.dir);
      if (entries.length === 0 || entries.length > MAX_EPUB_ENTRIES) {
        throw new WatermarkProcessingError("INVALID_FILE");
      }

      let totalExpandedBytes = 0;
      for (const entry of entries) {
        if (
          (entry.unsafeOriginalName && entry.unsafeOriginalName !== entry.name) ||
          !this.isSafeZipPath(entry.name)
        ) {
          throw new WatermarkProcessingError("INVALID_FILE");
        }
        const size = (
          entry as JSZip.JSZipObject & {
            _data?: { uncompressedSize?: number };
          }
        )._data?.uncompressedSize;
        if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0) {
          throw new WatermarkProcessingError("INVALID_FILE");
        }
        totalExpandedBytes += size;
        if (totalExpandedBytes > MAX_EPUB_EXPANDED_BYTES) {
          throw new WatermarkProcessingError("FILE_TOO_LARGE");
        }
      }

      const mimetypeFile = input.file("mimetype");
      const containerFile = input.file("META-INF/container.xml");
      if (!mimetypeFile || !containerFile) {
        throw new WatermarkProcessingError("INVALID_FILE");
      }
      const mimetype = (await mimetypeFile.async("string")).trim();
      if (mimetype !== "application/epub+zip") {
        throw new WatermarkProcessingError("INVALID_FILE");
      }

      const container = await containerFile.async("string");
      const rootfile = /<(?:[A-Za-z_][\w.-]*:)?rootfile\b[^>]*\bfull-path\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*\/?\s*>/i.exec(
        container,
      );
      const packagePath = rootfile?.[1] ?? rootfile?.[2];
      if (!packagePath || !this.isSafeZipPath(packagePath)) {
        throw new WatermarkProcessingError("INVALID_FILE");
      }
      const packageFile = input.file(packagePath);
      if (!packageFile) throw new WatermarkProcessingError("INVALID_FILE");
      const packageDocument = await packageFile.async("string");
      if (!/<(?:[A-Za-z_][\w.-]*:)?package\b/i.test(packageDocument)) {
        throw new WatermarkProcessingError("INVALID_FILE");
      }

      const manifestClose = /<\/((?:[A-Za-z_][\w.-]*:)?manifest)\s*>/i.exec(
        packageDocument,
      );
      const spineClose = /<\/((?:[A-Za-z_][\w.-]*:)?spine)\s*>/i.exec(
        packageDocument,
      );
      if (!manifestClose || !spineClose) {
        throw new WatermarkProcessingError("INVALID_FILE");
      }
      const packageDirectory = packagePath.includes("/")
        ? packagePath.slice(0, packagePath.lastIndexOf("/") + 1)
        : "";
      let suffix = 0;
      let pageName = "lumina-watermark.xhtml";
      let itemId = "lumina-watermark";
      while (
        input.file(`${packageDirectory}${pageName}`) ||
        new RegExp(`\\bid\\s*=\\s*["']${itemId}["']`).test(packageDocument)
      ) {
        suffix += 1;
        pageName = `lumina-watermark-${suffix}.xhtml`;
        itemId = `lumina-watermark-${suffix}`;
      }

      const manifestPrefix = manifestClose[1].includes(":")
        ? `${manifestClose[1].split(":")[0]}:`
        : "";
      const spinePrefix = spineClose[1].includes(":")
        ? `${spineClose[1].split(":")[0]}:`
        : "";
      const manifestItem = `<${manifestPrefix}item id="${itemId}" href="${pageName}" media-type="application/xhtml+xml"/>`;
      const spineItem = `<${spinePrefix}itemref idref="${itemId}"/>`;
      const updatedPackage = packageDocument
        .replace(manifestClose[0], `${manifestItem}</${manifestClose[1]}>`)
        .replace(spineClose[0], `${spineItem}</${spineClose[1]}>`);
      const page = this.createEpubWatermarkPage(identity);

      const output = new JSZip();
      output.file("mimetype", "application/epub+zip", {
        compression: "STORE",
        createFolders: false,
      });
      for (const entry of entries) {
        if (entry.name === "mimetype") continue;
        if (entry.name === packagePath) {
          output.file(entry.name, updatedPackage, {
            binary: false,
            compression: "DEFLATE",
            createFolders: false,
            date: entry.date,
          });
        } else {
          output.file(entry.name, await entry.async("uint8array"), {
            binary: true,
            compression: "DEFLATE",
            createFolders: false,
            date: entry.date,
          });
        }
      }
      output.file(`${packageDirectory}${pageName}`, page, {
        binary: false,
        compression: "DEFLATE",
        createFolders: false,
      });

      return {
        content: await output.generateAsync({
          type: "uint8array",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        }),
        extension: "epub",
        mimeType: "application/epub+zip",
      };
    } catch (error) {
      if (error instanceof WatermarkProcessingError) throw error;
      throw new WatermarkProcessingError("INVALID_FILE");
    }
  }

  private wrapText(
    value: string,
    font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
    fontSize: number,
    maxWidth: number,
  ): string[] {
    const words = value.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      current = "";
      for (const character of word) {
        const next = current + character;
        if (font.widthOfTextAtSize(next, fontSize) > maxWidth && current) {
          lines.push(current);
          current = character;
        } else {
          current = next;
        }
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private createEpubWatermarkPage(identity: WatermarkIdentity): string {
    const escape = (value: string) =>
      value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Cópia personalizada</title></head><body><section epub:type="colophon"><h1>Cópia personalizada</h1><p>Nome: ${escape(identity.name)}</p><p>E-mail: ${escape(identity.email)}</p><p>Compra: ${escape(identity.purchaseId)}</p></section></body></html>`;
  }

  private isSafeZipPath(path: string): boolean {
    return (
      path.length > 0 &&
      !path.startsWith("/") &&
      !path.includes("\\") &&
      !path.includes("\0") &&
      !/^[A-Za-z]:/.test(path) &&
      path.split("/").every((part) => part !== ".." && part !== ".")
    );
  }
}
