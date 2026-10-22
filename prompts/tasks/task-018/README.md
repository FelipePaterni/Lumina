# TASK-018 — Bundles e pré-vendas

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-04 · **Priority:** HIGH
- Objetivo: Implementar composição, preço proporcional e liberação de pré-vendas físicas/digitais.
- Dependências: `DEPENDS_ON: TASK-017`
- Relacionados: RF-015,016; RN-006,007,012,013.

## Scope Guard

- Permitido: `modules/bundles/**`; `modules/preorders/**`; `modules/orders/**`; `modules/library/**`; `tests/**`; `TASKS.md`.
- Proibido: descontos não especificados; expedição antes de lançamento.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-018-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-018-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Contexto histórico e pré-condições | [prompt-task-018-etapa-002-contexto-historico-e-pre-condicoes.md](./prompt-task-018-etapa-002-contexto-historico-e-pre-condicoes.md) | GATE-002 | GATE-001 |
| 003 | Planejamento mínimo | [prompt-task-018-etapa-003-planejamento-minimo.md](./prompt-task-018-etapa-003-planejamento-minimo.md) | GATE-003 | GATE-002 |
| 004 | Implementação controlada | [prompt-task-018-etapa-004-implementacao-controlada.md](./prompt-task-018-etapa-004-implementacao-controlada.md) | GATE-004 | GATE-003 |
| 005 | Revisão e gates automatizados | [prompt-task-018-etapa-005-revisao-e-gates-automatizados.md](./prompt-task-018-etapa-005-revisao-e-gates-automatizados.md) | GATE-005 | GATE-004 |
| 006 | Testes manuais | [prompt-task-018-etapa-006-testes-manuais.md](./prompt-task-018-etapa-006-testes-manuais.md) | GATE-006 | GATE-005 |
| 007 | Conclusão e rastreabilidade | [prompt-task-018-etapa-007-conclusao-e-rastreabilidade.md](./prompt-task-018-etapa-007-conclusao-e-rastreabilidade.md) | GATE-007 | GATE-006 |

## Critérios de conclusão

- Aceitação/testes: composição duplicada falha; desconto nunca negativo; todos possuídos bloqueia; liberação só na data.
- DoD: compra de bundle concede cada item separadamente.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual funcional, de segurança e de regressão proporcional ao risco; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
