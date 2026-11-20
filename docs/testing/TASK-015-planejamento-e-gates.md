# TASK-015 — Plano e evidências dos gates

Data: 2026-11-20. Branch: `feature/TASK-015-checkpoint-phase-03`.

## GATE-001 — Prontidão

**Estado: APROVADO.** A TASK-014 está `DONE`; seus relatórios de gates e testes manuais existem. TASK-013 e TASK-012 também estão `DONE`, com seus artefatos de evidência presentes. Os relatórios dos predecessores registram sucesso em lint, unitários, integração e build; TASK-014 registra 8/8 integrações e três cenários manuais aprovados. ADR-005 está `ACCEPTED`. A TASK-015 define objetivo, critérios de aceite, DoD e Scope Guard. A fila não tinha outra TASK `READY`; a autorização do responsável nesta conversa habilitou a promoção. A branch específica foi criada antes das alterações de escopo.

## GATE-002 — Matriz de evidências

| Critério | Evidência esperada | Verificação | Estado inicial | Responsável |
|---|---|---|---|---|
| Compra gratuita | Pedido confirmado em R$ 0, pagamento `NOT_REQUIRED`, aquisição sem cobrança | `npm run test:integration` (checkout TASK-013); roteiro manual TASK-013 MT-013-02 | Pendente de execução nesta branch; predecessora documenta aprovado | Agente / responsável manual |
| Compra paga simulada | Pedido positivo aprovado pelo adaptador simulado | `npm test` (regras de pagamento); integração checkout híbrido | Pendente | Agente |
| Checkout híbrido | Pedido único com físico e digital e totais corretos | Integração TASK-013; roteiro manual MT-013-03 | Pendente; predecessora documenta aprovado | Agente / responsável manual |
| Idempotência e notificações | Replay retorna pedido existente e não duplica notificação | Integração TASK-013/014; roteiro MT-014-03 | Pendente; predecessora documenta aprovado | Agente / responsável manual |
| Consistência concorrente | Sem sobre-venda física/digital nem excesso de cota de cupom; conflito não cria pedido | Integração TASK-013 para estoque, licença e cupom; roteiro MT-013-03/04 para estoque e cupom | Pendente; licença concorrente não está coberta no roteiro manual existente | Agente / responsável manual |
| Qualidade e segurança de regressão | lint, build, integração isolada e diff limpo | `npm run lint`; `npm run build`; `npm run test:integration`; `git diff --check` | Pendente | Agente |
| Regressão de notificações | Falha/duplicação não compromete confirmação e eventos existentes permanecem corretos | testes unitários/integração de notifications/identity/orders e roteiro MT-014-01/02/03 | Pendente; predecessora documenta aprovado | Agente / responsável manual |

**Lacuna identificada:** o roteiro manual TASK-013 cobre corrida de estoque físico e cota de cupom, mas não corrida de licença digital limitada. A integração automatizada cobre licença. Esse cenário manual extra não será incluído sem autorização específica de extensão do escopo operacional.

## GATE-003 — Plano de validação

Ordem planejada, sem ações destrutivas: `npm test`, `npm run lint`, `npm run build`, `npm run test:integration` apenas se `TASK009_TEST_DATABASE_URL` estiver configurada para o banco isolado `lumina_task009_test`; `git diff --check`; validação sintática dos scripts PowerShell. A integração usa dados sintéticos e tem limpeza em `finally`. Não usar banco `lumina` principal. Os testes manuais previstos nas predecessoras são exclusivos do responsável humano; seus relatórios atuais permanecem como evidência histórica e não serão reescritos. Docker Desktop não está acessível nesta sessão. Se integração isolada ou serviço local não estiver disponível, registrar `BLOQUEADO`, sem presumir aprovação.

Arquivos previstos nesta TASK:
- Alterar: `TASKS.md`.
- Criar: `docs/testing/TASK-015-planejamento-e-gates.md`, `docs/testing/TASK-015-testes-manuais-resultado.md`, `tests/manual/task-015/README.md` e coletor de resultados PowerShell.
- Não tocar: implementação de produto, banco/migrations, biblioteca, bundles, logística, artefatos de predecessoras.

Rollback: descartar somente os arquivos novos da TASK e reverter o estado de TASK-015; nenhuma operação de banco será executada fora do banco de teste isolado. Credenciais e valores de conexão não serão gravados nos relatórios.

## Estado dos gates

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Prontidão | APROVADO | Dependência, artefatos, ADR, critérios e branch verificados. |
| GATE-002 — Matriz de evidências | APROVADO | Matriz acima cobre compra gratuita/paga, híbrido, concorrência, notificações, regressão e lacuna manual. |
| GATE-003 — Planejamento | APROVADO | Comandos e restrições reais identificados; Docker indisponível; integração condicionada ao DB isolado. |
| GATE-004 — Validações automatizadas | BLOQUEADO | `npm test` 50/50, lint, build, parser PowerShell e `git diff --check` passaram. Integração não executada: `TASK009_TEST_DATABASE_URL` ausente no ambiente e `.env`; Docker indisponível e `localhost:5432` fechado. Não houve acesso ao banco principal. |
| GATE-005 — Testes manuais e conclusão | BLOQUEADO | O roteiro está preparado; somente o responsável pode executar/revisar. Relatório inicia `NÃO EXECUTADO`. |

## Scope Guard

Mudanças primárias limitadas a testes/documentação PHASE-03 e `TASKS.md`. Nenhuma implementação de produto será alterada. Incidental Changes: NONE.

## Resultado dos gates automatizados

Executado em 2026-11-20:

| Verificação | Resultado | Evidência |
|---|---|---|
| `npm test` | APROVADO | 50 testes passaram, 0 falharam. |
| `npm run lint` | APROVADO | Código de saída 0. |
| `npm run build` | APROVADO | API TypeScript e build de produção Next.js concluídos. |
| `npm run test:integration` | BLOQUEADO | Não executado: variável do banco de teste ausente; Docker indisponível; porta PostgreSQL local fechada. |
| Parser de `collect-task-015-results.ps1` | APROVADO | Sem erros de sintaxe PowerShell. |
| `git diff --check` | APROVADO | Código de saída 0. |

Limite: como a integração e a validação manual permanecem pendentes, não há evidência suficiente para afirmar que todos os cenários estão verdes ou que não existe sobre-venda conhecida.
