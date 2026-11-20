# TASK-015 — Resultado dos testes manuais

- Execução UTC: 2026-11-20T21:39:06Z
- Endpoint informado: localhost:3001
- Revisão humana: CONFIRMADA
- Dados: somente dados sintéticos nos roteiros predecessores
- Credenciais/tokens: usados apenas em memória pelos roteiros predecessores; não copiados para este relatório

| Cenário | Estado | Evidência resumida |
|---|---|---|
| MT-015-01 — Compra digital gratuita | APROVADO | Relatório sanitizado recente de TASK-013 aprovado e revisão humana confirmada. |
| MT-015-02 — Compra híbrida paga | APROVADO | Relatório sanitizado recente de TASK-013 aprovado e revisão humana confirmada. |
| MT-015-03 — Concorrência de estoque e cupom | APROVADO | Relatório sanitizado recente de TASK-013 aprovado e revisão humana confirmada. |
| MT-015-04 — Notificação e replay idempotente | BLOQUEADO | Relatório sanitizado recente de TASK-014 registra cenário bloqueado; confira a falha de pré-requisito no relatório fonte. |

Para validar, registre o horário UTC de início, execute os roteiros TASK-013 e TASK-014 no PowerShell do Windows, revise seus relatórios sanitizados e então execute este coletor com -ExecutionStartedAtUtc e -HumanReviewed. Os roteiros fonte recebem credenciais sintéticas por parâmetros PSCredential; não passe senhas em argumentos de texto nem grave tokens.
