# TASK-006 — Checkpoint de transição PHASE-01

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-01 · **Priority:** CRITICAL
- Objetivo: Autorizar formalmente início do catálogo após revalidar dependências.
- Dependências: `DEPENDS_ON: TASK-001, TASK-002, TASK-003, TASK-004, TASK-005`
- Relacionados: todos PHASE-01.

## Scope Guard

- Permitido: `TASKS.md`; testes/configuração PHASE-01.
- Proibido: código de catálogo ou comércio.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-006-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-006-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Matriz de evidências | [prompt-task-006-etapa-002-matriz-de-evidencias.md](./prompt-task-006-etapa-002-matriz-de-evidencias.md) | GATE-002 | GATE-001 |
| 003 | Planejamento de validação | [prompt-task-006-etapa-003-planejamento-de-validacao.md](./prompt-task-006-etapa-003-planejamento-de-validacao.md) | GATE-003 | GATE-002 |
| 004 | Execução das validações | [prompt-task-006-etapa-004-execucao-das-validacoes.md](./prompt-task-006-etapa-004-execucao-das-validacoes.md) | GATE-004 | GATE-003 |
| 005 | Testes manuais e conclusão | [prompt-task-006-etapa-005-testes-manuais-e-conclusao.md](./prompt-task-006-etapa-005-testes-manuais-e-conclusao.md) | GATE-005 | GATE-004 |

## Critérios de conclusão

- Aceitação/testes: ordem e estados validados; todos gates PHASE-01 verdes.
- DoD: TASK-007 pode se tornar READY.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual de validação do checkpoint; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
