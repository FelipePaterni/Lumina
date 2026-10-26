import { Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { Role } from "../../domain/role.enum.js";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  isEmailConfirmed: boolean;
}

@Injectable()
export class JwtTokenService {
  private readonly issuer = "lumina-api";
  private readonly audience = "lumina-web";

  private get secret(): string {
    return (
      process.env.JWT_SECRET || "local-development-secret-key-min-32-chars-long"
    );
  }

  sign(payload: JwtPayload, expiresInSeconds = 3600): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: expiresInSeconds,
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret, {
      issuer: this.issuer,
      audience: this.audience,
    }) as JwtPayload;
  }
}
