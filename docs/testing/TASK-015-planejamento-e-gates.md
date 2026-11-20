# TASK-015 — Plano e evidências dos gates

Data: 2026-11-20. Branch: `feature/TASK-015-checkpoint-phase-03`.

## GATE-001 — Prontidão

**Estado: APROVADO.** A TASK-014 está `DONE`; seus relatórios de gates e testes manuais existem. TASK-013 e TASK-012 também estão `DONE`, com seus artefatos de evidência presentes. Os relatórios dos predecessores registram sucesso em lint, unitários, integração e build; TASK-014 registra 8/8 integrações e três cenários manuais aprovados. ADR-005 está `ACCEPTED`. A TASK-015 define objetivo, critérios de aceite, DoD e Scope Guard. A fila não tinha outra TASK `READY`; a autorização do responsável nesta conversa habilitou a promoção. A branch específica foi criada antes das alterações de escopo.

## GATE-002 — Matriz de evidências

| Critério | Evidência esperada | Verificação | Estado inicial | Responsável |
|---|---|---|---|---|
| Compra gratuita | Pedido confirmado em R$ 0, pagamento `NOT_REQUIRED`, aquisição sem cobrança | `npm run test:integration` (checkout TASK-013); roteiro manual TASK-013 MT-013-02 | Integração passou; manual pendente | Agente / responsável manual |
| Compra paga simulada | Pedido positivo aprovado pelo adaptador simulado | `npm test` (regras de pagamento); integração checkout híbrido | Unitário e integração passaram | Agente |
| Checkout híbrido | Pedido único com físico e digital e totais corretos | Integração TASK-013; roteiro manual MT-013-03 | Integração passou; manual pendente | Agente / responsável manual |
| Idempotência e notificações | Replay retorna pedido existente e não duplica notificação | Integração TASK-013/014; roteiro MT-014-03 | Integração passou; manual pendente | Agente / responsável manual |
| Consistência concorrente | Sem sobre-venda física/digital nem excesso de cota de cupom; conflito não cria pedido | Integração TASK-013 para estoque, licença e cupom; roteiro manual MT-013-03/04 para estoque e cupom | Integração passou para estoque/licença/cupom; manual pendente | Agente / responsável manual |
| Qualidade e segurança de regressão | lint, build, integração isolada e diff limpo | `npm run lint`; `npm run build`; `npm run test:integration`; `git diff --check` | Todos os gates automatizados passaram | Agente |
| Regressão de notificações | Falha/duplicação não compromete confirmação e eventos existentes permanecem corretos | testes unitários/integração de notifications/identity/orders e roteiro MT-014-01/02/03 | Automatizados passaram; manual pendente | Agente / responsável manual |

**Lacuna identificada:** o roteiro manual TASK-013 cobre corrida de estoque físico e cota de cupom, mas não corrida de licença digital limitada. A integração automatizada cobre licença. Esse cenário manual extra não será incluído sem autorização específica de extensão do escopo operacional.

## GATE-003 — Plano de validação

Plano executado sem ações destrutivas no banco principal: testes unitários, lint, build, parser PowerShell e `git diff --check`; em seguida, o container PostgreSQL local foi verificado e o banco `lumina_task009_test` foi criado. URL e credenciais foram compostas e mantidas apenas em memória; 11 migrations foram aplicadas e `npm run test:integration` executou os testes com limpeza em `finally`. O banco `lumina` não foi usado pelos testes. Os testes manuais das predecessoras permanecem exclusivos do responsável humano; seus relatórios históricos não foram reutilizados como aprovação desta TASK.

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
| GATE-004 — Validações automatizadas | APROVADO | `npm test` 50/50, lint, build, parser PowerShell, `git diff --check` e integração 8/8 passaram. O banco `lumina_task009_test` foi criado no PostgreSQL local; 11 migrations aplicadas. URL e credenciais ficaram somente em memória. Banco principal não foi usado. |
| GATE-005 — Testes manuais e conclusão | BLOQUEADO | MT-013-01 a MT-013-04 foram aprovados e a limpeza confirmou. TASK-014 chega ao helper de schema, mas registra `RuntimeException`. A consulta isolada no destino `.env` (`localhost:5433/lumina`) retorna schema pronto. O runner agora prioriza esse destino Compose em vez de uma `DATABASE_URL` possivelmente obsoleta e registrará banco/porta e código Prisma sanitizado. MT-014 precisa ser repetido pelo responsável. |

## Scope Guard

Mudanças primárias limitadas a testes/documentação PHASE-03 e `TASKS.md`. Incidental: o runner manual da TASK-014 prioriza as configurações Compose do `.env` sobre `DATABASE_URL` herdada, e inclui etapa/host/porta/banco/código Prisma sanitizados para diagnosticar a falha desta TASK; cenários e comportamento de produto não foram alterados. Nenhuma implementação de produto foi alterada.

## Resultado dos gates automatizados

Executado em 2026-11-20:

| Verificação | Resultado | Evidência |
|---|---|---|
| `npm test` | APROVADO | 50 testes passaram, 0 falharam. |
| `npm run lint` | APROVADO | Código de saída 0. |
| `npm run build` | APROVADO | API TypeScript e build de produção Next.js concluídos. |
| Banco isolado e migrations | APROVADO | Banco `lumina_task009_test` criado no PostgreSQL local; 11 migrations aplicadas. URL/credenciais somente em memória. |
| `npm run test:integration` | APROVADO | 8 passaram, 0 falharam, 0 ignorados; executado em `lumina_task009_test`. |
| Parser de `collect-task-015-results.ps1` | APROVADO | Sem erros de sintaxe PowerShell. |
| `git diff --check` | APROVADO | Código de saída 0. |

Limite: os gates automatizados da Etapa 004 passaram, incluindo os cenários concorrentes de estoque, licença e cupom. A validação manual e revisão humana da Etapa 005 continuam pendentes; portanto, a TASK-015 ainda não está concluída.
