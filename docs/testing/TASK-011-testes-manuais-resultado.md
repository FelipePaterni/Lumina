# TASK-011 — Resultado dos testes manuais

Data de geração: 2026-11-20; resultados fornecidos pelo responsável humano para MT-011-01 a MT-011-03. Cenários restantes não executados.

| ID | Cenário | Status | Evidência sanitizada | Falhas |
|---|---|---|---|---|
| MT-011-01 | Catálogo sem autenticação | APROVADO | `GET /works` sem Authorization retornou HTTP 200 em 2026-11-20 | Nenhuma |
| MT-011-02 | Operação de catálogo por papel não autorizado | APROVADO | PATCH `/works/<uuid-inexistente>` com token CUSTOMER válido retornou HTTP 403; corpo vazio e ID inexistente evitaram mutação | Nenhuma |
| MT-011-03 | Busca, filtros e paginação | BLOQUEADO | Busca encontrou 1 resultado; página 2 vazia com total 1; filtro combinado com idioma `en-US` manteve o resultado | Falta evidência de que obra oculta não aparece; aprovar se fixture oculta sintética estiver disponível |
| MT-011-04 | Inventário por papel | BLOQUEADO | `GET /inventory/<edição-sintética>` com token CUSTOMER retornou HTTP 403 | Falta confirmar leitura autorizada ADMIN/STOCK HTTP 200; nenhuma mutação foi realizada |
| MT-011-05 | Original digital privado | BLOQUEADO | `GET /catalog/assets/<edição-digital-sintética>` sem token retornou HTTP 401 | Falta consultar com ADMIN/CATALOG e confirmar ausência de `storageKey`/`contentBase64` na resposta; inspeção de rotas não substitui esta evidência HTTP |
| MT-011-06 | Wishlist isolada | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |
| MT-011-07 | Índices e plano de consulta | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |

Aprovação humana do relatório completo: PENDENTE. Não inclua senhas, tokens, PII, conteúdo original ou valores de storageKey.
