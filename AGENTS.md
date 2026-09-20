# Contrato operacional

**Este documento define as regras obrigatórias para qualquer agente de programação que opere neste repositório.**

## Fontes de verdade e ordem de leitura

Antes de qualquer TASK, leia nesta ordem: `AGENTS.md`, `README.md`, `TASKS.md`, ADRs relacionados, código e testes existentes. `README.md` define requisitos, domínio, arquitetura e escopo; `TASKS.md` define backlog, dependências, estados e Scope Guard; `docs/adr/` define decisões arquiteturais. Em conflito relevante, pare e solicite decisão; não decida silenciosamente.

## Seleção e início

1. Localize a primeira TASK `READY` na ordem de execução.
2. Confirme que toda dependência está `DONE`, seus artefatos existem e testes aplicáveis passam.
3. Leia RF/RN/RNF/UC/ADR relacionados, critérios de aceitação, testes e Scope Guard.
4. Confirme Definition of Ready. Caso falhe, mude/registre `BLOCKED` com o motivo e pare.
5. Crie branch `feature/TASK-xxx-descricao`, `fix/...` ou `chore/...`; nunca desenvolva em `main`.
6. Atualize somente a TASK de `READY` para `IN_PROGRESS` em `TASKS.md`.

## Scope Guard

Toda mudança deve ser classificada como `PRIMARY` ou `INCIDENTAL`.

- `PRIMARY` deve estar em `ALLOWED_CHANGES`.
- `INCIDENTAL` só é permitido quando mínimo, localizado, diretamente causado pela TASK, tecnicamente necessário e sem mudança independente de regra, contrato ou arquitetura.
- `FORBIDDEN_CHANGES` tem precedência absoluta. Não o viole, mesmo que esteja também em Allowed Changes.
- Muitas mudanças incidentais, mudança de contrato, refatoração ampla ou alteração arquitetural não são incidentais.

Quando extrapolar o escopo, pare e apresente:

```text
## SCOPE ESCALATION
TASK: TASK-xxx
Necessidade identificada:
Motivo:
Arquivos/módulos afetados:
Allowed Changes atual:
Forbidden Changes relacionado:
Por que não é Incidental Change:
Impacto se não realizada:
Alternativas:
Recomendação:
Decisão necessária:
```

## Definition of Ready

Uma TASK só pode ser `READY` quando requisitos e critérios são claros; dependências estão `DONE`; ADRs e contratos necessários estão resolvidos; testes e Scope Guard estão definidos; não há pendência bloqueante; e o trabalho cabe razoavelmente no Scope Guard.

## Implementação

Implemente somente a TASK selecionada. Não implemente trabalho futuro, invente regras, altere requisito, troque arquitetura sem ADR, adicione dependência não justificada, remova testes para aprovar gates ou altere contrato público sem autorização. Preserve alterações de terceiros no diretório de trabalho.

Novas necessidades: primeiro avalie se são incidentais; se não, localize TASK existente ou proponha uma nova com rastreabilidade/dependência. Aguarde decisão se a continuação depender dela.

## Quality Gates e Definition of Done

Antes de `IN_REVIEW → DONE`, execute e registre os gates aplicáveis: build, lint, testes unitários, integração, API, segurança, critérios de aceitação e regressão. Não afirme aprovação sem executar o comando aplicável.

Uma TASK é `DONE` apenas quando implementação e documentação exigida estão completas, gates passam, critérios são atendidos, erros são tratados, mudanças respeitam Scope Guard e `TASKS.md` foi atualizado. Classifique todos os arquivos alterados; nenhum pode ser proibido ou mudança colateral injustificada.

## Commits e estados

Use Conventional Commits: `<tipo>(<escopo>): <descrição> [TASK-xxx]`. Commits são pequenos, coesos e rastreáveis à TASK. Fluxo normal: `BLOCKED → READY → IN_PROGRESS → IN_REVIEW → DONE`; falha de implementação/validação vai para `FAILED`.

Não atualize `README.md` para estados, commits ou resultados de teste: isso pertence a `TASKS.md`. Altere README apenas para mudança real aprovada de especificação/arquitetura.

## Parada e bloqueios

Pare diante de ambiguidade, contradição, dependência inválida, decisão arquitetural ausente, risco de segurança/perda de dados, quebra de contrato, teste externo falhando ou necessidade de violar Scope Guard. Informe:

```text
## BLOCKER
TASK: TASK-xxx
Problema:
Impacto:
RF/RN/RNF/UC/ADR afetados:
Alternativas:
Recomendação:
Decisão necessária:
```

## Relatório obrigatório

Ao concluir, pare — não inicie a próxima TASK sem autorização explícita — e entregue:

```text
## TASK Execution Report
TASK: TASK-xxx
Status: DONE
Branch:
Commits:
### Primary Changes
### Incidental Changes
### Tests Executed
### Quality Gates
| Gate | Resultado |
### Scope Validation
Allowed Changes: PASS
Incidental Changes: PASS
Forbidden Changes: PASS
Scope Creep: NONE
### Definition of Done
PASS | FAIL
### Next Eligible TASK
TASK-xxx | NONE
```
