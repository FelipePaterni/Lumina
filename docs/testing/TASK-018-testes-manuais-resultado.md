# TASK-018 — Resultado dos testes manuais

- Execução UTC: 2026-11-21T01:21:48Z
- Alvo: API local localhost:3002
- Dados: somente obras, bundles, contas e compras sintéticas; credenciais, tokens, e-mails e identificadores não são registrados
- Revisão humana: PENDENTE

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-018-01 — Composição única e controle de acesso de catálogo | APROVADO | Composição invertida respondeu 409; papel CUSTOMER respondeu 403. |
| MT-018-02 — Bundle cobra preço não negativo e concede itens separadamente | APROVADO | Checkout confirmou subtotal não negativo e 3 edições em linhas separadas. |
| MT-018-03 — Posse parcial ajusta preço e composição integralmente possuída é recusada | APROVADO | Posse parcial recalculou o preço sem valor negativo; posse total respondeu 409. |
| MT-018-04 — Pré-venda mostra liberação somente na data de lançamento | APROVADO | Pedido sinalizou PREORDER antes do lançamento e RELEASED na data ou depois. |

Pré-requisitos: API local conectada exclusivamente ao banco isolado `lumina_task009_test`; duas contas CUSTOMER sintéticas com carrinhos vazios e sem posse dos e-books informados; obras têm edição digital visível e inventário configurado. O runner prepara compras sintéticas para os cenários de posse parcial e total.
