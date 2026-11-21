# TASK-017 — Resultado dos testes manuais

- Execução UTC: 2026-11-21T00:06:51Z
- Alvo: API local localhost:3001
- Dados: contas e compra sintéticas; credenciais, tokens, nome, e-mail, conteúdo e respostas HTTP não são registrados
- Revisão humana: PENDENTE

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-017-01 — Biblioteca lista compra digital do cliente | APROVADO | GET /library 200; edição comprada presente. |
| MT-017-02 — Isolamento impede acesso por outro cliente | APROVADO | POST de edição alheia respondeu 404. |
| MT-017-03 — Admin não acessa biblioteca de cliente | APROVADO | GET /library para ADMIN respondeu 403. |
| MT-017-04 — Link temporário renovável baixa cópia personalizada | BLOQUEADO | Segundo link respondeu 200; falha ao salvar o primeiro download pelo `Invoke-WebRequest`. Runner atualizado para salvar bytes com `HttpClient`; repetir este cenário. |

Pré-requisitos: API local iniciada, edição digital lançada com compra sintética confirmada e três contas locais. Consulte `tests/manual/task-017/README.md`.
