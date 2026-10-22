# TASK-026 — Checkpoint final V1

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-05 · **Priority:** CRITICAL
- Objetivo: Validar V1 integralmente contra requisitos, segurança, documentação e Scope Guard.
- Dependências: `DEPENDS_ON: TASK-021, TASK-022, TASK-023, TASK-024, TASK-025, TASK-027`
- Relacionados: todos RF/RN/RNF/UC/ADR.

## Scope Guard

- Permitido: testes, documentação, configuração de qualidade e `TASKS.md`.
- Proibido: funcionalidades fora de escopo; infraestrutura/integrações reais.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-026-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-026-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Matriz de evidências | [prompt-task-026-etapa-002-matriz-de-evidencias.md](./prompt-task-026-etapa-002-matriz-de-evidencias.md) | GATE-002 | GATE-001 |
| 003 | Planejamento de validação | [prompt-task-026-etapa-003-planejamento-de-validacao.md](./prompt-task-026-etapa-003-planejamento-de-validacao.md) | GATE-003 | GATE-002 |
| 004 | Execução das validações | [prompt-task-026-etapa-004-execucao-das-validacoes.md](./prompt-task-026-etapa-004-execucao-das-validacoes.md) | GATE-004 | GATE-003 |
| 005 | Testes manuais e conclusão | [prompt-task-026-etapa-005-testes-manuais-e-conclusao.md](./prompt-task-026-etapa-005-testes-manuais-e-conclusao.md) | GATE-005 | GATE-004 |

## Critérios de conclusão

- Aceitação/testes: gates completos, rastreabilidade, backup/restore ensaiado e testes de regressão aprovados.
- DoD: V1 elegível para revisão humana; PD-001–003 explicitamente aceitos ou bloqueiam publicação.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual de validação do checkpoint; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
