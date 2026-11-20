# TASK-011 — Checkpoint PHASE-02

Atualizado em 2026-11-20. Branch: `feature/TASK-011-checkpoint-phase-02`.

## Etapas e evidências

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Prontidão | APROVADO | Branch específica; TASK-007–010 estão `DONE`; respectivos relatórios de testes/gates existem; checkout estava limpo antes da mudança deliberada de estado da TASK-011. |
| GATE-002 — Matriz | APROVADO | A matriz abaixo relaciona critérios a fontes e validações. Lacunas de plano SQL permanecem marcadas como bloqueio, sem inferir aprovação. |
| GATE-003 — Plano | APROVADO | Comandos independentes do banco e validações manuais delimitados abaixo; após confirmação do mantenedor, foi possível executar integração e EXPLAIN com acesso elevado ao Docker. |
| GATE-004 — Execução | APROVADO COM PENDÊNCIA DE ACEITAÇÃO | `npm run test:integration` passou 4/4 no banco isolado; `EXPLAIN ANALYZE` e listagem de índices executados. Busca por substring/data teve varreduras sequenciais e ordenação; resultado documentado como pendência de aceitação/escopo, não como índice aprovado. |
| GATE-005 — Manual e conclusão | AGUARDANDO TESTES MANUAIS | Roteiro preparado em `tests/manual/task-011/README.md`, todos os estados iniciais `NÃO EXECUTADO`. Somente o responsável humano pode preencher e aprovar. |

## Matriz de evidências

| Critério | Evidência esperada / fonte | Verificação | Resultado atual | Responsável |
|---|---|---|---|---|
| Autorizações do catálogo | `catalog` controller/guards e cenários de TASK-007/008 | Inspeção de guards; teste unitário; roteiro manual MT-011-01/02 | Guards JWT/RBAC existentes; cobertura de integração/manual consolidada pendente de revalidação humana | Agente + responsável humano |
| Busca, filtros e paginação | `catalog-search.service.ts`, testes e requisito TASK-008 | `npm run test`; revisão dos filtros e comportamento; roteiro MT-011-03 | 30 testes aprovados; teste unitário de busca cobre normalização de paginação, não plano SQL | Agente + responsável humano |
| Índices/plano de consultas relevantes | `database/schema.prisma`, migrações, DoD TASK-008 | Inspecionar índices e executar `EXPLAIN` no banco isolado para consulta representativa | `price_cents` usou `editions_price_cents_idx`; consulta por substring/data usou sequencial scans em `works`/`authors` e sort. Banco de teste sem registros: resultado não prova desempenho com volume real. Índices/schema inadequados ou não comprovados para aceitar o DoD | Agente / operador do banco |
| Autorização do inventário | controller/guards e relatório TASK-009 | Inspeção JWT/RBAC e cenários MT-011-04 | Relatório anterior registra cenários aprovados; nova revisão manual pendente | Responsável humano |
| Originais digitais não expostos | controller/service/storage, ausência de serving estático e relatório TASK-009 | Revisão da superfície de rotas, respostas sem storage key/conteúdo; tentativa pública em MT-011-05 | Código seleciona/retorna sem storageKey/contentBase64, rotas autenticadas; relatório TASK-009 documenta HTTP 401/404. Revalidação humana pendente | Agente + responsável humano |
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
| Parser PowerShell (`System.Management.Automation.Language.Parser`) | Exit 0 | Sintaxe de `tests/manual/task-011/run-task-011-manual-tests.ps1` válida |
| `npm run test:integration` (tentativa no sandbox) | Exit 1; 4 falhas de conexão | Sandbox não alcançou `localhost:5433`; não houve mutação no banco principal |
| `npm run test:integration` (acesso elevado, banco isolado) | Exit 0; 4 aprovados, 0 falhas, 0 skips | PostgreSQL em Docker; migrações deploy idempotente. Saída de seed continha ID sintético e foi omitida deste relatório |
| `EXPLAIN (ANALYZE, BUFFERS)` busca por substring + release date | Executado | Sem linhas na base; `Seq Scan` em `authors` e `works`, `Sort` por `release_date DESC, title ASC`; não existem índices para releaseDate ou busca substring no catálogo |
| `EXPLAIN (ANALYZE, BUFFERS)` faixa de preço + data | Executado | `Bitmap Index Scan` usou `editions_price_cents_idx`; depois `works_pkey`; `Sort` por data/título. Base sem linhas limita a utilidade de performance |
| Inventário de índices no banco de integração | Executado | `works_title_idx`, `works_author_id_idx`, `editions_price_cents_idx` e índices de PK/unique; nenhum índice em release_date; saída não inclui valores de dados |

Critérios de parada: qualquer falha de autorização, exposição de `storageKey`/conteúdo original, falha de teste ou acesso ao banco diferente do isolado. Não alterar schema, migrações ou consultas nesta TASK: isso excede os caminhos permitidos e requer escopo aprovado.

Rollback: não há migração nem alteração de dados neste checkpoint. Se o roteiro manual criar dados sintéticos, remover apenas os registros criados pelo próprio roteiro após guardar evidência sanitizada.

## Bloqueio de escopo

O DoD da TASK-008 exige índices/revisão de plano. Foram confirmados índices para `title`, `authorId` e `priceCents`, e executados planos representativos. Sem dados de catálogo no banco isolado, o otimizador escolheu varreduras sequenciais para busca por substring/data; isso não demonstra por si só inadequação, pois o volume é zero. Não há índice `releaseDate` e busca `contains` não usa os índices B-tree observados. A verificação conclusiva requer plano com fixture sintética representativa e revisão humana do critério de performance. Alterar índices/consultas exige tocar `database/schema.prisma`, migrações ou código de catálogo, caminhos não autorizados pela TASK-011.

### SCOPE ESCALATION

TASK: TASK-011  
Necessidade identificada: confirmar com dados sintéticos representativos se os índices atuais atendem às consultas de catálogo/busca ou se cabe adicionar índices.
Motivo: o DoD de TASK-008 requer revisão de plano; o plano atual foi medido sem linhas, não conclusivo para escala, não existe índice `releaseDate` e busca `contains` não usa os índices B-tree observados.
Arquivos/módulos afetados: banco PostgreSQL isolado para `EXPLAIN`; potencialmente `database/schema.prisma`, `database/migrations/**` e `apps/api/src/modules/catalog/search/**`.
Allowed Changes atual: testes/documentação PHASE-02; `TASKS.md`.
Forbidden Changes relacionado: nenhum item nomeia índices, mas schema/código estão fora do permitido nesta tarefa; carrinho/pedidos seguem proibidos.
Por que não é incidental: pode alterar schema, migração e comportamento/performance da busca.
Impacto se não realizada: adequação dos índices para volume representativo permanece sem comprovação; não alterar schema nesta TASK.
Alternativas: executar o cenário MT-011-07 com fixture sintética e decidir que índices atuais são suficientes; ou aprovar tarefa/escopo específico para correção.
Recomendação: responsável revisar o plano com volume representativo e deliberar sobre índice de data/estratégia de busca textual.
Decisão necessária: confirmar se a revisão com fixture atende o DoD ou aprovar escopo de implementação caso os planos demonstrem necessidade.

## Estado final desta rodada

TASK-011 permanece `IN_PROGRESS`; não há base para marcar `DONE` ou desbloquear PHASE-03. GATE-004 foi executado com sucesso quanto aos comandos, mas identificou pendência de aceitação sobre índices/plano. GATE-005 aguarda execução/revisão humana. TASK-012 permanece `BLOCKED`.
