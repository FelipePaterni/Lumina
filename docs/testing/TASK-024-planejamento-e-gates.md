# TASK-024 — Planejamento e gates

Data: 2026-11-22  
Branch: `feature/TASK-024-privacidade-observabilidade`

## Recontextualização e prontidão

- Estado inicial: `BLOCKED`; working tree limpa em `main` no commit `c00b204`.
- Dependência `TASK-020`: `DONE`; relatório manual aprovado localizado em `docs/testing/TASK-020-testes-manuais-resultado.md`.
- `TASK-021`, `TASK-022` e `TASK-023` também constam `DONE`; relatórios de resultado/revisão localizados em `docs/testing/TASK-021-testes-manuais-resultado.md`, `docs/testing/TASK-022-planejamento-e-gates.md` e `docs/testing/TASK-023-testes-manuais-resultado.md`.
- ADR-003 está `ACCEPTED`; RN-018 permite janela configurável, com 30 dias como padrão; PD-002 mantém pendente a política jurídica definitiva.
- O schema já contém `User.deactivatedAt`, `User.scheduledDeletionAt` e `OutboxEmail` com estados, tentativas, lease e código de falha. Nenhuma migração é necessária.
- Código existente já desativa/reativa contas, notifica cliente/Admin e persiste a outbox; o prazo, porém, está fixo em 30 dias. Existe painel de equipe em `/dashboard`, mas não existe painel técnico.
- Decisão do responsável nesta conversa: painel Admin local com saúde API/banco, agregados da outbox e acompanhamento agregado de solicitações de exclusão; sem PII e sem serviço externo.

## Gates de contexto e planejamento

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Recontextualização e prontidão | APROVADO | Task, branch, working tree, dependência, critérios e Scope Guard confirmados; alterações anteriores preservadas. |
| GATE-002 — Contexto e pré-condições | APROVADO | ADR-003, relatórios das dependências, schema, módulos de identidade/auditoria/notificações e painel existente inspecionados. Build/lint/testes serão executados no GATE-005 conforme scripts do repositório. |
| GATE-003 — Planejamento mínimo | APROVADO | Plano abaixo limita implementação a identidade, auditoria, novo módulo observability, feature do dashboard, testes, roteiro/relatório manual e TASKS. Sem schema/migration; rollback por reversão dos commits exclusivos. |
| GATE-004 — Implementação controlada | APROVADO | Configuração do prazo, endpoint Admin agregado, seção Operação e sanitização implementados dentro do Scope Guard; sem schema/migração. |
| GATE-005 — Revisão e gates automatizados | APROVADO | Build, lint, smoke/unit (93/93), integração (13/13 no banco isolado), parser Node/PowerShell e `git diff --check` passaram. `npm run format:check` reporta baseline de 200 arquivos; não é gate operacional definido e não foi aplicada formatação em massa. |
| GATE-006 — Testes manuais | APROVADO | Roteiro executado com dados sintéticos; HTTP/API 7/7 aprovados e MT-024-UI-01 a MT-024-UI-03 aprovados explicitamente pelo responsável em 2026-11-22. Aprovação registrada no relatório manual sanitizado. |
| GATE-007 — Conclusão e rastreabilidade | APROVADO | Relatório e `TASKS.md` atualizados; Scope Guard, gates, limites PD-002 e DoD conferidos. |

## Plano mínimo

1. Ler `ACCOUNT_DELETION_GRACE_PERIOD_DAYS` no serviço de contas; ausente significa 30 dias; valor não inteiro positivo causa erro de configuração explícito. Não criar lógica de exclusão definitiva.
2. Criar módulo `observability` e `GET /admin/observability/dashboard`, usando JWT/RBAC existente. Retorno contém disponibilidade API (resposta ao endpoint) e banco (consulta `SELECT 1` capturada sem erro bruto), contagem de notificações por estado, total de solicitações dentro da janela, total com prazo vencido e próxima data prevista. `FAILED > 0` ou `PROCESSING` cujo lease (`nextAttemptAt`) venceu gera alerta agregado.
3. Derivar solicitações de usuários inativos com `scheduledDeletionAt` definido; vencidas permanecem apenas em revisão agregada, sem exclusão ou identificação.
4. Incluir seção “Operação” apenas para Admin em `/dashboard`, com estados, contagens, próxima data e mensagens de erro genéricas; nenhuma PII, ID, motivo, e-mail, assunto ou corpo de notificação.
5. Sanitizar falha de escrita de auditoria, removendo mensagem crua da exceção; preservar ação/código técnico sem dados do evento.
6. Testar serviço de resumo com mocks, integração HTTP com papéis, ausência de PII, configuração da janela e regressão do ciclo existente. Roteiro manual HTTP/UI/segurança em `tests/manual/task-024/`, dados sintéticos em memória, relatório em `docs/testing/TASK-024-testes-manuais-resultado.md`.

## Arquivos e rollback

- Primários previstos: `apps/api/src/modules/identity/**`, `apps/api/src/modules/audit/**`, `apps/api/src/modules/observability/**`, `apps/web/src/features/dashboard/**`, `tests/**`, `tests/manual/task-024/**`, `docs/testing/TASK-024-*`, `README.md` (contrato HTTP e variável de configuração) e `TASKS.md`.
- Não tocar: schema/migrações, política legal definitiva, gateways/serviços externos, arquivos originais ou outros módulos de negócio.
- Rollback: reverter commits da TASK-024; sem migração ou mudança de dados necessária.

## Registro de prontidão

Após resolver a lacuna de indicadores e alinhar o Scope Guard com os caminhos reais, a tarefa passou de `BLOCKED` para `READY` em 2026-11-22. GATE-001 a GATE-003 aprovados. Em seguida, mudou para `IN_PROGRESS` na branch própria. Commits: `893ed7b` (prontidão e plano).

## Implementação e evidências

- `GET /admin/observability/dashboard` restringe acesso a `ADMIN`; retorna somente status da API/banco, contagens de estados da outbox, contagens de solicitações futuras/vencidas e próxima data. Indica falhas terminais e leases expirados. Banco indisponível resulta em `UNAVAILABLE` e métricas `null`, nunca zeros presumidos.
- Painel `/dashboard` ganhou seção Operação disponível apenas para Admin. Dados pessoais e payloads não entram no contrato do painel.
- `ACCOUNT_DELETION_GRACE_PERIOD_DAYS` usa padrão 30, valida inteiro positivo na inicialização e afeta data/mensagem da janela; vencimento não dispara exclusão.
- Auditoria não registra mensagem bruta de erro de persistência.
- Mudança incidental: registro de `ObservabilityModule` em `apps/api/src/app.module.ts`, necessário para a montagem NestJS; uma importação e uma entrada na lista de módulos, sem alterar contrato de outros módulos.
- Build e lint: aprovados. `npm test`: 93/93. `npm run test:integration`: 13/13 no banco isolado `lumina_task009_test`. Roteiro HTTP manual: 7/7 aprovados. Build Next requer elevação para gravação do cache `.next`; sem elevação, prerender retorna `EPERM`.
- `npm run format:check` falha em 200 arquivos do repositório; não estava definido como gate operacional e não foi aplicada formatação global. `git diff --check` passa.
- Encerramento: responsável aprovou explicitamente MT-024-UI-01 a MT-024-UI-03 em 2026-11-22. GATE-006 e GATE-007 aprovados; TASK-024 DONE. Sem mudanças proibidas; PD-002 permanece como limite.
