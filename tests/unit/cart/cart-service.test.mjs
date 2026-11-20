import assert from "node:assert/strict";
import test from "node:test";
import { CartService } from "../../../apps/api/dist/modules/cart/cart.service.js";

function createHarness({ ownedEditionIds = [] } = {}) {
  const editions = new Map([
    ["00000000-0000-4000-8000-000000000001", { id: "00000000-0000-4000-8000-000000000001", format: "DIGITAL", isVisible: true, priceCents: 1_590, work: { title: "Synthetic ebook", isVisible: true }, inventory: { digitalLicenseLimit: null, digitalAllocated: 0 } }],
    ["00000000-0000-4000-8000-000000000002", { id: "00000000-0000-4000-8000-000000000002", format: "PHYSICAL", isVisible: true, priceCents: 4_290, work: { title: "Synthetic print", isVisible: true }, inventory: { physicalStock: 3 } }],
    ["00000000-0000-4000-8000-000000000003", { id: "00000000-0000-4000-8000-000000000003", format: "PHYSICAL", isVisible: true, priceCents: 1_000, work: { title: "Hidden synthetic", isVisible: false }, inventory: { physicalStock: 3 } }],
  ]);
  let cart = null;
  const items = [];
  const load = () => ({ id: cart.id, coupon: null, items: items.map((item) => ({ ...item, edition: editions.get(item.editionId) })) });
  const prisma = {
    cart: {
      upsert: async ({ where }) => {
        if (!cart) cart = { id: "cart-1", userId: where.userId, couponId: null };
        return cart;
      },
      findUnique: async () => load(),
      findUniqueOrThrow: async () => load(),
      update: async ({ data }) => { Object.assign(cart, data); return cart; },
    },
    cartItem: {
      findUnique: async ({ where }) => items.find((item) => item.cartId === where.cartId_editionId.cartId && item.editionId === where.cartId_editionId.editionId) ?? null,
      create: async ({ data }) => {
        if (items.some((item) => item.editionId === data.editionId)) { const error = new Error("unique"); error.code = "P2002"; throw error; }
        items.push(data); return data;
      },
      upsert: async ({ where, update, create }) => {
        const current = items.find((item) => item.cartId === where.cartId_editionId.cartId && item.editionId === where.cartId_editionId.editionId);
        if (current) current.quantity += update.quantity.increment;
        else items.push(create);
        return current ?? create;
      },
      updateMany: async ({ where, data }) => { const item = items.find((entry) => entry.editionId === where.editionId); if (item) item.quantity = data.quantity; return { count: item ? 1 : 0 }; },
      deleteMany: async ({ where }) => { const index = items.findIndex((entry) => entry.editionId === where.editionId); if (index < 0) return { count: 0 }; items.splice(index, 1); return { count: 1 }; },
    },
    edition: { findUnique: async ({ where }) => editions.get(where.id) ?? null },
  };
  const coupons = { preview: async () => { throw new Error("No coupon in this scenario"); } };
  const shipping = { quote: async () => ({ priceCents: 900 }) };
  const ownership = { ownsEdition: async (_userId, editionId) => ownedEditionIds.includes(editionId) };
  return { service: new CartService(prisma, coupons, shipping, ownership), items };
}

test("cart adds physical quantities and recalculates amount from current server price", async () => {
  const { service } = createHarness();
  const editionId = "00000000-0000-4000-8000-000000000002";
  const cart = await service.add("customer-a", editionId, 2);
  assert.equal(cart.subtotalCents, 8_580);
  assert.equal(cart.totalAmount, "R$ 85,80");
  const next = await service.add("customer-a", editionId, 1);
  assert.equal(next.items[0].quantity, 3);
});

test("cart rejects ebook duplication, purchased ebooks, hidden editions and over-stock quantity", async () => {
  const { service } = createHarness({ ownedEditionIds: ["00000000-0000-4000-8000-000000000001"] });
  const ebook = "00000000-0000-4000-8000-000000000001";
  await assert.rejects(service.add("customer-a", ebook, 1), (error) => error.getStatus() === 409);
  await assert.rejects(service.add("customer-a", "00000000-0000-4000-8000-000000000002", 4), (error) => error.getStatus() === 409);
  await assert.rejects(service.add("customer-a", "00000000-0000-4000-8000-000000000003", 1), (error) => error.getStatus() === 404);
  const { service: unowned } = createHarness();
  await unowned.add("customer-a", ebook, 1);
  await assert.rejects(unowned.add("customer-a", ebook, 1), (error) => error.getStatus() === 409);
});

test("digital-only carts do not require an address or incur shipping", async () => {
  const { service } = createHarness();
  await service.add("customer-a", "00000000-0000-4000-8000-000000000001", 1);
  const quote = await service.quoteShipping("customer-a", undefined);
  assert.equal(quote.shippingCents, 0);
  assert.equal(quote.physicalQuantity, 0);
});
