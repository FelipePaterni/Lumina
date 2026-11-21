# TASK-019 — resultado dos testes manuais

Execução: 2026-11-21 11:23:35 UTC
Ambiente: API local; roteiro exige confirmação do banco sintético.
Credenciais, tokens, IDs, e-mails e conteúdo dos pedidos foram omitidos.

| Cenário | Status | Evidência resumida | Falha |
|---|---|---|---|
| MT-019-00 API local e autenticação | APROVADO | API local aceitou as contas de teste. |  |
| MT-019-01 proteção de dados sintéticos | APROVADO | Pedido identificado como fixture sintética TASK019. |  |
| MT-019-02 solicitação e decisão | APROVADO | Fluxo terminou em PROCESSED; pedido REFUNDED; pagamento REFUNDED; reposição de 1 unidade e 1 movimento PHYSICAL_RESTOCK confirmados na base isolada. |  |
| MT-019-03 idempotência | APROVADO | A repetição retornou a solicitação existente. |  |

Revisão humana: APROVADA pelo responsável em 2026-11-21. A reposição foi conferida na base isolada após a aprovação, sem expor IDs.
