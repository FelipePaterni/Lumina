import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import crypto from "node:crypto";
import { PrismaService } from "../../../../infrastructure/persistence/prisma.service.js";
import { Role } from "../../domain/role.enum.js";
import { PasswordHasherService } from "./password-hasher.service.js";
import { TokenService } from "./token.service.js";
import { JwtTokenService } from "./jwt-token.service.js";
import { NotificationEventType } from "../../../notifications/notification-event.js";
import { NotificationService } from "../../../notifications/notification.service.js";

export interface AuthResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    isEmailConfirmed: boolean;
  };
}

const STAFF_ROLES = new Set<Role>([Role.ADMIN, Role.CATALOG, Role.STOCK]);
const STAFF_INVITATION_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hasher: PasswordHasherService,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtTokenService,
    private readonly notifications: NotificationService,
  ) {}

  async register(
    email: string,
    password: string,
  ): Promise<{ message: string; userId: string }> {
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const passwordHash = await this.hasher.hash(password);

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: Role.CUSTOMER,
        isEmailConfirmed: false,
      },
    });

    const { token, tokenHash } = this.tokenService.generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const verificationRecord = await this.prisma.emailVerificationToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    await this.notifications.dispatchSimulatedEmail({
      eventKey: `identity:${user.id}:email-confirmation:${verificationRecord.id}`,
      eventType: NotificationEventType.EMAIL_CONFIRMATION_REQUESTED,
      toEmail: user.email,
      subject: "Confirmação de Cadastro - Lumina Livros",
      body: `Seu código de ativação é: ${token}`,
    });

    return {
      message:
        "Cadastro realizado com sucesso. Verifique seu e-mail para confirmar a conta.",
      userId: user.id,
    };
  }

  async confirmEmail(token: string): Promise<{ message: string }> {
    const tokenHash = this.tokenService.hashToken(token);

    const record = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException(
        "Token de confirmação inválido ou expirado.",
      );
    }

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { isEmailConfirmed: true },
      }),
    ]);

    return { message: "E-mail confirmado com sucesso." };
  }

  async createStaffInvitation(input: {
    email: string;
    role: Role;
  }): Promise<{ userId: string; email: string; role: Role; token: string }> {
    const email = input.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestException("E-mail inválido.");
    }
    if (!STAFF_ROLES.has(input.role)) {
      throw new BadRequestException("Papel de equipe inválido.");
    }

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException("Email already in use");

    const temporaryPassword = crypto.randomBytes(32).toString("base64url");
    const passwordHash = await this.hasher.hash(temporaryPassword);
    const { token, tokenHash } = this.tokenService.generateOpaqueToken();
    const expiresAt = new Date(Date.now() + STAFF_INVITATION_TTL_MS);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: input.role,
        isEmailConfirmed: false,
        staffInvitationTokens: {
          create: { tokenHash, expiresAt },
        },
      },
      select: { id: true, email: true, role: true },
    });

    return {
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      token,
    };
  }

  async acceptStaffInvitation(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!token || !newPassword || newPassword.length < 12) {
      throw new BadRequestException("Convite ou senha inválidos.");
    }
    const record = await this.prisma.staffInvitationToken.findUnique({
      where: { tokenHash: this.tokenService.hashToken(token) },
      include: { user: true },
    });
    const now = new Date();
    if (
      !record ||
      record.usedAt ||
      record.expiresAt <= now ||
      record.user.isEmailConfirmed
    ) {
      throw new BadRequestException(
        "Convite inválido, expirado ou já utilizado.",
      );
    }

    const passwordHash = await this.hasher.hash(newPassword);
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.staffInvitationToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException(
          "Convite inválido, expirado ou já utilizado.",
        );
      }
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash, isEmailConfirmed: true },
      });
    });
    return { message: "Conta de equipe ativada com sucesso." };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      // Execute dummy hash comparison to prevent timing enumeration
      await this.hasher.compare(
        password,
        "$2a$10$dummyhashfortimingpreventionxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      );
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const isValidPassword = await this.hasher.compare(
      password,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException("Credenciais inválidas.");
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      isEmailConfirmed: user.isEmailConfirmed,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
        isEmailConfirmed: user.isEmailConfirmed,
      },
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Anti-enumeration: Return generic message whether user exists or not
    const genericSuccess = {
      message:
        "Se o e-mail informado estiver cadastrado, as instruções para redefinição foram enviadas.",
    };

    if (!user || !user.isActive) {
      return genericSuccess;
    }

    const { token, tokenHash } = this.tokenService.generateOpaqueToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    const resetRecord = await this.prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    await this.notifications.dispatchSimulatedEmail({
      eventKey: `identity:${user.id}:password-reset:${resetRecord.id}`,
      eventType: NotificationEventType.PASSWORD_RESET_REQUESTED,
      toEmail: user.email,
      subject: "Recuperação de Senha - Lumina Livros",
      body: `Seu token de recuperação é: ${token}`,
    });

    return genericSuccess;
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = this.tokenService.hashToken(token);

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException(
        "Token de recuperação inválido ou expirado.",
      );
    }

    const newPasswordHash = await this.hasher.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: newPasswordHash },
      }),
    ]);

    return { message: "Senha redefinida com sucesso." };
  }
}
