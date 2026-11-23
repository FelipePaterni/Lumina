"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  API_URL,
  confirmEmailRequest,
  forgotPasswordRequest,
  loginRequest,
  registerRequest,
  resetPasswordRequest,
} from "../auth/services/auth-api";
import { getCart, type CartView } from "../checkout/cart-api";
import { AccountApiClient } from "../account/services/account-api";
import { WishlistPanel } from "../wishlist/WishlistPanel";
import { apiRequest, displayDate, money } from "./api";
import { useCustomerSession } from "./CustomerSession";
import { useDashboardSession } from "../dashboard/DashboardSessionProvider";
import { sessionsForLogin } from "../dashboard/session-login";
import type { DashboardRole } from "../dashboard/dashboard-api";
import { landingRouteForRole } from "../dashboard/dashboard-navigation";

const accountApi = new AccountApiClient(API_URL);

type Edition = {
  id: string;
  format: "PHYSICAL" | "DIGITAL";
  priceCents: number;
  isVisible: boolean;
};
type Work = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  author: { name: string };
  publisher?: { name: string };
  language?: string;
  releaseDate?: string;
  coverUrl?: string | null;
  categories?: Array<{ category: { name: string } }>;
  editions: Edition[];
  averageRating?: number | null;
  reviewCount?: number;
};
type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt?: string;
};
type Bundle = {
  id: string;
  name: string;
  priceCents: number;
  items: Array<{ workId: string; title: string }>;
};
type LibraryEntry = {
  purchaseItemId: string;
  editionId: string;
  title: string;
  purchasedAt: string;
  releaseAt: string;
  downloadAvailable: boolean;
};
type OrderDetails = {
  id?: string;
  orderId?: string;
  status?: string;
  fulfillmentStatus?: string;
  totalAmount?: string;
  trackingCode?: string;
  items?: Array<{
    id?: string;
    editionId: string;
    workTitle: string;
    quantity?: number;
    format?: string;
  }>;
};
type Profile = { email: string; role: string; isEmailConfirmed: boolean };

function Page({
  title,
  eyebrow = "LUMINA LIVROS",
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="page-shell">
      <header className="page-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </header>
      {children}
    </main>
  );
}

function CustomerLogin({
  onSuccess,
}: {
  onSuccess?: (token: string, role: string) => void;
}) {
  const { setToken } = useCustomerSession();
  const { setSession } = useDashboardSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = (await loginRequest({ email, password })) as {
        accessToken?: string;
        user?: { role?: string };
        message?: string;
      };
      if (!result.accessToken)
        throw new Error(result.message ?? "Não foi possível entrar.");
      const role = result.user?.role ?? "CUSTOMER";
      if (role === "CUSTOMER") {
        const sessions = sessionsForLogin(result.accessToken, "CUSTOMER");
        setToken(sessions.customerToken);
        setSession(sessions.staffSession);
        onSuccess?.(result.accessToken, role);
      } else if (role === "ADMIN" || role === "CATALOG" || role === "STOCK") {
        const sessions = sessionsForLogin(result.accessToken, role);
        setToken(sessions.customerToken);
        setSession(sessions.staffSession);
        router.push(
          landingRouteForRole(role as Exclude<DashboardRole, "CUSTOMER">),
        );
      }
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Falha ao autenticar.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-card" onSubmit={(event) => void submit(event)}>
      <label>
        E-mail
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        Senha
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <button disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <p>
        <Link href="/criar-conta">Criar conta</Link> ·{" "}
        <Link href="/recuperar-senha">Esqueci a senha</Link>
      </p>
    </form>
  );
}

export function CatalogHome() {
  const [works, setWorks] = useState<Work[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: String(page), limit: "12" });
    for (const [key, value] of Object.entries({
      search,
      category,
      language,
      minPriceCents: minPrice,
      maxPriceCents: maxPrice,
      sort,
    }))
      if (value) query.set(key, value);
    setLoading(true);
    setError("");
    fetch(`${API_URL}/works?${query}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Não foi possível carregar o catálogo.");
        return r.json();
      })
      .then((data) => {
        if (active) setWorks(data.items ?? []);
      })
      .catch((reason) => {
        if (active) {
          setWorks([]);
          setError(
            reason instanceof Error
              ? reason.message
              : "Falha ao carregar o catálogo.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, category, language, minPrice, maxPrice, sort, page]);
  return (
    <Page title="Encontre sua próxima leitura">
      <section className="filter-row" aria-label="Filtros do catálogo">
        <label>
          Buscar
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Título ou autor"
          />
        </label>
        <label>
          Categoria
          <input
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Idioma
          <input
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setPage(1);
            }}
            placeholder="pt-BR"
          />
        </label>
        <label>
          Preço mínimo (centavos)
          <input
            inputMode="numeric"
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Preço máximo (centavos)
          <input
            inputMode="numeric"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Ordenação
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Mais recentes</option>
            <option value="BEST_SELLING">Mais vendidos</option>
            <option value="TOP_RATED">Melhor avaliados</option>
          </select>
        </label>
      </section>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {loading && <p role="status">Carregando catálogo…</p>}
      {!loading && !error && !works.length && (
        <p role="status">Nenhuma obra encontrada.</p>
      )}
      <section className="catalog-grid">
        {works.map((work) => (
          <article className="book-card" key={work.id}>
            <div className="cover">
              {work.coverUrl ? (
                <img src={work.coverUrl} alt={`Capa de ${work.title}`} />
              ) : (
                work.title.slice(0, 1)
              )}
            </div>
            <p className="eyebrow">
              {work.categories?.map((x) => x.category.name).join(" · ")}
            </p>
            <h2>
              <Link href={`/livros/${encodeURIComponent(work.slug)}`}>
                {work.title}
              </Link>
            </h2>
            <p className="author">{work.author.name}</p>
            <p>{work.synopsis}</p>
            <p>
              {work.averageRating == null
                ? "Sem avaliações"
                : `★ ${work.averageRating.toFixed(1)} (${work.reviewCount ?? 0})`}
            </p>
            <div className="editions">
              {work.editions
                .filter((x) => x.isVisible)
                .map((edition) => (
                  <span key={edition.id}>
                    {edition.format === "DIGITAL" ? "E-book" : "Físico"} ·{" "}
                    {money(edition.priceCents)}
                  </span>
                ))}
            </div>
          </article>
        ))}
      </section>
      <nav className="pagination" aria-label="Paginação">
        <button
          disabled={page === 1}
          onClick={() => setPage((n) => Math.max(1, n - 1))}
        >
          Anterior
        </button>
        <span>Página {page}</span>
        <button
          disabled={works.length < 12}
          onClick={() => setPage((n) => n + 1)}
        >
          Próxima
        </button>
      </nav>
    </Page>
  );
}

export function AuthPage({
  mode,
}: {
  mode: "login" | "register" | "confirm" | "forgot" | "reset";
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
    setEmail(params.get("email") ?? "");
  }, []);
  const title = {
    login: "Entrar",
    register: "Criar conta",
    confirm: "Confirmar e-mail",
    forgot: "Recuperar senha",
    reset: "Redefinir senha",
  }[mode];
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let result: unknown;
      if (mode === "register")
        result = await registerRequest({ email, password });
      else if (mode === "confirm")
        result = await confirmEmailRequest({ token });
      else if (mode === "forgot")
        result = await forgotPasswordRequest({ email });
      else if (mode === "reset")
        result = await resetPasswordRequest({ token, newPassword: password });
      else return;
      const msg =
        result &&
        typeof result === "object" &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : "Solicitação concluída.";
      setMessage(msg);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Não foi possível concluir.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={title}>
      <section className="auth-wrap">
        {mode === "login" ? (
          <CustomerLogin />
        ) : (
          <form className="form-card" onSubmit={(e) => void submit(e)}>
            {(mode === "register" || mode === "forgot") && (
              <label>
                E-mail
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            )}
            {(mode === "confirm" || mode === "reset") && (
              <label>
                Token
                <input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </label>
            )}
            {(mode === "register" || mode === "reset") && (
              <label>
                {mode === "register" ? "Senha" : "Nova senha"}
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={12}
                  required
                />
              </label>
            )}
            <button disabled={busy}>{busy ? "Enviando…" : title}</button>
            {message && <p role="status">{message}</p>}
            {error && (
              <p role="alert" className="error-text">
                {error}
              </p>
            )}
          </form>
        )}
      </section>
    </Page>
  );
}

export function WorkDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useCustomerSession();
  const [work, setWork] = useState<Work | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [reportId, setReportId] = useState("");
  const [reportReason, setReportReason] = useState("");
  useEffect(() => {
    let active = true;
    void apiRequest<Work>(`/works/${encodeURIComponent(slug)}`)
      .then(async (book) => {
        const reviewPage = await apiRequest<{ items: Review[] }>(
          `/works/${encodeURIComponent(book.id)}/reviews?page=1&limit=20`,
        );
        if (active) {
          setWork(book);
          setReviews(reviewPage.items);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [slug]);
  async function addEdition(editionId: string) {
    if (!token) {
      setError("Entre para adicionar itens ao carrinho.");
      return;
    }
    try {
      await apiRequest("/cart/items", {
        token,
        method: "POST",
        body: { editionId, quantity: 1 },
      });
      setNotice("Adicionado ao carrinho.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao adicionar.");
    }
  }
  async function addWishlist() {
    if (!token || !work) {
      setError("Entre para salvar na wishlist.");
      return;
    }
    try {
      await apiRequest("/wishlist", {
        token,
        method: "POST",
        body: { workId: work.id },
      });
      setNotice("Obra adicionada à wishlist.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Falha ao adicionar à wishlist.",
      );
    }
  }
  async function postReview(event: FormEvent) {
    event.preventDefault();
    if (!token || !work) return;
    try {
      await apiRequest(`/works/${work.id}/reviews`, {
        token,
        method: "POST",
        body: { rating: Number(rating), comment },
      });
      setNotice("Avaliação publicada.");
      setComment("");
      const data = await apiRequest<{ items: Review[] }>(
        `/works/${work.id}/reviews`,
      );
      setReviews(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao avaliar.");
    }
  }
  async function report(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    try {
      await apiRequest(`/reviews/${reportId}/reports`, {
        token,
        method: "POST",
        body: { reason: reportReason },
      });
      setNotice("Denúncia enviada.");
      setReportId("");
      setReportReason("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao denunciar.");
    }
  }
  return (
    <Page title={work?.title ?? "Detalhe da obra"}>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!work ? (
        !error && <p role="status">Carregando obra…</p>
      ) : (
        <>
          <p className="eyebrow">
            {work.author.name} · {work.publisher?.name ?? ""}
          </p>
          <p>{work.synopsis}</p>
          <p>
            {work.categories?.map((x) => x.category.name).join(" · ")} ·{" "}
            {work.language} ·{" "}
            {work.releaseDate ? displayDate(work.releaseDate) : ""}
          </p>
          <button onClick={() => void addWishlist()}>
            Adicionar à wishlist
          </button>
          <div className="editions">
            {work.editions
              .filter((x) => x.isVisible)
              .map((edition) => (
                <article key={edition.id}>
                  <strong>
                    {edition.format === "DIGITAL" ? "E-book" : "Edição física"}
                  </strong>
                  <p>{money(edition.priceCents)}</p>
                  <button onClick={() => void addEdition(edition.id)}>
                    Adicionar ao carrinho
                  </button>
                </article>
              ))}
          </div>
          <section>
            <h2>Avaliações</h2>
            {reviews.length ? (
              reviews.map((review) => (
                <article key={review.id}>
                  <p>
                    {"★".repeat(review.rating)} · {review.comment}
                  </p>
                  <button
                    onClick={() => {
                      setReportId(review.id);
                    }}
                  >
                    Denunciar
                  </button>
                </article>
              ))
            ) : (
              <p>Ainda não há avaliações.</p>
            )}
            {reportId && (
              <form className="inline-form" onSubmit={(e) => void report(e)}>
                <label>
                  Motivo da denúncia
                  <input
                    minLength={5}
                    maxLength={500}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                  />
                </label>
                <button>Enviar denúncia</button>
              </form>
            )}
            {token && (
              <form className="form-card" onSubmit={(e) => void postReview(e)}>
                <h3>Escreva sua avaliação</h3>
                <label>
                  Nota
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Comentário
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={2000}
                    required
                  />
                </label>
                <button>Publicar avaliação</button>
              </form>
            )}
          </section>
        </>
      )}
    </Page>
  );
}

export function BundlesPage({ detail = false }: { detail?: boolean }) {
  const params = useParams<{ id?: string }>();
  const { token } = useCustomerSession();
  const [items, setItems] = useState<Bundle[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    const path =
      detail && params.id
        ? `/bundles/${encodeURIComponent(params.id)}`
        : "/bundles";
    void apiRequest<Bundle | Bundle[]>(path)
      .then((data) => {
        if (active) setItems(Array.isArray(data) ? data : [data]);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [detail, params.id]);
  async function add(id: string) {
    if (!token) {
      setError("Entre para adicionar o bundle ao carrinho.");
      return;
    }
    try {
      await apiRequest("/cart/bundles", {
        token,
        method: "POST",
        body: { bundleId: id },
      });
      setNotice("Bundle adicionado ao carrinho.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao adicionar.");
    }
  }
  return (
    <Page title={detail ? "Bundle" : "Bundles"}>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!items.length && !error && <p role="status">Carregando bundles…</p>}
      <section className="catalog-grid">
        {items.map((bundle) => (
          <article key={bundle.id}>
            <h2>{bundle.name}</h2>
            <p>{money(bundle.priceCents)}</p>
            <ul>
              {bundle.items?.map((item) => (
                <li key={item.workId}>{item.title}</li>
              ))}
            </ul>
            <Link href={`/bundles/${bundle.id}`}>Ver bundle</Link>
            <button onClick={() => void add(bundle.id)}>
              Adicionar ao carrinho
            </button>
          </article>
        ))}
      </section>
    </Page>
  );
}

const emptyAddress = {
  recipientName: "",
  cpf: "",
  phone: "",
  postalCode: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  state: "",
};
export function CartPage({ checkout = false }: { checkout?: boolean }) {
  const { token, hydrated } = useCustomerSession();
  const router = useRouter();
  const [cart, setCart] = useState<CartView | null>(null);
  const [coupon, setCoupon] = useState("");
  const [address, setAddress] = useState(emptyAddress);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shipping, setShipping] = useState("");
  async function refresh() {
    if (!token) return;
    try {
      setCart(await getCart(token));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar o carrinho.",
      );
    }
  }
  useEffect(() => {
    void refresh();
  }, [token]);
  async function mutate(path: string, method: string, body?: unknown) {
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(path, { token, method, body });
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível atualizar o carrinho.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function setQuantity(editionId: string, quantity: number) {
    if (quantity < 1) return;
    await mutate(`/cart/items/${encodeURIComponent(editionId)}`, "PATCH", {
      quantity,
    });
  }
  async function quote() {
    if (!token) return;
    try {
      const result = await apiRequest<{
        shippingAmount: string;
        totalAmount: string;
      }>("/cart/shipping-quote", { token, method: "POST", body: { address } });
      setShipping(`${result.shippingAmount} · total ${result.totalAmount}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível calcular o frete.",
      );
    }
  }
  async function complete(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setError("");
    try {
      const order = await apiRequest<{ id: string }>("/checkout", {
        token,
        method: "POST",
        body: { shippingAddress: address },
        idempotencyKey: crypto.randomUUID(),
      });
      router.push(`/pedidos/${order.id}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível confirmar o pedido.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Page title={checkout ? "Finalizar pedido" : "Seu carrinho"}>
      {!hydrated ? (
        <p role="status">Restaurando sua sessão…</p>
      ) : !token ? (
        <>
          <p>Entre para acessar seu carrinho.</p>
          <CustomerLogin />
        </>
      ) : (
        <>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          {!cart && !error && <p role="status">Carregando carrinho…</p>}
          {cart && (
            <>
              <section className="stack">
                {cart.items.map((item) => (
                  <article key={item.editionId}>
                    <h2>{item.workTitle}</h2>
                    <p>
                      {item.format === "DIGITAL" ? (
                        "E-book"
                      ) : (
                        <>
                          <button
                            disabled={busy || item.quantity <= 1}
                            onClick={() =>
                              void setQuantity(
                                item.editionId,
                                item.quantity - 1,
                              )
                            }
                          >
                            −
                          </button>{" "}
                          {item.quantity} unidade(s){" "}
                          <button
                            disabled={busy}
                            onClick={() =>
                              void setQuantity(
                                item.editionId,
                                item.quantity + 1,
                              )
                            }
                          >
                            +
                          </button>
                        </>
                      )}{" "}
                      · {item.lineTotalAmount}
                    </p>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void mutate(
                          `/cart/items/${encodeURIComponent(item.editionId)}`,
                          "DELETE",
                        )
                      }
                    >
                      Remover
                    </button>
                  </article>
                ))}
                {cart.bundles.map((bundle) => (
                  <article key={bundle.bundleId}>
                    <h2>{bundle.name}</h2>
                    <ul>
                      {bundle.items.map((item) => (
                        <li key={item.workId}>{item.title}</li>
                      ))}
                    </ul>
                    <p>{money(bundle.priceCents)}</p>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void mutate(
                          `/cart/bundles/${encodeURIComponent(bundle.bundleId)}`,
                          "DELETE",
                        )
                      }
                    >
                      Remover bundle
                    </button>
                  </article>
                ))}
                {cart.items.length === 0 && cart.bundles.length === 0 && (
                  <p>Seu carrinho está vazio.</p>
                )}
              </section>
              <form
                className="inline-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void mutate("/cart/coupon", "POST", { code: coupon });
                }}
              >
                <label>
                  Cupom
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                </label>
                <button disabled={busy}>Aplicar</button>
                <button
                  type="button"
                  onClick={() => void mutate("/cart/coupon", "DELETE")}
                >
                  Remover cupom
                </button>
              </form>
              <p>
                Subtotal {cart.subtotalAmount} · Desconto {cart.discountAmount}{" "}
                · Frete {cart.shippingAmount} ·{" "}
                <strong>Total {cart.totalAmount}</strong>
              </p>
              {cart.couponError && <p role="status">{cart.couponError}</p>}
              {cart.items.some((x) => x.format === "PHYSICAL") && (
                <fieldset className="form-card">
                  <legend>Endereço de entrega</legend>
                  {Object.entries(address).map(([key, value]) => (
                    <label key={key}>
                      {key === "recipientName"
                        ? "Destinatário"
                        : key === "postalCode"
                          ? "CEP"
                          : key}
                      <input
                        required={key !== "complement"}
                        value={value}
                        onChange={(e) =>
                          setAddress((previous) => ({
                            ...previous,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    </label>
                  ))}
                  <button type="button" onClick={() => void quote()}>
                    Calcular frete
                  </button>
                  {shipping && <p role="status">Frete estimado: {shipping}</p>}
                </fieldset>
              )}
              {checkout ? (
                <form onSubmit={(e) => void complete(e)}>
                  <button
                    disabled={
                      busy || (!cart.items.length && !cart.bundles.length)
                    }
                  >
                    {busy ? "Confirmando…" : "Confirmar pedido"}
                  </button>
                </form>
              ) : (
                <Link className="button-link" href="/checkout">
                  Ir para checkout
                </Link>
              )}
            </>
          )}
        </>
      )}
    </Page>
  );
}

export function OrderPage({ tracking = false }: { tracking?: boolean }) {
  const { id } = useParams<{ id: string }>();
  const { token, hydrated } = useCustomerSession();
  const [data, setData] = useState<OrderDetails | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!token) return;
    let active = true;
    void apiRequest<OrderDetails>(
      tracking
        ? `/orders/${encodeURIComponent(id)}/tracking`
        : `/orders/${encodeURIComponent(id)}`,
      { token },
    )
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, token, tracking]);
  async function requestAction(itemId: string, action: "cancel" | "refund") {
    if (!token) return;
    try {
      await apiRequest(`/orders/${encodeURIComponent(id)}/${action}`, {
        token,
        method: "POST",
        body: { orderItemId: itemId, reason },
        idempotencyKey: crypto.randomUUID(),
      });
      setNotice("Solicitação registrada.");
      setError("");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível registrar a solicitação.",
      );
    }
  }
  return (
    <Page title={tracking ? "Rastreamento do pedido" : "Pedido"}>
      {!hydrated ? (
        <p role="status">Restaurando sua sessão…</p>
      ) : !token ? (
        <CustomerLogin />
      ) : (
        <>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          {notice && <p role="status">{notice}</p>}
          {!data ? (
            !error && <p role="status">Carregando pedido…</p>
          ) : (
            <article>
              <h2>{data.id ?? data.orderId}</h2>
              <p>Status: {data.status ?? data.fulfillmentStatus}</p>
              {data.trackingCode && (
                <p>Código de rastreio: {data.trackingCode}</p>
              )}
              <p>Total: {data.totalAmount ?? "—"}</p>
              <ul>
                {data.items?.map((item) => (
                  <li key={item.id ?? item.editionId}>
                    <strong>{item.workTitle}</strong> · {item.quantity ?? 1} ·{" "}
                    {item.format ?? "Digital"}
                    {item.id && !tracking && (
                      <div className="inline-form">
                        <label>
                          Motivo da solicitação
                          <input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                          />
                        </label>
                        <button
                          disabled={!reason.trim()}
                          onClick={() => void requestAction(item.id!, "cancel")}
                        >
                          Solicitar cancelamento
                        </button>
                        <button
                          disabled={!reason.trim()}
                          onClick={() => void requestAction(item.id!, "refund")}
                        >
                          Solicitar reembolso
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {!tracking && (
                <Link href={`/pedidos/${id}/rastreamento`}>
                  Ver rastreamento
                </Link>
              )}
            </article>
          )}
        </>
      )}
    </Page>
  );
}

export function LibraryPage() {
  const { token, hydrated } = useCustomerSession();
  const [items, setItems] = useState<LibraryEntry[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) return;
    let active = true;
    void apiRequest<LibraryEntry[]>("/library", { token })
      .then((data) => {
        if (active) setItems(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [token]);
  async function download(editionId: string) {
    if (!token) return;
    try {
      const result = await apiRequest<{ downloadUrl: string }>(
        `/library/${encodeURIComponent(editionId)}/download`,
        { token, method: "POST", body: { name } },
      );
      window.location.assign(`${API_URL}${result.downloadUrl}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível criar o download.",
      );
    }
  }
  return (
    <Page title="Minha biblioteca">
      {!hydrated ? (
        <p role="status">Restaurando sua sessão…</p>
      ) : !token ? (
        <CustomerLogin />
      ) : (
        <>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <label>
            Nome para marca d’água
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          {items.length === 0 ? (
            <p role="status">Sua biblioteca está vazia.</p>
          ) : (
            <section className="stack">
              {items.map((item) => (
                <article key={item.purchaseItemId}>
                  <h2>{item.title}</h2>
                  <p>
                    Comprado em {displayDate(item.purchasedAt)} · Lançamento{" "}
                    {displayDate(item.releaseAt)}
                  </p>
                  {item.downloadAvailable ? (
                    <button
                      disabled={!name.trim()}
                      onClick={() => void download(item.editionId)}
                    >
                      Gerar download temporário
                    </button>
                  ) : (
                    <p>Download ainda indisponível.</p>
                  )}
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </Page>
  );
}

export function WishlistPage() {
  const { token, hydrated } = useCustomerSession();
  return (
    <Page title="Minha wishlist">
      {!hydrated ? <p role="status">Restaurando sua sessão…</p> : token ? <WishlistPanel token={token} /> : <CustomerLogin />}
    </Page>
  );
}

export function AccountPage() {
  const { token, setToken, hydrated } = useCustomerSession();
  const { setSession } = useDashboardSession();
  const [user, setUser] = useState<Profile | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!token) return;
    let active = true;
    void apiRequest<{ user: Profile }>("/auth/me", { token })
      .then((r) => {
        if (active) setUser(r.user);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [token]);
  async function requestDeletion() {
    if (!token) return;
    try {
      const result = await accountApi.requestAccountDeletion(token, reason);
      setMessage(result.message);
      setToken(null);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível solicitar desativação.",
      );
    }
  }
  async function reactivate() {
    if (!token) return;
    try {
      const result = await accountApi.reactivateAccount(token);
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível reativar.");
    }
  }
  return (
    <Page title="Minha conta">
      {!hydrated ? (
        <p role="status">Restaurando sua sessão…</p>
      ) : !token ? (
        <>
          {message && <p role="status">{message}</p>}
          <CustomerLogin />
        </>
      ) : (
        <>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          {user ? (
            <article>
              <p>{user.email}</p>
              <p>Perfil: {user.role}</p>
              <p>E-mail: {user.isEmailConfirmed ? "Confirmado" : "Pendente"}</p>
              <p>A API atual não permite editar dados do perfil.</p>
            </article>
          ) : (
            <p role="status">Carregando conta…</p>
          )}
          <button onClick={() => void reactivate()}>Reativar conta</button>
          <label>
            Motivo para desativação
            <input value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <button onClick={() => void requestDeletion()}>
            Solicitar desativação
          </button>
          <p>
            <Link href="/minha-conta/pedidos">Histórico de pedidos</Link>
          </p>
          <p>
            A API atual não fornece uma listagem do histórico; pedidos podem ser
            consultados pelo identificador.
          </p>
          <button
            onClick={() => {
              setToken(null);
              setSession(null);
            }}
          >
            Sair
          </button>
        </>
      )}
    </Page>
  );
}

export function CustomerOrderHistoryPage() {
  return (
    <Page title="Histórico de pedidos">
      <p>
        A API atual não possui endpoint para listar os pedidos da conta. Se você
        tiver o identificador de um pedido, pode consultá-lo diretamente.
      </p>
      <ManualOrderLookup />
    </Page>
  );
}
function ManualOrderLookup() {
  const [id, setId] = useState("");
  return (
    <form
      className="inline-form"
      onSubmit={(e) => {
        e.preventDefault();
        window.location.href = `/pedidos/${encodeURIComponent(id)}`;
      }}
    >
      <label>
        Identificador do pedido
        <input value={id} onChange={(e) => setId(e.target.value)} required />
      </label>
      <button>Consultar</button>
    </form>
  );
}
