# TASK-014 — Plano e evidências dos gates

Atualizado em 2026-11-20. Branch: `feature/TASK-014-notificacoes-ciclo-pedido`.

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Prontidão | APROVADO | TASK-012 e TASK-013 `DONE`; requisitos RF-020/RN-019/UC-020, critérios e DoD definidos; ADR-005 `ACCEPTED`; branch própria; árvore inicial limpa. Scope Guard foi ampliado para `database/schema.prisma` e `database/migrations/**` por autorização explícita do responsável em 2026-11-20. |
| GATE-002 — Contexto | APROVADO | README, TASKS, ADR-005, código de identidade/pedidos e testes relacionados lidos. Baseline atual: `npm test` 46/46; `npm run lint` passou; build repetido isoladamente passou. Integração de TASK-013 7/7 e migrations estão registradas em seu relatório de gates. |
| GATE-003 — Planejamento | APROVADO | Mapeamento abaixo; alterações em identidade, pedido, notifications, persistência e testes; sem provedor externo, biblioteca/download ou interface web. Rollback por migration e reversão do commit da TASK. |
| GATE-004 — Implementação | APROVADO | Outbox persistente, módulo Notifications, estados/tentativas/retry, eventos de identidade e pedido; migration aditiva e rollback; diff classificado dentro do Scope Guard. |
| GATE-005 — Gates automatizados | APROVADO | Em 2026-11-20: `npm run lint`; `npm test` 50/50; `npm run test:integration` 8/8 no banco isolado `lumina_task009_test`; `npm run build` completo; `npx prisma validate`; deploy repetido das migrations; parser PowerShell/`node --check`; `git diff --check`. `npm audit --omit=dev` havia reportado 0 vulnerabilidades numa execução com acesso à rede; a repetição no sandbox não alcançou `registry.npmjs.org` por DNS. |
| GATE-006 — Testes manuais | APROVADO | Em 2026-11-20, os cenários MT-014-01 a MT-014-03 passaram na API local; a limpeza foi confirmada. Relatório revisado e aprovado explicitamente pelo responsável. |
| GATE-007 — Conclusão | APROVADO | Definition of Done validada: implementação, gates automatizados e manuais aprovados, relatório sanitizado registrado e alterações rastreadas nos commits `afaa404` e `a751948`; conclusão registrada neste commit. |

## Contexto confirmado

- RF-020 e RN-019 listam notificações simuladas de confirmação, recuperação, compra, mudanças relevantes de pedido/conta, exclusão e correção de arquivo; UC-020 determina que falha de notificação não invalide a operação de origem.
- `OutboxEmail` atual tem `toEmail`, `subject`, `body`, `sentAt`, `createdAt`; não há chave do evento, tentativas, código de falha nem agendamento de retry.
- `EmailDispatcherService` grava diretamente em `outbox_emails` e é chamado pelos fluxos de identidade. `OrderService.checkout` não emite notificação.
- Não existe módulo de notificações. API já carrega identidade e pedidos pela composição atual.
- Producers de correção de arquivo e mudanças de expedição ainda não existem dentro do escopo da TASK-014. O dispatcher será reutilizável para esses produtores futuros; esta TASK integrará os eventos de identidade existentes e a confirmação de compra.

## Arquivos mapeados

**Existentes a alterar:**

- `TASKS.md`
- `database/schema.prisma` e migration aditiva para outbox
- `apps/api/src/modules/identity/identity.module.ts`
- `apps/api/src/modules/identity/application/services/auth.service.ts`
- `apps/api/src/modules/identity/application/services/account.service.ts`
- `apps/api/src/modules/orders/order.module.ts`
- `apps/api/src/modules/orders/order.service.ts`
- testes de identidade/pedido e novos testes de notifications

**Novos:**

- `apps/api/src/modules/notifications/**` para evento, dispatcher/outbox, transporte simulado e retry worker
- `database/migrations/<timestamp>_task_014_notifications/`
- `tests/unit/notifications/**`, `tests/integration/notifications/**`
- `tests/manual/task-014/**` e relatório sanitizado `docs/testing/TASK-014-testes-manuais-resultado.md`

**Fora do escopo e não serão tocados:** interface web, gateway/provedor externo, módulos de biblioteca/arquivos, e endpoints de ciclo logístico ainda não existentes.

## Plano técnico

1. Estender o modelo existente de outbox com tipo de evento, chave única de deduplicação, status de entrega, tentativas, datas de tentativa/próximo retry e código de erro sanitizado; manter linhas históricas compatíveis por migration e incluir rollback SQL.
2. Criar serviço de notifications e worker local com transporte simulado, retry limitado e backoff observável. Não registrar destinatário, corpo, token, endereço nem PII em logs.
3. Migrar os dispatches de confirmação/recuperação/exclusão/reativação para eventos idempotentes; adicionar confirmação de compra após pedido confirmado e nunca em replay idempotente.
4. Falhas ao enfileirar/entregar devem ser capturadas fora da transação de negócio; compra, cadastro ou operação de conta já concluída não será revertida por falha de notificação.
5. Cobrir deduplicação concorrente, retry/sucesso/falha terminal, falha isolada da notificação, eventos de conta e pedido, e relatório manual sanitizado.

**Riscos e mitigação:** migration sobre tabela histórica é aditiva e repetida no banco isolado; unicidade protege deduplicação; logs só incluem tipo/tentativa/código controlado de falha; worker não chama rede externa; rollback preserva os campos históricos da tabela e remove somente os campos novos.

## Scope Guard

Primário: módulos API de notifications, identity e orders; schema/migration PostgreSQL; testes autorizados. `docs/testing/**` e `tests/manual/task-014/**` são artefatos operacionais mínimos exigidos pelo AGENTS.md. Nenhum caminho proibido será modificado.

## Resultado final dos gates automatizados

O banco isolado `lumina_task009_test` foi configurado somente em memória a partir de `.env`; as migrations estavam aplicadas e o deploy repetido foi validado pela suíte. `npm run test:integration` concluiu 8/8, incluindo os testes de identidade, checkout, migration e deduplicação do outbox. Nenhum teste foi executado contra o banco local principal `lumina`.

A repetição de `npm audit --omit=dev` durante a revisão final ficou indisponível por falha DNS do sandbox. A execução anterior com acesso à rede registrou zero vulnerabilidades de produção; nenhuma dependência foi alterada nesta etapa.
