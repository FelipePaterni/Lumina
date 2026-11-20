# TASK-011 — Resultado dos testes manuais

Data de geração: 2026-11-20; resultados fornecidos pelo responsável humano para MT-011-01 a MT-011-03. Cenários restantes não executados.

| ID | Cenário | Status | Evidência sanitizada | Falhas |
|---|---|---|---|---|
| MT-011-01 | Catálogo sem autenticação | APROVADO | `GET /works` sem Authorization retornou HTTP 200 em 2026-11-20 | Nenhuma |
| MT-011-02 | Operação de catálogo por papel não autorizado | APROVADO | PATCH `/works/<uuid-inexistente>` com token CUSTOMER válido retornou HTTP 403; corpo vazio e ID inexistente evitaram mutação | Nenhuma |
| MT-011-03 | Busca, filtros e paginação | APROVADO | Busca encontrou 1 resultado; página 2 vazia com total 1; filtro combinado com idioma `en-US` manteve o resultado. Exclusão de obra oculta coberta pela aprovação manual MT-007-06 em `TASK-007-testes-manuais-resultado.md` | Nenhuma |
| MT-011-04 | Inventário por papel | APROVADO | `GET /inventory/<edição-sintética>` retornou HTTP 403 com token CUSTOMER e HTTP 200 com token ADMIN; nenhuma mutação foi realizada | Nenhuma |
| MT-011-05 | Original digital privado | BLOQUEADO | Consulta sem token retornou HTTP 401. Consulta autenticada à primeira edição digital retornou HTTP 404 (ativo não cadastrado); verificação posterior de `$null` não é evidência válida de ausência dos campos | Há ativos digitais existentes no banco local; repetir consulta autenticada em edição que já possua ativo e verificar resposta não nula sem `storageKey`/`contentBase64` |
| MT-011-06 | Wishlist isolada | APROVADO | Isolamento entre clientes, recusa de remoção por terceiro e preservação do item já aprovados nos cenários MT-010-05–07 em `TASK-010-testes-manuais-resultado.md`, com aprovação humana em 2026-11-20 | Nenhuma; evidência manual de TASK-010 reutilizada por cobrir os mesmos critérios |
| MT-011-07 | Índices e plano de consulta | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |

Aprovação humana do relatório completo: PENDENTE. Não inclua senhas, tokens, PII, conteúdo original ou valores de storageKey.
