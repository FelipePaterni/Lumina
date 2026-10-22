# TASK-025 — Acessibilidade, responsividade e desempenho

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-05 · **Priority:** HIGH
- Objetivo: Validar meta WCAG A, navegadores, layouts e tempo de carregamento.
- Dependências: `DEPENDS_ON: TASK-021, TASK-022, TASK-023, TASK-024, TASK-027`
- Relacionados: RNF-004–006.

## Scope Guard

- Permitido: `apps/web/**`; `tests/e2e/**`; `tests/accessibility/**`; `docs/architecture/**`; `TASKS.md`.
- Proibido: alteração de regra de negócio; redesign não necessário.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-025-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-025-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Contexto histórico e pré-condições | [prompt-task-025-etapa-002-contexto-historico-e-pre-condicoes.md](./prompt-task-025-etapa-002-contexto-historico-e-pre-condicoes.md) | GATE-002 | GATE-001 |
| 003 | Planejamento mínimo | [prompt-task-025-etapa-003-planejamento-minimo.md](./prompt-task-025-etapa-003-planejamento-minimo.md) | GATE-003 | GATE-002 |
| 004 | Implementação controlada | [prompt-task-025-etapa-004-implementacao-controlada.md](./prompt-task-025-etapa-004-implementacao-controlada.md) | GATE-004 | GATE-003 |
| 005 | Revisão e gates automatizados | [prompt-task-025-etapa-005-revisao-e-gates-automatizados.md](./prompt-task-025-etapa-005-revisao-e-gates-automatizados.md) | GATE-005 | GATE-004 |
| 006 | Testes manuais | [prompt-task-025-etapa-006-testes-manuais.md](./prompt-task-025-etapa-006-testes-manuais.md) | GATE-006 | GATE-005 |
| 007 | Conclusão e rastreabilidade | [prompt-task-025-etapa-007-conclusao-e-rastreabilidade.md](./prompt-task-025-etapa-007-conclusao-e-rastreabilidade.md) | GATE-007 | GATE-006 |

## Critérios de conclusão

- Aceitação/testes: teclado, rótulos, contraste, mobile e navegadores-alvo passam; medição registrada.
- DoD: qualquer meta não medida é marcada como falha, não presumida.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual funcional, de segurança e de regressão proporcional ao risco; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
