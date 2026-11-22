"use client";

import Link from "next/link";
import { useCustomerSession } from "./CustomerSession";
import { useDashboardSession } from "../dashboard/DashboardSessionProvider";

export function SiteNavigation() {
  const { token, setToken } = useCustomerSession();
  const { session } = useDashboardSession();
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
        <Link href="/dashboard">Equipe</Link>
        {session && <Link href="/admin/catalogo">Administração</Link>}
        {token ? (
          <button
            type="button"
            className="nav-button"
            onClick={() => setToken(null)}
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
