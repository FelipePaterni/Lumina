import assert from "node:assert/strict";
import process from "node:process";
import test from "node:test";
import { URL } from "node:url";
import { NestFactory } from "@nestjs/core";
import { PrismaClient } from "@prisma/client";
import { AppModule } from "../../apps/api/dist/app.module.js";
import { CatalogService } from "../../apps/api/dist/modules/catalog/application/catalog.service.js";
import { InventoryService } from "../../apps/api/dist/modules/inventory/inventory.service.js";
import { AccountService } from "../../apps/api/dist/modules/identity/application/services/account.service.js";
import { AuthService } from "../../apps/api/dist/modules/identity/application/services/auth.service.js";
import { JwtTokenService } from "../../apps/api/dist/modules/identity/application/services/jwt-token.service.js";
import { PasswordHasherService } from "../../apps/api/dist/modules/identity/application/services/password-hasher.service.js";
import { TokenService } from "../../apps/api/dist/modules/identity/application/services/token.service.js";
import { Role } from "../../apps/api/dist/modules/identity/domain/role.enum.js";
import { AuditService } from "../../apps/api/dist/modules/audit/application/services/audit.service.js";
import { getIntegrationDatabaseUrl } from "./test-database.mjs";

test("TASK-030 admin workflows preserve history, enforce invitation lifecycle and expose paged lists", async () => {
  const databaseUrl = getIntegrationDatabaseUrl();
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  const suffix = `task030-${Date.now()}`;
  const email = `${suffix}@example.invalid`;
  const authorName = `Synthetic ${suffix} Author`;
  const publisherName = `Synthetic ${suffix} Publisher`;
  const reason = "Provisionamento de teste sintético";
  const tokenService = new TokenService();
  const hasher = new PasswordHasherService();
  const auth = new AuthService(
    prisma,
    hasher,
    tokenService,
    new JwtTokenService(),
    {},
  );
  const catalog = new CatalogService(prisma);
  const audit = new AuditService(prisma);
  const inventory = new InventoryService(prisma, audit);
  const accounts = new AccountService(prisma, {});
  let inviteUserId;
  let customerId;
  let stockUserId;
  let adminUserId;
  let workId;
  let httpWorkId;
  let httpInviteEmail;
  let app;
  let baseUrl;

  try {
    await prisma.$connect();
    process.env.DATABASE_URL = databaseUrl;
    process.env.WEB_BASE_URL = "http://localhost:3000";
    const invitation = await auth.createStaffInvitation({
      email,
      role: Role.CATALOG,
    });
    inviteUserId = invitation.userId;
    const persistedInvite = await prisma.staffInvitationToken.findUnique({
      where: { tokenHash: tokenService.hashToken(invitation.token) },
    });
    assert.ok(persistedInvite);
    assert.equal(persistedInvite.tokenHash.includes(invitation.token), false);
    assert.equal(
      persistedInvite.expiresAt.getTime() - Date.now() <= 24 * 60 * 60 * 1000,
      true,
    );
    await audit.logAction({
      actorRole: Role.ADMIN,
      action: "TEAM_INVITATION_CREATED",
      targetType: "USER",
      targetId: inviteUserId,
      reason,
      metadata: { role: Role.CATALOG },
    });
    await auth.acceptStaffInvitation(
      invitation.token,
      "synthetic-secure-password-030",
    );
    const login = await auth.login(email, "synthetic-secure-password-030");
    assert.equal(login.user.role, Role.CATALOG);
    assert.equal(login.user.isEmailConfirmed, true);
    await assert.rejects(
      auth.acceptStaffInvitation(
        invitation.token,
        "another-synthetic-password",
      ),
    );
    const filteredUsers = await accounts.listUsers({
      page: 1,
      limit: 10,
      role: Role.CATALOG,
      search: suffix,
      isActive: true,
    });
    assert.equal(
      filteredUsers.users.some((user) => user.id === inviteUserId),
      true,
    );
    assert.equal(filteredUsers.totalPages, 1);

    const adminUser = await prisma.user.create({
      data: { email: `admin-${email}`, passwordHash: "synthetic-hash", role: "ADMIN", isEmailConfirmed: true },
    });
    adminUserId = adminUser.id;
    const customer = await prisma.user.create({
      data: {
        email: `owner-${email}`,
        passwordHash: "synthetic-hash",
        role: Role.CUSTOMER,
        isEmailConfirmed: true,
      },
    });
    customerId = customer.id;
    const stockUser = await prisma.user.create({
      data: {
        email: `stock-${email}`,
        passwordHash: "synthetic-hash",
        role: Role.STOCK,
        isEmailConfirmed: true,
      },
    });
    stockUserId = stockUser.id;

    app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}`;
    const jwt = new JwtTokenService();
    const adminToken = jwt.sign({ sub: adminUser.id, email: adminUser.email, role: Role.ADMIN, isEmailConfirmed: true });
    const stockToken = jwt.sign({ sub: stockUser.id, email: stockUser.email, role: Role.STOCK, isEmailConfirmed: true });
    const api = async (path, token, method = "GET", body) => {
      const response = await globalThis.fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      return { status: response.status, payload: await response.json().catch(() => null) };
    };
    const apiAdminWorks = await api("/admin/works?page=1&limit=10", adminToken);
    const apiStockInventory = await api("/admin/inventory?page=1&limit=10", stockToken);
    assert.equal(apiAdminWorks.status, 200);
    assert.equal(apiStockInventory.status, 200);
    assert.equal((await api("/admin/works?page=1&limit=10", stockToken)).status, 403);
    assert.equal((await api("/admin/inventory?page=1&limit=10", login.accessToken)).status, 403);
    httpInviteEmail = `http-invite-${email}`;
    const httpInvite = await api("/admin/users/invitations", adminToken, "POST", {
      email: httpInviteEmail,
      role: Role.ADMIN,
      reason,
    });
    assert.equal(httpInvite.status, 201);
    const activationToken = new URL(httpInvite.payload.activationUrl).searchParams.get("token");
    assert.ok(activationToken);
    const accepted = await api("/auth/accept-invitation", undefined, "POST", {
      token: activationToken,
      newPassword: "synthetic-http-admin-password",
    });
    assert.equal(accepted.status, 201);
    const reused = await api("/auth/accept-invitation", undefined, "POST", {
      token: activationToken,
      newPassword: "synthetic-http-admin-password-again",
    });
    assert.equal(reused.status, 400);

    const httpAuthorName = `HTTP ${authorName}`;
    const httpPublisherName = `HTTP ${publisherName}`;
    const httpWork = await api("/works", login.accessToken, "POST", {
      title: `HTTP synthetic work ${suffix}`,
      slug: `http-${suffix}`,
      author: httpAuthorName,
      publisher: httpPublisherName,
      synopsis: "HTTP synthetic work for role and visibility validation.",
      releaseDate: "2026-01-01",
      editions: [{ format: "DIGITAL", priceCents: 500, isVisible: true }],
    });
    assert.equal(httpWork.status, 201);
    httpWorkId = httpWork.payload.id;
    const hiddenResult = await api(`/works/${httpWorkId}/visibility`, login.accessToken, "PATCH", {
      isVisible: false,
      reason,
    });
    assert.equal(hiddenResult.status, 200);
    const hiddenAdminResult = await api(`/admin/works/${httpWorkId}`, login.accessToken);
    assert.equal(hiddenAdminResult.status, 200);
    assert.equal(hiddenAdminResult.payload.isVisible, false);
    const publicHidden = await api(`/works?search=${encodeURIComponent(`HTTP synthetic work ${suffix}`)}&page=1&limit=10`);
    assert.equal(publicHidden.status, 200);
    assert.equal(publicHidden.payload.items.some((work) => work.id === httpWorkId), false);
    const stockAdjustmentDenied = await api(`/inventory/${hiddenAdminResult.payload.editions[0].id}/digital`, login.accessToken, "PATCH", {
      limit: 1,
      reason,
    });
    assert.equal(stockAdjustmentDenied.status, 403);

    const slug = suffix;
    const created = await catalog.upsert({
      title: "Synthetic administrative work",
      slug,
      author: authorName,
      publisher: publisherName,
      synopsis: "Synthetic work used by isolated integration validation.",
      releaseDate: "2026-01-01",
      editions: [{ format: "DIGITAL", priceCents: 500 }],
    });
    workId = created.id;
    const digitalEdition = created.editions.find(
      (edition) => edition.format === "DIGITAL",
    );
    await prisma.libraryItem.create({
      data: { userId: customerId, editionId: digitalEdition.id },
    });
    await inventory.setDigitalLimit(
      digitalEdition.id,
      5,
      reason,
      stockUserId,
      Role.STOCK,
    );

    await catalog.hide(workId, false);
    const hidden = await catalog.listAdmin({
      search: slug,
      visibility: "hidden",
      page: 1,
      limit: 10,
    });
    assert.equal(
      hidden.items.some((work) => work.id === workId),
      true,
    );
    const hiddenDetail = await catalog.getAdminById(workId);
    const updated = await catalog.upsert(
      {
        title: "Synthetic administrative work revised",
        slug,
        author: authorName,
        publisher: publisherName,
        synopsis: "Revised synthetic metadata without replacing acquisitions.",
        releaseDate: "2026-01-01",
        editions: [
          ...hiddenDetail.editions.map(
            ({ format, isbn, priceCents, isVisible }) => ({
              format,
              isbn,
              priceCents,
              isVisible,
            }),
          ),
          { format: "PHYSICAL", priceCents: 1000, isVisible: true },
        ],
      },
      workId,
    );
    assert.equal(updated.isVisible, false);
    const updatedEditionIds = updated.editions.map((edition) => edition.id);
    assert.equal(
      hiddenDetail.editions.every((edition) => updatedEditionIds.includes(edition.id)),
      true,
    );
    assert.equal(
      await prisma.libraryItem.count({
        where: { userId: customerId, editionId: digitalEdition.id },
      }),
      1,
    );
    await assert.rejects(catalog.get(slug), /Obra não encontrada/);

    const physicalEdition = updated.editions.find(
      (edition) => edition.format === "PHYSICAL",
    );
    await inventory.adjustPhysical(
      physicalEdition.id,
      4,
      reason,
      stockUserId,
      Role.STOCK,
    );
    const inventoryPage = await inventory.listAdmin({
      search: slug,
      page: 1,
      limit: 10,
    });
    assert.equal(
      inventoryPage.items.some((edition) => edition.id === physicalEdition.id),
      true,
    );
    assert.equal(
      inventoryPage.items.some((edition) => edition.id === digitalEdition.id),
      true,
    );
    assert.equal(
      inventoryPage.items.find((edition) => edition.id === physicalEdition.id)
        .inventory.physicalStock,
      4,
    );
    assert.equal(
      inventoryPage.items.find((edition) => edition.id === digitalEdition.id)
        .inventory.digitalLicenseLimit,
      5,
    );
    const inviteAudit = await prisma.auditLog.findFirst({
      where: { targetId: inviteUserId, action: "TEAM_INVITATION_CREATED" },
    });
    assert.equal(inviteAudit.reason, reason);
    assert.doesNotMatch(inviteAudit.metadata ?? "", /token|password|email/i);
  } finally {
    if (app) await app.close();
    if (customerId) await prisma.libraryItem.deleteMany({ where: { userId: customerId } });
    if (httpWorkId) await prisma.work.deleteMany({ where: { id: httpWorkId } });
    if (workId) await prisma.work.deleteMany({ where: { id: workId } });
    await prisma.author.deleteMany({ where: { name: `HTTP ${authorName}` } });
    await prisma.publisher.deleteMany({ where: { name: `HTTP ${publisherName}` } });
    await prisma.author.deleteMany({ where: { name: authorName } });
    await prisma.publisher.deleteMany({ where: { name: publisherName } });
    const httpInviteUser = httpInviteEmail
      ? await prisma.user.findUnique({ where: { email: httpInviteEmail } })
      : null;
    const userIds = [inviteUserId, customerId, stockUserId, adminUserId, httpInviteUser?.id].filter(Boolean);
    if (userIds.length) {
      await prisma.auditLog.deleteMany({
        where: {
          OR: [{ actorId: { in: userIds } }, { targetId: { in: userIds } }],
        },
      });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  }
});
