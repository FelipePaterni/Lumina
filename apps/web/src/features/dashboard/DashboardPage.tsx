"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginRequest } from "../auth/services/auth-api";
import {
  AdminDashboard,
  CatalogDashboard,
  DashboardRole,
  DashboardSection,
  getDashboard,
  OperationsDashboard,
  WarehouseDashboard,
} from "./dashboard-api";
import {
  dashboardSectionRoutes,
  dashboardSectionsForRole,
  landingRouteForRole,
} from "./dashboard-navigation";
import { DashboardSession, useDashboardSession } from "./DashboardSessionProvider";
import { sessionsForLogin } from "./session-login";
import { useCustomerSession } from "../v11/CustomerSession";
import styles from "./DashboardPage.module.css";

interface LoginResponse {
  accessToken?: string;
  user?: { role?: DashboardRole };
  message?: string;
}

type DashboardData = AdminDashboard | CatalogDashboard | WarehouseDashboard | OperationsDashboard;

const sectionLabels: Record<DashboardSection, string> = {
  admin: "Visão geral",
  catalog: "Catálogo",
  warehouse: "Estoque",
  operations: "Operação",
};

const roleLabels: Record<DashboardSession["role"], string> = {
  ADMIN: "Administrador",
  CATALOG: "Catálogo",
  STOCK: "Estoque",
};

export function DashboardPage({
  initialSection,
}: {
  initialSection: DashboardSection;
}): React.ReactElement {
  const router = useRouter();
  const { session, setSession } = useDashboardSession();
  const { setToken } = useCustomerSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const section = initialSection;
  const [data, setData] = useState<DashboardData | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableSections = useMemo(
    () => (session ? dashboardSectionsForRole[session.role] : []),
    [session],
  );
  const authorized = availableSections.includes(section);

  useEffect(() => {
    if (!session || !authorized) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const result = await getDashboard<DashboardData>(session.token, section);
        if (active) setData(result);
      } catch (reason) {
        if (active) {
          setError(reason instanceof Error ? reason.message : "Não foi possível carregar o painel.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [authorized, section, session]);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const result = await loginRequest({ email, password }) as LoginResponse;
      const role = result.user?.role;
      if (!result.accessToken || !role) {
        setError(result.message ?? "Não foi possível autenticar.");
        return;
      }
      if (role === "CUSTOMER") {
        const sessions = sessionsForLogin(result.accessToken, role);
        setSession(sessions.staffSession);
        setToken(sessions.customerToken);
        router.replace("/");
        return;
      }
      const sessions = sessionsForLogin(result.accessToken, role);
      setSession(sessions.staffSession);
      setToken(sessions.customerToken);
      const targetRoute = role === "ADMIN"
        ? dashboardSectionRoutes[initialSection]
        : landingRouteForRole(role);
      setPassword("");
      setMessage(null);
      router.replace(targetRoute);
    } catch {
      setError("Não foi possível conectar à API.");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    setSession(null);
    setToken(null);
    setData(null);
    setError(null);
    setMessage("Sessão encerrada.");
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.backLink} href="/">Lumina Livros</a>
        <p className={styles.eyebrow}>OPERAÇÃO LUMINA</p>
        <h1>Painéis da equipe</h1>
        <p>Indicadores operacionais separados por função.</p>
      </header>

      {!session ? (
        <section className={styles.loginCard} aria-labelledby="dashboard-login-heading">
          <h2 id="dashboard-login-heading">Entrar para continuar</h2>
          <p>Use uma conta administrativa, de catálogo ou de estoque.</p>
          <form className={styles.loginForm} onSubmit={(event) => void submitLogin(event)}>
            <label htmlFor="dashboard-email">E-mail</label>
            <input id="dashboard-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="dashboard-password">Senha</label>
            <input id="dashboard-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
          </form>
          {error && <p className={styles.error} role="alert">{error}</p>}
        </section>
      ) : (
        <>
          <div className={styles.sessionBar}>
            <p>Sessão da equipe: <strong>{roleLabels[session.role]}</strong></p>
            <button type="button" className={styles.secondaryButton} onClick={logout}>Sair</button>
          </div>
          {session.role === "ADMIN" && (
            <nav className={styles.tabs} aria-label="Painéis disponíveis">
              {availableSections.map((availableSection) => (
                <Link
                  key={availableSection}
                  href={dashboardSectionRoutes[availableSection]}
                  aria-current={section === availableSection ? "page" : undefined}
                  className={section === availableSection ? styles.activeTab : styles.tab}
                >
                  {sectionLabels[availableSection]}
                </Link>
              ))}
            </nav>
          )}
          {!authorized && (
            <section className={styles.error} role="alert">
              <p>Seu perfil não tem acesso a este painel.</p>
              <Link href={landingRouteForRole(session.role)}>Abrir meu painel</Link>
            </section>
          )}
          {authorized && loading && <p className={styles.status} role="status">Carregando indicadores…</p>}
          {authorized && error && <p className={styles.error} role="alert">{error}</p>}
          {authorized && data && !loading && (
            <section className={styles.dashboard} aria-live="polite">
              {section === "admin" && <AdminPanel data={data as AdminDashboard} />}
              {section === "catalog" && <CatalogPanel data={data as CatalogDashboard} />}
              {section === "warehouse" && <WarehousePanel data={data as WarehouseDashboard} />}
              {section === "operations" && <OperationsPanel data={data as OperationsDashboard} />}
            </section>
          )}
        </>
      )}
      {message && <p className={styles.status} role="status">{message}</p>}
      <p className={styles.sessionNote}>A sessão fica somente nesta página e termina ao sair ou recarregar.</p>
    </main>
  );
}

function AdminPanel({ data }: { data: AdminDashboard }): React.ReactElement {
  return (
    <>
      <div className={styles.metricGrid}>
        <Metric label="Vendas líquidas" value={formatCurrency(data.netSalesCents)} />
        <Metric label="Clientes ativos" value={formatCount(data.activeCustomers)} />
        <Metric label="Pedidos confirmados" value={formatCount(data.confirmedOrders)} />
      </div>
      <section className={styles.listCard} aria-labelledby="bestsellers-heading">
        <h2 id="bestsellers-heading">Top 5 obras por unidades</h2>
        {data.bestsellers.length ? (
          <ol className={styles.ranking}>
            {data.bestsellers.map((work) => <li key={work.workId}><span>{work.workTitle}</span><strong>{formatCount(work.netUnits)}</strong></li>)}
          </ol>
        ) : <p className={styles.empty}>Ainda não há vendas confirmadas.</p>}
      </section>
    </>
  );
}

function CatalogPanel({ data }: { data: CatalogDashboard }): React.ReactElement {
  return (
    <>
      <div className={styles.metricGrid}>
        <Metric label="Edições digitais" value={formatCount(data.licenses.digitalEditionCount)} />
        <Metric label="Licenças alocadas" value={formatCount(data.licenses.allocated)} />
        <Metric label="Disponíveis com limite" value={formatCount(data.licenses.finiteAvailable)} />
        <Metric label="Edições ilimitadas" value={formatCount(data.licenses.unlimitedEditionCount)} />
        <Metric label="Cupons válidos" value={formatCount(data.coupons.availableCount)} />
        <Metric label="Usos restantes dos cupons" value={formatCount(data.coupons.remainingUses)} />
      </div>
      <section className={styles.listCard} aria-labelledby="license-alerts-heading">
        <h2 id="license-alerts-heading">Licenças digitais esgotadas</h2>
        {data.licenses.exhausted.length ? (
          <ul className={styles.alertList}>
            {data.licenses.exhausted.map((edition) => <li key={edition.editionId}><span>{edition.workTitle}</span><strong>{formatCount(edition.allocated)} / {formatCount(edition.limit)}</strong></li>)}
          </ul>
        ) : <p className={styles.empty}>Nenhuma edição digital com limite esgotado.</p>}
      </section>
    </>
  );
}

function WarehousePanel({ data }: { data: WarehouseDashboard }): React.ReactElement {
  return (
    <>
      <div className={styles.metricGrid}>
        <Metric label="Aguardando separação" value={formatCount(data.orders.pending)} />
        <Metric label="Em separação" value={formatCount(data.orders.picking)} />
        <Metric label="Enviados" value={formatCount(data.orders.shipped)} />
        <Metric label="Entregues" value={formatCount(data.orders.delivered)} />
        <Metric label="Unidades físicas" value={formatCount(data.inventory.totalUnits)} />
        <Metric label="Alertas de estoque" value={formatCount(data.inventory.outOfStockCount)} />
      </div>
      <section className={styles.listCard} aria-labelledby="physical-alerts-heading">
        <h2 id="physical-alerts-heading">Edições sem estoque configurado ou zerado</h2>
        {data.alerts.length ? (
          <ul className={styles.alertList}>
            {data.alerts.map((alert) => <li key={alert.editionId}><span>{alert.workTitle}</span><strong>{alert.type === "OUT_OF_STOCK" ? "Sem unidades" : "Estoque não configurado"}</strong></li>)}
          </ul>
        ) : <p className={styles.empty}>Nenhuma edição física sem estoque.</p>}
      </section>
    </>
  );
}

function OperationsPanel({ data }: { data: OperationsDashboard }): React.ReactElement {
  const notificationCounts = data.notifications;
  const deletions = data.accountDeletion;
  return (
    <>
      <div className={styles.metricGrid}>
        <Metric label="API" value={data.health.api === "UP" ? "Disponível" : "Indisponível"} />
        <Metric label="Banco de dados" value={data.health.database === "UP" ? "Disponível" : "Indisponível"} />
        <Metric label="Notificações pendentes" value={notificationCounts ? formatCount(notificationCounts.PENDING) : "Indisponível"} />
        <Metric label="Notificações em processamento" value={notificationCounts ? formatCount(notificationCounts.PROCESSING) : "Indisponível"} />
        <Metric label="Notificações em nova tentativa" value={notificationCounts ? formatCount(notificationCounts.RETRY) : "Indisponível"} />
        <Metric label="Notificações enviadas" value={notificationCounts ? formatCount(notificationCounts.SENT) : "Indisponível"} />
        <Metric label="Notificações com falha" value={notificationCounts ? formatCount(notificationCounts.FAILED) : "Indisponível"} />
        <Metric label="Exclusões no prazo de reativação" value={deletions ? formatCount(deletions.pendingRequests) : "Indisponível"} />
        <Metric label="Prazos vencidos para revisão" value={deletions ? formatCount(deletions.expiredRequests) : "Indisponível"} />
      </div>
      <section className={styles.listCard} aria-labelledby="operations-alerts-heading">
        <h2 id="operations-alerts-heading">Alertas operacionais</h2>
        {data.alerts.failedNotifications === null ? <p className={styles.error}>Não foi possível consultar os dados operacionais.</p> : (
          <ul className={styles.alertList}>
            {data.health.database !== "UP" && <li key="database"><span>Banco de dados</span><strong>Indisponível</strong></li>}
            {data.alerts.failedNotifications > 0 && <li key="failed"><span>Notificações com falha terminal</span><strong>{formatCount(data.alerts.failedNotifications)}</strong></li>}
            {(data.alerts.expiredProcessingLeases ?? 0) > 0 && <li key="lease"><span>Processamentos com lease vencido</span><strong>{formatCount(data.alerts.expiredProcessingLeases ?? 0)}</strong></li>}
            {deletions && deletions.expiredRequests > 0 && <li key="deletions"><span>Solicitações vencidas aguardando revisão</span><strong>{formatCount(deletions.expiredRequests)}</strong></li>}
            {!data.alerts.failedNotifications && !(data.alerts.expiredProcessingLeases ?? 0) && data.health.database === "UP" && (!deletions || deletions.expiredRequests === 0) && <li key="none"><span>Nenhum alerta ativo</span></li>}
          </ul>
        )}
        <p className={styles.empty}>
          Próxima data prevista: {deletions?.nextScheduledDeletionAt ? new Date(deletions.nextScheduledDeletionAt).toLocaleString("pt-BR") : "nenhuma solicitação pendente"}.
          Solicitações vencidas ficam para revisão; este painel não executa exclusões.
        </p>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }): React.ReactElement {
  return <article className={styles.metric}><span>{label}</span><strong>{value}</strong></article>;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valueInCents / 100);
}
