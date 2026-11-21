# TASK-019 — planejamento e evidências dos gates

Data: 2026-11-21
Branch: `feature/TASK-019-cancelamentos-reembolsos`

## Decisões aprovadas

- Dependências TASK-017 e TASK-018 concluídas.
- Scope escalation aprovada: persistência de refunds e fulfillment mínima em `database/schema.prisma` e `database/migrations/**`.
- Cupom rateado proporcionalmente entre linhas; frete excluído do reembolso. Centavos residuais distribuídos por maior resto, com desempate pelo ID da linha.
- GATE-003 aprovou estado de fulfillment, reversão de licença/estoque, auditoria transacional e verificação de entitlement para links já emitidos.

## Evidências de execução

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 | APROVADO | TASK-017 e TASK-018 em DONE; prontidão, aceitação, ADR-003/005 e Scope Guard revisados. |
| GATE-002 | APROVADO | Histórico, baseline, dependências e estado do branch registrados antes da implementação. |
| GATE-003 | APROVADO | Plano e decisão de rateio registrados em `TASKS.md`; commits `349a078` e `84e467f`. |
| GATE-004 | APROVADO | Serviço, regras, rotas, migration e integração da biblioteca implementados; API compila; testes unitários passam. |
| GATE-005 | BLOQUEADO | `npm test`: 69/69; `npm run lint`: passou; `npx prisma validate`: passou; `npm run build`: passou (API e web); parser PowerShell passou; sintaxe do teste de integração (`node --check`) passou; `git diff --check` passou. Integração na sessão do agente falhou antes dos cenários por PostgreSQL indisponível em `localhost:5433`; ainda falta executá-la com o serviço disponível. |
| GATE-006 | REPROVADO, CORREÇÃO PENDENTE DE REEXECUÇÃO | A tentativa do responsável passou autenticação e verificação da fixture. O processamento de reembolso chegou à API, mas constraint antiga `payments_status_amount_check` rejeitou `REFUNDED`. Migration corretiva `20261121120000_task_019_payment_refund_check` atualiza a constraint; falta reexecutar o roteiro e revisão humana. Tentativa anterior com UUIDs placeholder foi bloqueada antes de alteração de dados. Relatório sanitizado em `docs/testing/TASK-019-testes-manuais-resultado.md`. |
| GATE-007 | PENDENTE | Depende da resolução de GATE-005 e execução/revisão humana de GATE-006. |

## Pendências

1. Executar novamente o preparador para aplicar a migration corretiva; depois executar `npm run test:integration` com `TASK009_TEST_DATABASE_URL` para `lumina_task009_test`.
2. Reexecutar `tests/manual/task-019/run-task-019-manual-tests.ps1` com os IDs sintéticos já gerados e revisar o relatório atualizado em `docs/testing/TASK-019-testes-manuais-resultado.md`.
3. Somente após esses gates, decidir o estado `DONE`.

O relatório de planejamento em `docs/testing/` e o relatório manual gerado são alterações incidentais e mínimas, exigidas pelo contrato operacional de `AGENTS.md`; não mudam requisitos, arquitetura nem contratos.

Nenhum segredo, token, e-mail ou dado pessoal foi copiado para este relatório.
