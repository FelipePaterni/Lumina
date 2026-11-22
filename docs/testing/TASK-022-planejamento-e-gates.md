# TASK-022 — Planejamento e gates

Data: 2026-11-22
Branch: `feature/TASK-022-avaliacoes-denuncia-moderacao`
Commit parcial: `3e8fb02` (`feat(reviews): add reviews and moderation [TASK-022]`)

## Contexto e prontidão

- TASK-020 está `DONE`; relatório e gates predecessores foram localizados em `docs/testing/TASK-020-testes-manuais-resultado.md`.
- RF-019/RF-022, RN-016/RN-017, critérios de aceite e DoD estão definidos em `README.md` e `TASKS.md`.
- ADR-003 (identidade, privacidade e auditoria) está `ACCEPTED`.
- O schema não tinha modelos de avaliação/denúncia. O responsável autorizou `database/schema.prisma` e `database/migrations/**` em 2026-11-21.
- A DoD requer que o catálogo exponha média apenas das avaliações visíveis. O responsável autorizou a integração mínima em `apps/api/src/modules/catalog/**` em 2026-11-21.
- A auditoria agora sanitiza e-mail, CPF, telefone com DDD, bearer token e JWT no motivo textual; regressão adicionada em `tests/unit/audit/audit-service.test.mjs`.
- Para liberar o lint global, o responsável autorizou em 2026-11-21 corrigir dois problemas preexistentes em `tests/manual/task-021/manual-environment.mjs` e `tests/manual/task-021/prepare-task-021-manual.mjs`.
- A documentação da tabela de APIs no `README.md` recebeu uma atualização incidental mínima para listar a fila de denúncias Admin.
- A working tree estava limpa em `main` antes da criação da branch específica.

## Plano de implementação

1. Persistir avaliações publicadas e denúncias com unicidade por usuário/obra e usuário/avaliação.
2. Permitir avaliação apenas a cliente autenticado e confirmado com aquisição confirmada ainda não integralmente reembolsada.
3. Permitir denúncia a qualquer usuário autenticado; restringir listagem de denúncias e remoção a Admin.
4. Remover logicamente, registrar motivo/moderador e gravar auditoria na mesma transação.
5. Expor no catálogo média e quantidade agregadas somente de avaliações visíveis.

Rollback: reverter o commit exclusivo da TASK-022 antes de aplicar a migração em ambientes compartilhados. A migração não foi aplicada a banco nesta etapa.

## Gates

| Gate | Resultado | Evidência |
|---|---|---|
| GATE-001 — Recontextualização e prontidão | APROVADO | TASK, branch, working tree, dependência e Scope Guard verificados; critérios e ADR encontrados. |
| GATE-002 — Contexto e pré-condições | APROVADO | Relatório TASK-020 localizado; arquitetura modular e padrões existentes de auditoria, RBAC, Prisma e pedidos inspecionados. |
| GATE-003 — Planejamento mínimo | APROVADO | Mudanças limitadas a Reviews, catálogo autorizado, schema/migração autorizados, testes e `TASKS.md`; rollback listado. |
| GATE-004 — Implementação controlada | APROVADO | API, schema, migração e agregados do catálogo implementados; build, validação Prisma, lint e suíte unitária passaram. |
| GATE-005 — Revisão/gates automatizados | APROVADO | Migração aplicada ao banco isolado `lumina_task009_test`; suíte completa de integração passou, incluindo TASK-022. |
| GATE-006 — Testes manuais | APROVADO (execução) | Roteiro HTTP sanitizado passou nos oito cenários com fixture sintética; revisão humana do relatório pendente. |
| GATE-007 — Conclusão/rastreabilidade | IN_REVIEW | Implementação, gates e relatório rastreados; aguardando revisão humana do resultado manual antes de `DONE`. |

### Comandos executados

- `npm run db:generate` — APROVADO.
- `npx prisma validate --schema=database/schema.prisma` — APROVADO.
- `npm run build` — APROVADO após remoção do cache `.next` gerado localmente, que falhava com `EPERM` durante prerender. A repetição sequencial passou.
- `npm run lint` — APROVADO após importar `URL` de `node:url` e remover hash não utilizado no preparador TASK-021. A ampliação mínima está autorizada e registrada no backlog.
- `npm run test` — APROVADO, 83/83.
- `npm run test:unit` — APROVADO, 82/82.
- `npm run test:integration` — APROVADO, 11/11; executado sequencialmente contra `lumina_task009_test`.
- `npx prisma migrate deploy --schema=database/schema.prisma` — APROVADO; aplicada a migração `20261121140000_task_022_reviews` somente ao banco de teste isolado.
- `tests/manual/task-022/run-task-022-manual-tests.ps1` — APROVADO, 8/8; API temporária na porta 3101, dados sintéticos e relatório sanitizado em `docs/testing/TASK-022-testes-manuais-resultado.md`.
- `node --check` nos testes unitário e de integração TASK-022 — APROVADO.
- Parser PowerShell no roteiro manual TASK-022 — APROVADO.
- `git diff --check` — APROVADO.
- Para a execução, `TASK009_TEST_DATABASE_URL` foi montada apenas em memória a partir da configuração de conexão local, com o nome do banco `lumina_task009_test`; nenhuma credencial foi impressa ou gravada. O container PostgreSQL estava saudável na porta 5433. A API temporária usou a mesma URL de teste e foi encerrada ao final. O banco `lumina` de desenvolvimento não foi usado para migração ou testes.

## Cenários para revisão manual

O roteiro foi executado com contas, pedido, obra e comentários sintéticos; tokens e IDs foram mantidos em memória e omitidos do relatório.

| ID | Cenário | Resultado esperado | Status |
|---|---|---|---|
| MT-022-01 | Visitante consulta a lista pública de avaliações | HTTP 200 para obra visível | APROVADO |
| MT-022-02 | Cliente confirmado com compra elegível avalia obra | Criada e imediatamente visível | APROVADO |
| MT-022-03 | Catálogo retorna média/contagem antes e depois da remoção | Apenas avaliações visíveis entram no agregado | APROVADO |
| MT-022-04 | Não adquirente tenta avaliar | Recusada sem criar avaliação | APROVADO |
| MT-022-05 | Usuário autenticado denuncia avaliação visível | Denúncia criada | APROVADO |
| MT-022-06 | Não Admin consulta denúncias; Admin consulta fila | Não Admin recebe 403; Admin recebe 200 | APROVADO |
| MT-022-07 | Admin tenta remover sem motivo e depois informa motivo | Sem motivo recebe 400; remoção gera auditoria e oculta a avaliação | APROVADO |
| MT-022-08 | Visitante consulta avaliação removida | Avaliação não aparece e não compõe a média | APROVADO |

## Pendência para conclusão

A implementação e os gates técnicos estão concluídos. A TASK permanece `IN_REVIEW` para revisão humana do relatório sanitizado de execução manual antes de atualizar para `DONE`.
