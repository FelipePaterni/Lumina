# TASK-011 — Resultado dos testes manuais

Data de geração: 2026-11-20; resultados fornecidos pelo responsável humano para MT-011-01 a MT-011-03. Cenários restantes não executados.

| ID | Cenário | Status | Evidência sanitizada | Falhas |
|---|---|---|---|---|
| MT-011-01 | Catálogo sem autenticação | APROVADO | `GET /works` sem Authorization retornou HTTP 200 em 2026-11-20 | Nenhuma |
| MT-011-02 | Operação de catálogo por papel não autorizado | BLOQUEADO | POST `/works` com placeholder `<token-sintetico>` retornou HTTP 401; não houve teste de autorização CUSTOMER nem confirmação de estado | Token placeholder inválido; repetir com token CUSTOMER sintético válido e confirmar HTTP 403 |
| MT-011-03 | Busca, filtros e paginação | BLOQUEADO | GET `/works?search=synthetic&language=pt-BR&page=1&limit=10` retornou HTTP 200 e lista vazia | Sem obra correspondente, não validou filtros, paginação nem exclusão de obra oculta; repetir com fixtures sintéticas existentes |
| MT-011-04 | Inventário por papel | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |
| MT-011-05 | Original digital privado | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |
| MT-011-06 | Wishlist isolada | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |
| MT-011-07 | Índices e plano de consulta | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |

Aprovação humana do relatório completo: PENDENTE. Não inclua senhas, tokens, PII, conteúdo original ou valores de storageKey.
