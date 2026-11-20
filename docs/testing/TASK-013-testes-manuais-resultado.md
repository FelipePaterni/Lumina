# TASK-013 — Resultado dos testes manuais

- Execução UTC: 2026-11-20T19:41:45Z
- Alvo: API local localhost:3001 e banco local Lumina
- Dados: sintéticos; credenciais, tokens, CPF, endereço e corpos HTTP não são gravados neste relatório
- Limpeza: NÃO NECESSÁRIA; fixtures não criadas

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-013-01 — Autenticação, papel e carrinho vazio | BLOQUEADO | Execução não concluída. |
| MT-013-02 — Pedido digital gratuito e idempotência | BLOQUEADO | Execução não concluída. |
| MT-013-03 — Pedido híbrido e concorrência de estoque/licença | BLOQUEADO | Execução não concluída. |
| MT-013-04 — Concorrência na cota do cupom | BLOQUEADO | Execução não concluída. |

Falha/bloqueio: Falha na etapa verificar API local; consulte os pré-requisitos e repita sem compartilhar credenciais ou conteúdo HTTP.

Para preparar ambiente local: npm run db:migrate; docker compose up -d --build api. Em seguida, execute este roteiro novamente.
