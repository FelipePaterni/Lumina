# TASK-011 — Resultado dos testes manuais

Data de geração: 2026-11-20; resultados fornecidos pelo responsável humano para MT-011-01 a MT-011-03. Cenários restantes não executados.

| ID | Cenário | Status | Evidência sanitizada | Falhas |
|---|---|---|---|---|
| MT-011-01 | Catálogo sem autenticação | APROVADO | `GET /works` sem Authorization retornou HTTP 200 em 2026-11-20 | Nenhuma |
| MT-011-02 | Operação de catálogo por papel não autorizado | APROVADO | PATCH `/works/<uuid-inexistente>` com token CUSTOMER válido retornou HTTP 403; corpo vazio e ID inexistente evitaram mutação | Nenhuma |
| MT-011-03 | Busca, filtros e paginação | BLOQUEADO | GET `/works?search=Quiet%20Observatory&page=1&limit=1` retornou total 1/totalPages 1; página 2 retornou sem itens e manteve total 1 | Busca/paginação verificadas; falta evidência do filtro de idioma e exclusão de obra oculta |
| MT-011-04 | Inventário por papel | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |
| MT-011-05 | Original digital privado | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |
| MT-011-06 | Wishlist isolada | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |
| MT-011-07 | Índices e plano de consulta | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |

Aprovação humana do relatório completo: PENDENTE. Não inclua senhas, tokens, PII, conteúdo original ou valores de storageKey.
