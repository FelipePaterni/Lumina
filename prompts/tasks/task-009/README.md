# TASK-009 — Inventário e ativos privados

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-02 · **Priority:** HIGH
- Objetivo: Gerir estoque físico, licenças digitais e upload/versionamento privado local.
- Dependências: `DEPENDS_ON: TASK-007`
- Relacionados: RF-006,007; RN-003,004; ADR-004.

## Scope Guard

- Permitido: `apps/api/src/modules/catalog/assets/**`; `apps/api/src/modules/inventory/**`; `apps/api/src/storage/**`; `storage/**`; `database/**`; `tests/**`; `docs/testing/TASK-009-*.md`; `prompts/tasks/task-009/**`; `TASKS.md`.
- Proibido: endpoint público de download; pedidos.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-009-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-009-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Contexto histórico e pré-condições | [prompt-task-009-etapa-002-contexto-historico-e-pre-condicoes.md](./prompt-task-009-etapa-002-contexto-historico-e-pre-condicoes.md) | GATE-002 | GATE-001 |
| 003 | Planejamento mínimo | [prompt-task-009-etapa-003-planejamento-minimo.md](./prompt-task-009-etapa-003-planejamento-minimo.md) | GATE-003 | GATE-002 |
| 004 | Implementação controlada | [prompt-task-009-etapa-004-implementacao-controlada.md](./prompt-task-009-etapa-004-implementacao-controlada.md) | GATE-004 | GATE-003 |
| 005 | Revisão e gates automatizados | [prompt-task-009-etapa-005-revisao-e-gates-automatizados.md](./prompt-task-009-etapa-005-revisao-e-gates-automatizados.md) | GATE-005 | GATE-004 |
| 006 | Testes manuais | [prompt-task-009-etapa-006-testes-manuais.md](./prompt-task-009-etapa-006-testes-manuais.md) | GATE-006 | GATE-005 |
| 007 | Conclusão e rastreabilidade | [prompt-task-009-etapa-007-conclusao-e-rastreabilidade.md](./prompt-task-009-etapa-007-conclusao-e-rastreabilidade.md) | GATE-007 | GATE-006 |

## Critérios de conclusão

- Aceitação/testes: original não é servido publicamente; licença ilimitada/numerada e estoque são validados.
- DoD: mudança gera auditoria apropriada.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual funcional, de segurança e de regressão proporcional ao risco; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.

## Responsabilidade e evidências

- Responsável e executor técnico do GATE-005: agente de programação responsável pela TASK-009; executa os comandos, registra resultados reais e marca o gate somente com evidências e pré-requisitos aprovados.
- Ambiente de integração: operador local disponibiliza banco de teste isolado; teste de migração/rollback não usa banco de desenvolvimento.
- Revisão humana obrigatória dos cenários manuais pertence ao GATE-006. O GATE-005 não tem uma pessoa nominal atribuída nem exige aprovação humana separada; decisões de escopo ou não aplicabilidade continuam sendo do mantenedor.
- `felipePaterni` aparece como autor de commits, mas isso não é tratado como atribuição de aprovador.
- Matriz cumulativa dos gates: `docs/testing/TASK-009-gates.md`; execuções devem ser acrescentadas sem apagar evidências anteriores.

O roteiro automatizado preserva resultados humanos: cada execução registra seção datada, sem substituir as anteriores.
