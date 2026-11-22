import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const read = (path) => readFile(resolve(here, path), "utf8");

function luminance(hex) {
  const channels = hex
    .match(/[0-9a-f]{2}/gi)
    ?.map((part) => Number.parseInt(part, 16) / 255);
  assert.equal(channels?.length, 3, `Cor inválida: ${hex}`);
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("cores de texto verificadas atendem contraste 4.5:1", async () => {
  const pairs = [
    ["24332c", "f7f3ec", "texto principal sobre fundo da página"],
    ["646b65", "f7f3ec", "texto auxiliar sobre fundo da página"],
    ["646b65", "fffdf9", "texto auxiliar sobre cartão"],
    ["a65334", "f7f3ec", "rótulos de seção"],
    ["315848", "ffffff", "texto de botão"],
    ["8e3025", "fff0ed", "mensagem de erro"],
  ];
  for (const [foreground, background, label] of pairs) {
    assert.ok(
      contrast(foreground, background) >= 4.5,
      `${label}: ${contrast(foreground, background).toFixed(2)}:1`,
    );
  }
});

test("busca global usa box sizing que evita overflow por padding", async () => {
  const css = await read("../../apps/web/app/globals.css");
  assert.match(css, /input\s*\{[^}]*box-sizing:\s*border-box/s);
});

test("telas de painel oferecem rótulos, status e erros acessíveis", async () => {
  const dashboard = await read(
    "../../apps/web/src/features/dashboard/DashboardPage.tsx",
  );
  const warehouse = await read(
    "../../apps/web/src/features/warehouse/WarehousePanel.tsx",
  );
  const home = await read("../../apps/web/app/page.tsx");
  assert.match(dashboard, /role="alert"/);
  assert.match(dashboard, /aria-label="Painéis disponíveis"/);
  assert.match(dashboard, /role="status"/);
  assert.match(warehouse, /role="alert"/);
  assert.match(warehouse, /aria-labelledby=/);
  assert.match(home, /aria-label="Pesquisar por título ou autor"/);
  assert.match(home, /role="status"/);
  assert.match(home, /role="alert"/);
});
