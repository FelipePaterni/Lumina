# TASK-020 — Planejamento e evidências dos gates

Data: 2026-11-21  
Branch: `feature/TASK-020-checkpoint-phase-04`

## GATE-001 — Recontextualização e prontidão

**Estado: APROVADO.** A árvore de trabalho inicial estava limpa em `main`; a branch específica foi criada antes das alterações. TASK-017, TASK-018 e TASK-019 estão `DONE`. Seus relatórios automatizados e manuais existem e documentam os gates aprovados. `ADR-003`, `ADR-004` e `ADR-005` estão `ACCEPTED`. Objetivo, dependências, critérios, DoD e Scope Guard da TASK-020 estão definidos em `TASKS.md` e `prompts/tasks/task-020/README.md`. A task foi promovida para `IN_PROGRESS` após autorização do responsável.

### Fatos confirmados e evidências das dependências

| Dependência | Estado | Artefatos verificados | Evidência automatizada/manual |
|---|---|---|---|
| TASK-017 | DONE | `docs/testing/TASK-017-planejamento-e-gates.md`; `docs/testing/TASK-017-testes-manuais-resultado.md`; `tests/manual/task-017/` | gates automatizados e MT-017-01 a MT-017-04 aprovados; revisão humana da cópia marcada aprovada. |
| TASK-018 | DONE | `docs/testing/TASK-018-planejamento-e-gates.md`; `docs/testing/TASK-018-testes-manuais-resultado.md`; `tests/manual/task-018/` | `npm test` 64/64; integração 9/9; MT-018-01 a MT-018-04 aprovados e revisão humana aprovada. |
| TASK-019 | DONE | `docs/testing/TASK-019-planejamento-e-gates.md`; `docs/testing/TASK-019-testes-manuais-resultado.md`; `tests/manual/task-019/` | `npm test` 69/69; integração 10/10; reembolso/restauração conferidos; MT-019-00 a MT-019-03 aprovados e revisão humana aprovada. |

**Inferência controlada:** em conjunto, as evidências predecessoras cobrem biblioteca/cópia personalizada, bundle e lançamento, reembolso digital/físico. Esta TASK adiciona um teste de regressão específico para a interação entre reembolso e link digital já emitido.

## GATE-002 — Matriz de evidências

| Critério | Evidência esperada | Comando/inspeção | Resultado nesta branch |
|---|---|---|---|
| Original protegido e cópia personalizada | endpoints servem somente cópia derivada autenticada/temporária; nenhum original é exposto | testes existentes TASK-017; `npm test`; revisão de `LibraryService`, `LibraryController` e `PrivateLocalStorage` | A EXECUTAR |
| Regras temporais | pré-venda bloqueia download antes da data e libera na data; cancelamento respeita janelas aprovadas | testes de bundles/pré-venda e reembolso; `npm test`; integração | A EXECUTAR |
| Reversão digital | reembolso restaura licença exatamente uma vez e revoga o acesso, inclusive link emitido anteriormente | integração de TASK-019 e novo `tests/unit/library/refunded-download.test.mjs`; `npm test`, `npm run test:integration` | A EXECUTAR |
| Fluxo de bundle | posse parcial ajusta valor, posse integral bloqueia, direitos são concedidos por edição | relatório TASK-018 e integração | A EXECUTAR |
| Ciclo de reembolso físico | Admin decide e reposição só ocorre com cancelamento/devolução conforme estado | relatório TASK-019 e integração | A EXECUTAR |
| Revisão humana PHASE-04 | responsável revisa matriz e relatório consolidado, sem inferir aprovação de uma execução automatizada | roteiro `tests/manual/task-020/README.md` e relatório manual | NÃO EXECUTADO |
| DoD: PHASE-05 desbloqueada | todos os gates, inclusive revisão humana, aprovados | atualização final de `TASKS.md` | BLOQUEADO enquanto a revisão manual não for aprovada |

### Arquivos

- Alterado: `TASKS.md` (estado e prontidão da TASK-020).
- Novos: `docs/testing/TASK-020-planejamento-e-gates.md`; `docs/testing/TASK-020-testes-manuais-resultado.md`; `tests/unit/library/refunded-download.test.mjs`; `tests/manual/task-020/README.md` e seu coletor executável de evidências.
- Não serão tocados: módulos de produto, schema/migrations, logística, avaliações, painéis, arquivos originais e dados locais.

## GATE-003 — Planejamento de validação

**Estado: APROVADO.** Verificações são locais e não destrutivas. A integração só é permitida se `TASK009_TEST_DATABASE_URL` apontar para `lumina_task009_test` (a própria suíte valida o nome). Nenhum teste é direcionado ao banco de desenvolvimento. Os comandos não escrevem credenciais nos relatórios.

| Verificação | Comando | Evidência | Critério |
|---|---|---|---|
| Build | `npm run build` | código de saída e saída final | zero |
| Lint | `npm run lint` | código de saída | zero |
| Testes unitários/smoke | `npm test` | contagem e código de saída | todos aprovados |
| Integração | `npm run test:integration` | contagem e código de saída | todos aprovados; apenas DB isolado |
| Prisma | `npx prisma validate --schema database/schema.prisma` | código de saída | zero |
| Teste manual agregado | `./tests/manual/task-020/run-task-020-manual-evidence.ps1` | relatório sanitizado | evidências predecessor encontradas; status bloqueado até revisão humana explícita |
| Diff | `git diff --check` | código de saída | zero |

Rollback: descartar apenas os arquivos de evidência/teste exclusivos da TASK-020 antes de concluir; nenhuma migração, arquivo de storage ou dado persistente de aplicação será criado por esta TASK. Critério de parada: falha automatizada, evidência predecessora ausente/contraditória, ambiente de integração sem confirmação de banco isolado ou qualquer necessidade de editar módulos fora do escopo.

## GATE-004 — Execução das validações

**Estado: APROVADO em 2026-11-21.** Resultados observados nesta branch:

| Verificação | Comando/operação | Resultado |
|---|---|---|
| Build | `npm run build` | APROVADO. A primeira tentativa no sandbox falhou com `EPERM` ao criar artefato de prerender em `.next`; repetição autorizada fora do sandbox concluiu com código 0. |
| Lint | `npm run lint` | APROVADO, código 0. |
| Testes unitários/smoke | `npm test` | APROVADO, 70/70. Inclui `a previously issued digital link stops working after its purchase is refunded`. |
| Integração | `npm run test:integration` | APROVADO, 10/10. A primeira chamada sem configuração terminou no preflight por ausência de `TASK009_TEST_DATABASE_URL`, sem abrir conexão; repetição com URL montada em memória e nome validado `lumina_task009_test` passou. Credenciais foram removidas da saída. |
| Prisma | `npx prisma validate --schema database/schema.prisma` | APROVADO, schema válido. |
| Sintaxe do coletor | PowerShell `Parser.ParseFile` | APROVADO, sem erros sintáticos. |
| Diff | `git diff --check` | APROVADO, código 0. |

O build API foi compilado antes da suíte unitária; build geral executado novamente com sucesso. A regressão confirma que, depois da emissão de um link, a ausência de entitlement após reembolso gera 404 antes de ler a cópia derivada.

## GATE-005 — Revisão manual e conclusão

**Estado: APROVADO pelo responsável em 2026-11-21.** O responsável executou o coletor com `-HumanReviewConfirmed` após revisar as evidências consolidadas; MT-020-01 a MT-020-05 constam como APROVADO em `docs/testing/TASK-020-testes-manuais-resultado.md`. TASK-020 foi concluída e TASK-021 tornou-se a primeira TASK READY da PHASE-05. Nenhuma implementação da TASK-021 foi iniciada.

## Scope Guard

Alterações primárias autorizadas: testes e documentação PHASE-04 e `TASKS.md`. Não há alteração de produto. Nenhuma mudança alcança os caminhos proibidos de logística, avaliações ou painéis.
