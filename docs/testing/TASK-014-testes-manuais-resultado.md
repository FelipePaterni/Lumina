# TASK-014 — Resultado dos testes manuais

- Execução UTC: 2026-11-20T20:57:11Z
- Revisão humana: APROVADA pelo responsável em 2026-11-20
- Alvo: API local 127.0.0.1:3001 e banco local Lumina
- Dados: sintéticos; credenciais, tokens, destinatários, conteúdo de e-mail e corpos HTTP não são registrados
- Limpeza: CONFIRMADA

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-014-01 — Recuperação de senha e anti-enumeração | APROVADO | Respostas anti-enumeração iguais; notificação de recuperação registrada como SENT com uma tentativa. |
| MT-014-02 — Notificações de exclusão e reativação de conta | APROVADO | Solicitação e reativação confirmadas; duas notificações SENT por evento (cliente/admin), sem eventos pendentes. |
| MT-014-03 — Pedido confirmado, replay idempotente e autorização | APROVADO | Acesso sem token 401; pedido gratuito confirmado e replay idempotente; uma notificação SENT. |

Pré-requisitos locais: npm run db:migrate; docker compose up -d --build api. Execute este roteiro novamente no PowerShell do Windows.
