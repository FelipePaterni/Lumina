# TASK-020 — Checkpoint PHASE-04

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-04 · **Priority:** CRITICAL
- Objetivo: Validar ciclo digital completo e pós-compra.
- Dependências: `DEPENDS_ON: TASK-017, TASK-018, TASK-019`
- Relacionados: RF-013–018; RNF-010.

## Scope Guard

- Permitido: testes/documentação PHASE-04; `TASKS.md`.
- Proibido: logística, avaliações e painéis.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-020-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-020-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Matriz de evidências | [prompt-task-020-etapa-002-matriz-de-evidencias.md](./prompt-task-020-etapa-002-matriz-de-evidencias.md) | GATE-002 | GATE-001 |
| 003 | Planejamento de validação | [prompt-task-020-etapa-003-planejamento-de-validacao.md](./prompt-task-020-etapa-003-planejamento-de-validacao.md) | GATE-003 | GATE-002 |
| 004 | Execução das validações | [prompt-task-020-etapa-004-execucao-das-validacoes.md](./prompt-task-020-etapa-004-execucao-das-validacoes.md) | GATE-004 | GATE-003 |
| 005 | Testes manuais e conclusão | [prompt-task-020-etapa-005-testes-manuais-e-conclusao.md](./prompt-task-020-etapa-005-testes-manuais-e-conclusao.md) | GATE-005 | GATE-004 |

## Critérios de conclusão

- Aceitação/testes: originais protegidos, regras temporais e reversões passam.
- DoD: PHASE-05 desbloqueada.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual de validação do checkpoint; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
