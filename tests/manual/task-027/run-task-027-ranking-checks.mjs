import process from "node:process";
import { mkdir, writeFile } from "node:fs/promises";
import { URL } from "node:url";

const baseUrl = new URL(process.env.TASK027_API_BASE || "http://localhost:3001");
const results = [];

async function check(id, description, query, validate) {
  try {
    const response = await globalThis.fetch(new URL(`/works?${query}`, baseUrl));
    const body = await response.json().catch(() => null);
    const passed = validate(response, body);
    results.push({ id, description, status: passed ? "APROVADO" : "REPROVADO", evidence: `HTTP ${response.status}` });
  } catch {
    results.push({ id, description, status: "BLOQUEADO", evidence: "API indisponível ou resposta ilegível" });
  }
}

const validPage = (response, body) => response.status === 200
  && Array.isArray(body?.items)
  && Number.isInteger(body?.page)
  && Number.isInteger(body?.limit)
  && Number.isInteger(body?.total)
  && Number.isInteger(body?.totalPages);
const containsNoSensitiveFields = (value) => {
  if (!value || typeof value !== "object") return true;
  return Object.entries(value).every(([key, child]) =>
    !/(email|password|token|reason|user.?id|requester|reviewer)/i.test(key)
    && containsNoSensitiveFields(child));
};

await check("MT-027-API-01", "Ordenação padrão mantém resposta paginada", "limit=1", validPage);
await check("MT-027-API-02", "BEST_SELLING retorna resposta paginada", "sort=BEST_SELLING&limit=1", validPage);
await check("MT-027-API-03", "TOP_RATED retorna resposta paginada", "sort=TOP_RATED&limit=1", validPage);
await check("MT-027-API-04", "Ordenação inválida retorna HTTP 400", "sort=INVALID", (response) => response.status === 400);
await check("MT-027-API-05", "Resposta pública não inclui campos sensíveis", "sort=TOP_RATED&limit=1", (_response, body) => containsNoSensitiveFields(body));

const generatedAt = new Date().toISOString();
const reportPath = new URL("../../../docs/testing/TASK-027-testes-manuais-resultado.md", import.meta.url);
const report = [
  "# TASK-027 — Resultado dos testes manuais",
  "",
  `Data: ${generatedAt}`,
  `API: ${baseUrl.origin}`,
  "Dados: somente leitura de catálogo; nenhum dado sintético ou credencial é criado ou exibido.",
  "",
  "| Cenário | Descrição | Status | Evidência sanitizada |",
  "|---|---|---|---|",
  ...results.map(({ id, description, status, evidence }) => `| ${id} | ${description} | ${status} | ${evidence} |`),
  "| MT-027-UI-01 | Revisar controles de ordenação e estados na página inicial | NAO EXECUTADO | Aguarda revisão visual humana no navegador. |",
  "",
  "A revisão visual da página de catálogo e dos controles de ordenação depende de observação humana no navegador.",
  "",
].join("\n");
await mkdir(new URL("../../../docs/testing/", import.meta.url), { recursive: true });
await writeFile(reportPath, report, "utf8");
for (const { id, status, evidence } of results) process.stdout.write(`${id}: ${status} (${evidence})\n`);
process.stdout.write(`Relatório sanitizado: ${reportPath.pathname}\n`);
if (results.some(({ status }) => status !== "APROVADO")) process.exitCode = 1;
