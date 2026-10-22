# TASK-011 — Checkpoint PHASE-02

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-02 · **Priority:** CRITICAL
- Objetivo: Verificar catálogo, busca, inventário e segurança de arquivos.
- Dependências: `DEPENDS_ON: TASK-007, TASK-008, TASK-009, TASK-010`
- Relacionados: RF-003–008; RNF-004,010.

## Scope Guard

- Permitido: testes/documentação PHASE-02; `TASKS.md`.
- Proibido: carrinho/pedidos.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-011-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-011-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Matriz de evidências | [prompt-task-011-etapa-002-matriz-de-evidencias.md](./prompt-task-011-etapa-002-matriz-de-evidencias.md) | GATE-002 | GATE-001 |
| 003 | Planejamento de validação | [prompt-task-011-etapa-003-planejamento-de-validacao.md](./prompt-task-011-etapa-003-planejamento-de-validacao.md) | GATE-003 | GATE-002 |
| 004 | Execução das validações | [prompt-task-011-etapa-004-execucao-das-validacoes.md](./prompt-task-011-etapa-004-execucao-das-validacoes.md) | GATE-004 | GATE-003 |
| 005 | Testes manuais e conclusão | [prompt-task-011-etapa-005-testes-manuais-e-conclusao.md](./prompt-task-011-etapa-005-testes-manuais-e-conclusao.md) | GATE-005 | GATE-004 |

## Critérios de conclusão

- Aceitação/testes: autorizações, índices e não exposição de originais passam.
- DoD: PHASE-03 desbloqueada.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual de validação do checkpoint; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
