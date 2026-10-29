import { Role } from "../../identity/domain/role.enum.js";

export interface CreateAuditLogParams {
  actorId?: string | null;
  actorRole?: Role | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class AuditLogEntity {
  public readonly id?: string;
  public readonly actorId?: string | null;
  public readonly actorRole?: Role | null;
  public readonly action: string;
  public readonly targetType: string;
  public readonly targetId?: string | null;
  public readonly reason?: string | null;
  public readonly metadata?: string | null;
  public readonly createdAt: Date;

  // Lista de ações sensíveis que exigem motivo obrigatório (RN-017 / DoD)
  private static readonly SENSITIVE_ACTIONS_REQUIRING_REASON = new Set([
    "USER_ROLE_UPDATED",
    "USER_STATUS_UPDATED",
    "ACCOUNT_DELETION_REQUESTED",
    "REVIEW_REMOVED",
    "REFUND_PROCESSED",
  ]);

  constructor(params: CreateAuditLogParams, id?: string, createdAt?: Date) {
    if (!params.action || params.action.trim().length === 0) {
      throw new Error("Audit action cannot be empty");
    }
    if (!params.targetType || params.targetType.trim().length === 0) {
      throw new Error("Audit targetType cannot be empty");
    }

    // Validação estrita de motivo obrigatório em ações sensíveis (DoD)
    if (AuditLogEntity.isSensitiveAction(params.action)) {
      if (!params.reason || params.reason.trim().length < 5) {
        throw new Error(
          `Reason is required for sensitive action '${params.action}' (minimum 5 characters)`,
        );
      }
    }

    // Sanitização contra vazamento acidental de PII (RN-017 / RNF-003)
    const sanitizedMetadata = params.metadata
      ? AuditLogEntity.sanitizeMetadata(params.metadata)
      : null;

    this.id = id;
    this.actorId = params.actorId ?? null;
    this.actorRole = params.actorRole ?? null;
    this.action = params.action.trim();
    this.targetType = params.targetType.trim();
    this.targetId = params.targetId ?? null;
    this.reason = params.reason ? params.reason.trim() : null;
    this.metadata = sanitizedMetadata ? JSON.stringify(sanitizedMetadata) : null;
    this.createdAt = createdAt ?? new Date();
  }

  public static isSensitiveAction(action: string): boolean {
    return this.SENSITIVE_ACTIONS_REQUIRING_REASON.has(action);
  }

  /**
   * Remove chaves sensíveis que contenham PII ou credenciais
   */
  public static sanitizeMetadata(
    metadata: Record<string, unknown>,
  ): Record<string, unknown> {
    const forbiddenKeys = new Set([
      "password",
      "passwordhash",
      "token",
      "tokenhash",
      "secret",
      "authorization",
      "cpf",
      "card",
      "cvv",
      "email",
    ]);

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (forbiddenKeys.has(lowerKey)) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
