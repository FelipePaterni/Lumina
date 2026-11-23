import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const reportPath = resolve(
  root,
  "docs/testing/TASK-030-testes-manuais-resultado.md",
);
const apiBase = (process.env.API_BASE_URL ?? "").replace(/\/$/, "");
const adminToken = process.env.ADMIN_TOKEN ?? "";
const runId = randomUUID();
const syntheticPassword = `Synthetic-${randomUUID()}-Secure`;
const syntheticReason = "Validação sintética TASK-030";
const scenarioNames = [
  "Acesso Admin e convites de equipe",
  "Filtros e paginação de usuários",
  "Catálogo oculto e edição com IDs preservados",
  "Ajuste de estoque e limites por papel",
];
const outcomes = [];
let catalogToken = "";
let stockToken = "";
let workId = "";
let currentScenario = scenarioNames[0];

function record(name, status, evidence) {
  outcomes.push({ name, status, evidence });
}

async function request(path, { token, method = "GET", body } = {}) {
  const response = await globalThis.fetch(`${apiBase}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => null);
  return { status: response.status, payload };
}

function assertStatus(result, allowed, label) {
  if (!allowed.includes(result.status))
    throw new Error(`${label}: HTTP ${result.status}`);
  return result.payload;
}

async function inviteAndActivate(role) {
  const email = `task030-${runId}-${role.toLowerCase()}@example.invalid`;
  const created = assertStatus(
    await request("/admin/users/invitations", {
      token: adminToken,
      method: "POST",
      body: { email, role, reason: syntheticReason },
    }),
    [200, 201],
    "Criar convite",
  );
  const token = new URL(created.activationUrl).searchParams.get("token");
  if (!token || created.expiresInHours !== 24)
    throw new Error("Link de ativação inválido.");
  assertStatus(
    await request("/auth/accept-invitation", {
      method: "POST",
      body: { token, newPassword: syntheticPassword },
    }),
    [200, 201],
    "Ativar convite",
  );
  const repeated = await request("/auth/accept-invitation", {
    method: "POST",
    body: { token, newPassword: `${syntheticPassword}-again` },
  });
  if (repeated.status !== 400)
    throw new Error("O token de convite não foi invalidado após uso.");
  const login = assertStatus(
    await request("/auth/login", {
      method: "POST",
      body: { email, password: syntheticPassword },
    }),
    [200],
    "Login da conta convidada",
  );
  return { token: login.accessToken, email };
}

async function run() {
  if (!apiBase || !adminToken) {
    for (const name of scenarioNames)
      record(
        name,
        "BLOQUEADO",
        "Configure API_BASE_URL e ADMIN_TOKEN sintético para o banco isolado.",
      );
  } else {
    try {
      currentScenario = scenarioNames[0];
      assertStatus(
        await request("/admin/works?page=1&limit=1", { token: adminToken }),
        [200],
        "Acesso Admin ao catálogo",
      );
      const catalog = await inviteAndActivate("CATALOG");
      catalogToken = catalog.token;
      const stock = await inviteAndActivate("STOCK");
      stockToken = stock.token;
      record(
        "Acesso Admin e convites de equipe",
        "APROVADO",
        "Convites CATALOG/STOCK ativados e tokens de uso único rejeitaram reutilização.",
      );

      currentScenario = scenarioNames[1];
      const filtered = assertStatus(
        await request(
          `/admin/users?search=${encodeURIComponent(`task030-${runId}`)}&role=CATALOG&isActive=true&page=1&limit=10`,
          { token: adminToken },
        ),
        [200],
        "Listagem filtrada",
      );
      if (!filtered.users?.length || filtered.totalPages < 1)
        throw new Error("A busca/paginação não retornou a conta sintética.");
      record(
        "Filtros e paginação de usuários",
        "APROVADO",
        "Busca por e-mail e filtro de papel/status retornaram resultado paginado.",
      );

      currentScenario = scenarioNames[2];
      const slug = `task030-${runId}`;
      const created = assertStatus(
        await request("/works", {
          token: catalogToken,
          method: "POST",
          body: {
            title: `Synthetic work ${runId}`,
            slug,
            author: `Synthetic Author ${runId}`,
            publisher: `Synthetic Publisher ${runId}`,
            synopsis: "Synthetic work for TASK-030 manual validation.",
            releaseDate: "2026-01-01",
            editions: [
              { format: "PHYSICAL", priceCents: 1000, isVisible: true },
              { format: "DIGITAL", priceCents: 500, isVisible: true },
            ],
          },
        }),
        [200, 201],
        "Criar obra sintética",
      );
      workId = created.id;
      assertStatus(
        await request(`/works/${encodeURIComponent(workId)}/visibility`, {
          token: catalogToken,
          method: "PATCH",
          body: { isVisible: false, reason: syntheticReason },
        }),
        [200],
        "Ocultar obra sintética",
      );
      const hidden = assertStatus(
        await request(
          `/admin/works?search=${encodeURIComponent(slug)}&visibility=hidden&page=1&limit=10`,
          { token: catalogToken },
        ),
        [200],
        "Localizar obra oculta",
      );
      if (!hidden.items?.some((work) => work.id === workId))
        throw new Error("Obra oculta não apareceu na listagem administrativa.");
      const detail = assertStatus(
        await request(`/admin/works/${encodeURIComponent(workId)}`, {
          token: catalogToken,
        }),
        [200],
        "Detalhe administrativo",
      );
      const editionIds = detail.editions.map((edition) => edition.id).sort();
      const updateBody = {
        title: detail.title,
        slug: detail.slug,
        author: detail.author.name,
        publisher: detail.publisher.name,
        synopsis: `${detail.synopsis} revised`,
        releaseDate: detail.releaseDate.slice(0, 10),
        language: detail.language,
        isbn: detail.isbn,
        coverUrl: detail.coverUrl,
        edition: detail.edition,
        categories: detail.categories.map((item) => item.category.name),
        editions: detail.editions.map(
          ({ format, isbn, priceCents, isVisible }) => ({
            format,
            isbn,
            priceCents,
            isVisible,
          }),
        ),
      };
      assertStatus(
        await request(`/works/${encodeURIComponent(workId)}`, {
          token: catalogToken,
          method: "PATCH",
          body: updateBody,
        }),
        [200],
        "Editar metadados",
      );
      const updated = assertStatus(
        await request(`/admin/works/${encodeURIComponent(workId)}`, {
          token: catalogToken,
        }),
        [200],
        "Reler obra editada",
      );
      if (
        JSON.stringify(updated.editions.map((edition) => edition.id).sort()) !==
        JSON.stringify(editionIds)
      )
        throw new Error("A edição substituiu IDs existentes.");
      const publicWorks = assertStatus(
        await request(
          `/works?search=${encodeURIComponent(`Synthetic work ${runId}`)}&page=1&limit=10`,
        ),
        [200],
        "Vitrine pública",
      );
      if (publicWorks.items?.some((work) => work.id === workId))
        throw new Error("Obra oculta apareceu na vitrine pública.");
      record(
        "Catálogo oculto e edição com IDs preservados",
        "APROVADO",
        "Obra oculta localizável no Admin; atualização preservou os IDs de suas edições.",
      );

      currentScenario = scenarioNames[3];
      const stockPage = assertStatus(
        await request(
          `/admin/inventory?search=${encodeURIComponent(slug)}&page=1&limit=10`,
          { token: stockToken },
        ),
        [200],
        "Listar estoque",
      );
      const physical = stockPage.items.find(
        (edition) =>
          edition.work.id === workId && edition.format === "PHYSICAL",
      );
      const digital = stockPage.items.find(
        (edition) => edition.work.id === workId && edition.format === "DIGITAL",
      );
      if (!physical || !digital)
        throw new Error("As edições sintéticas não apareceram no estoque.");
      assertStatus(
        await request(
          `/inventory/${encodeURIComponent(physical.id)}/physical`,
          {
            token: stockToken,
            method: "PATCH",
            body: {
              stock: physical.inventory?.physicalStock ?? 0,
              reason: syntheticReason,
            },
          },
        ),
        [200],
        "Ajustar estoque físico",
      );
      assertStatus(
        await request(`/inventory/${encodeURIComponent(digital.id)}/digital`, {
          token: stockToken,
          method: "PATCH",
          body: {
            limit: digital.inventory?.digitalLicenseLimit ?? null,
            reason: syntheticReason,
          },
        }),
        [200],
        "Ajustar limite digital",
      );
      const forbiddenCatalog = await request("/admin/works?page=1&limit=1", {
        token: stockToken,
      });
      const forbiddenStock = await request("/admin/inventory?page=1&limit=1", {
        token: catalogToken,
      });
      if (forbiddenCatalog.status !== 403 || forbiddenStock.status !== 403)
        throw new Error("A API não negou acesso fora do papel.");
      record(
        "Ajuste de estoque e limites por papel",
        "APROVADO",
        "Estoque físico/digital atualizado com motivo; CATALOG e STOCK receberam 403 nas áreas alheias.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Falha não identificada.";
      if (!outcomes.some((item) => item.name === currentScenario)) {
        record(
          currentScenario,
          "REPROVADO",
          message.replace(/https?:\/\/\S+/g, "[URL]").slice(0, 180),
        );
      }
      const currentIndex = scenarioNames.indexOf(currentScenario);
      for (const name of scenarioNames.slice(currentIndex + 1)) {
        if (!outcomes.some((item) => item.name === name)) {
          record(name, "BLOQUEADO", "Cenário não executado após falha em etapa anterior.");
        }
      }
    } finally {
      if (workId && catalogToken) {
        await request(`/works/${encodeURIComponent(workId)}/visibility`, {
          token: catalogToken,
          method: "PATCH",
          body: { isVisible: true, reason: syntheticReason },
        }).catch(() => null);
      }
    }
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const date = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  const rows = outcomes.map(
    (item) =>
      `| ${item.name} | ${item.status} | ${item.evidence.replaceAll("|", "\\|")} |`,
  );
  const report = [
    "# TASK-030 — validação manual de gestão administrativa",
    "",
    `Data: ${date}`,
    "Dados de convite, tokens, senhas, e-mails sintéticos e identificadores foram mantidos em memória e omitidos deste relatório.",
    workId
      ? "A obra de teste é sintética e permanece no banco isolado; nenhum dado original é alterado."
      : "Nenhuma obra foi criada nesta execução; nenhum dado original foi alterado.",
    "",
    "| Cenário | Estado | Evidência resumida |",
    "|---|---|---|",
    ...rows,
    "",
  ].join("\n");
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, report, "utf8");
  process.stdout.write(
    `Relatório sanitizado: ${outcomes.filter((item) => item.status === "APROVADO").length} aprovado(s), ${outcomes.filter((item) => item.status === "REPROVADO").length} reprovado(s), ${outcomes.filter((item) => item.status === "BLOQUEADO").length} bloqueado(s).\n`,
  );
}

await run();
