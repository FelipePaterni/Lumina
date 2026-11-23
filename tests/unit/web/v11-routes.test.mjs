import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const routes = [
  "app/page.tsx",
  "app/livros/[slug]/page.tsx",
  "app/livros/[slug]/avaliar/page.tsx",
  "app/bundles/page.tsx",
  "app/bundles/[id]/page.tsx",
  "app/entrar/page.tsx",
  "app/criar-conta/page.tsx",
  "app/confirmar-email/page.tsx",
  "app/recuperar-senha/page.tsx",
  "app/redefinir-senha/page.tsx",
  "app/ativar-equipe/page.tsx",
  "app/carrinho/page.tsx",
  "app/checkout/page.tsx",
  "app/pedidos/[id]/page.tsx",
  "app/pedidos/[id]/rastreamento/page.tsx",
  "app/biblioteca/page.tsx",
  "app/wishlist/page.tsx",
  "app/minha-conta/page.tsx",
  "app/minha-conta/pedidos/page.tsx",
  "app/dashboard/page.tsx",
  "app/catalog/dashboard/page.tsx",
  "app/warehouse/dashboard/page.tsx",
  "app/warehouse/inventory/page.tsx",
  "app/operations/dashboard/page.tsx",
  "app/admin/catalogo/page.tsx",
  "app/admin/catalogo/[id]/page.tsx",
  "app/admin/bundles/page.tsx",
  "app/admin/cupons/page.tsx",
  "app/admin/frete/page.tsx",
  "app/admin/usuarios/page.tsx",
  "app/admin/reembolsos/page.tsx",
  "app/admin/avaliacoes/page.tsx",
  "app/admin/auditoria/page.tsx",
];

test("V1.1 Web declares all planned route entrypoints", () => {
  const missing = routes.filter(
    (route) => !existsSync(resolve(root, "apps/web", route)),
  );
  assert.deepEqual(missing, []);
});

test("V1.1 route services keep API requests in the Web layer", () => {
  const apiClient = readFileSync(
    resolve(root, "apps/web/src/features/v11/api.ts"),
    "utf8",
  );
  const client = readFileSync(
    resolve(root, "apps/web/src/features/v11/StorePages.tsx"),
    "utf8",
  );
  const staff = readFileSync(
    resolve(root, "apps/web/src/features/v11/StaffPages.tsx"),
    "utf8",
  );
  assert.match(apiClient, /NEXT_PUBLIC_API_URL|API_URL/);
  assert.match(client, /\/checkout/);
  assert.match(client, /\/library/);
  assert.match(staff, /\/admin\/review-reports/);
  assert.match(staff, /\/admin\/audit-logs/);
  assert.match(staff, /\/admin\/users\/invitations/);
  assert.match(staff, /\/admin\/inventory/);
  assert.match(staff, /\/admin\/works/);
});
