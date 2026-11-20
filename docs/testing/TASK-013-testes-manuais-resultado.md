# TASK-013 — Resultado dos testes manuais

- Execução UTC: 2026-11-20T20:03:40Z
- Alvo: API local 127.0.0.1:3001 e banco local Lumina
- Dados: sintéticos; credenciais, tokens, CPF, endereço e corpos HTTP não são gravados neste relatório
- Limpeza: CONFIRMADA

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-013-01 — Autenticação, papel e carrinho vazio | APROVADO | ADMIN 403; chave ausente 400; carrinho vazio 409. |
| MT-013-02 — Pedido digital gratuito e idempotência | APROVADO | Pedido de R$ 0,00 sem pagamento; repetição devolveu o mesmo pedido. |
| MT-013-03 — Pedido híbrido e concorrência de estoque/licença | APROVADO | Uma confirmação 201 e um conflito 409; estoque 0, licença alocada 1 e um pedido híbrido. |
| MT-013-04 — Concorrência na cota do cupom | BLOQUEADO | Execução não concluída. |

Falha/bloqueio: Falha na etapa MT-013-04 (RuntimeException); confira o serviço local e repita sem compartilhar credenciais ou conteúdo HTTP.

Para preparar ambiente local: npm run db:migrate; docker compose up -d --build api. Em seguida, execute este roteiro novamente.
