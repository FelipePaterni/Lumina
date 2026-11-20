# TASK-015 — Resultado dos testes manuais

- Execução UTC: 2026-11-20T21:48:13Z
- Endpoint informado: localhost:3001
- Revisão humana: CONFIRMADA
- Dados: somente dados sintéticos nos roteiros predecessores
- Credenciais/tokens: usados apenas em memória pelos roteiros predecessores; não copiados para este relatório

| Cenário | Estado | Evidência resumida |
|---|---|---|
| MT-015-01 — Compra digital gratuita | APROVADO | Relatório sanitizado recente de TASK-013 aprovado e revisão humana confirmada. |
| MT-015-02 — Compra híbrida paga | APROVADO | Relatório sanitizado recente de TASK-013 aprovado e revisão humana confirmada. |
| MT-015-03 — Concorrência de estoque e cupom | APROVADO | Relatório sanitizado recente de TASK-013 aprovado e revisão humana confirmada. |
| MT-015-04 — Notificação e replay idempotente | APROVADO | Evidência manual aprovada e versionada da dependência TASK-014; revisão humana confirmada. Reexecução posterior bloqueou no pré-flight antes dos cenários e não substituiu a aprovação anterior. |

Para validar, registre o horário UTC de início, execute o roteiro manual TASK-013 no PowerShell do Windows e revise o relatório. A evidência aprovada da TASK-014 concluída é reutilizada do histórico versionado; não é necessário reexecutar seu runner para este checkpoint. Execute este coletor com -ExecutionStartedAtUtc e -HumanReviewed. Credenciais sintéticas são fornecidas somente por PSCredential; não passe senhas em argumentos de texto nem grave tokens.
