import assert from "node:assert/strict";
import test from "node:test";
import { AuthService } from "../../../apps/api/dist/modules/identity/application/services/auth.service.js";
import { Role } from "../../../apps/api/dist/modules/identity/domain/role.enum.js";

function createHarness() {
  const users = new Map();
  const invitations = new Map();
  let nextId = 1;
  const prisma = {
    user: {
      findUnique: async ({ where }) => users.get(where.email) ?? null,
      create: async ({ data }) => {
        const id = `staff-${nextId++}`;
        const user = {
          id,
          email: data.email,
          role: data.role,
          passwordHash: data.passwordHash,
          isEmailConfirmed: data.isEmailConfirmed,
          isActive: true,
        };
        users.set(user.email, user);
        const invite = data.staffInvitationTokens.create;
        invitations.set(invite.tokenHash, {
          id: `invite-${id}`,
          tokenHash: invite.tokenHash,
          userId: id,
          expiresAt: invite.expiresAt,
          usedAt: null,
          user,
        });
        return { id, email: user.email, role: user.role };
      },
      update: async ({ where, data }) => {
        const user = [...users.values()].find(
          (candidate) => candidate.id === where.id,
        );
        Object.assign(user, data);
        return user;
      },
    },
    staffInvitationToken: {
      findUnique: async ({ where }) => invitations.get(where.tokenHash) ?? null,
    },
    $transaction: async (work) =>
      work({
        staffInvitationToken: {
          updateMany: async ({ where, data }) => {
            const invite = [...invitations.values()].find(
              (candidate) => candidate.id === where.id,
            );
            if (
              !invite ||
              invite.usedAt ||
              invite.expiresAt <= where.expiresAt.gt
            )
              return { count: 0 };
            invite.usedAt = data.usedAt;
            return { count: 1 };
          },
        },
        user: {
          update: async ({ where, data }) => {
            const user = [...users.values()].find(
              (candidate) => candidate.id === where.id,
            );
            Object.assign(user, data);
            return user;
          },
        },
      }),
  };
  const hasher = { hash: async (value) => `hashed:${value}` };
  const tokenService = {
    generateOpaqueToken: () => ({
      token: "single-use-invite",
      tokenHash: "hash:single-use-invite",
    }),
    hashToken: (token) => `hash:${token}`,
  };
  const service = new AuthService(prisma, hasher, tokenService, {}, {});
  return { service, users, invitations };
}

test("staff invitation creates a pending account and returns only the one-time token", async () => {
  const { service, users, invitations } = createHarness();
  const result = await service.createStaffInvitation({
    email: "  STOCK@EXAMPLE.INVALID ",
    role: Role.STOCK,
  });
  const account = users.get("stock@example.invalid");
  const invitation = invitations.get("hash:single-use-invite");
  assert.equal(result.email, "stock@example.invalid");
  assert.equal(result.role, Role.STOCK);
  assert.equal(result.token, "single-use-invite");
  assert.equal(account.isEmailConfirmed, false);
  assert.equal(account.passwordHash.startsWith("hashed:"), true);
  assert.equal(invitation.token, undefined);
  assert.equal(invitation.tokenHash, "hash:single-use-invite");
});

test("staff invitation rejects customer role and duplicate email", async () => {
  const { service } = createHarness();
  await assert.rejects(
    service.createStaffInvitation({
      email: "customer@example.invalid",
      role: Role.CUSTOMER,
    }),
    /Papel de equipe inválido/,
  );
  await service.createStaffInvitation({
    email: "existing@example.invalid",
    role: Role.ADMIN,
  });
  await assert.rejects(
    service.createStaffInvitation({
      email: "EXISTING@example.invalid",
      role: Role.CATALOG,
    }),
    /Email already in use/,
  );
});

test("valid staff invitation sets a password, confirms email and becomes single-use", async () => {
  const { service, users } = createHarness();
  await service.createStaffInvitation({
    email: "catalog@example.invalid",
    role: Role.CATALOG,
  });
  const result = await service.acceptStaffInvitation(
    "single-use-invite",
    "a-secure-synthetic-password",
  );
  const user = users.get("catalog@example.invalid");
  assert.match(result.message, /ativada/);
  assert.equal(user.isEmailConfirmed, true);
  assert.equal(user.passwordHash, "hashed:a-secure-synthetic-password");
  await assert.rejects(
    service.acceptStaffInvitation(
      "single-use-invite",
      "another-secure-synthetic-password",
    ),
    /inválido, expirado ou já utilizado/,
  );
});

test("expired invitation cannot be accepted", async () => {
  const { service, invitations } = createHarness();
  await service.createStaffInvitation({
    email: "expired@example.invalid",
    role: Role.ADMIN,
  });
  invitations.get("hash:single-use-invite").expiresAt = new Date(
    Date.now() - 1,
  );
  await assert.rejects(
    service.acceptStaffInvitation(
      "single-use-invite",
      "a-secure-synthetic-password",
    ),
    /inválido, expirado ou já utilizado/,
  );
});
