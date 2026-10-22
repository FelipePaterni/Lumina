# TASK-005 — Checkpoint PHASE-01

## Identificação

- Estado inicial: BLOCKED · **Phase:** PHASE-01 · **Priority:** HIGH
- Objetivo: Validar base, identidade, segurança e rastreabilidade da fase.
- Dependências: `DEPENDS_ON: TASK-004`
- Relacionados: RNF-001–003,012.

## Scope Guard

- Permitido: testes/configuração das fases 01; documentação de qualidade; `TASKS.md`.
- Proibido: funcionalidades PHASE-02+.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-005-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-005-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Matriz de evidências | [prompt-task-005-etapa-002-matriz-de-evidencias.md](./prompt-task-005-etapa-002-matriz-de-evidencias.md) | GATE-002 | GATE-001 |
| 003 | Planejamento de validação | [prompt-task-005-etapa-003-planejamento-de-validacao.md](./prompt-task-005-etapa-003-planejamento-de-validacao.md) | GATE-003 | GATE-002 |
| 004 | Execução das validações | [prompt-task-005-etapa-004-execucao-das-validacoes.md](./prompt-task-005-etapa-004-execucao-das-validacoes.md) | GATE-004 | GATE-003 |
| 005 | Testes manuais e conclusão | [prompt-task-005-etapa-005-testes-manuais-e-conclusao.md](./prompt-task-005-etapa-005-testes-manuais-e-conclusao.md) | GATE-005 | GATE-004 |

## Critérios de conclusão

- Aceitação/testes: build/lint/unidade/integração/segurança passam; ADRs e matriz conferem.
- DoD: nenhum bloqueador de fundação conhecido.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual de validação do checkpoint; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
