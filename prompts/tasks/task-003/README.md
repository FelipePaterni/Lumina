# TASK-003 — Identidade e confirmação de e-mail

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-01 · **Priority:** CRITICAL
- Objetivo: Implementar usuários, senha, registro, confirmação e recuperação seguros.
- Dependências: `DEPENDS_ON: TASK-001, TASK-002`
- Relacionados: RF-001, RN-001,021, RNF-001–003, ADR-003, ADR-007.

## Scope Guard

- Permitido: `apps/api/src/modules/identity/**`; `apps/web/src/features/auth/**`; `database/**`; `tests/**identity/**`; `TASKS.md`.
- Proibido: autorização de catálogo/comércio; PII em fixtures/logs.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-003-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-003-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Contexto histórico e pré-condições | [prompt-task-003-etapa-002-contexto-historico-e-pre-condicoes.md](./prompt-task-003-etapa-002-contexto-historico-e-pre-condicoes.md) | GATE-002 | GATE-001 |
| 003 | Planejamento mínimo | [prompt-task-003-etapa-003-planejamento-minimo.md](./prompt-task-003-etapa-003-planejamento-minimo.md) | GATE-003 | GATE-002 |
| 004 | Implementação controlada | [prompt-task-003-etapa-004-implementacao-controlada.md](./prompt-task-003-etapa-004-implementacao-controlada.md) | GATE-004 | GATE-003 |
| 005 | Revisão e gates automatizados | [prompt-task-003-etapa-005-revisao-e-gates-automatizados.md](./prompt-task-003-etapa-005-revisao-e-gates-automatizados.md) | GATE-005 | GATE-004 |
| 006 | Testes manuais | [prompt-task-003-etapa-006-testes-manuais.md](./prompt-task-003-etapa-006-testes-manuais.md) | GATE-006 | GATE-005 |
| 007 | Conclusão e rastreabilidade | [prompt-task-003-etapa-007-conclusao-e-rastreabilidade.md](./prompt-task-003-etapa-007-conclusao-e-rastreabilidade.md) | GATE-007 | GATE-006 |

## Critérios de conclusão

- Aceitação/testes: e-mail não confirmado não compra; token inválido/expirado falha sem enumeração; reset funciona; seed controlado cria o primeiro Admin; JWT inválido ou expirado é recusado.
- DoD: hash, rate limit e testes de abuso aplicáveis passam.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual funcional, de segurança e de regressão proporcional ao risco; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
