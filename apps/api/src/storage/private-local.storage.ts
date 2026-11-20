import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

@Injectable()
export class PrivateLocalStorage {
  private readonly root =
    process.env.PRIVATE_STORAGE_ROOT ||
    join(process.cwd(), "storage", "private");

  async put(
    scope: "original" | "derived",
    content: Uint8Array,
    extension: string,
  ): Promise<{ storageKey: string; checksum: string }> {
    const safeExtension =
      extension.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10) || "bin";
    const checksum = createHash("sha256").update(content).digest("hex");
    const storageKey = join(scope, `${checksum}.${safeExtension}`);
    const absolute = join(this.root, storageKey);
    const rootRelative = relative(this.root, absolute);
    if (rootRelative.startsWith(`..${sep}`) || rootRelative === "..")
      throw new Error("Chave de armazenamento inválida");
    await mkdir(join(this.root, scope), { recursive: true });
    await writeFile(absolute, content, { flag: "wx" }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code !== "EEXIST") throw error;
      },
    );
    return { storageKey: storageKey.replaceAll(sep, "/"), checksum };
  }

  async read(
    scope: "original" | "derived",
    storageKey: string,
  ): Promise<Buffer> {
    const absolute = this.resolveStoragePath(scope, storageKey);
    const metadata = await lstat(absolute);
    if (!metadata.isFile() || metadata.isSymbolicLink()) {
      throw new Error("Arquivo privado inválido");
    }
    return readFile(absolute);
  }

  private resolveStoragePath(
    scope: "original" | "derived",
    storageKey: string,
  ): string {
    const match = /^(original|derived)\/([a-f0-9]{64})\.([a-z0-9]{1,10})$/i.exec(
      storageKey,
    );
    if (!match || match[1] !== scope) {
      throw new Error("Chave de armazenamento inválida");
    }

    const root = resolve(this.root);
    const absolute = resolve(root, scope, `${match[2]}.${match[3]}`);
    const rootRelative = relative(root, absolute);
    if (
      rootRelative.startsWith(`..${sep}`) ||
      rootRelative === ".." ||
      isAbsolute(rootRelative)
    ) {
      throw new Error("Chave de armazenamento inválida");
    }
    return absolute;
  }
}
