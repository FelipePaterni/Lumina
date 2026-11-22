"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  FulfillmentStatus,
  WarehouseOrder,
  WarehouseOrderPage,
  WarehouseSummary,
  getWarehouseOrders,
  getWarehouseSummary,
  updateWarehouseOrder,
} from "./warehouse-api";
import styles from "./WarehousePanel.module.css";

interface WarehousePanelProps {
  token: string;
}

const statusLabels: Record<FulfillmentStatus, string> = {
  PENDING: "Aguardando separação",
  PICKING: "Em separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  NOT_REQUIRED: "Não aplicável",
  CANCELLED: "Cancelado",
};

export function WarehousePanel({ token }: WarehousePanelProps): React.ReactElement {
  const [summary, setSummary] = useState<WarehouseSummary | null>(null);
  const [orders, setOrders] = useState<WarehouseOrderPage | null>(null);
  const [page, setPage] = useState(1);
  const [trackingCodes, setTrackingCodes] = useState<Record<string, string>>({});
  const [busyOrder, setBusyOrder] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = async (active: () => boolean = () => true) => {
    try {
      const [nextSummary, nextOrders] = await Promise.all([getWarehouseSummary(token), getWarehouseOrders(token, page)]);
      if (!active()) return;
      setSummary(nextSummary);
      setOrders(nextOrders);
      setError(null);
    } catch (reason) {
      if (!active()) return;
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar o painel de estoque");
    }
  };

  useEffect(() => {
    let active = true;
    void refresh(() => active);
    return () => { active = false; };
  }, [token, page]);

  const transitionOrder = async (event: FormEvent<HTMLFormElement>, order: WarehouseOrder) => {
    event.preventDefault();
    const target = order.fulfillmentStatus === "PENDING" ? "PICKING" : order.fulfillmentStatus === "PICKING" ? "SHIPPED" : "DELIVERED";
    const trackingCode = trackingCodes[order.id]?.trim();
    if (target === "SHIPPED" && !trackingCode) {
      setError("Informe o código de rastreio para enviar o pedido.");
      return;
    }
    setBusyOrder(order.id);
    setError(null);
    setNotice(null);
    try {
      await updateWarehouseOrder(token, order.id, target, trackingCode);
      setNotice(`Pedido atualizado: ${statusLabels[target]}.`);
      setTrackingCodes((values) => ({ ...values, [order.id]: "" }));
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o pedido");
    } finally {
      setBusyOrder(null);
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="warehouse-heading">
      <header className={styles.header}>
        <p className={styles.eyebrow}>OPERAÇÃO DE ESTOQUE</p>
        <h1 id="warehouse-heading">Separação e expedição</h1>
        <p>Acompanhe pedidos físicos, atualize etapas e consulte o rastreio informado manualmente.</p>
      </header>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}

      <div className={styles.metrics} aria-label="Resumo do estoque">
        <Metric label="Aguardando separação" value={summary?.orders.pending} />
        <Metric label="Em separação" value={summary?.orders.picking} />
        <Metric label="Em trânsito" value={summary?.orders.shipped} />
        <Metric label="Unidades físicas" value={summary?.inventory.totalUnits} />
      </div>

      <section className={styles.alerts} aria-labelledby="stock-alerts-heading">
        <h2 id="stock-alerts-heading">Estoque zerado</h2>
        {summary?.alerts.length ? (
          <ul>{summary.alerts.map((alert) => <li key={alert.editionId}>{alert.workTitle} <span>{alert.type === "OUT_OF_STOCK" ? "sem unidades disponíveis" : "estoque não configurado"}</span></li>)}</ul>
        ) : <p>{summary ? "Nenhuma edição física sem estoque." : error ? "Alertas de estoque indisponíveis." : "Carregando alertas…"}</p>}
      </section>

      <section aria-labelledby="orders-heading">
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>FILA DE TRABALHO</p><h2 id="orders-heading">Pedidos físicos</h2></div>
          <span>{orders?.total ?? 0} pedidos ativos</span>
        </div>
        {orders?.items.length ? <div className={styles.orders}>
          {orders.items.map((order) => {
            const next = order.fulfillmentStatus === "PENDING" ? "PICKING" : order.fulfillmentStatus === "PICKING" ? "SHIPPED" : "DELIVERED";
            const address = order.shippingAddress;
            return <article className={styles.order} key={order.id}>
              <div className={styles.orderTop}><strong>Pedido {order.id.slice(0, 8)}</strong><span>{statusLabels[order.fulfillmentStatus]}</span></div>
              <ul>{order.items.map((item, index) => <li key={`${item.workTitle}-${index}`}>{item.quantity} × {item.workTitle}</li>)}</ul>
              {address && <address>{address.recipientName}<br />{address.street}, {address.number}{address.complement ? `, ${address.complement}` : ""}<br />{address.district} · {address.city}/{address.state} · CEP {address.postalCode}<br />Tel. {address.phone}</address>}
              {order.trackingCode && <p className={styles.tracking}>Rastreio: <strong>{order.trackingCode}</strong></p>}
              <form className={styles.transitionForm} onSubmit={(event) => void transitionOrder(event, order)}>
                {next === "SHIPPED" && <label>Código de rastreio<input maxLength={120} value={trackingCodes[order.id] ?? ""} onChange={(event) => setTrackingCodes((values) => ({ ...values, [order.id]: event.target.value }))} required /></label>}
                <button type="submit" disabled={busyOrder === order.id}>{busyOrder === order.id ? "Salvando…" : `Marcar: ${statusLabels[next]}`}</button>
              </form>
            </article>;
          })}
        </div> : <p className={styles.empty}>{orders ? "Não há pedidos físicos pendentes." : error ? "Pedidos indisponíveis." : "Carregando pedidos…"}</p>}
        {orders && orders.total > orders.limit && <nav className={styles.pagination} aria-label="Paginação dos pedidos">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Anterior</button>
          <span>Página {page}</span>
          <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page * orders.limit >= orders.total}>Próxima</button>
        </nav>}
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value?: number }): React.ReactElement {
  return <article className={styles.metric}><span>{label}</span><strong>{value ?? "—"}</strong></article>;
}
