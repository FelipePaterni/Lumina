# TASK-001 — Inicializar estrutura e qualidade

## Identificação

- Estado inicial: READY · **Phase:** PHASE-01 · **Priority:** CRITICAL
- Objetivo: Criar estrutura da stack decidida, ferramentas de build/lint/teste e convenções mínimas.
- Dependências: `DEPENDS_ON: NONE`
- Relacionados: ADR-001, ADR-002, ADR-006, RNF-012,013.

## Scope Guard

- Permitido: arquivos-raiz de build e Docker; `apps/**`; `packages/**`; `tests/**`; documentação de execução; `TASKS.md`.
- Proibido: requisitos/ADRs; integrações externas; regras de negócio.

## Workflow e gates

| Ordem | Etapa | Arquivo | Gate | Dependência |
|---|---|---|---|---|
| 001 | Recontextualização e prontidão | [prompt-task-001-etapa-001-recontextualizacao-e-prontidao.md](./prompt-task-001-etapa-001-recontextualizacao-e-prontidao.md) | GATE-001 | — |
| 002 | Contexto histórico e pré-condições | [prompt-task-001-etapa-002-contexto-historico-e-pre-condicoes.md](./prompt-task-001-etapa-002-contexto-historico-e-pre-condicoes.md) | GATE-002 | GATE-001 |
| 003 | Planejamento mínimo | [prompt-task-001-etapa-003-planejamento-minimo.md](./prompt-task-001-etapa-003-planejamento-minimo.md) | GATE-003 | GATE-002 |
| 004 | Implementação controlada | [prompt-task-001-etapa-004-implementacao-controlada.md](./prompt-task-001-etapa-004-implementacao-controlada.md) | GATE-004 | GATE-003 |
| 005 | Revisão e gates automatizados | [prompt-task-001-etapa-005-revisao-e-gates-automatizados.md](./prompt-task-001-etapa-005-revisao-e-gates-automatizados.md) | GATE-005 | GATE-004 |
| 006 | Testes manuais | [prompt-task-001-etapa-006-testes-manuais.md](./prompt-task-001-etapa-006-testes-manuais.md) | GATE-006 | GATE-005 |
| 007 | Conclusão e rastreabilidade | [prompt-task-001-etapa-007-conclusao-e-rastreabilidade.md](./prompt-task-001-etapa-007-conclusao-e-rastreabilidade.md) | GATE-007 | GATE-006 |

## Critérios de conclusão

- Aceitação/testes: build, lint e teste vazio passam em ambiente limpo; a composição Docker inicia os serviços locais documentados; nenhuma chave real é criada.
- DoD: comandos nativos e Docker documentados; imagens são reproduzíveis e gates verdes.
- Todos os gates aprovados com evidência; nenhum bloqueio de escopo ou segurança pendente.

## Testes manuais previstos

Roteiro manual funcional, de segurança e de regressão proporcional ao risco; execução humana obrigatória. Não substituem testes automatizados e começam como NÃO EXECUTADO.
