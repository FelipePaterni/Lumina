# TASK-013 — Resultado dos testes manuais

- Execução UTC: 2026-11-20T20:08:56Z
- Alvo: API local 127.0.0.1:3001 e banco local Lumina
- Dados: sintéticos; credenciais, tokens, CPF, endereço e corpos HTTP não são gravados neste relatório
- Limpeza: CONFIRMADA

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-013-01 — Autenticação, papel e carrinho vazio | APROVADO | ADMIN 403; chave ausente 400; carrinho vazio 409. |
| MT-013-02 — Pedido digital gratuito e idempotência | APROVADO | Pedido de R$ 0,00 sem pagamento; repetição devolveu o mesmo pedido. |
| MT-013-03 — Pedido híbrido e concorrência de estoque/licença | APROVADO | Uma confirmação 201 e um conflito 409; estoque 0, licença alocada 1 e um pedido híbrido. |
| MT-013-04 — Concorrência na cota do cupom | BLOQUEADO | Execução não concluída. |

Falha/bloqueio: a inclusão do item passou (HTTP 201), mas aplicar o cupom retornou HTTP 404. A fixture gravava o código em minúsculas, enquanto a API normaliza o código para maiúsculas antes da busca. Corrigido na fixture para persistir o mesmo formato; nenhum cenário de concorrência do cupom foi executado nesta tentativa.

Para preparar ambiente local: npm run db:migrate; docker compose up -d --build api. Em seguida, execute este roteiro novamente.
