# Prompt — TASK-005: Checkpoint PHASE-01

Execute somente a `TASK-005`, que é um checkpoint. Leia `AGENTS.md`, `README.md`, `TASKS.md`, ADRs aplicáveis, código e testes. Valide que TASK-004 está `DONE` e que todas as TASKs da PHASE-01 têm artefatos e testes existentes. Use `chore/TASK-005-checkpoint-phase-01`; não trabalhe em `main`; altere o estado para `IN_PROGRESS` somente após essas validações.

Execute build, lint, testes unitários, integração, API quando aplicável, verificações de segurança e regressão da fundação. Confira identidade, JWT, confirmação de e-mail, seed, RBAC, auditoria, exclusão reativável, PostgreSQL/migrações, Docker e rastreabilidade contra README/ADRs. Produza a evidência e o relatório de checkpoint.

São permitidos apenas testes/configuração da PHASE-01, documentação de qualidade e `TASKS.md`. Correções só podem ser estritamente necessárias para fazer os requisitos já aprovados da PHASE-01 funcionarem e devem ser classificadas. Não implemente qualquer funcionalidade da PHASE-02 ou posterior.

Se qualquer gate falhar ou houver incongruência documental/arquitetural, não marque `DONE`: registre o problema com evidência usando `BLOCKER` ou `SCOPE ESCALATION`. Caso tudo passe, faça commits coesos, transite por `IN_REVIEW` e entregue o relatório obrigatório.
