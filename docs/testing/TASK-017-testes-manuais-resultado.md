# TASK-017 — Resultado dos testes manuais

- Execução UTC: 2026-11-20T23:57:19Z
- Alvo: API local localhost:3001
- Dados: contas e compra sintéticas; credenciais, tokens, nome, e-mail, conteúdo e respostas HTTP não são registrados
- Revisão humana: PENDENTE

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-017-01 — Biblioteca lista compra digital do cliente | BLOQUEADO | A compra consta no banco isolado; o runner colapsou a resposta JSON de um item e foi corrigido. Aguardando repetição. |
| MT-017-02 — Isolamento impede acesso por outro cliente | APROVADO | POST de edição alheia respondeu 404. |
| MT-017-03 — Admin não acessa biblioteca de cliente | APROVADO | GET /library para ADMIN respondeu 403. |
| MT-017-04 — Link temporário renovável baixa cópia personalizada | BLOQUEADO | Execução interrompida antes do cenário. |

Falha/bloqueio: Falso negativo do parser PowerShell em resposta JSON de um único item; MT-017-04 não foi alcançado. Runner corrigido; repetir a execução.

Pré-requisitos: API local iniciada, edição digital lançada com compra sintética confirmada e três contas locais. Consulte `tests/manual/task-017/README.md`.
