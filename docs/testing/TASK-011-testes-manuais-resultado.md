# TASK-011 — Resultado dos testes manuais

Data de geração: 2026-11-20; resultados fornecidos pelo responsável humano para MT-011-01 a MT-011-03. Cenários restantes não executados.

| ID | Cenário | Status | Evidência sanitizada | Falhas |
|---|---|---|---|---|
| MT-011-01 | Catálogo sem autenticação | APROVADO | `GET /works` sem Authorization retornou HTTP 200 em 2026-11-20 | Nenhuma |
| MT-011-02 | Operação de catálogo por papel não autorizado | APROVADO | PATCH `/works/<uuid-inexistente>` com token CUSTOMER válido retornou HTTP 403; corpo vazio e ID inexistente evitaram mutação | Nenhuma |
| MT-011-03 | Busca, filtros e paginação | APROVADO | Busca encontrou 1 resultado; página 2 vazia com total 1; filtro combinado com idioma `en-US` manteve o resultado. Exclusão de obra oculta coberta pela aprovação manual MT-007-06 em `TASK-007-testes-manuais-resultado.md` | Nenhuma |
| MT-011-04 | Inventário por papel | APROVADO | `GET /inventory/<edição-sintética>` retornou HTTP 403 com token CUSTOMER e HTTP 200 com token ADMIN; nenhuma mutação foi realizada | Nenhuma |
| MT-011-05 | Original digital privado | APROVADO | Sem token, GET do ativo respondeu HTTP 401; com ADMIN, GET de uma edição digital com ativo respondeu HTTP 200 e a resposta não continha `storageKey` nem `contentBase64` | Nenhuma |
| MT-011-06 | Wishlist isolada | APROVADO | Isolamento entre clientes, recusa de remoção por terceiro e preservação do item já aprovados nos cenários MT-010-05–07 em `TASK-010-testes-manuais-resultado.md`, com aprovação humana em 2026-11-20 | Nenhuma; evidência manual de TASK-010 reutilizada por cobrir os mesmos critérios |
| MT-011-07 | Índices e plano de consulta | APROVADO | No banco isolado, fixture de 10.000 obras/edições: busca por texto/data fez Seq Scan em works/authors e top-N sort, 14,655 ms; faixa seletiva de preço usou `editions_price_cents_idx` e `works_pkey`, 0,160 ms. `ROLLBACK` confirmou `synthetic_rows_remaining = 0`. O responsável revisou e aprovou a adequação para o escopo atual em 2026-11-20 | Otimização textual pode ser reavaliada antes de ampliar a escala; nenhuma alteração de schema foi autorizada nesta TASK |

Aprovação humana do relatório completo/GATE-005: APROVADA em 2026-11-20. Não inclua senhas, tokens, PII, conteúdo original ou valores de storageKey.
