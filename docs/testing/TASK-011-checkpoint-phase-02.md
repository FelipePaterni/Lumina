# TASK-011 — Checkpoint PHASE-02

Atualizado em 2026-11-20. Branch: `feature/TASK-011-checkpoint-phase-02`.

## Etapas e evidências

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Prontidão | APROVADO | Branch específica; TASK-007–010 estão `DONE`; respectivos relatórios de testes/gates existem; checkout estava limpo antes da mudança deliberada de estado da TASK-011. |
| GATE-002 — Matriz | APROVADO | A matriz abaixo relaciona critérios a fontes e validações. A pendência original do plano SQL foi resolvida com fixture sintética, medição e aprovação humana documentadas. |
| GATE-003 — Plano | APROVADO | Comandos independentes do banco e validações manuais delimitados abaixo; após confirmação do mantenedor, foi possível executar integração e EXPLAIN com acesso elevado ao Docker. |
| GATE-004 — Execução | APROVADO COM PENDÊNCIA DE ACEITAÇÃO | `npm run test:integration` passou 4/4 no banco isolado; `EXPLAIN ANALYZE` e listagem de índices executados. Busca por substring/data teve varreduras sequenciais e ordenação; resultado documentado como pendência de aceitação/escopo, não como índice aprovado. |
| GATE-005 — Manual e conclusão | APROVADO | MT-011-01–07 aprovados por execução recente ou evidência manual anterior aprovada. O responsável aprovou em 2026-11-20 o plano textual medido (Seq Scan, 14,655 ms em 10.000 linhas sintéticas) para o escopo atual; rollback confirmou zero linhas remanescentes. |

## Matriz de evidências

| Critério | Evidência esperada / fonte | Verificação | Resultado atual | Responsável |
|---|---|---|---|---|
| Autorizações do catálogo | `catalog` controller/guards e cenários de TASK-007/008 | Inspeção de guards; teste unitário; roteiro manual MT-011-01/02 | MT-011-01 e MT-011-02 aprovados manualmente; CUSTOMER recebeu 403 ao PATCH | Agente + responsável humano |
| Busca, filtros e paginação | `catalog-search.service.ts`, testes e requisito TASK-008 | `npm run test`; revisão dos filtros e comportamento; roteiro MT-011-03 | 30 testes aprovados; teste unitário de busca cobre normalização de paginação, não plano SQL | Agente + responsável humano |
| Índices/plano de consultas relevantes | `database/schema.prisma`, migrações, DoD TASK-008 | Inspecionar índices e executar `EXPLAIN` no banco isolado com fixture representativa | Com 10.000 obras/edições sintéticas, busca por texto/data fez Seq Scan em `works`/`authors` e top-N sort (14,655 ms); preço usou `editions_price_cents_idx` e `works_pkey` (0,160 ms). Limpeza via rollback confirmou zero linhas da fixture. Sem SLO de busca, adequação do plano textual aguarda decisão humana | Responsável técnico |
| Autorização do inventário | controller/guards e relatório TASK-009 | Inspeção JWT/RBAC e cenários MT-011-04 | CUSTOMER recebeu HTTP 403; ADMIN recebeu HTTP 200, sem mutação | Responsável humano |
| Originais digitais não expostos | controller/service/storage, ausência de serving estático e relatório TASK-009 | Revisão da superfície de rotas, respostas sem storage key/conteúdo; tentativa pública em MT-011-05 | Sem token HTTP 401; com ADMIN HTTP 200 e resposta sem `storageKey`/`contentBase64` | Agente + responsável humano |
| Isolamento de wishlist | módulo e relatório TASK-010 | Cenários de isolamento MT-011-06 | TASK-010 reporta oito cenários aprovados e aprovação humana em 2026-11-20; reapresentado no roteiro para checkpoint | Responsável humano |

## Plano e execução automatizada

Ambiente identificado: Node `v24.19.0`, npm `12.2.1`, projeto npm workspaces; schema Prisma em `database/schema.prisma`. A integração deve usar somente o banco isolado `lumina_task009_test`, nunca base de desenvolvimento/produtiva. Nenhum segredo foi lido ou incluído no relatório.

| Comando/operação | Saída/código | Evidência |
|---|---|---|
| `npm run test` | Exit 0; 30 aprovados, 0 falhas, 0 skips | Saída do Node test runner em 2026-11-20 |
| `npm run lint` | Exit 0 | ESLint sem avisos/erros |
| `npx prisma validate --schema=database/schema.prisma` | Exit 0 | Schema válido |
| `git diff --check` | Exit 0 | Sem erros de whitespace |
| `npm run build` | Exit 0 | API TypeScript e Web Next.js compilados; páginas estáticas geradas |
| Parser PowerShell (`System.Management.Automation.Language.Parser`) | Exit 0 | Sintaxe dos roteiros `run-task-011-manual-tests.ps1` e `run-task-011-query-plan.ps1` válida |
| `npm run test:integration` (tentativa no sandbox) | Exit 1; 4 falhas de conexão | Sandbox não alcançou `localhost:5433`; não houve mutação no banco principal |
| `npm run test:integration` (acesso elevado, banco isolado) | Exit 0; 4 aprovados, 0 falhas, 0 skips | PostgreSQL em Docker; migrações deploy idempotente. Saída de seed continha ID sintético e foi omitida deste relatório |
| `EXPLAIN (ANALYZE, BUFFERS)` busca por substring + release date | Executado em banco vazio e repetido com 10.000 obras sintéticas | Com a fixture: `Seq Scan` em `works`/`authors`, top-N sort, 14,655 ms; a consulta `%synthetic%` retornou 100 de 10.000 linhas. Índices B-tree existentes não foram usados para substring |
| `EXPLAIN (ANALYZE, BUFFERS)` faixa de preço + data | Executado em banco vazio e repetido com 10.000 edições sintéticas | `editions_price_cents_idx` e `works_pkey` usados; 0,160 ms para faixa seletiva de preço, com sort por data/título |
| Rollback da fixture sintética | Exit 0 | `ROLLBACK`; consulta subsequente confirmou `synthetic_rows_remaining = 0` no banco isolado |
| Inventário de índices no banco de integração | Executado | `works_title_idx`, `works_author_id_idx`, `editions_price_cents_idx` e índices de PK/unique; nenhum índice em release_date; saída não inclui valores de dados |

Critérios de parada: qualquer falha de autorização, exposição de `storageKey`/conteúdo original, falha de teste ou acesso ao banco diferente do isolado. Não alterar schema, migrações ou consultas nesta TASK: isso excede os caminhos permitidos e requer escopo aprovado.

Rollback: não há migração nem alteração de dados neste checkpoint. Se o roteiro manual criar dados sintéticos, remover apenas os registros criados pelo próprio roteiro após guardar evidência sanitizada.

## Questão de escopo analisada

O DoD da TASK-008 exige índices/revisão de plano. Foram confirmados índices para `title`, `authorId` e `priceCents`, e executados planos com 10.000 obras/edições sintéticas. O preço usou o índice esperado; a busca por substring/data percorreu 10.000 obras/autores e levou 14,655 ms. Não há índice `releaseDate`; busca `contains` não usa os B-tree observados. Em 2026-11-20, o responsável aprovou esse plano para o escopo atual; a otimização textual pode ser reavaliada antes de ampliar a escala. Nenhuma mudança de schema/consulta foi autorizada ou realizada nesta TASK.

### SCOPE ESCALATION — RESOLVIDA

Status: responsável aprovou em 2026-11-20 o plano medido para o escopo atual; nenhuma alteração de código/schema foi solicitada.

TASK: TASK-011  
Necessidade identificada: decidir se o plano de busca textual (14,655 ms em 10.000 obras, sem índice usado) atende ao DoD ou se é necessário adicionar índices/alterar estratégia de consulta.
Motivo: o DoD de TASK-008 requer revisão de plano; o plano foi medido com fixture representativa. O preço usa índice em 0,160 ms, mas a busca textual faz varredura sequencial. Não há limite de latência/escala definido para decidir adequação.
Arquivos/módulos afetados: banco PostgreSQL isolado para `EXPLAIN`; potencialmente `database/schema.prisma`, `database/migrations/**` e `apps/api/src/modules/catalog/search/**`.
Allowed Changes atual: testes/documentação PHASE-02; `TASKS.md`.
Forbidden Changes relacionado: nenhum item nomeia índices, mas schema/código estão fora do permitido nesta tarefa; carrinho/pedidos seguem proibidos.
Por que não é incidental: pode alterar schema, migração e comportamento/performance da busca.
Impacto se não realizada: não é possível declarar aceitação dos índices nem concluir TASK-011/desbloquear PHASE-03.
Alternativas: aceitar o plano medido para a escala atual; ou aprovar escopo específico para índices/estratégia de busca e critérios de desempenho.
Recomendação: definir um limite de latência e escala de referência; com esse critério, aceitar o plano ou priorizar mudança específica.
Decisão necessária: RESOLVIDA — em 2026-11-20, o responsável aprovou o plano medido para o escopo atual. Nenhuma mudança de schema/consulta foi autorizada nesta TASK.

## Estado final desta rodada

TASK-011 concluída como `DONE` em 2026-11-20 após aprovação humana dos sete cenários, dos gates, da decisão de aceitação, do Scope Guard e do DoD. GATE-004 e GATE-005 aprovados. PHASE-03 desbloqueada; TASK-012 está `READY` e aguarda autorização própria para iniciar. Nenhum trabalho da TASK-012 foi iniciado.
