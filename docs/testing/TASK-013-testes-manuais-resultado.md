# TASK-013 — Resultado dos testes manuais

- Execução UTC: 2026-11-20T19:37:46Z
- Alvo: API local localhost:3001 e banco local Lumina
- Dados: sintéticos; credenciais, tokens, CPF, endereço e corpos HTTP não são gravados neste relatório
- Limpeza: NÃO NECESSÁRIA; fixtures não criadas

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-013-01 — Autenticação, papel e carrinho vazio | BLOQUEADO | O runner Codex não abriu conexão loopback ao host. |
| MT-013-02 — Pedido digital gratuito e idempotência | BLOQUEADO | O runner Codex não abriu conexão loopback ao host. |
| MT-013-03 — Pedido híbrido e concorrência de estoque/licença | BLOQUEADO | O runner Codex não abriu conexão loopback ao host. |
| MT-013-04 — Concorrência na cota do cupom | BLOQUEADO | O runner Codex não abriu conexão loopback ao host. |

Falha/bloqueio: o runner do Codex recebeu erro de permissão de socket ao acessar localhost:3001. A API respondeu HTTP 200 em `/works` e HTTP 401 em `/checkout` sem autenticação quando consultada de dentro do contêiner. Nenhuma fixture foi criada nesta tentativa. Execute o roteiro no PowerShell local do Windows para concluir os cenários; não compartilhe credenciais nem conteúdo HTTP.

Para preparar ambiente local: npm run db:migrate; docker compose up -d --build api. Em seguida, execute este roteiro novamente.
