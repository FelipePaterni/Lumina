import process from "node:process";
import { log } from "node:console";
import { URL } from "node:url";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const prefix = process.env.TASK014_MANUAL_PREFIX;
const userId = process.env.TASK014_MANUAL_USER_ID;
const baseline = JSON.parse(process.env.TASK014_MANUAL_BASELINE ?? "{}");
if (!databaseUrl || !prefix || !/^t14-[a-f0-9]{24}$/.test(prefix)) {
  throw new Error("Local database or synthetic prefix is not configured.");
}
const parsedUrl = new URL(databaseUrl);
const databaseName = decodeURIComponent(parsedUrl.pathname.slice(1));
if (!["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname) ||
    !/^lumina(?:_[a-z0-9_]+)?$/i.test(databaseName)) {
  throw new Error("Fixtures are restricted to a local Lumina database.");
}

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

try {
  const mode = process.argv[2];
  if (mode === "verify-schema") {
    const columns = await prisma.$queryRaw`
      SELECT count(*)::int AS total FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'outbox_emails'
        AND column_name IN ('event_key', 'event_type', 'delivery_status', 'attempt_count', 'last_attempt_at', 'next_attempt_at', 'last_error_code')
    `;
    log(JSON.stringify({ ready: columns[0]?.total === 7 }));
  } else if (mode === "snapshot") {
    if (!userId) throw new Error("Synthetic user is not configured.");
    const [events, resetTokens, audits] = await Promise.all([
      prisma.outboxEmail.findMany({ where: { eventKey: { startsWith: `identity:${userId}:` } }, select: { id: true } }),
      prisma.passwordResetToken.findMany({ where: { userId }, select: { id: true } }),
      prisma.auditLog.findMany({ where: { targetId: userId }, select: { id: true } }),
    ]);
    log(JSON.stringify({ eventIds: events.map(({ id }) => id), resetTokenIds: resetTokens.map(({ id }) => id), auditIds: audits.map(({ id }) => id) }));
  } else if (mode === "prepare") {
    const author = await prisma.author.create({ data: { name: `${prefix} Author` } });
    const publisher = await prisma.publisher.create({ data: { name: `${prefix} Publisher` } });
    const work = await prisma.work.create({
      data: {
        title: `${prefix} Free digital notification`,
        slug: `${prefix}-free-digital-notification`,
        synopsis: "Synthetic TASK-014 manual test data.",
        releaseDate: new Date("2026-01-01T00:00:00Z"),
        authorId: author.id,
        publisherId: publisher.id,
        editions: {
          create: [{
            format: "DIGITAL",
            priceCents: 0,
            inventory: { create: { digitalLicenseLimit: null, digitalAllocated: 0 } },
          }],
        },
      },
      include: { editions: true },
    });
    log(JSON.stringify({ editionId: work.editions[0].id }));
  } else if (mode === "verify-account") {
    if (!userId) throw new Error("Synthetic user is not configured.");
    const existingIds = new Set(baseline.eventIds ?? []);
    const events = await prisma.outboxEmail.findMany({
      where: { eventKey: { startsWith: `identity:${userId}:` } },
      select: { id: true, eventType: true, deliveryStatus: true, attemptCount: true },
    });
    const generated = events.filter(({ id }) => !existingIds.has(id));
    const count = (eventType) => generated.filter((event) => event.eventType === eventType);
    const sent = (items) => items.filter((event) => event.deliveryStatus === "SENT" && event.attemptCount >= 1).length;
    const reset = count("PASSWORD_RESET_REQUESTED");
    const deletion = count("ACCOUNT_DELETION_REQUESTED");
    const reactivation = count("ACCOUNT_REACTIVATED");
    log(JSON.stringify({
      resetSent: sent(reset),
      deletionSent: sent(deletion),
      reactivationSent: sent(reactivation),
      unexpectedOrUnsent: generated.filter((event) => event.deliveryStatus !== "SENT" || event.attemptCount < 1).length,
    }));
  } else if (mode === "verify-order") {
    const orderId = process.env.TASK014_MANUAL_ORDER_ID;
    if (!orderId) throw new Error("Synthetic order is not configured.");
    const events = await prisma.outboxEmail.findMany({
      where: { eventKey: `order:${orderId}:confirmed`, eventType: "ORDER_CONFIRMED" },
      select: { deliveryStatus: true, attemptCount: true },
    });
    log(JSON.stringify({ count: events.length, sent: events.filter((event) => event.deliveryStatus === "SENT" && event.attemptCount >= 1).length }));
  } else if (mode === "cleanup") {
    const existingEventIds = new Set(baseline.eventIds ?? []);
    const existingResetTokenIds = new Set(baseline.resetTokenIds ?? []);
    const existingAuditIds = new Set(baseline.auditIds ?? []);
    const [works, orders, newEvents, resetTokens, audits] = await Promise.all([
      prisma.work.findMany({ where: { slug: { startsWith: prefix } }, select: { id: true, editions: { select: { id: true } } } }),
      userId ? prisma.order.findMany({ where: { userId, idempotencyKey: { startsWith: prefix } }, select: { id: true } }) : [],
      userId ? prisma.outboxEmail.findMany({ where: { eventKey: { startsWith: `identity:${userId}:` } }, select: { id: true } }) : [],
      userId ? prisma.passwordResetToken.findMany({ where: { userId }, select: { id: true } }) : [],
      userId ? prisma.auditLog.findMany({ where: { targetId: userId }, select: { id: true } }) : [],
    ]);
    const editionIds = works.flatMap((work) => work.editions.map((edition) => edition.id));
    const orderIds = orders.map(({ id }) => id);
    const deleteEventIds = newEvents.filter(({ id }) => !existingEventIds.has(id)).map(({ id }) => id);
    const deleteResetTokenIds = resetTokens.filter(({ id }) => !existingResetTokenIds.has(id)).map(({ id }) => id);
    const deleteAuditIds = audits.filter(({ id }) => !existingAuditIds.has(id)).map(({ id }) => id);

    await prisma.$transaction(async (tx) => {
      if (userId && editionIds.length) {
        await tx.libraryItem.deleteMany({ where: { userId, editionId: { in: editionIds } } });
      }
      if (editionIds.length) await tx.cartItem.deleteMany({ where: { editionId: { in: editionIds } } });
      if (orderIds.length) {
        const orderEvents = await tx.outboxEmail.findMany({
          where: { eventKey: { in: orderIds.map((id) => `order:${id}:confirmed`) } },
          select: { id: true },
        });
        if (orderEvents.length) await tx.outboxEmail.deleteMany({ where: { id: { in: orderEvents.map(({ id }) => id) } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      if (deleteEventIds.length) await tx.outboxEmail.deleteMany({ where: { id: { in: deleteEventIds } } });
      if (deleteResetTokenIds.length) await tx.passwordResetToken.deleteMany({ where: { id: { in: deleteResetTokenIds } } });
      if (deleteAuditIds.length) await tx.auditLog.deleteMany({ where: { id: { in: deleteAuditIds } } });
      if (works.length) await tx.work.deleteMany({ where: { id: { in: works.map(({ id }) => id) } } });
      await tx.author.deleteMany({ where: { name: `${prefix} Author` } });
      await tx.publisher.deleteMany({ where: { name: `${prefix} Publisher` } });
    });
    log(JSON.stringify({ cleaned: true }));
  } else {
    throw new Error("Unsupported fixture operation.");
  }
} finally {
  await prisma.$disconnect();
}
