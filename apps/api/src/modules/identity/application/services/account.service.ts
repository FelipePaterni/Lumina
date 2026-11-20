import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../../infrastructure/persistence/prisma.service.js";
import { Role } from "../../domain/role.enum.js";
import { NotificationEventType } from "../../../notifications/notification-event.js";
import { NotificationService } from "../../../notifications/notification.service.js";

type PrismaRole = import("@prisma/client").$Enums.Role;

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
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
    const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@lumina.local";
    const eventKey = `identity:${userId}:deletion-request:${now.getTime()}`;
    await this.notifications.dispatchSimulatedEmail({
      eventKey: `${eventKey}:customer`,
      eventType: NotificationEventType.ACCOUNT_DELETION_REQUESTED,
      toEmail: updatedUser.email,
      subject: "Lumina Livros - Solicitação de exclusão de conta",
      body: `Sua conta foi desativada em ${now.toISOString()}. Você tem até ${scheduledDeletionAt.toISOString()} (30 dias) para reativá-la antes da exclusão definitiva.`,
    });
    await this.notifications.dispatchSimulatedEmail({
      eventKey: `${eventKey}:admin`,
      eventType: NotificationEventType.ACCOUNT_DELETION_REQUESTED,
      toEmail: adminEmail,
      subject: "Notificação Administrativa - Solicitação de exclusão de conta",
      body: `Uma conta solicitou exclusão. Identificador interno: ${userId}. Prazo: ${scheduledDeletionAt.toISOString()}.`,
    });

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

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        deactivatedAt: null,
        scheduledDeletionAt: null,
      },
      select: { email: true },
    });

    const eventKey = `identity:${userId}:account-reactivated:${Date.now()}`;
    const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@lumina.local";
    await this.notifications.dispatchSimulatedEmail({
      eventKey: `${eventKey}:customer`,
      eventType: NotificationEventType.ACCOUNT_REACTIVATED,
      toEmail: updatedUser.email,
      subject: "Lumina Livros - Conta reativada com sucesso",
      body: "Sua solicitação de exclusão foi cancelada e sua conta foi reativada.",
    });
    await this.notifications.dispatchSimulatedEmail({
      eventKey: `${eventKey}:admin`,
      eventType: NotificationEventType.ACCOUNT_REACTIVATED,
      toEmail: adminEmail,
      subject: "Notificação Administrativa - Conta reativada",
      body: `A conta de identificador interno ${userId} foi reativada dentro do prazo de carência.`,
    });

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
      select: { id: true, email: true, role: true, updatedAt: true },
    });

    if (targetUser.role !== updated.role) {
      await this.notifications.dispatchSimulatedEmail({
        eventKey: `identity:${updated.id}:role-changed:${updated.updatedAt.toISOString()}`,
        eventType: NotificationEventType.ACCOUNT_ROLE_CHANGED,
        toEmail: updated.email,
        subject: "Lumina Livros - Perfil da conta atualizado",
        body: `O perfil da sua conta foi atualizado para ${updated.role}.`,
      });
    }

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

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      throw new NotFoundException("Usuário alvo não encontrado");
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
      select: { id: true, email: true, isActive: true, updatedAt: true },
    });

    if (targetUser.isActive !== updated.isActive) {
      await this.notifications.dispatchSimulatedEmail({
        eventKey: `identity:${updated.id}:status-changed:${updated.updatedAt.toISOString()}`,
        eventType: NotificationEventType.ACCOUNT_STATUS_CHANGED,
        toEmail: updated.email,
        subject: "Lumina Livros - Estado da conta atualizado",
        body: `O estado da sua conta foi atualizado para ${updated.isActive ? "ativa" : "inativa"}.`,
      });
    }

    return { id: updated.id, isActive: updated.isActive };
  }
}
