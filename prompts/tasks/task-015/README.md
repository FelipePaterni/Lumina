# TASK-015 — Checkpoint PHASE-03

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-03 · **Priority:** HIGH
- Objetivo: Validar compra gratuita/paga simulada, híbrida e concorrente.
- Dependências: `DEPENDS_ON: TASK-014`
- Relacionados: RF-009–012,020; RNF-009.

## Scope Guard

- Permitido: testes/documentação PHASE-03; `TASKS.md`.
- Proibido: biblioteca, bundles e logística.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-015-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-015-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Matriz de evidências | [prompt-task-015-etapa-002-matriz-de-evidencias.md](./prompt-task-015-etapa-002-matriz-de-evidencias.md) | GATE-002 | GATE-001 |
| 003 | Planejamento de validação | [prompt-task-015-etapa-003-planejamento-de-validacao.md](./prompt-task-015-etapa-003-planejamento-de-validacao.md) | GATE-003 | GATE-002 |
| 004 | Execução das validações | [prompt-task-015-etapa-004-execucao-das-validacoes.md](./prompt-task-015-etapa-004-execucao-das-validacoes.md) | GATE-004 | GATE-003 |
| 005 | Testes manuais e conclusão | [prompt-task-015-etapa-005-testes-manuais-e-conclusao.md](./prompt-task-015-etapa-005-testes-manuais-e-conclusao.md) | GATE-005 | GATE-004 |

## Critérios de conclusão

- Aceitação/testes: todos cenários de checkout e regressões verdes.
- DoD: não há sobre-venda conhecida.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual de validação do checkpoint; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
