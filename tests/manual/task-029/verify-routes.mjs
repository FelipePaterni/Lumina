/* global process, fetch, console, AbortSignal */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const baseUrl = (process.env.WEB_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);
const routes = [
  "/",
  "/livros/smoke-book",
  "/livros/smoke-book/avaliar",
  "/bundles",
  "/bundles/00000000-0000-4000-8000-000000000001",
  "/entrar",
  "/criar-conta",
  "/confirmar-email",
  "/recuperar-senha",
  "/redefinir-senha",
  "/carrinho",
  "/checkout",
  "/pedidos/00000000-0000-4000-8000-000000000002",
  "/pedidos/00000000-0000-4000-8000-000000000002/rastreamento",
  "/biblioteca",
  "/wishlist",
  "/minha-conta",
  "/minha-conta/pedidos",
  "/dashboard",
  "/catalog/dashboard",
  "/warehouse/dashboard",
  "/operations/dashboard",
  "/admin/catalogo",
  "/admin/catalogo/00000000-0000-4000-8000-000000000003",
  "/admin/bundles",
  "/admin/cupons",
  "/admin/frete",
  "/admin/usuarios",
  "/admin/reembolsos",
  "/admin/avaliacoes",
  "/admin/auditoria",
];
const checks = [];
for (const path of routes) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(1500),
    });
    checks.push({
      scenario: `GET ${path}`,
      status: response.status === 200 ? "APROVADO" : "REPROVADO",
      evidence: `HTTP ${response.status}`,
    });
  } catch {
    checks.push({
      scenario: `GET ${path}`,
      status: "BLOQUEADO",
      evidence: "Servidor Web indisponível",
    });
  }
}
const date = new Date().toISOString().slice(0, 10);
const failed = checks.some((check) => check.status === "REPROVADO");
const blocked = checks.some((check) => check.status === "BLOQUEADO");
const report = [
  "# TASK-029 — validação manual de rotas",
  "",
  `Data: ${date}`,
  `Resumo: ${checks.filter((check) => check.status === "APROVADO").length}/${checks.length} rotas responderam HTTP 200.`,
  "",
  "| Cenário | Estado | Evidência |",
  "|---|---|---|",
  ...checks.map(
    (check) => `| ${check.scenario} | ${check.status} | ${check.evidence} |`,
  ),
  "",
  "A verificação testa apenas a resposta HTTP da página; não autentica contas nem substitui revisão visual dos fluxos.",
  blocked
    ? "Nesta execução, o servidor local não foi alcançado; os cenários sem resposta foram registrados como BLOQUEADO."
    : "",
  "",
].join("\n");
const output = resolve("docs/testing/TASK-029-testes-manuais-resultado.md");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, report, "utf8");
console.log(
  `${failed ? "REPROVADO" : blocked ? "BLOQUEADO" : "APROVADO"}: relatório sanitizado gravado em ${output}`,
);
if (failed) process.exitCode = 1;
else if (blocked) process.exitCode = 2;
