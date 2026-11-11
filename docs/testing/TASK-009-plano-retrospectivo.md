# TASK-009 — plano mínimo e revisão retrospectiva

**Data da revisão:** 2026-11-11
**Natureza:** retrospectiva, autorizada pelo mantenedor nesta data. Este documento não afirma que o plano foi aprovado antes da implementação nem retroage datas.

## Objetivo e critérios

- Gerir estoque físico e limites de licença digital com validação por formato de edição e auditoria.
- Manter versões de ativos digitais privadas, sem expor conteúdo ou chave de armazenamento nas respostas.
- Critérios principais: RF-006/RF-007, RN-003/RN-004, UC-006/UC-007, ADR-004 e RNF-010.

## Escopo confirmado

- API: `apps/api/src/modules/inventory/**`, `apps/api/src/modules/catalog/assets/**`, `apps/api/src/storage/**`.
- Banco: `database/**`, incluindo migração aditiva de reconciliação de schema.
- Testes/roteiros: `tests/**`.
- Evidências e workflow da TASK: `docs/testing/TASK-009-*.md`, `prompts/tasks/task-009/**`, `TASKS.md`.
- Proibido: rota pública que sirva originais; pedidos.

## Revisão das alterações e validação

| Área | Alteração/revisão | Evidência/validação |
|---|---|---|
| Inventário | Rejeitar estoque físico em edição digital e limite digital em edição física. | Unitários de inventário; auditoria e validação de limites. |
| Ativos | Validar conteúdo privado, omitir campos internos e rejeitar edição física. | Unitários de ativos; cenários manuais MT-009-07–10; inspeção de controllers. |
| Banco | Reconciliar objetos ausentes apesar da migração original constar aplicada. Migração corretiva aditiva e idempotente. | Deploy em `lumina_task009_test`; verificação de tabelas, enum e deploy repetido. |
| Segurança | Não servir original por rota pública; revisar surface de rotas e testar requisições anônimas. | MT-009-10, com evidência de rota presumida como teste complementar. |
| Gate de qualidade | Executar checks automatizados em banco de teste isolado e formatação nos arquivos da task. | Matriz `TASK-009-gates.md`. |

## Estratégia de recuperação

As migrações são forward-only neste fluxo. Não executar rollback da migração corretiva em banco com dados; em recuperação, restaurar backup validado ou preparar uma nova migração aditiva após revisão. O teste de migração executa deploy idempotente em `lumina_task009_test` e não reverte schema.

## Desvio de processo

Os gates 001–004 não tinham registros duráveis quando a implementação já estava presente na branch. O mantenedor autorizou em 2026-11-11 uma avaliação retrospectiva com desvio de sequência explicitamente registrado. As aprovações dos gates 001–004 abaixo são efetivas nesta data e não certificam que a sequência original foi cumprida.
