# Prompt — TASK-003: Identidade e confirmação de e-mail

Trabalhe somente na `TASK-003`. Leia `AGENTS.md`, `README.md`, `TASKS.md`, ADR-003 e ADR-007, além da implementação e testes das TASKs 001 e 002. Só comece se ambas estiverem `DONE`, seus artefatos existirem e testes passarem. Use `feature/TASK-003-identidade-email`; não trabalhe em `main`; registre `IN_PROGRESS` apenas após validar a Definition of Ready.

Implemente identidade local: usuário, senha com hash adaptativo, cadastro, confirmação obrigatória de e-mail, login JWT assinado e expirável, recuperação de senha, tokens de uso único/expiráveis e caixa de saída local simulada. Crie o primeiro Administrador Geral exclusivamente por seed controlado por ambiente. JWT inválido ou expirado deve ser recusado; dados sensíveis e credenciais nunca entram em código, fixtures, logs, imagens Docker ou relatórios.

Imponha prevenção de enumeração de conta e rate limit aplicável. E-mail não confirmado não pode executar compra. Teste registro, confirmação, expiração/reuso de token, reset, login/JWT, seed e cenários de abuso. Restrinja-se a `apps/api/src/modules/identity/**`, `apps/web/src/features/auth/**`, `database/**`, `tests/**identity/**` e `TASKS.md`.

Não implemente autorização de catálogo/comércio, RBAC completo, exclusão de conta, PII em fixtures ou funcionalidades posteriores. Diante de ambiguidade ou mudança fora do Scope Guard, pare com `BLOCKER`/`SCOPE ESCALATION`. Execute gates, faça commits rastreáveis e entregue o relatório exigido.
