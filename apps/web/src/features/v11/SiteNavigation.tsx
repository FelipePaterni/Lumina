"use client";

import Link from "next/link";
import { useCustomerSession } from "./CustomerSession";
import { useDashboardSession } from "../dashboard/DashboardSessionProvider";

export function SiteNavigation() {
  const { token, setToken, hydrated } = useCustomerSession();
  const { session, setSession } = useDashboardSession();
  return (
    <nav className="site-nav" aria-label="Navegação principal">
      <Link className="brand" href="/">
        Lumina Livros
      </Link>
      <div className="site-links">
        <Link href="/bundles">Bundles</Link>
        <Link href="/wishlist">Wishlist</Link>
        <Link href="/biblioteca">Biblioteca</Link>
        <Link href="/minha-conta">Minha conta</Link>
        <Link href="/carrinho">Carrinho</Link>
        {hydrated && !token && <Link href="/dashboard">Equipe</Link>}
        {!token && session &&
          (session.role === "ADMIN" || session.role === "CATALOG") && (
            <Link href="/admin/catalogo">Administração</Link>
          )}
        {!token && session && (session.role === "ADMIN" || session.role === "STOCK") && (
          <Link href="/warehouse/inventory">Estoque</Link>
        )}
        {!hydrated ? null : token ? (
          <button
            type="button"
            className="nav-button"
            onClick={() => {
              setToken(null);
              setSession(null);
            }}
          >
            Sair
          </button>
        ) : (
          <Link href="/entrar">Entrar</Link>
        )}
      </div>
    </nav>
  );
}
