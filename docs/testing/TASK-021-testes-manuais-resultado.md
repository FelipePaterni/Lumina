# TASK-021 — resultado dos testes manuais

Execução: 2026-11-21 13:14:57 UTC
Ambiente: API local em loopback e banco sintético lumina_task009_test.
Credenciais, tokens, IDs, endereços e conteúdo dos pedidos foram omitidos.

| Cenário | Status | Evidência resumida | Falha |
|---|---|---|---|
| MT-021-00 — API local e autenticação dos papéis | APROVADO | API local autenticou estoque, Admin e dois clientes sintéticos. |  |
| MT-021-01 — fila, movimentos e alerta de estoque zerado | APROVADO | Estoque/Admin consultaram a fila; o movimento sintético e alerta de estoque zero foram encontrados. |  |
| MT-021-02 — transições, rastreio e avisos únicos | APROVADO | Três transições válidas geraram histórico, rastreio e avisos enviados no outbox. |  |
| MT-021-03 — pré-venda não pode ser enviada antes do lançamento | APROVADO | API recusou o envio antecipado sem alterar o status nem a trilha. |  |
| MT-021-04 — cliente consulta o próprio rastreio | APROVADO | Cliente dono do pedido recebeu o rastreio sintético. |  |
| MT-021-05 — autorização e isolamento entre clientes | APROVADO | Cliente não alterou logística nem consultou pedido de outro cliente. |  |

Revisão humana: PENDENTE.
