"use client";

import { useEffect, useState } from "react";
import type { CartView } from "./cart-api";
import {
  addCartItem,
  applyCartCoupon,
  getCart,
  loginRequest,
  quoteCartShipping,
  removeCartCoupon,
  removeCartItem,
} from "./cart-api";
import { useCustomerSession } from "../v11/CustomerSession";

interface EditionOption { id: string; format: string; priceCents: number; isVisible: boolean }
interface WorkOption { id: string; title: string; editions: EditionOption[] }

const initialAddress = {
  recipientName: "", cpf: "", phone: "", postalCode: "", street: "", number: "",
  complement: "", district: "", city: "", state: "",
};

export function CheckoutPanel({ works }: { works: WorkOption[] }) {
  const { token, setToken, hydrated } = useCustomerSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cart, setCart] = useState<CartView | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [address, setAddress] = useState(initialAddress);
  const [shipping, setShipping] = useState<{ shippingAmount: string; totalAmount: string; physicalQuantity: number } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    getCart(token).then(setCart).catch((error: Error) => setMessage(error.message));
  }, [token]);

  async function run(action: () => Promise<CartView>) {
    setBusy(true);
    setMessage("");
    setShipping(null);
    try { setCart(await action()); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o carrinho"); }
    finally { setBusy(false); }
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = await loginRequest({ email, password });
      if (typeof result.accessToken !== "string") throw new Error(typeof result.message === "string" ? result.message : "Falha ao autenticar");
      if (result.user?.role !== "CUSTOMER") throw new Error("Entre com uma conta de cliente para acessar o carrinho.");
      setPassword("");
      setToken(result.accessToken);
      setMessage("Sessão ativa nesta aba até você sair ou o acesso expirar.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível autenticar"); }
    finally { setBusy(false); }
  }

  async function calculateShipping(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setBusy(true);
    setMessage("");
    try { setShipping(await quoteCartShipping(token, address)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível calcular o frete"); }
    finally { setBusy(false); }
  }

  return (
    <section aria-labelledby="cart-heading" style={{ marginTop: "3rem", padding: "1.5rem", background: "#fffdf9", border: "1px solid #e5ddd2" }}>
      <p className="eyebrow">SUA SELEÇÃO</p>
      <h2 id="cart-heading">Carrinho</h2>
      {!hydrated ? (
        <p role="status">Restaurando sua sessão…</p>
      ) : !token ? (
        <form onSubmit={signIn} style={{ display: "grid", gap: ".75rem", maxWidth: 520 }}>
          <p>Entre com uma conta de cliente para manter seu carrinho.</p>
          <label>E-mail<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Senha<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          <button type="submit" disabled={busy}>Entrar</button>
        </form>
      ) : (
        <>
          <button type="button" onClick={() => { setToken(null); setCart(null); setShipping(null); setMessage("Sessão encerrada."); }}>Sair</button>
          <div style={{ display: "grid", gap: ".75rem", margin: "1rem 0" }}>
            {works.map((work) => work.editions.filter((edition) => edition.isVisible).map((edition) => (
              <div key={edition.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
                <span>{work.title} · {edition.format === "DIGITAL" ? "E-book" : "Físico"} · R$ {(edition.priceCents / 100).toFixed(2).replace(".", ",")}</span>
                <button type="button" disabled={busy} onClick={() => void run(() => addCartItem(token, edition.id))}>Adicionar</button>
              </div>
            ))) }
          </div>
          <ul aria-label="Itens no carrinho">
            {cart?.items.map((item) => (
              <li key={item.editionId}>
                {item.workTitle} · {item.format === "DIGITAL" ? "E-book" : `${item.quantity} físico(s)`} · {item.lineTotalAmount}
                <button type="button" disabled={busy} onClick={() => void run(() => removeCartItem(token, item.editionId))}>Remover</button>
              </li>
            ))}
          </ul>
          {cart && <p>Subtotal {cart.subtotalAmount} · Desconto {cart.discountAmount} · Frete {cart.shippingAmount} · <strong>Total {shipping?.totalAmount ?? cart.totalAmount}</strong></p>}
          <form onSubmit={(event) => { event.preventDefault(); void run(() => applyCartCoupon(token, couponCode)); }} style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            <label>Cupom<input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} maxLength={40} /></label>
            <button type="submit" disabled={busy || !couponCode}>Aplicar cupom</button>
            {(cart?.coupon || cart?.couponError) && <button type="button" disabled={busy} onClick={() => void run(() => removeCartCoupon(token))}>Remover cupom</button>}
          </form>
          {cart?.couponError && <p role="status">{cart.couponError}. Remova o cupom ou aplique outro.</p>}
          {cart?.items.some((item) => item.format === "PHYSICAL") && (
            <form onSubmit={calculateShipping} style={{ display: "grid", gap: ".65rem", maxWidth: 640, marginTop: "1.5rem" }}>
              <h3>Calcular frete</h3>
              {([
                ["recipientName", "Nome do destinatário"], ["cpf", "CPF"], ["phone", "Telefone"],
                ["postalCode", "CEP"], ["street", "Rua"], ["number", "Número"], ["complement", "Complemento (opcional)"],
                ["district", "Bairro"], ["city", "Cidade"], ["state", "UF"],
              ] as const).map(([key, label]) => (
                <label key={key}>{label}<input required={key !== "complement"} maxLength={key === "cpf" ? 14 : undefined} value={address[key]} onChange={(event) => setAddress({ ...address, [key]: event.target.value })} /></label>
              ))}
              <button type="submit" disabled={busy}>Calcular</button>
            </form>
          )}
          {shipping && <p role="status">Frete: {shipping.shippingAmount} · Quantidade física: {shipping.physicalQuantity}</p>}
          <p>O resumo é recalculado pelo servidor. Nenhum pedido é confirmado nesta etapa.</p>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
