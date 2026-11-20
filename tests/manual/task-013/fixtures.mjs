import console from "node:console";
import process from "node:process";
import { URL } from "node:url";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
const prefix = process.env.TASK013_MANUAL_PREFIX;
if (!databaseUrl || !prefix || !/^t13-[a-f0-9]{24}$/.test(prefix)) {
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
    const tables = await prisma.$queryRaw`
      SELECT to_regclass('public.orders')::text AS orders,
             to_regclass('public.order_items')::text AS order_items,
             to_regclass('public.payments')::text AS payments
    `;
    console.log(JSON.stringify({
      orders: Boolean(tables[0]?.orders),
      orderItems: Boolean(tables[0]?.order_items),
      payments: Boolean(tables[0]?.payments),
    }));
  } else if (mode === "prepare") {
    const author = await prisma.author.create({ data: { name: `${prefix} Author` } });
    const publisher = await prisma.publisher.create({ data: { name: `${prefix} Publisher` } });
    const createWork = (name, editions) => prisma.work.create({
      data: {
        title: `${prefix} ${name}`,
        slug: `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        synopsis: "Synthetic TASK-013 manual test data.",
        releaseDate: new Date("2026-01-01T00:00:00Z"),
        authorId: author.id,
        publisherId: publisher.id,
        editions: { create: editions },
      },
      include: { editions: true },
    });

    const freeWork = await createWork("Free digital", [
      { format: "DIGITAL", priceCents: 0, inventory: { create: { digitalLicenseLimit: null, digitalAllocated: 0 } } },
    ]);
    const hybridWork = await createWork("Hybrid limited", [
      { format: "PHYSICAL", priceCents: 1_000, inventory: { create: { physicalStock: 1 } } },
      { format: "DIGITAL", priceCents: 1_000, inventory: { create: { digitalLicenseLimit: 1, digitalAllocated: 0 } } },
    ]);
    const couponWork = await createWork("Coupon limited", [
      { format: "DIGITAL", priceCents: 1_000, inventory: { create: { digitalLicenseLimit: null, digitalAllocated: 0 } } },
    ]);
    const coupon = await prisma.coupon.create({
      data: {
        code: `${prefix}-FREE`,
        discountType: "PERCENTAGE",
        percentageBasisPoints: 10_000,
        validFrom: new Date(Date.now() - 60_000),
        validUntil: new Date(Date.now() + 3_600_000),
        maxUses: 1,
      },
    });
    const shippingRule = await prisma.shippingRule.create({
      data: {
        postalCodeStart: "99999990",
        postalCodeEnd: "99999999",
        minPhysicalQuantity: 1,
        maxPhysicalQuantity: 5,
        priceCents: 500,
        priority: 1_000,
      },
    });

    console.log(JSON.stringify({
      freeEditionId: freeWork.editions[0].id,
      physicalEditionId: hybridWork.editions.find((edition) => edition.format === "PHYSICAL").id,
      hybridDigitalEditionId: hybridWork.editions.find((edition) => edition.format === "DIGITAL").id,
      couponEditionId: couponWork.editions[0].id,
      couponCode: coupon.code,
      shippingRuleId: shippingRule.id,
    }));
  } else if (mode === "verify-hybrid") {
    const physicalEditionId = process.env.TASK013_MANUAL_PHYSICAL_EDITION_ID;
    const digitalEditionId = process.env.TASK013_MANUAL_HYBRID_DIGITAL_EDITION_ID;
    const [physical, digital, hybridOrders] = await Promise.all([
      prisma.inventory.findUnique({ where: { editionId: physicalEditionId }, select: { physicalStock: true } }),
      prisma.inventory.findUnique({ where: { editionId: digitalEditionId }, select: { digitalAllocated: true } }),
      prisma.order.count({ where: { idempotencyKey: { startsWith: prefix }, items: { some: { editionId: physicalEditionId } } } }),
    ]);
    console.log(JSON.stringify({ physicalStock: physical?.physicalStock ?? null, digitalAllocated: digital?.digitalAllocated ?? null, hybridOrders }));
  } else if (mode === "verify-coupon") {
    const couponCode = process.env.TASK013_MANUAL_COUPON_CODE;
    const [coupon, couponOrders] = await Promise.all([
      prisma.coupon.findUnique({ where: { code: couponCode }, select: { usageCount: true } }),
      prisma.order.count({ where: { idempotencyKey: { startsWith: prefix }, couponCode } }),
    ]);
    console.log(JSON.stringify({ usageCount: coupon?.usageCount ?? null, couponOrders }));
  } else if (mode === "cleanup") {
    const [works, coupons] = await Promise.all([
      prisma.work.findMany({ where: { slug: { startsWith: prefix } }, select: { id: true, editions: { select: { id: true } } } }),
      prisma.coupon.findMany({ where: { code: { startsWith: prefix } }, select: { id: true } }),
    ]);
    const editionIds = works.flatMap((work) => work.editions.map((edition) => edition.id));
    const couponIds = coupons.map((coupon) => coupon.id);
    const shippingRuleId = process.env.TASK013_MANUAL_SHIPPING_RULE_ID;

    await prisma.$transaction(async (tx) => {
      await tx.order.deleteMany({ where: { idempotencyKey: { startsWith: prefix } } });
      if (editionIds.length) await tx.cartItem.deleteMany({ where: { editionId: { in: editionIds } } });
      if (couponIds.length) await tx.cart.updateMany({ where: { couponId: { in: couponIds } }, data: { couponId: null } });
      if (shippingRuleId) await tx.shippingRule.deleteMany({ where: { id: shippingRuleId } });
      if (couponIds.length) await tx.coupon.deleteMany({ where: { id: { in: couponIds } } });
      if (works.length) await tx.work.deleteMany({ where: { id: { in: works.map((work) => work.id) } } });
      await tx.author.deleteMany({ where: { name: `${prefix} Author` } });
      await tx.publisher.deleteMany({ where: { name: `${prefix} Publisher` } });
    });
    console.log(JSON.stringify({ cleaned: true }));
  } else {
    throw new Error("Unsupported fixture operation.");
  }
} finally {
  await prisma.$disconnect();
}
