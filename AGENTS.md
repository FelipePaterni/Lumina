# Contrato operacional

**Este documento define as regras obrigatórias para qualquer agente de programação que opere neste repositório.**

## Fontes de verdade e leitura obrigatória

Antes de qualquer TASK, leia nesta ordem: `AGENTS.md`, `README.md`, `TASKS.md`, ADRs relacionados, código existente e testes existentes.

| Fonte | Autoridade |
|---|---|
| `README.md` | requisitos, escopo, regras, domínio, arquitetura e APIs |
| `TASKS.md` | backlog, dependências, estado e Scope Guard |
| `AGENTS.md` | processo e restrições operacionais |
| `docs/adr/` | decisões arquiteturais aceitas |

Em conflito relevante entre fontes: **PARAR E SOLICITAR DECISÃO**. Não resolver por suposição.

## Ciclo obrigatório

1. Localize a primeira TASK `READY` pela ordem de execução.
2. Confirme que cada `DEPENDS_ON` está `DONE`, artefatos existem e testes da dependência passam.
3. Leia RF/RN/RNF/UC/ADR ligados, critérios, testes e Scope Guard.
4. Confirme Definition of Ready; só então altere `READY → IN_PROGRESS` em `TASKS.md`.
5. Trabalhe somente na TASK atual e em sua branch `feature/TASK-xxx-descricao`, `fix/...` ou `chore/...`.
6. Execute gates, classifique mudanças, altere para `IN_REVIEW`, valide DoD e só então `DONE`.
7. Apresente o relatório final e pare. A próxima TASK exige nova autorização, salvo execução contínua explicitamente autorizada.

Nunca desenvolver diretamente em `main`.

## Scope Guard

Toda alteração primária deve estar em `ALLOWED_CHANGES`. Uma alteração fora dele só é incidental se for mínima, localizada, diretamente causada pela TASK, tecnicamente necessária e não alterar requisito, regra, arquitetura ou contrato público. Registre-a no relatório.

É vedado tocar `FORBIDDEN_CHANGES`. Se o trabalho necessário exceder alteração incidental, parar e emitir:

```text
## SCOPE ESCALATION
TASK: TASK-xxx
Necessidade identificada:
Motivo:
Arquivos/módulos afetados:
Allowed Changes atual:
Forbidden Changes relacionado:
Por que não é incidental:
Impacto se não realizada:
Alternativas:
Recomendação:
Decisão necessária:
```

## Definition of Ready

Uma TASK é `READY` somente se requisitos/aceitação/testes/Scope Guard estão definidos, ADRs necessários aceitos, pendências bloqueantes resolvidas e dependências `DONE`. Caso contrário, é `BLOCKED`.

## Quality gates e Definition of Done

Gates aplicáveis: build, lint, testes unitários, integração, API, segurança, aceitação e regressão. Não afirme execução não realizada.

`DONE` exige implementação completa, gates aprovados, critérios satisfeitos, segurança e erros tratados, documentação necessária atualizada, commits rastreáveis, `TASKS.md` atualizado, e validação de que todas as mudanças são `PRIMARY` autorizadas ou `INCIDENTAL` justificadas; nenhuma pode ser proibida ou scope creep.

## Segurança e parada

Nunca exponha segredos, PII, arquivos originais ou tokens em código, logs, fixtures ou relatórios. Não reduza validações para passar testes. Pare diante de requisito ambíguo, dependência inválida, decisão arquitetural ausente, risco de segurança/perda de dados, quebra de contrato ou testes externos falhando:

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

## Commits e relatório

Use Conventional Commits: `<tipo>(<escopo>): <descrição> [TASK-xxx]`. Commits são pequenos, coesos e exclusivos da TASK.

Ao concluir, informe TASK, estado, branch, commits, mudanças primárias/incidentes, testes, tabela de gates, validação de Scope Guard, DoD e próxima TASK elegível. `README.md` não registra estado de execução.
