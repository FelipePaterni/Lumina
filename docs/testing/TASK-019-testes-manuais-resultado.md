# TASK-019 — resultado dos testes manuais

Execução: 2026-11-21 11:16:03 UTC
Ambiente: API local; roteiro exige confirmação do banco sintético.
Credenciais, tokens, IDs, e-mails e conteúdo dos pedidos foram omitidos.

| Cenário | Status | Evidência resumida | Falha |
|---|---|---|---|
| MT-019-00 API local e autenticação | APROVADO | API local aceitou as contas de teste. |  |
| MT-019-01 proteção de dados sintéticos | APROVADO | Pedido identificado como fixture sintética TASK019. |  |
| MT-019-02 solicitação, decisão e idempotência | REPROVADO | API processou a solicitação, mas a constraint anterior do estado do pagamento rejeitou `REFUNDED`. Nenhum dado de conta ou identificador foi registrado. | Constraint `payments_status_amount_check` incompatível com os novos estados; migration corretiva criada e aguarda reexecução. |

Revisão humana: PENDENTE.
