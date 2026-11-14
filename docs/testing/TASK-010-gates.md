# TASK-010 — Evidências dos gates

Atualizado em 2026-11-14. A TASK permanece em revisão até execução e aprovação humana do roteiro manual.

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
| GATE-003 | APROVADO | Plano acima restrito ao escopo aprovado; fallback de integração manual documentado. |
| GATE-004 | APROVADO | Implementação revisada; teste de unidade cobre isolamento, duplicata, remoção alheia e obra não disponível. |
| GATE-005 | BLOQUEADO POR AMBIENTE EXTERNO | 30/30 unitários; lint, build API/Web, Prisma validate e sintaxe PowerShell passaram. `npm run test:integration` foi executado, mas os 4 cenários falharam antes de iniciar porque `TASK009_TEST_DATABASE_URL` não está configurada; Docker Desktop/daemon não está disponível para prover o PostgreSQL isolado. |
| GATE-006 | APROVADO — ROTEIRO PRONTO | Oito cenários têm procedimento automatizado, status inicial NÃO EXECUTADO e relatório sanitizado. Execução e revisão humana ainda pendentes. |
| GATE-007 | AGUARDANDO TESTES MANUAIS | Relatório rastreável; TASK não pode ser marcada DONE até resultados e revisão humana. Próxima tarefa continua bloqueada. |

## Comandos executados

| Comando | Resultado |
|---|---|
| `npm run db:generate` | Exit 0; Prisma Client gerado. |
| `npx prisma validate --schema=database/schema.prisma` | Exit 0; schema válido. |
| `npm run test` | Exit 0; 30 aprovados, 0 falhas, 0 skips. |
| `npm run lint` | Exit 0. |
| `npm run build --workspace=@lumina/api` | Exit 0. |
| `npm run build --workspace=@lumina/web` | Exit 0 após remover somente o cache ignorado `apps/web/.next`; a primeira tentativa falhou com EPERM ao criar diretório no cache. |
| Parser PowerShell 7 sobre o roteiro | Exit 0; sintaxe válida. |
| `npx prettier --check` nos arquivos TypeScript/TSX/JS da tarefa | Exit 0; todos os arquivos conferidos passam. O schema Prisma foi formatado/validado com `prisma format` e `prisma validate`. |
| Parser PowerShell 7 sobre o roteiro | Exit 0; sintaxe válida após revisão final. |
| `git diff --check` | Exit 0; sem erros de whitespace. Git emitiu apenas avisos de conversão LF/CRLF. |
| `npm run test:integration` | Exit 1; 4 cenários falharam na pré-condição porque `TASK009_TEST_DATABASE_URL` não está configurada. `docker ps` confirmou que o daemon Docker não está acessível. Nenhum cenário chegou a modificar banco. |

## Revisão do Scope Guard e DoD

- A ampliação aprovada adicionou persistência e registro do módulo API ao escopo.
- Roteiro manual em `tests/manual/task-010/` é incidental operacional exigido por `AGENTS.md`.
- `database/schema.prisma`, migração, módulo API, feature Web e testes pertencem ao escopo aprovado.
- GATE-006 exige execução humana; nenhum resultado manual foi presumido.
- TASK permanece `IN_REVIEW`; não há commit de conclusão nem próxima TASK elegível enquanto faltarem PostgreSQL de integração e revisão manual.
