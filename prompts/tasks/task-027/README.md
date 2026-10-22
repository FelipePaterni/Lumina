# TASK-027 — Rankings de descoberta pós-venda

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-05 · **Priority:** HIGH
- Objetivo: Entregar os filtros de catálogo que dependem de dados consolidados de pedidos e avaliações.
- Dependências: `DEPENDS_ON: TASK-022`
- Relacionados: RF-003,019; RN-016; RNF-011.

## Scope Guard

- Permitido: `modules/catalog/search/**`; `features/catalog/**`; `tests/**catalog/**`; `TASKS.md`.
- Proibido: alterar regras de pedido, avaliação, cálculo de média ou visibilidade; criar métricas administrativas novas.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-027-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-027-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Contexto histórico e pré-condições | [prompt-task-027-etapa-002-contexto-historico-e-pre-condicoes.md](./prompt-task-027-etapa-002-contexto-historico-e-pre-condicoes.md) | GATE-002 | GATE-001 |
| 003 | Planejamento mínimo | [prompt-task-027-etapa-003-planejamento-minimo.md](./prompt-task-027-etapa-003-planejamento-minimo.md) | GATE-003 | GATE-002 |
| 004 | Implementação controlada | [prompt-task-027-etapa-004-implementacao-controlada.md](./prompt-task-027-etapa-004-implementacao-controlada.md) | GATE-004 | GATE-003 |
| 005 | Revisão e gates automatizados | [prompt-task-027-etapa-005-revisao-e-gates-automatizados.md](./prompt-task-027-etapa-005-revisao-e-gates-automatizados.md) | GATE-005 | GATE-004 |
| 006 | Testes manuais | [prompt-task-027-etapa-006-testes-manuais.md](./prompt-task-027-etapa-006-testes-manuais.md) | GATE-006 | GATE-005 |
| 007 | Conclusão e rastreabilidade | [prompt-task-027-etapa-007-conclusao-e-rastreabilidade.md](./prompt-task-027-etapa-007-conclusao-e-rastreabilidade.md) | GATE-007 | GATE-006 |

## Critérios de conclusão

- Aceitação/testes: mais vendidos usa apenas pedidos confirmados; bem avaliados usa apenas avaliações visíveis; filtros combinam, respeitam ocultação e paginação.
- DoD: consultas de ranking possuem índices/revisão de plano e testes de dados vazios.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual funcional, de segurança e de regressão proporcional ao risco; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
