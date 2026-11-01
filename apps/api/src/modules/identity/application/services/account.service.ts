import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/persistence/prisma.service.js";
import { Role } from "../../domain/role.enum.js";
import { EmailDispatcherService } from "./email-dispatcher.service.js";

type PrismaRole = import("@prisma/client").$Enums.Role;

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatcher: EmailDispatcherService,
  ) {}

  /**
   * Solicitação de exclusão/desativação pelo próprio cliente (RF-002 / RN-018)
   * Desativa a conta e agenda exclusão para daqui a 30 dias.
   */
  async requestAccountDeletion(
    userId: string,

  ): Promise<{
    message: string;
    deactivatedAt: Date;
    scheduledDeletionAt: Date;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    if (!user.isActive) {
      throw new BadRequestException("Esta conta já se encontra desativada");
    }

    // Regra de segurança: Não permitir auto-desativação do único Admin ativo
    if (user.role === Role.ADMIN) {
      const activeAdminsCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, isActive: true },
      });
      if (activeAdminsCount <= 1) {
        throw new ForbiddenException(
          "Não é permitido desativar o único Administrador ativo do sistema",
        );
      }
    }

    const now = new Date();
    // Prazo de carência configurável (30 dias padrão conforme RN-018)
    const scheduledDeletionAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deactivatedAt: now,
        scheduledDeletionAt,
      },
    });

    // Enviar notificações simuladas ao cliente e ao admin (RN-018 / RN-019)
    await this.emailDispatcher.dispatchSimulatedEmail(
      updatedUser.email,
      "Lumina Livros - Solicitação de exclusão de conta",
      `Sua conta foi desativada em ${now.toISOString()}. Você tem até ${scheduledDeletionAt.toISOString()} (30 dias) para reativá-la antes da exclusão definitiva.`,
    );

    const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@lumina.local";
    await this.emailDispatcher.dispatchSimulatedEmail(
      adminEmail,
      "Notificação Administrativa - Solicitação de exclusão de conta",
      `O usuário ID ${userId} solicitou a exclusão da conta. Exclusão agendada para ${scheduledDeletionAt.toISOString()}.`,
    );

    return {
      message:
        "Sua conta foi desativada. Você possui 30 dias para reativá-la antes da exclusão permanente.",
      deactivatedAt: now,
      scheduledDeletionAt,
    };
  }

  /**
   * Reativação de conta dentro da janela de 30 dias (RN-018)
   */
  async reactivateAccount(
    userId: string,
  ): Promise<{ message: string; isActive: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    if (user.isActive) {
      return { message: "A conta já está ativa", isActive: true };
    }

    const now = new Date();
    if (user.scheduledDeletionAt && now > user.scheduledDeletionAt) {
      throw new BadRequestException(
        "O prazo de 30 dias para reativação expirou. Entre em contato com o suporte.",
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        deactivatedAt: null,
        scheduledDeletionAt: null,
      },
    });

    // Notificação ao cliente
    await this.emailDispatcher.dispatchSimulatedEmail(
      user.email,
      "Lumina Livros - Conta reativada com sucesso",
      "Sua solicitação de exclusão foi cancelada e sua conta foi reativada.",
    );

    return {
      message: "Sua conta foi reativada com sucesso.",
      isActive: true,
    };
  }

  /**
   * Listagem administrativa de usuários (RF-023 / UC-023)
   */
  async listUsers(params: {
    page?: number;
    limit?: number;
    role?: Role;
  }): Promise<{
    users: Array<{
      id: string;
      email: string;
      role: Role;
      isActive: boolean;
      isEmailConfirmed: boolean;
      deactivatedAt: Date | null;
      createdAt: Date;
    }>;
    total: number;
  }> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;
    const skip = (page - 1) * limit;

    const where = params.role ? { role: params.role as unknown as PrismaRole } : {};

    const [rawUsers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          isEmailConfirmed: true,
          deactivatedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const users = rawUsers.map((u) => ({
      ...u,
      role: u.role as unknown as Role,
    }));

    return { users, total };
  }

  /**
   * Atualização administrativa de papel (RBAC / RF-023)
   */
  async updateUserRole(
    actorId: string,
    targetUserId: string,
    newRole: Role,
    reason: string,
  ): Promise<{ id: string; email: string; role: Role }> {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException(
        "Motivo obrigatório para alteração de papel (mínimo 5 caracteres)",
      );
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException("Usuário alvo não encontrado");
    }

    // Regra de segurança: O admin não pode alterar o próprio papel
    if (actorId === targetUserId && newRole !== Role.ADMIN) {
      throw new ForbiddenException(
        "Um Administrador não pode revogar o próprio papel administrativo",
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole as unknown as PrismaRole },
      select: { id: true, email: true, role: true },
    });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role as unknown as Role,
    };
  }

  /**
   * Bloqueio ou ativação administrativa (RF-023)
   */
  async updateUserStatus(
    actorId: string,
    targetUserId: string,
    isActive: boolean,
    reason: string,
  ): Promise<{ id: string; isActive: boolean }> {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException(
        "Motivo obrigatório para alteração de status do usuário (mínimo 5 caracteres)",
      );
    }

    if (actorId === targetUserId && !isActive) {
      throw new ForbiddenException(
        "Um Administrador não pode desativar sua própria conta via painel administrativo",
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: { id: true, isActive: true },
    });

    return updated;
  }
}
