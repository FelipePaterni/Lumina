"use client";

import { useEffect, useState } from "react";
import { CheckoutPanel } from "../src/features/checkout/CheckoutPanel";
import { API_URL } from "../src/features/auth/services/auth-api";

type Work = { id: string; title: string; slug: string; synopsis: string; author: { name: string }; categories: { category: { name: string } }[]; editions: { id: string; format: string; priceCents: number; isVisible: boolean }[]; averageRating: number | null; reviewCount: number };

export default function Home(): React.ReactElement {
  const [works, setWorks] = useState<Work[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams({ page: String(page), limit: "12" });
    if (search) query.set("search", search);
    if (sort) query.set("sort", sort);
    setLoading(true);
    setLoadError(false);
    fetch(`${API_URL}/works?${query}`)
      .then((response) => {
        if (!response.ok) throw new Error("Catalog request failed");
        return response.json();
      })
      .then((result) => { if (active) setWorks(result.items ?? []); })
      .catch(() => { if (active) { setWorks([]); setLoadError(true); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, page, sort]);
  return <main><header><p className="eyebrow">LUMINA LIVROS</p><h1>Encontre sua próxima leitura</h1><p>Obras selecionadas, edições físicas e digitais em um só lugar.</p><a href="/dashboard">Painéis da equipe</a><input aria-label="Pesquisar por título ou autor" placeholder="Pesquisar título ou autor" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /><label htmlFor="catalog-sort">Ordenar por</label><select id="catalog-sort" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="">Mais recentes</option><option value="BEST_SELLING">Mais vendidos</option><option value="TOP_RATED">Melhor avaliados</option></select></header>{loadError && <p role="alert">Não foi possível carregar o catálogo. Tente novamente.</p>}{loading && <p role="status">Carregando catálogo…</p>}<section aria-label="Catálogo" className="catalog-grid">{works.map((work) => <article key={work.id}><div className="cover" aria-hidden="true">{work.title.slice(0, 1)}</div><p className="eyebrow">{work.categories.map(({ category }) => category.name).join(" · ")}</p><h2>{work.title}</h2><p className="author">{work.author.name}</p><p>{work.synopsis}</p><p aria-label="Avaliação">{work.averageRating === null ? "Sem avaliações" : `★ ${work.averageRating.toFixed(1)} (${work.reviewCount})`}</p><div className="editions">{work.editions.filter((edition) => edition.isVisible).map((edition) => <span key={edition.format}>{edition.format === "DIGITAL" ? "E-book" : "Físico"} · R$ {(edition.priceCents / 100).toFixed(2).replace(".", ",")}</span>)}</div></article>)}</section>{!loading && !loadError && works.length === 0 && <p role="status">Nenhuma obra encontrada.</p>}<nav aria-label="Paginação" className="pagination"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Anterior</button><span>Página {page}</span><button type="button" onClick={() => setPage((value) => value + 1)} disabled={works.length < 12}>Próxima</button></nav><CheckoutPanel works={works} /></main>;
}
