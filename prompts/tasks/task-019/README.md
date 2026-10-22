# TASK-019 — Cancelamentos e reembolsos

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-04 · **Priority:** HIGH
- Objetivo: Aplicar regras automáticas digitais e decisão administrativa/estado físico.
- Dependências: `DEPENDS_ON: TASK-017, TASK-018`
- Relacionados: RF-018; RN-013–015,017.

## Scope Guard

- Permitido: `modules/refunds/**`; `modules/orders/**`; `modules/library/**`; `modules/audit/**`; `tests/**`; `TASKS.md`.
- Proibido: gateway real; regras legais não aprovadas.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-019-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-019-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Contexto histórico e pré-condições | [prompt-task-019-etapa-002-contexto-historico-e-pre-condicoes.md](./prompt-task-019-etapa-002-contexto-historico-e-pre-condicoes.md) | GATE-002 | GATE-001 |
| 003 | Planejamento mínimo | [prompt-task-019-etapa-003-planejamento-minimo.md](./prompt-task-019-etapa-003-planejamento-minimo.md) | GATE-003 | GATE-002 |
| 004 | Implementação controlada | [prompt-task-019-etapa-004-implementacao-controlada.md](./prompt-task-019-etapa-004-implementacao-controlada.md) | GATE-004 | GATE-003 |
| 005 | Revisão e gates automatizados | [prompt-task-019-etapa-005-revisao-e-gates-automatizados.md](./prompt-task-019-etapa-005-revisao-e-gates-automatizados.md) | GATE-005 | GATE-004 |
| 006 | Testes manuais | [prompt-task-019-etapa-006-testes-manuais.md](./prompt-task-019-etapa-006-testes-manuais.md) | GATE-006 | GATE-005 |
| 007 | Conclusão e rastreabilidade | [prompt-task-019-etapa-007-conclusao-e-rastreabilidade.md](./prompt-task-019-etapa-007-conclusao-e-rastreabilidade.md) | GATE-007 | GATE-006 |

## Critérios de conclusão

- Aceitação/testes: janelas 2h/2 semanas/1 semana; reembolso digital revoga acesso e restaura licença limitada; físico pré-envio e estoque restaurado somente após devolução confirmada; Admin auditado.
- DoD: exceção não permite violar janela sem Admin.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual funcional, de segurança e de regressão proporcional ao risco; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
