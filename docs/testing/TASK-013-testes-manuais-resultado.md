# TASK-013 — Resultado dos testes manuais

- Execução UTC: 2026-11-20T19:56:38Z
- Alvo: API local 127.0.0.1:3001 e banco local Lumina
- Dados: sintéticos; credenciais, tokens, CPF, endereço e corpos HTTP não são gravados neste relatório
- Limpeza: NÃO NECESSÁRIA; fixtures não criadas

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-013-01 — Autenticação, papel e carrinho vazio | BLOQUEADO | Execução não concluída. |
| MT-013-02 — Pedido digital gratuito e idempotência | BLOQUEADO | Execução não concluída. |
| MT-013-03 — Pedido híbrido e concorrência de estoque/licença | BLOQUEADO | Execução não concluída. |
| MT-013-04 — Concorrência na cota do cupom | BLOQUEADO | Execução não concluída. |

Falha/bloqueio: esta tentativa parou na validação de loopback do roteiro, que chamava `Uri.IsLoopback` como método estático inexistente no PowerShell/.NET usado. Corrigido no commit `9ea5353`; a API local já foi confirmada com HTTP 200 em `/works` e HTTP 401 em `/checkout` sem autenticação. Repita o roteiro atualizado; nenhum cenário foi executado nesta tentativa.

Para preparar ambiente local: npm run db:migrate; docker compose up -d --build api. Em seguida, execute este roteiro novamente.
