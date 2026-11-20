# TASK-011 — Checkpoint PHASE-02

Atualizado em 2026-11-20. Branch: `feature/TASK-011-checkpoint-phase-02`.

## Etapas e evidências

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Prontidão | APROVADO | Branch específica; TASK-007–010 estão `DONE`; respectivos relatórios de testes/gates existem; checkout estava limpo antes da mudança deliberada de estado da TASK-011. |
| GATE-002 — Matriz | APROVADO | A matriz abaixo relaciona critérios a fontes e validações. Lacunas de plano SQL permanecem marcadas como bloqueio, sem inferir aprovação. |
| GATE-003 — Plano | APROVADO | Comandos independentes do banco e validações manuais delimitados abaixo. Docker indisponível nesta execução; integração e EXPLAIN não foram executados. |
| GATE-004 — Execução | BLOQUEADO | `npm run test` (30/30), `npm run lint`, `npm run build`, `npx prisma validate --schema=database/schema.prisma`, parser PowerShell e `git diff --check` passaram. Integração e plano SQL não executados porque Docker negou acesso ao socket. |
| GATE-005 — Manual e conclusão | AGUARDANDO TESTES MANUAIS | Roteiro preparado em `tests/manual/task-011/README.md`, todos os estados iniciais `NÃO EXECUTADO`. Somente o responsável humano pode preencher e aprovar. |

## Matriz de evidências

| Critério | Evidência esperada / fonte | Verificação | Resultado atual | Responsável |
|---|---|---|---|---|
| Autorizações do catálogo | `catalog` controller/guards e cenários de TASK-007/008 | Inspeção de guards; teste unitário; roteiro manual MT-011-01/02 | Guards JWT/RBAC existentes; cobertura de integração/manual consolidada pendente de revalidação humana | Agente + responsável humano |
| Busca, filtros e paginação | `catalog-search.service.ts`, testes e requisito TASK-008 | `npm run test`; revisão dos filtros e comportamento; roteiro MT-011-03 | 30 testes aprovados; teste unitário de busca cobre normalização de paginação, não plano SQL | Agente + responsável humano |
| Índices/plano de consultas relevantes | `database/schema.prisma`, migrações, DoD TASK-008 | Inspecionar índices e executar `EXPLAIN` no banco isolado para consulta representativa | Índices title, authorId e priceCents existem. Não há índice `releaseDate`; `contains` usa substring. EXPLAIN pendente por Docker inacessível; critério não comprovado | Agente / operador do banco |
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
| `npm run test:integration` | NÃO EXECUTADO | Docker respondeu `permission denied` ao acessar `npipe:////./pipe/dockerDesktopLinuxEngine`; sem integração sem DB isolado |
| `EXPLAIN` de busca por título/autor/categoria/faixa de preço e ordenação por data | NÃO EXECUTADO | Mesmo bloqueio de acesso ao Docker/banco isolado |

Critérios de parada: qualquer falha de autorização, exposição de `storageKey`/conteúdo original, falha de teste ou acesso ao banco diferente do isolado. Não alterar schema, migrações ou consultas nesta TASK: isso excede os caminhos permitidos e requer escopo aprovado.

Rollback: não há migração nem alteração de dados neste checkpoint. Se o roteiro manual criar dados sintéticos, remover apenas os registros criados pelo próprio roteiro após guardar evidência sanitizada.

## Bloqueio de escopo

O DoD da TASK-008 exige índices/revisão de plano. A revisão está incompleta: há índices para `title`, `authorId` e `priceCents`, mas não para `releaseDate`; a busca usa `contains`, e nenhuma evidência `EXPLAIN` foi localizada ou executada nesta sessão. Alterar índices/consultas exige tocar `database/schema.prisma`, migrações ou código de catálogo, caminhos não autorizados pela TASK-011.

### SCOPE ESCALATION

TASK: TASK-011  
Necessidade identificada: confirmar se os índices atuais atendem às consultas de catálogo/busca ou adicionar índices adequados.  
Motivo: o DoD de TASK-008 requer revisão de plano; faltam evidência de `EXPLAIN` e índice aparente para ordenação/filtro por data.  
Arquivos/módulos afetados: banco PostgreSQL isolado para `EXPLAIN`; potencialmente `database/schema.prisma`, `database/migrations/**` e `apps/api/src/modules/catalog/search/**`.  
Allowed Changes atual: testes/documentação PHASE-02; `TASKS.md`.  
Forbidden Changes relacionado: nenhum item nomeia índices, mas schema/código estão fora do permitido nesta tarefa; carrinho/pedidos seguem proibidos.  
Por que não é incidental: pode alterar schema, migração e comportamento/performance da busca.  
Impacto se não realizada: critério de índices e DoD da TASK-008 continuam sem evidência verificável; TASK-011 não pode concluir aceitação nem desbloquear PHASE-03.  
Alternativas: executar `EXPLAIN` em banco isolado e documentar que os planos atendem; ou aprovar uma tarefa/escopo específico para correção de índices/consulta.  
Recomendação: operador habilitar banco isolado e executar plano; se inadequado, autorizar mudança específica antes de implementação.  
Decisão necessária: fornecer acesso ao Docker/banco isolado para validação e aprovar escopo adicional se os planos exigirem mudança.

## Estado final desta rodada

TASK-011 permanece `IN_PROGRESS`; não há base para marcar `DONE` ou desbloquear PHASE-03. GATE-004 está bloqueado por Docker inacessível e resultado de build pendente; GATE-005 aguarda execução/revisão humana e depende do desbloqueio do GATE-004. TASK-012 permanece `BLOCKED`.
