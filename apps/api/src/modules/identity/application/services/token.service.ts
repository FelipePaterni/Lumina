import { Injectable } from "@nestjs/common";
import crypto from "node:crypto";

@Injectable()
export class TokenService {
  generateOpaqueToken(): { token: string; tokenHash: string } {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(token);
    return { token, tokenHash };
  }

  hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }
}
