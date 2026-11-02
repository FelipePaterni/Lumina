"use client";

import { useEffect, useState } from "react";

type Work = { id: string; title: string; slug: string; synopsis: string; author: { name: string }; categories: { category: { name: string } }[]; editions: { format: string; priceCents: number; isVisible: boolean }[] };

export default function Home(): React.ReactElement {
  const [works, setWorks] = useState<Work[]>([]);
  const [search, setSearch] = useState("");
  useEffect(() => { const query = search ? `?search=${encodeURIComponent(search)}` : ""; fetch(`http://localhost:3001/works${query}`).then((response) => response.ok ? response.json() : []).then(setWorks).catch(() => setWorks([])); }, [search]);
  return <main><header><p className="eyebrow">LUMINA LIVROS</p><h1>Encontre sua próxima leitura</h1><p>Obras selecionadas, edições físicas e digitais em um só lugar.</p><input aria-label="Pesquisar por título ou autor" placeholder="Pesquisar título ou autor" value={search} onChange={(event) => setSearch(event.target.value)} /></header><section aria-label="Catálogo" className="catalog-grid">{works.map((work) => <article key={work.id}><div className="cover" aria-hidden="true">{work.title.slice(0, 1)}</div><p className="eyebrow">{work.categories.map(({ category }) => category.name).join(" · ")}</p><h2>{work.title}</h2><p className="author">{work.author.name}</p><p>{work.synopsis}</p><div className="editions">{work.editions.filter((edition) => edition.isVisible).map((edition) => <span key={edition.format}>{edition.format === "DIGITAL" ? "E-book" : "Físico"} · R$ {(edition.priceCents / 100).toFixed(2).replace(".", ",")}</span>)}</div></article>)}</section></main>;
}
