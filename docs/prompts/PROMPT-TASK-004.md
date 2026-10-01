# Prompt — TASK-004: RBAC, auditoria e exclusão solicitada

Execute exclusivamente a `TASK-004`. Leia `AGENTS.md`, `README.md`, `TASKS.md`, ADR-003 e ADR-007 e valide que TASK-003 está `DONE`, implementada e com testes verdes. Use `feature/TASK-004-rbac-auditoria-exclusao`, nunca `main`; somente então mude o estado para `IN_PROGRESS`.

Implemente os papéis Cliente, Gestão de Catálogo, Estoquista e Administrador Geral, guardas de autorização e negações por menor privilégio. Crie auditoria estruturada para ações sensíveis com ator, ação, alvo, momento e motivo exigido, sem PII explícita. Implemente solicitação de exclusão que desativa a conta por 30 dias configuráveis, permite reativação durante todo o prazo e gera notificações previstas ao cliente/Admin. Preserve o seed administrativo controlado definido no ADR-007.

Limite alterações a `modules/identity/**`, `modules/audit/**`, `features/account/**`, `database/**`, `tests/**` e `TASKS.md`. Teste permissões positivas e negativas para cada papel, obrigatoriedade de motivo, ausência de PII na auditoria e reativação no prazo configurado.

Não implemente retenção ou exclusão definitiva/legal, 2FA, catálogo, checkout, exportação de dados ou decisões jurídicas. Se o prazo legal exigir regra não documentada, pare e registre `BLOCKER`. Execute gates, commits convencionais e relatório final conforme `AGENTS.md`.
