"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useDashboardSession } from "../dashboard/DashboardSessionProvider";
import { DashboardRole } from "../dashboard/dashboard-api";
import { apiRequest, displayDate, money } from "./api";

type Kind =
  | "works"
  | "work"
  | "inventory"
  | "bundles"
  | "coupons"
  | "shipping"
  | "users"
  | "refunds"
  | "reviews"
  | "audit";
interface ResourceRecord {
  [key: string]: unknown;
  id?: string;
  reviewId?: string;
  title?: string;
  slug?: string;
  name?: string;
  code?: string;
  action?: string;
  reason?: string;
  createdAt?: string;
  actorRole?: string;
  targetType?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  isVisible?: boolean;
  isEmailConfirmed?: boolean;
  usageCount?: number;
  maxUses?: number;
  priceCents?: number;
  postalCodeStart?: string;
  postalCodeEnd?: string;
  minPhysicalQuantity?: number;
  maxPhysicalQuantity?: number | null;
  priority?: number;
  author?: { name?: string };
  items?: Array<{ workId: string; title: string }>;
  review?: { rating?: number; comment?: string };
  synopsis?: string;
  releaseDate?: string;
  language?: string;
  coverUrl?: string | null;
  isbn?: string;
  edition?: string;
  publisher?: { name?: string };
  categories?: Array<{ category: { name: string } }>;
  editions?: Array<{
    id?: string;
    format: string;
    isbn?: string;
    priceCents: number;
    isVisible: boolean;
  }>;
}
interface WorkData {
  id: string;
  slug: string;
  title: string;
  editions: Array<{ id: string; format: string }>;
}
interface InventoryData {
  physicalStock?: number;
  digitalLicenseLimit?: number | null;
}
interface InventoryEntry {
  id: string;
  format: "PHYSICAL" | "DIGITAL";
  priceCents: number;
  isVisible: boolean;
  work: {
    id: string;
    title: string;
    slug: string;
    isVisible: boolean;
    author: { name: string };
  };
  inventory: {
    physicalStock: number;
    digitalLicenseLimit: number | null;
    digitalAllocated: number;
  } | null;
}
type EditableEdition = NonNullable<ResourceRecord["editions"]>[number];
const titles: Record<Kind, string> = {
  works: "Gestão de obras",
  work: "Edições, estoque e arquivos",
  inventory: "Gerenciamento de estoque",
  bundles: "Bundles",
  coupons: "Cupons",
  shipping: "Regras de frete",
  users: "Usuários",
  refunds: "Reembolsos",
  reviews: "Moderação de avaliações",
  audit: "Auditoria",
};
const paths: Partial<Record<Kind, string>> = {
  works: "/admin/works",
  bundles: "/bundles",
  coupons: "/admin/coupons",
  shipping: "/admin/shipping-rules",
  users: "/admin/users",
  refunds: "/admin/refunds",
  reviews: "/admin/review-reports",
  audit: "/admin/audit-logs?page=1&limit=50",
};
const allowedRoles: Record<Kind, DashboardRole[]> = {
  works: ["ADMIN", "CATALOG"],
  work: ["ADMIN", "CATALOG", "STOCK"],
  inventory: ["ADMIN", "STOCK"],
  bundles: ["ADMIN", "CATALOG"],
  coupons: ["ADMIN", "CATALOG"],
  shipping: ["ADMIN"],
  users: ["ADMIN"],
  refunds: ["ADMIN"],
  reviews: ["ADMIN"],
  audit: ["ADMIN"],
};

function StaffShell({
  kind,
  children,
}: {
  kind: Kind;
  children: React.ReactNode;
}) {
  const { session, hydrated } = useDashboardSession();
  if (!hydrated)
    return (
      <main className="page-shell">
        <p role="status">Restaurando sessão da equipe…</p>
      </main>
    );
  if (!session)
    return (
      <main className="page-shell">
        <header className="page-heading">
          <p className="eyebrow">ÁREA DA EQUIPE</p>
          <h1>{titles[kind]}</h1>
        </header>
        <p>Entre com sua conta da equipe para continuar.</p>
        <Link className="button-link" href="/dashboard">
          Entrar no painel
        </Link>
      </main>
    );
  if (!allowedRoles[kind].includes(session.role))
    return (
      <main className="page-shell">
        <h1>Acesso não autorizado</h1>
        <p>Seu perfil não tem permissão para esta área.</p>
        <Link href="/dashboard">Voltar ao painel</Link>
      </main>
    );
  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="eyebrow">ADMINISTRAÇÃO</p>
        <h1>{titles[kind]}</h1>
        <p>Ações exibidas conforme o papel de equipe e as permissões da API.</p>
      </header>
      <StaffLinks />
      {children}
    </main>
  );
}
function StaffLinks() {
  const { session } = useDashboardSession();
  const links: Array<[string, string]> = [];
  if (session?.role === "ADMIN" || session?.role === "CATALOG") {
    links.push(
      ["Catálogo", "/admin/catalogo"],
      ["Bundles", "/admin/bundles"],
      ["Cupons", "/admin/cupons"],
      ["Frete", "/admin/frete"],
    );
  }
  if (session?.role === "ADMIN" || session?.role === "STOCK") {
    links.push(["Estoque", "/warehouse/inventory"]);
  }
  if (session?.role === "ADMIN") {
    links.push(
      ["Usuários", "/admin/usuarios"],
      ["Reembolsos", "/admin/reembolsos"],
      ["Avaliações", "/admin/avaliacoes"],
      ["Auditoria", "/admin/auditoria"],
    );
  }
  return (
    <nav className="staff-links" aria-label="Ferramentas da equipe">
      {links.map(([label, href]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

function ResourceList({ kind }: { kind: Exclude<Kind, "work" | "inventory"> }) {
  const { session } = useDashboardSession();
  const [items, setItems] = useState<ResourceRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [visibilityDraft, setVisibilityDraft] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [roleDraft, setRoleDraft] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusDraft, setStatusDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const authorized = Boolean(
    session && allowedRoles[kind].includes(session.role),
  );
  const refresh = useCallback(async () => {
    if (!session || !authorized) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (kind === "works") params.set("visibility", visibility);
      if (kind === "users") {
        if (roleFilter) params.set("role", roleFilter);
        if (statusFilter) params.set("isActive", statusFilter);
      }
      const isPaged = kind === "works" || kind === "users";
      const path = isPaged ? `${paths[kind]}?${params}` : paths[kind]!;
      const data = await apiRequest<unknown>(path, {
        token: session.token,
      });
      let values: ResourceRecord[] = [];
      if (Array.isArray(data)) values = data as ResourceRecord[];
      else if (data && typeof data === "object") {
        const record = data as Record<string, unknown>;
        const rows = record.items ?? record.users;
        if (Array.isArray(rows)) values = rows as ResourceRecord[];
        setTotalPages(
          typeof record.totalPages === "number" ? record.totalPages : 1,
        );
      }
      setItems(values);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar.");
    } finally {
      setLoading(false);
    }
  }, [
    authorized,
    kind,
    page,
    roleFilter,
    search,
    session,
    statusFilter,
    visibility,
  ]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function update(path: string, method: string, body: unknown) {
    if (!session || !authorized) return;
    try {
      await apiRequest(path, { token: session.token, method, body });
      setNotice("Alteração registrada.");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  }
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session || !authorized || kind !== "users") return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setNotice("");
    setInviteUrl("");
    try {
      const result = await apiRequest<{
        activationUrl: string;
        email: string;
        expiresInHours: number;
      }>("/admin/users/invitations", {
        token: session.token,
        method: "POST",
        body: {
          email: data.get("email"),
          role: data.get("role"),
          reason: data.get("reason"),
        },
      });
      setInviteUrl(result.activationUrl);
      setNotice(
        `Convite para ${result.email} criado. Copie o link agora; ele expira em ${result.expiresInHours} horas.`,
      );
      form.reset();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao criar convite.");
    }
  }
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    let path = paths[kind]!;
    let body: unknown;
    if (kind === "bundles") {
      path = "/bundles";
      body = {
        name: fd.get("name"),
        priceCents: Number(fd.get("priceCents")),
        workIds: String(fd.get("workIds"))
          .split(/[\s,]+/)
          .filter(Boolean),
      };
    } else if (kind === "coupons")
      body = {
        code: fd.get("code"),
        discountType: fd.get("discountType"),
        ...(fd.get("discountType") === "FIXED"
          ? { fixedAmountCents: Number(fd.get("amount")) }
          : { percentageBasisPoints: Number(fd.get("amount")) }),
        validFrom: new Date(String(fd.get("validFrom"))).toISOString(),
        validUntil: new Date(String(fd.get("validUntil"))).toISOString(),
        maxUses: Number(fd.get("maxUses")),
      };
    else if (kind === "shipping")
      body = {
        postalCodeStart: fd.get("postalCodeStart"),
        postalCodeEnd: fd.get("postalCodeEnd"),
        minPhysicalQuantity: Number(fd.get("minPhysicalQuantity")),
        maxPhysicalQuantity: fd.get("maxPhysicalQuantity")
          ? Number(fd.get("maxPhysicalQuantity"))
          : null,
        priceCents: Number(fd.get("priceCents")),
        priority: Number(fd.get("priority") || 0),
      };
    else if (kind === "works") {
      path = "/works";
      body = {
        title: fd.get("title"),
        slug: fd.get("slug") || undefined,
        author: fd.get("author"),
        publisher: fd.get("publisher"),
        synopsis: fd.get("synopsis"),
        releaseDate: fd.get("releaseDate"),
        language: fd.get("language") || "pt-BR",
        isbn: fd.get("isbn") || undefined,
        coverUrl: fd.get("coverUrl") || undefined,
        edition: fd.get("edition") || undefined,
        categories: String(fd.get("categories"))
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        editions: [
          {
            format: fd.get("format"),
            isbn: fd.get("editionIsbn") || undefined,
            priceCents: Number(fd.get("priceCents")),
            isVisible: true,
          },
        ],
      };
    } else return;
    try {
      await apiRequest(path, { token: session.token, method: "POST", body });
      setNotice("Cadastro salvo.");
      form.reset();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar.");
    }
  };
  return (
    <StaffShell kind={kind}>
      <div className="status-row">
        {loading && <p role="status">Carregando…</p>}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
      </div>
      {(kind === "works" || kind === "users") && (
        <form
          className="inline-form admin-filters"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setSearch(searchDraft.trim());
            if (kind === "works") setVisibility(visibilityDraft);
            if (kind === "users") {
              setRoleFilter(roleDraft);
              setStatusFilter(statusDraft);
            }
          }}
        >
          <label>
            Buscar por {kind === "works" ? "título ou autor" : "e-mail"}
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
            />
          </label>
          {kind === "works" ? (
            <label>
              Visibilidade
              <select
                value={visibilityDraft}
                onChange={(event) => setVisibilityDraft(event.target.value)}
              >
                <option value="all">Todas</option>
                <option value="visible">Visíveis</option>
                <option value="hidden">Ocultas</option>
              </select>
            </label>
          ) : (
            <>
              <label>
                Papel
                <select
                  value={roleDraft}
                  onChange={(event) => setRoleDraft(event.target.value)}
                >
                  <option value="">Todos</option>
                  {["ADMIN", "CATALOG", "STOCK", "CUSTOMER"].map((role) => (
                    <option key={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={statusDraft}
                  onChange={(event) => setStatusDraft(event.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="true">Ativos</option>
                  <option value="false">Inativos</option>
                </select>
              </label>
            </>
          )}
          <button type="submit">Filtrar</button>
        </form>
      )}
      {kind === "users" && (
        <form className="form-card" onSubmit={(event) => void invite(event)}>
          <h2>Convidar pessoa para a equipe</h2>
          <label>
            E-mail
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Papel
            <select name="role" defaultValue="CATALOG">
              <option value="ADMIN">Administrador</option>
              <option value="CATALOG">Catálogo</option>
              <option value="STOCK">Estoque</option>
            </select>
          </label>
          <label>
            Motivo da criação (mínimo 5 caracteres)
            <input name="reason" minLength={5} required />
          </label>
          <button type="submit">Criar convite</button>
          {inviteUrl && (
            <div role="status" className="info-note">
              <p>
                Copie e compartilhe este link de ativação agora. Ele não será
                exibido novamente.
              </p>
              <input
                aria-label="Link de ativação exibido uma vez"
                readOnly
                value={inviteUrl}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
          )}
        </form>
      )}
      {["works", "bundles", "coupons", "shipping"].includes(kind) && (
        <CreateForm kind={kind} onSubmit={(e) => void create(e)} />
      )}
      {items.length === 0 && !loading && !error ? (
        <p>Nenhum registro encontrado.</p>
      ) : (
        <section className="stack">
          {items.map((item, index) => (
            <article key={item.id ?? item.reviewId ?? index}>
              <Record kind={kind} item={item} onUpdate={update} />
            </article>
          ))}
        </section>
      )}
      {(kind === "works" || kind === "users") && totalPages > 1 && (
        <div className="pagination-controls" aria-label="Paginação">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => value - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </StaffShell>
  );
}

function CreateForm({
  kind,
  onSubmit,
}: {
  kind: Exclude<Kind, "work">;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  if (kind === "works")
    return (
      <form className="form-card" onSubmit={onSubmit}>
        <h2>Nova obra</h2>
        <label>
          Título
          <input name="title" required />
        </label>
        <label>
          Slug opcional
          <input name="slug" />
        </label>
        <label>
          Autor
          <input name="author" required />
        </label>
        <label>
          Editora
          <input name="publisher" required />
        </label>
        <label>
          Sinopse
          <textarea name="synopsis" required />
        </label>
        <label>
          Lançamento
          <input name="releaseDate" type="date" required />
        </label>
        <label>
          Idioma
          <input name="language" defaultValue="pt-BR" />
        </label>
        <label>
          ISBN da obra (opcional)
          <input name="isbn" />
        </label>
        <label>
          URL da capa (opcional)
          <input name="coverUrl" type="url" />
        </label>
        <label>
          Número/descrição da edição (opcional)
          <input name="edition" />
        </label>
        <label>
          Categorias separadas por vírgula
          <input name="categories" />
        </label>
        <label>
          Formato
          <select name="format">
            <option value="DIGITAL">Digital</option>
            <option value="PHYSICAL">Físico</option>
          </select>
        </label>
        <label>
          ISBN da edição (opcional)
          <input name="editionIsbn" />
        </label>
        <label>
          Preço em centavos
          <input name="priceCents" type="number" min="0" required />
        </label>
        <button>Criar obra</button>
      </form>
    );
  if (kind === "bundles")
    return (
      <form className="form-card" onSubmit={onSubmit}>
        <h2>Novo bundle</h2>
        <label>
          Nome
          <input name="name" required />
        </label>
        <label>
          Preço em centavos
          <input name="priceCents" type="number" min="0" required />
        </label>
        <label>
          IDs das obras digitais (separados por vírgula)
          <textarea name="workIds" required />
        </label>
        <button>Criar bundle</button>
      </form>
    );
  if (kind === "coupons")
    return (
      <form className="form-card" onSubmit={onSubmit}>
        <h2>Novo cupom</h2>
        <label>
          Código
          <input name="code" required />
        </label>
        <label>
          Tipo
          <select name="discountType">
            <option value="FIXED">Valor fixo</option>
            <option value="PERCENTAGE">Percentual</option>
          </select>
        </label>
        <label>
          Valor (centavos ou pontos-base)
          <input name="amount" type="number" min="1" required />
        </label>
        <label>
          Início
          <input name="validFrom" type="datetime-local" required />
        </label>
        <label>
          Fim
          <input name="validUntil" type="datetime-local" required />
        </label>
        <label>
          Usos máximos
          <input name="maxUses" type="number" min="1" required />
        </label>
        <button>Criar cupom</button>
      </form>
    );
  return (
    <form className="form-card" onSubmit={onSubmit}>
      <h2>Nova regra de frete</h2>
      <label>
        CEP inicial
        <input name="postalCodeStart" required />
      </label>
      <label>
        CEP final
        <input name="postalCodeEnd" required />
      </label>
      <label>
        Quantidade física mínima
        <input name="minPhysicalQuantity" type="number" min="1" required />
      </label>
      <label>
        Quantidade máxima (opcional)
        <input name="maxPhysicalQuantity" type="number" min="1" />
      </label>
      <label>
        Preço em centavos
        <input name="priceCents" type="number" min="0" required />
      </label>
      <label>
        Prioridade
        <input name="priority" type="number" defaultValue="0" />
      </label>
      <button>Criar regra</button>
    </form>
  );
}

function Record({
  kind,
  item,
  onUpdate,
}: {
  kind: Exclude<Kind, "work">;
  item: ResourceRecord;
  onUpdate: (path: string, method: string, body: unknown) => void;
}) {
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState("APPROVE");
  if (kind === "works")
    return (
      <>
        <h2>{item.title}</h2>
        <p>
          {item.author?.name} · {item.slug} ·{" "}
          {item.isVisible ? "Visível" : "Oculta"}
        </p>
        <Link href={`/admin/catalogo/${item.id}`}>
          Editar estoque e arquivos
        </Link>
        <p>
          <label>
            Motivo{" "}
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        </p>
        <button
          disabled={!reason.trim()}
          onClick={() =>
            onUpdate(`/works/${item.id}/visibility`, "PATCH", {
              isVisible: !item.isVisible,
              reason,
            })
          }
        >
          {item.isVisible ? "Ocultar" : "Publicar"}
        </button>
        <details>
          <summary>Editar metadados e edições</summary>
          <WorkEditor
            item={item}
            onSave={(body) => onUpdate(`/works/${item.id}`, "PATCH", body)}
          />
        </details>
      </>
    );
  if (kind === "bundles")
    return (
      <>
        <h2>{item.name}</h2>
        <p>
          {money(item.priceCents ?? 0)} · {item.items?.length ?? 0} obras
        </p>
        <ul>
          {item.items?.map((x) => (
            <li key={x.workId}>{x.title}</li>
          ))}
        </ul>
        <p>A API atual não permite editar ou remover bundles.</p>
      </>
    );
  if (kind === "coupons")
    return (
      <>
        <h2>{item.code}</h2>
        <p>
          {item.isActive ? "Ativo" : "Inativo"} · {item.usageCount ?? 0}/
          {item.maxUses} usos
        </p>
        <button
          onClick={() =>
            onUpdate(`/admin/coupons/${item.id}/active`, "PATCH", {
              isActive: !item.isActive,
            })
          }
        >
          {item.isActive ? "Desativar" : "Ativar"}
        </button>
      </>
    );
  if (kind === "shipping")
    return (
      <>
        <h2>
          CEP {item.postalCodeStart}–{item.postalCodeEnd}
        </h2>
        <p>
          {money(item.priceCents ?? 0)} · quantidade{" "}
          {item.minPhysicalQuantity ?? "—"}–
          {item.maxPhysicalQuantity ?? "sem limite"} · prioridade{" "}
          {item.priority ?? 0}
        </p>
        <button
          onClick={() =>
            onUpdate(`/admin/shipping-rules/${item.id}/active`, "PATCH", {
              isActive: !item.isActive,
            })
          }
        >
          {item.isActive ? "Desativar" : "Ativar"}
        </button>
      </>
    );
  if (kind === "users")
    return (
      <UserRecord
        item={item}
        reason={reason}
        setReason={setReason}
        onUpdate={onUpdate}
      />
    );
  if (kind === "refunds")
    return (
      <>
        <h2>Solicitação {item.id}</h2>
        <pre>{JSON.stringify(item, null, 2)}</pre>
        <label>
          Decisão
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          >
            <option value="APPROVE">Aprovar</option>
            <option value="REJECT">Recusar</option>
          </select>
        </label>
        <label>
          Motivo
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <button
          disabled={!reason.trim()}
          onClick={() =>
            onUpdate(`/admin/refunds/${item.id}/decision`, "POST", {
              decision,
              reason,
            })
          }
        >
          Registrar decisão
        </button>
        {decision === "APPROVE" && (
          <button
            onClick={() =>
              onUpdate(`/admin/refunds/${item.id}/confirm-return`, "POST", {
                reason,
              })
            }
          >
            Confirmar devolução física
          </button>
        )}
      </>
    );
  if (kind === "reviews")
    return (
      <>
        <h2>Denúncia {item.id}</h2>
        <p>{item.reason}</p>
        <p>
          Nota {item.review?.rating} · {item.review?.comment}
        </p>
        <label>
          Motivo da moderação
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <button
          onClick={() =>
            onUpdate(`/admin/reviews/${item.reviewId}`, "DELETE", { reason })
          }
        >
          Remover avaliação
        </button>
      </>
    );
  if (kind === "audit")
    return (
      <>
        <h2>{item.action}</h2>
        <p>
          {item.createdAt ? displayDate(item.createdAt) : "Data indisponível"} ·{" "}
          {item.actorRole} · {item.targetType}
        </p>
        <p>{item.reason}</p>
      </>
    );
  return (
    <>
      <h2>{item.id}</h2>
      <pre>{JSON.stringify(item, null, 2)}</pre>
    </>
  );
}

function WorkEditor({
  item,
  onSave,
}: {
  item: ResourceRecord;
  onSave: (body: unknown) => void;
}) {
  const [title, setTitle] = useState(item.title ?? "");
  const [author, setAuthor] = useState(item.author?.name ?? "");
  const [publisher, setPublisher] = useState(item.publisher?.name ?? "");
  const [synopsis, setSynopsis] = useState(item.synopsis ?? "");
  const [releaseDate, setReleaseDate] = useState(
    item.releaseDate?.slice(0, 10) ?? "",
  );
  const [language, setLanguage] = useState(item.language ?? "pt-BR");
  const [isbn, setIsbn] = useState(item.isbn ?? "");
  const [coverUrl, setCoverUrl] = useState(item.coverUrl ?? "");
  const [editionName, setEditionName] = useState(item.edition ?? "");
  const [categories, setCategories] = useState(
    item.categories?.map((category) => category.category.name).join(", ") ?? "",
  );
  const [editions, setEditions] = useState<EditableEdition[]>(
    item.editions ?? [],
  );
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await onSave({
        title,
        slug: item.slug,
        author,
        publisher,
        synopsis,
        releaseDate,
        language,
        isbn: isbn || undefined,
        coverUrl: coverUrl || undefined,
        edition: editionName || undefined,
        categories: categories
          .split(",")
          .map((category) => category.trim())
          .filter(Boolean),
        editions: editions.map(({ format, isbn, priceCents, isVisible }) => ({
          format,
          isbn,
          priceCents,
          isVisible,
        })),
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-card" onSubmit={submit}>
      <p>
        Edições existentes preservam seu histórico e identificador. Para retirar
        uma edição da venda, desmarque “Edição visível”.
      </p>
      <label>
        Título
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label>
        Autor
        <input
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
      </label>
      <label>
        Editora
        <input
          value={publisher}
          onChange={(e) => setPublisher(e.target.value)}
          required
        />
      </label>
      <label>
        Sinopse
        <textarea
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          required
        />
      </label>
      <label>
        Lançamento
        <input
          type="date"
          value={releaseDate}
          onChange={(e) => setReleaseDate(e.target.value)}
          required
        />
      </label>
      <label>
        Idioma
        <input
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        />
      </label>
      <label>
        ISBN da obra
        <input value={isbn} onChange={(event) => setIsbn(event.target.value)} />
      </label>
      <label>
        URL da capa
        <input
          type="url"
          value={coverUrl}
          onChange={(event) => setCoverUrl(event.target.value)}
        />
      </label>
      <label>
        Número/descrição da edição
        <input
          value={editionName}
          onChange={(event) => setEditionName(event.target.value)}
        />
      </label>
      <label>
        Categorias separadas por vírgula
        <input
          value={categories}
          onChange={(event) => setCategories(event.target.value)}
        />
      </label>
      <h3>Edições</h3>
      {editions.map((edition, index) => (
        <fieldset
          key={edition.id ?? `${edition.format}-${index}`}
          className="form-card"
        >
          <legend>Edição {index + 1}</legend>
          <p>Formato: {edition.format === "PHYSICAL" ? "Físico" : "Digital"}</p>
          <label>
            ISBN da edição
            <input
              value={edition.isbn ?? ""}
              onChange={(event) =>
                setEditions((current) =>
                  current.map((value, currentIndex) =>
                    currentIndex === index
                      ? { ...value, isbn: event.target.value || undefined }
                      : value,
                  ),
                )
              }
            />
          </label>
          <label>
            Preço em centavos
            <input
              type="number"
              min="0"
              value={edition.priceCents}
              onChange={(event) =>
                setEditions((current) =>
                  current.map((value, currentIndex) =>
                    currentIndex === index
                      ? { ...value, priceCents: Number(event.target.value) }
                      : value,
                  ),
                )
              }
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={edition.isVisible}
              onChange={(event) =>
                setEditions((current) =>
                  current.map((value, currentIndex) =>
                    currentIndex === index
                      ? { ...value, isVisible: event.target.checked }
                      : value,
                  ),
                )
              }
            />
            Edição visível
          </label>
        </fieldset>
      ))}
      {(["PHYSICAL", "DIGITAL"] as const)
        .filter(
          (format) => !editions.some((edition) => edition.format === format),
        )
        .map((format) => (
          <button
            key={format}
            type="button"
            onClick={() =>
              setEditions((current) => [
                ...current,
                {
                  format,
                  priceCents: 0,
                  isVisible: true,
                },
              ])
            }
          >
            Adicionar edição {format === "PHYSICAL" ? "física" : "digital"}
          </button>
        ))}
      <button disabled={busy}>Salvar edição</button>
    </form>
  );
}

function UserRecord({
  item,
  reason,
  setReason,
  onUpdate,
}: {
  item: ResourceRecord;
  reason: string;
  setReason: (value: string) => void;
  onUpdate: (path: string, method: string, body: unknown) => void;
}) {
  const [role, setRole] = useState(item.role ?? "CUSTOMER");
  return (
    <>
      <h2>{item.email}</h2>
      <p>
        {item.role} · {item.isActive ? "Ativo" : "Inativo"} ·{" "}
        {item.isEmailConfirmed ? "E-mail confirmado" : "E-mail pendente"}
      </p>
      <div className="inline-form">
        <label>
          Papel
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {["CUSTOMER", "CATALOG", "STOCK", "ADMIN"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Motivo obrigatório
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <button
          disabled={!reason.trim()}
          onClick={() =>
            onUpdate(`/admin/users/${item.id}/role`, "PATCH", { role, reason })
          }
        >
          Atualizar papel
        </button>
        <button
          disabled={!reason.trim()}
          onClick={() =>
            onUpdate(`/admin/users/${item.id}/status`, "PATCH", {
              isActive: !item.isActive,
              reason,
            })
          }
        >
          {item.isActive ? "Desativar" : "Ativar"}
        </button>
      </div>
    </>
  );
}

export function StaffResourcePage({
  kind,
}: {
  kind: Exclude<Kind, "work" | "inventory">;
}) {
  return <ResourceList kind={kind} />;
}

export function InventoryManagementPage() {
  const { session } = useDashboardSession();
  const authorized = Boolean(
    session && allowedRoles.inventory.includes(session.role),
  );
  const [items, setItems] = useState<InventoryEntry[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const refresh = useCallback(async () => {
    if (!session || !authorized) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) query.set("search", search);
      const result = await apiRequest<{
        items: InventoryEntry[];
        totalPages: number;
      }>(`/admin/inventory?${query}`, { token: session.token });
      setItems(result.items);
      setTotalPages(result.totalPages);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível carregar o estoque.",
      );
    } finally {
      setLoading(false);
    }
  }, [authorized, page, search, session]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function save(entry: InventoryEntry, form: HTMLFormElement) {
    if (!session || !authorized) return;
    const data = new FormData(form);
    const reason = String(data.get("reason") ?? "").trim();
    if (reason.length < 5) {
      setError("Informe um motivo com pelo menos 5 caracteres.");
      return;
    }
    const physical = entry.format === "PHYSICAL";
    try {
      await apiRequest(
        `/inventory/${encodeURIComponent(entry.id)}/${physical ? "physical" : "digital"}`,
        {
          token: session.token,
          method: "PATCH",
          body: physical
            ? { stock: Number(data.get("stock")), reason }
            : {
                limit:
                  data.get("limit") === "" ? null : Number(data.get("limit")),
                reason,
              },
        },
      );
      setNotice("Disponibilidade atualizada e registrada.");
      setError("");
      await refresh();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Falha ao atualizar disponibilidade.",
      );
    }
  }
  return (
    <StaffShell kind="inventory">
      <form
        className="inline-form admin-filters"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setSearch(searchDraft.trim());
        }}
      >
        <label>
          Buscar por título ou autor
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
        </label>
        <button type="submit">Buscar</button>
      </form>
      {loading && <p role="status">Carregando estoque…</p>}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!loading && !error && items.length === 0 && (
        <p>Nenhuma edição encontrada.</p>
      )}
      <section className="stack">
        {items.map((item) => (
          <form
            className="form-card inventory-card"
            key={item.id}
            onSubmit={(event) => {
              event.preventDefault();
              void save(item, event.currentTarget);
            }}
          >
            <h2>{item.work.title}</h2>
            <p>
              {item.work.author.name} ·{" "}
              {item.format === "PHYSICAL" ? "Físico" : "Digital"} ·{" "}
              {money(item.priceCents)}
            </p>
            <p>
              {item.work.isVisible && item.isVisible
                ? "Disponível na vitrine"
                : "Oculto da vitrine"}
            </p>
            {item.format === "PHYSICAL" ? (
              <label>
                Unidades em estoque
                <input
                  name="stock"
                  type="number"
                  min="0"
                  defaultValue={item.inventory?.physicalStock ?? 0}
                  required
                />
              </label>
            ) : (
              <>
                <p>
                  Licenças alocadas: {item.inventory?.digitalAllocated ?? 0}
                </p>
                <label>
                  Limite de licenças (vazio = ilimitado)
                  <input
                    name="limit"
                    type="number"
                    min="0"
                    defaultValue={item.inventory?.digitalLicenseLimit ?? ""}
                  />
                </label>
              </>
            )}
            <label>
              Motivo do ajuste (mínimo 5 caracteres)
              <input name="reason" minLength={5} required />
            </label>
            <button type="submit">Salvar disponibilidade</button>
          </form>
        ))}
      </section>
      {totalPages > 1 && (
        <div className="pagination-controls" aria-label="Paginação do estoque">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((value) => value - 1)}
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((value) => value + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </StaffShell>
  );
}

export function WorkInventoryPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useDashboardSession();
  const [work, setWork] = useState<WorkData | null>(null);
  const [editionId, setEditionId] = useState("");
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [stock, setStock] = useState("");
  const [limit, setLimit] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!session) return;
    let active = true;
    const loadWork =
      session.role === "ADMIN" || session.role === "CATALOG"
        ? apiRequest<WorkData>(`/admin/works/${encodeURIComponent(id)}`, {
            token: session.token,
          })
        : apiRequest<{ items: WorkData[] }>("/works?page=1&limit=50").then(
            (r) => {
              const found = r.items.find((item) => item.id === id);
              if (!found) throw new Error("Obra não localizada.");
              return apiRequest<WorkData>(
                `/works/${encodeURIComponent(found.slug)}`,
              );
            },
          );
    void loadWork
      .then((result) => {
        if (active) {
          setWork(result);
          setEditionId(result.editions?.[0]?.id ?? "");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, session?.token, session?.role]);
  useEffect(() => {
    if (!session || session.role === "CATALOG" || !editionId) return;
    let active = true;
    void apiRequest<InventoryData>(
      `/inventory/${encodeURIComponent(editionId)}`,
      { token: session.token },
    )
      .then((r) => {
        if (active) {
          setInventory(r);
          setStock(String(r.physicalStock ?? ""));
          setLimit(
            r.digitalLicenseLimit == null ? "" : String(r.digitalLicenseLimit),
          );
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [editionId, session?.token, session?.role]);
  async function save(type: "physical" | "digital") {
    if (!session || session.role === "CATALOG") return;
    try {
      await apiRequest(`/inventory/${encodeURIComponent(editionId)}/${type}`, {
        token: session.token,
        method: "PATCH",
        body:
          type === "physical"
            ? { stock: Number(stock), reason }
            : { limit: limit === "" ? null : Number(limit), reason },
      });
      setNotice("Estoque atualizado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao atualizar estoque.");
    }
  }
  return (
    <StaffShell kind="work">
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {work ? (
        <>
          <h2>{work.title}</h2>
          <label>
            Edição
            <select
              value={editionId}
              onChange={(e) => setEditionId(e.target.value)}
            >
              {work.editions.map((edition) => (
                <option key={edition.id} value={edition.id}>
                  {edition.format} · {edition.id}
                </option>
              ))}
            </select>
          </label>
          {session?.role !== "CATALOG" && (
            <>
              <p>Disponibilidade: {JSON.stringify(inventory)}</p>
              <label>
                Motivo obrigatório
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </label>
              <div className="inline-form">
                <label>
                  Estoque físico
                  <input
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </label>
                <button
                  disabled={!reason.trim()}
                  onClick={() => void save("physical")}
                >
                  Salvar estoque
                </button>
                <label>
                  Limite digital (vazio = ilimitado)
                  <input
                    type="number"
                    min="0"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                  />
                </label>
                <button
                  disabled={!reason.trim()}
                  onClick={() => void save("digital")}
                >
                  Salvar licença
                </button>
              </div>
            </>
          )}
          {session?.role !== "STOCK" && (
            <AssetVersions editionId={editionId} token={session?.token ?? ""} />
          )}
        </>
      ) : (
        !error && <p role="status">Carregando obra…</p>
      )}
    </StaffShell>
  );
}

function AssetVersions({
  editionId,
  token,
}: {
  editionId: string;
  token: string;
}) {
  const [versions, setVersions] = useState<
    Array<{
      id: string;
      version: number;
      mimeType: string;
      isOriginal: boolean;
    }>
  >([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!editionId || !token) return;
    let active = true;
    void apiRequest<typeof versions>(
      `/catalog/assets/${encodeURIComponent(editionId)}`,
      { token },
    )
      .then((data) => {
        if (active) setVersions(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [editionId, token]);
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.elements.namedItem("asset") as HTMLInputElement | null;
    const selected = file?.files?.[0];
    if (!selected) return;
    const formData = new FormData(form);
    try {
      const contentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () =>
          reject(new Error("Não foi possível ler o arquivo."));
        reader.onload = () =>
          resolve(String(reader.result).split(",")[1] ?? "");
        reader.readAsDataURL(selected);
      });
      const extension = selected.name.split(".").pop()?.toLowerCase() ?? "";
      await apiRequest(
        `/catalog/assets/${encodeURIComponent(editionId)}/versions`,
        {
          token,
          method: "POST",
          body: {
            contentBase64,
            extension,
            mimeType: selected.type,
            isOriginal: formData.get("isOriginal") === "on",
            reason,
          },
        },
      );
      setNotice("Nova versão registrada.");
      form.reset();
      const data = await apiRequest<typeof versions>(
        `/catalog/assets/${encodeURIComponent(editionId)}`,
        { token },
      );
      setVersions(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível adicionar versão.",
      );
    }
  }
  return (
    <section>
      <h2>Arquivos privados</h2>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {versions.map((version) => (
        <p key={version.id}>
          Versão {version.version} · {version.mimeType} ·{" "}
          {version.isOriginal ? "Original" : "Correção"}
        </p>
      ))}
      {versions.length === 0 && <p>Nenhum arquivo encontrado.</p>}
      <form className="form-card" onSubmit={(e) => void add(e)}>
        <label>
          Nova versão de arquivo
          <input
            name="asset"
            type="file"
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            required
          />
        </label>
        <label>
          <input name="isOriginal" type="checkbox" />
          Este arquivo é o original publicado
        </label>
        <label>
          Motivo da correção
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </label>
        <button disabled={!reason.trim()}>Adicionar versão</button>
      </form>
    </section>
  );
}
