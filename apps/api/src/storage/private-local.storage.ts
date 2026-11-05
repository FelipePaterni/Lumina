import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

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
}
