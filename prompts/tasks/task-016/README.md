# TASK-016 — Checkpoint de transição PHASE-03

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-03 · **Priority:** CRITICAL
- Objetivo: Autorizar a entrega digital e regras pós-compra.
- Dependências: `DEPENDS_ON: TASK-012, TASK-013, TASK-014, TASK-015`
- Relacionados: PHASE-03.

## Scope Guard

- Permitido: `TASKS.md`; testes/configuração PHASE-03.
- Proibido: novas funcionalidades.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-016-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-016-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Matriz de evidências | [prompt-task-016-etapa-002-matriz-de-evidencias.md](./prompt-task-016-etapa-002-matriz-de-evidencias.md) | GATE-002 | GATE-001 |
| 003 | Planejamento de validação | [prompt-task-016-etapa-003-planejamento-de-validacao.md](./prompt-task-016-etapa-003-planejamento-de-validacao.md) | GATE-003 | GATE-002 |
| 004 | Execução das validações | [prompt-task-016-etapa-004-execucao-das-validacoes.md](./prompt-task-016-etapa-004-execucao-das-validacoes.md) | GATE-004 | GATE-003 |
| 005 | Testes manuais e conclusão | [prompt-task-016-etapa-005-testes-manuais-e-conclusao.md](./prompt-task-016-etapa-005-testes-manuais-e-conclusao.md) | GATE-005 | GATE-004 |

## Critérios de conclusão

- Aceitação/testes: checkpoints e rastreabilidade aprovados.
- DoD: TASK-017 torna-se elegível.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual de validação do checkpoint; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
