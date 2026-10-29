import assert from "node:assert/strict";
import test from "node:test";
import { AuditLogEntity } from "../../../apps/api/dist/modules/audit/domain/audit-log.entity.js";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";

test("AuditLogEntity - instancia com sucesso ação não-sensível sem motivo", () => {
  const audit = new AuditLogEntity({
    actorId: "actor-1",
    actorRole: Role.CUSTOMER,
    action: "ITEM_VIEWED",
    targetType: "BOOK",
    targetId: "book-1",
  });

  assert.equal(audit.action, "ITEM_VIEWED");
  assert.equal(audit.targetType, "BOOK");
  assert.equal(audit.reason, null);
  assert.ok(audit.createdAt instanceof Date);
});

test("AuditLogEntity - exige motivo em ações sensíveis (DoD / RN-017)", () => {
  // Ação sensível sem motivo deve lançar erro
  assert.throws(
    () =>
      new AuditLogEntity({
        actorId: "admin-1",
        actorRole: Role.ADMIN,
        action: "USER_ROLE_UPDATED",
        targetType: "USER",
        targetId: "user-2",
      }),
    /Reason is required for sensitive action 'USER_ROLE_UPDATED'/,
  );

  // Ação sensível com motivo muito curto deve lançar erro
  assert.throws(
    () =>
      new AuditLogEntity({
        actorId: "admin-1",
        actorRole: Role.ADMIN,
        action: "USER_STATUS_UPDATED",
        targetType: "USER",
        targetId: "user-2",
        reason: "abc",
      }),
    /minimum 5 characters/,
  );

  // Ação sensível com motivo válido deve ser criada
  const validAudit = new AuditLogEntity({
    actorId: "admin-1",
    actorRole: Role.ADMIN,
    action: "USER_ROLE_UPDATED",
    targetType: "USER",
    targetId: "user-2",
    reason: "Promoção para equipe de estoque",
  });

  assert.equal(validAudit.action, "USER_ROLE_UPDATED");
  assert.equal(validAudit.reason, "Promoção para equipe de estoque");
});

test("AuditLogEntity - sanitiza PII e credenciais nos metadados (RN-017 / RNF-003)", () => {
  const rawMetadata = {
    newRole: "CATALOG",
    password: "SuperSecretPassword123!",
    token: "jwt.secret.token",
    email: "cliente@exemplo.com",
    cpf: "123.456.789-00",
    nested: {
      passwordHash: "$2a$10$abcdef...",
      normalField: "visible",
    },
  };

  const audit = new AuditLogEntity({
    actorId: "admin-1",
    actorRole: Role.ADMIN,
    action: "USER_ROLE_UPDATED",
    targetType: "USER",
    targetId: "user-2",
    reason: "Ajuste de privilégios de acesso",
    metadata: rawMetadata,
  });

  const parsed = JSON.parse(audit.metadata);
  assert.equal(parsed.password, "[REDACTED]");
  assert.equal(parsed.token, "[REDACTED]");
  assert.equal(parsed.email, "[REDACTED]");
  assert.equal(parsed.cpf, "[REDACTED]");
  assert.equal(parsed.nested.passwordHash, "[REDACTED]");
  assert.equal(parsed.nested.normalField, "visible");
  assert.equal(parsed.newRole, "CATALOG");
});
