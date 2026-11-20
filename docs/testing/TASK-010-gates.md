# TASK-010 — Evidências dos gates

Atualizado em 2026-11-20. A ETAPA 005 foi aprovada em 2026-11-20. O roteiro da ETAPA 006 foi executado com oito cenários aprovados; aguardando revisão humana do relatório.

## Prontidão e plano

- GATE-001: APROVADO. TASK-007, dependência declarada, consta `DONE`; relatórios das TASKs 007–009 estão presentes e a branch `feature/TASK-010-wishlist-basica` foi criada com a árvore inicialmente limpa.
- GATE-002: APROVADO. RF-008/UC-008, decisões ADR-001/002/003/008, esquema Prisma, guards JWT/RBAC, módulo de catálogo, suíte existente e relatórios prévios foram inspecionados. A ampliação de escopo necessária foi aprovada pelo mantenedor antes da implementação.
- GATE-003: APROVADO. Plano mínimo: tabela própria com unicidade `(user_id, work_id)` e cascata de exclusão; operações vinculadas ao `sub` do JWT; só papel CUSTOMER; testes de isolamento/duplicação; painel de interface recebe token do chamador. Rollback: reverter commit da tarefa e aplicar a estratégia de rollback da migração antes de remover o modelo, em banco isolado.

## Mudanças e classificação

- Primárias: modelo/migração `WishlistItem`, módulo e controller API, cliente/painel da feature Web e testes de unidade.
- Incidentais operacionais: roteiro PowerShell e este registro de gates, exigidos pelo processo do repositório.
- Não há notificações, checkout, armazenamento de token ou alterações a autenticação.

## Matriz de gates

| Gate | Estado | Evidência/pendência |
|---|---|---|
| GATE-001 | APROVADO | `TASKS.md`, evidência das TASKs anteriores e branch verificados. |
| GATE-002 | APROVADO | Requisitos, ADRs, esquema, módulos e testes existentes revisados. |
| GATE-003 | APROVADO | Plano acima restrito ao escopo aprovado; banco PostgreSQL isolado identificado e integração executada. |
| GATE-004 | APROVADO | Implementação revisada; teste de unidade cobre isolamento, duplicata, remoção alheia e obra não disponível. |
| GATE-005 | APROVADO | 30/30 unitários; 4/4 integrações sem skips no banco isolado; lint, build completo, validação Prisma, formatação, parser PowerShell e `git diff --check` passaram. Migração `20261114120000_wishlist`, tabela e índices foram verificados no banco de integração. |
| GATE-006 | PENDENTE — REVISÃO HUMANA | Oito cenários executados e aprovados; usuário deve revisar `TASK-010-testes-manuais-resultado.md`. Fixtures e API temporária foram removidos após a execução. |
| GATE-007 | PENDENTE | Conclusão aguarda GATE-006 e revisão final; TASK não pode ser marcada DONE. Próxima tarefa continua bloqueada. |

## Comandos executados

| Comando | Resultado |
|---|---|
| `npm run db:generate` | Exit 0; Prisma Client gerado. |
| `npx prisma validate --schema=database/schema.prisma` | Exit 0; schema válido. |
| `npm run test` | Exit 0; 30 aprovados, 0 falhas, 0 skips. |
| `npm run lint` | Exit 0. |
| `npm run build` | Exit 0; API e Web compiladas. Uma execução no sandbox apresentou EPERM no cache `.next`; a repetição autorizada fora do sandbox concluiu a geração estática. |
| `npx prettier --check` nos arquivos TypeScript/TSX/JS da tarefa | Exit 0; todos os arquivos conferidos passam. O schema Prisma foi formatado/validado com `prisma format` e `prisma validate`. |
| Parser PowerShell 7 sobre o roteiro | Exit 0; sintaxe válida após revisão final. |
| `git diff --check` | Exit 0; sem erros de whitespace. Git emitiu apenas avisos de conversão LF/CRLF. |
| `npm run test:integration` | Exit 0; 4 aprovados, 0 falhas, 0 skips, usando apenas `lumina_task009_test`. A URL foi montada em memória a partir das configurações locais; não foi impressa nem gravada. |
| Verificação SQL em `lumina_task009_test` | Exit 0; tabela `wishlist_items`, migração `20261114120000_wishlist` e índices de chave primária, unicidade `(user_id, work_id)` e ordenação por usuário/data presentes. |
| `tests/manual/task-010/run-task-010-manual-tests.ps1` | Oito cenários APROVADO: HTTP 401 sem token; login CUSTOMER; adição HTTP 201; duplicação HTTP 409; isolamento entre clientes; exclusão alheia HTTP 404; item preservado após tentativa alheia; remoção própria HTTP 200. Relatório sanitizado gerado. |
| Cleanup dos fixtures e instância API temporária | Exit 0; zero obras, usuários, autores e editoras com prefixo sintético da tarefa; listener temporário na porta 3002 encerrado. |

## Revisão do Scope Guard e DoD

- A ampliação aprovada adicionou persistência e registro do módulo API ao escopo.
- Roteiro manual em `tests/manual/task-010/` é incidental operacional exigido por `AGENTS.md`.
- `database/schema.prisma`, migração, módulo API, feature Web e testes pertencem ao escopo aprovado.
- GATE-005 foi reexecutado depois que o Docker foi reaberto; integração passou no banco isolado e a migração da TASK-010 foi confirmada.
- GATE-006: a execução automatizada produziu oito resultados APROVADO, mas o gate segue pendente até revisão humana explícita do relatório.
- TASK permanece `IN_REVIEW`; a próxima TASK só fica elegível depois da conclusão dos testes manuais e GATE-007.
