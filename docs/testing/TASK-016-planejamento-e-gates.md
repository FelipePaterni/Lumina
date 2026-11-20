# TASK-016 — Plano e evidências dos gates

Data: 2026-11-20. Branch: `feature/TASK-016-checkpoint-transicao-phase-03`.

## GATE-001 — Recontextualização e prontidão

**Estado: APROVADO.** A tabela-resumo e a seção detalhada de `TASKS.md` divergiam: a primeira dizia `READY` e a segunda `BLOCKED`. Em 2026-11-20, o responsável decidiu que `READY` prevalece. O registro detalhado foi então alinhado e a TASK-016 iniciada nesta branch própria. TASK-012, TASK-013, TASK-014 e TASK-015 constam como `DONE`; existem os relatórios de gates e manuais de cada predecessora. O ADR-005 está `ACCEPTED`. Os critérios, DoD e Scope Guard da TASK-016 estão definidos.

**Inventário de arquivos:** existente a alterar: `TASKS.md`. Novos: este plano, `tests/manual/task-016/README.md`, `tests/manual/task-016/collect-task-016-results.ps1` e relatório sanitizado em `docs/testing/TASK-016-testes-manuais-resultado.md`. Não serão tocados: código de produto, schema/migrations, relatórios predecessores, nem funcionalidades de biblioteca/download.

## GATE-002 — Matriz de evidências

| Critério | Evidência esperada | Verificação | Resultado documental | Responsável |
|---|---|---|---|---|
| Dependências completas | TASK-012 a TASK-015 em `DONE`; relatórios de gates e manuais presentes | `TASKS.md` e existência dos oito relatórios | Confirmado na entrada; coletor repetirá a verificação | Automação local |
| Gates predecessores rastreáveis | Todos os gates publicados como `APROVADO` nos quatro planos | Inspeção/contagem de linhas de gate; coletor fará a checagem | TASK-012 (7), TASK-013 (7), TASK-014 (7), TASK-015 (5) aprovados nos planos versionados | Automação local |
| Evidência manual predecessora | Relatórios manuais preservados; revisão humana registrada onde a tarefa a exige | Inspeção de cada relatório e checklist do responsável | TASK-012 registra execução aprovada; TASK-013 registra 4 cenários e limpeza; TASK-014 registra revisão e 3 cenários; TASK-015 registra revisão e 4 cenários | Responsável humano confirma a leitura |
| Rastreabilidade para transição PHASE-04 | Cadeia de dependências, gates e limitações explícitos; nenhuma implementação de produto | Revisão final do diff e matriz | Aguardando revisão humana final | Responsável humano |
| DoD: TASK-017 torna-se elegível | TASK-016 concluída após gates aprovados; dependência 016 indicada em TASK-017 | Revisão de `TASKS.md` após aprovação manual | Pendente; TASK-017 não será desbloqueada agora | Responsável humano após aprovação |

## GATE-003 — Planejamento de validação

O checkpoint é documental e não altera API, web, banco ou contratos. Comandos reais planejados:

- `Get-Content TASKS.md` e inspeção dos relatórios versionados para confirmar a cadeia e os gates predecessores.
- `git diff --check` para validar o diff desta TASK.
- Parser PowerShell (`[System.Management.Automation.Language.Parser]::ParseFile`) para validar sintaxe do coletor sem executá-lo.
- O coletor manual valida apenas estados/artefatos locais e gera relatório sanitizado. Não acessa rede, API, banco, credenciais ou segredos.
- Revisão humana: executar o coletor no PowerShell, inspecionar o checklist e preencher evidência/status do cenário manual. A automação não marca a revisão humana como aprovada.

Critério de parada: qualquer predecessor sem `DONE`, artefato ausente, gate predecessor não aprovado, sintaxe inválida ou diff fora do escopo mantém o checkpoint bloqueado. Rollback: reverter somente os arquivos desta TASK e restaurar o estado anterior de TASK-016; nenhuma operação em banco é necessária.

## GATE-004 — Execução das validações disponíveis

**Estado: APROVADO para as verificações automatizáveis/documentais desta TASK.** A checagem dos registros de status e da existência dos artefatos confirmou a cadeia 012–015. Os quatro planos registram, respectivamente, 7, 7, 7 e 5 gates aprovados. Os relatórios de testes manuais existem. O parser do coletor e `git diff --check` foram executados sem erro. Nenhuma suíte de produto foi reexecutada: esta TASK não altera código e os resultados são evidência versionada das dependências concluídas. A revisão manual própria da TASK-016 não foi executada pelo agente.

## GATE-005 — Testes manuais e conclusão

**Estado: AGUARDANDO TESTES MANUAIS.** O roteiro está preparado em `tests/manual/task-016/README.md`. O cenário MT-016-01 começa como `NÃO EXECUTADO`; somente o responsável pode registrar sua revisão e evidência. Até a aprovação humana, TASK-016 permanece `IN_PROGRESS` e TASK-017 permanece `BLOCKED`.

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Prontidão | APROVADO | Status resolvido pelo responsável; dependências `DONE`, artefatos e ADR conferidos. |
| GATE-002 — Matriz de evidências | APROVADO | Matriz acima cobre todos os critérios e separa fatos documentais da revisão pendente. |
| GATE-003 — Planejamento | APROVADO | Comandos, ambiente local, critérios de parada e rollback definidos sem operação destrutiva. |
| GATE-004 — Validações documentais/automatizáveis | APROVADO | Estados e relatórios predecessores conferidos; parser PowerShell e `git diff --check` aprovados. |
| GATE-005 — Revisão manual e conclusão | AGUARDANDO TESTES MANUAIS | MT-016-01 está `NÃO EXECUTADO`; aprovação humana pendente. |

## Scope Guard

Alteração primária: `TASKS.md` e roteiro/configuração de validação PHASE-03. Incidental mínimo: `docs/testing/TASK-016-*.md`, exigido para registrar plano e relatório sanitizado. Não houve alteração de código de produto, persistência ou dependências. Nenhuma funcionalidade de PHASE-04 foi implementada.
