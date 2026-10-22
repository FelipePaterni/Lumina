# TASK-013 — Pedido e checkout transacional

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-03 · **Priority:** HIGH
- Objetivo: Criar pedido único híbrido, confirmação fictícia e consumo atômico de recursos.
- Dependências: `DEPENDS_ON: TASK-012`
- Relacionados: RF-012; RN-004,010,011; ADR-005.

## Scope Guard

- Permitido: `modules/orders/**`; `modules/payments/**`; `database/**`; `tests/**orders/**`; `TASKS.md`.
- Proibido: gateway externo; biblioteca/download.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-013-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-013-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Contexto histórico e pré-condições | [prompt-task-013-etapa-002-contexto-historico-e-pre-condicoes.md](./prompt-task-013-etapa-002-contexto-historico-e-pre-condicoes.md) | GATE-002 | GATE-001 |
| 003 | Planejamento mínimo | [prompt-task-013-etapa-003-planejamento-minimo.md](./prompt-task-013-etapa-003-planejamento-minimo.md) | GATE-003 | GATE-002 |
| 004 | Implementação controlada | [prompt-task-013-etapa-004-implementacao-controlada.md](./prompt-task-013-etapa-004-implementacao-controlada.md) | GATE-004 | GATE-003 |
| 005 | Revisão e gates automatizados | [prompt-task-013-etapa-005-revisao-e-gates-automatizados.md](./prompt-task-013-etapa-005-revisao-e-gates-automatizados.md) | GATE-005 | GATE-004 |
| 006 | Testes manuais | [prompt-task-013-etapa-006-testes-manuais.md](./prompt-task-013-etapa-006-testes-manuais.md) | GATE-006 | GATE-005 |
| 007 | Conclusão e rastreabilidade | [prompt-task-013-etapa-007-conclusao-e-rastreabilidade.md](./prompt-task-013-etapa-007-conclusao-e-rastreabilidade.md) | GATE-007 | GATE-006 |

## Critérios de conclusão

- Aceitação/testes: R$0 pula pagamento; conflito não cria pedido; cupom/estoque/licença não sobrevendem.
- DoD: idempotência e concorrência são testadas.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual funcional, de segurança e de regressão proporcional ao risco; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
