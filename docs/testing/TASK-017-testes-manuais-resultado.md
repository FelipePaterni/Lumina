# TASK-017 — Resultado dos testes manuais

- Execução UTC: 2026-11-21T00:08:58Z
- Alvo: API local localhost:3001
- Dados: contas e compra sintéticas; credenciais, tokens, nome, e-mail, conteúdo e respostas HTTP não são registrados
- Revisão humana: APROVADA em 2026-11-21T00:10:24Z; a captura revisada mostra os três campos da marca d'água legíveis. Valores pessoais e a imagem não foram copiados para este relatório.

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-017-01 — Biblioteca lista compra digital do cliente | APROVADO | GET /library 200; edição comprada presente. |
| MT-017-02 — Isolamento impede acesso por outro cliente | APROVADO | POST de edição alheia respondeu 404. |
| MT-017-03 — Admin não acessa biblioteca de cliente | APROVADO | GET /library para ADMIN respondeu 403. |
| MT-017-04 — Link temporário renovável baixa cópia personalizada | APROVADO | Dois links baixaram a cópia PDF; responsável inspecionou e aprovou nome, e-mail e identificador de compra legíveis. |

Pré-requisitos: API local iniciada, edição digital lançada com compra sintética confirmada e três contas locais. Consulte `tests/manual/task-017/README.md`.

Resultado humano: APROVADO. O responsável conferiu a cópia PDF gerada e confirmou que os três campos de personalização estavam visíveis/legíveis. Nenhum valor de nome, e-mail, identificador ou arquivo foi anexado ao relatório.
