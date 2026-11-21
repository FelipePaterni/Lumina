# TASK-021 — Plano e roteiro manual

## Estado do workflow

- Branch: `feature/TASK-021-estoque-logistica-fisica`.
- GATE-001: APROVADO — TASK-021 é a primeira tarefa elegível; TASK-020 está DONE, sua dependência possui relatórios/gates e ADR-005 está ACCEPTED.
- GATE-002: APROVADO — baseline inspecionado: API NestJS/Prisma, PostgreSQL, testes Node e runner PowerShell para Windows/WSL.
- GATE-003: APROVADO — o responsável autorizou em 2026-11-21 a ampliação mínima de `ALLOWED_CHANGES` para adicionar evento específico de atualização logística em `apps/api/src/modules/notifications/notification-event.ts`; o plano de persistência reutiliza fulfillment e auditoria existentes, sem migração.
- GATE-004: APROVADO — módulos de logística, relatório de warehouse e painel; sem alteração de schema/migration; registro no módulo de inventário já carregado pela API.
- GATE-005: APROVADO COM BLOQUEIO EXTERNO REGISTRADO — build API/web, lint e 76 testes unitários passaram. `npm run test:integration` não iniciou cenários: `TASK009_TEST_DATABASE_URL` não está configurada, e `.env` não contém essa chave. A integração exige exclusivamente `lumina_task009_test`; nenhuma conexão foi aberta.
- GATE-006: PENDENTE — roteiro executável pronto, depende de ambiente/banco e revisão humana.
- GATE-007: PENDENTE — aguarda GATE-006 e decisão humana.

## Evidências e baseline

- `TASKS.md`: TASK-020 DONE e TASK-021 READY no início; critérios cobrem RF-007, RF-017, RN-004, RN-012 e RN-015.
- `docs/testing/TASK-020-planejamento-e-gates.md` e `docs/testing/TASK-020-testes-manuais-resultado.md`: dependência concluída, gates automatizados aprovados e revisão manual aprovada.
- `docs/adr/ADR-005-comercio-transacional-e-simulacoes.md`: adaptadores de notificação simulados atrás de contratos; operações de checkout transacionais.
- Código existente: `modules/inventory` já registra ajuste/movimento físico e restringe acesso a ADMIN/STOCK; `Order.fulfillmentStatus` já persiste estados; o módulo de notificações usa outbox e evento discriminado.
- Baseline inicial: nenhum teste foi executado antes da implementação. Após implementação, `npm run build --workspace=@lumina/api`, `npm run build --workspace=@lumina/web`, `npm run lint` e `npm test` passaram (76/76). A validação de integração foi bloqueada no preflight por falta da URL isolada.

## Plano mínimo sujeito à decisão

1. Em `modules/logistics/**`, expor transições autenticadas para ADMIN/STOCK (`PENDING → PICKING → SHIPPED → DELIVERED`), rejeitar saltos/retrocesso, e impedir envio antes da data de lançamento de qualquer item físico pré-vendido.
2. Registrar estado e rastreio manual em trilha de auditoria associada ao pedido; expor consulta autorizada ao cliente dono do pedido e ao ADMIN/STOCK. Reusar o campo de fulfillment existente evita migração de schema.
3. Em `modules/reporting/warehouse/**`, expor totais de itens físicos pendentes, em separação, enviados/entregues e itens com estoque zero. Alertas definidos como estoque zerado; não há regra aprovada para limiar de “baixo estoque”.
4. Reutilizar `modules/inventory/**` para montar os módulos de logística e relatório sem alterar as regras existentes de inventário.
5. Em `tests/manual/task-021/`, fornecer roteiro executável PowerShell não destrutivo, com dados sintéticos, status verificável e relatório sanitizado em `docs/testing/` após execução humana.

## Arquivos identificados

Existentes inspecionados: `apps/api/src/modules/inventory/**`, `apps/api/src/modules/shipping/**`, `apps/api/src/modules/orders/**`, `apps/api/src/modules/notifications/**`, `apps/api/src/modules/identity/**`, `apps/api/src/modules/audit/**`, `apps/api/src/app.module.ts`, `database/schema.prisma`, `tests/unit/inventory/inventory-service.test.mjs` e integrações de pedidos/notificações.

Novos dentro do escopo: `apps/api/src/modules/logistics/**`, `apps/api/src/modules/reporting/warehouse/**`, `apps/web/src/features/warehouse/**`, `tests/unit/logistics/**`, `tests/unit/reporting/**` e runner/preparador/verificador/roteiro em `tests/manual/task-021/**`.

Ampliação aprovada pelo responsável: adicionar evento de notificação próprio para transições logísticas em `apps/api/src/modules/notifications/notification-event.ts`. Sem essa ampliação, reutilizar `ORDER_CONFIRMED` para envio/entrega identificaria eventos incorretamente e produziria trilha de outbox enganosa.

## Roteiro manual planejado (ainda NÃO EXECUTADO)

Após aprovação do escopo e dos gates automatizados, o runner deverá validar:

| ID | Cenário | Resultado esperado | Status inicial |
|---|---|---|---|
| MT-021-00 | API local, banco sintético e autenticação de STOCK/ADMIN/CUSTOMER | Contas autenticam sem que credenciais/tokens sejam registradas | NÃO EXECUTADO |
| MT-021-01 | Estoque/Admin consultam fila e resumo; edição de estoque zero | Fila autorizada e alerta `OUT_OF_STOCK` presente | NÃO EXECUTADO |
| MT-021-02 | Estoquista avança em pedido lançado até entrega; repete estado final | Três transições persistidas; rastreio guardado; três avisos `SENT` idempotentes | NÃO EXECUTADO |
| MT-021-03 | Estoquista tenta enviar pré-venda antes do lançamento | HTTP 409; status e trilha sem envio | NÃO EXECUTADO |
| MT-021-04 | Cliente consulta pedido próprio e rastreio | Apenas histórico/rastreio do próprio pedido | NÃO EXECUTADO |
| MT-021-05 | Cliente tenta alterar logística e consultar pedido alheio | HTTP 403/404; sem mutação/exposição | NÃO EXECUTADO |

## Preparação e execução manual

O preparador e o verificador carregam o `.env` da raiz automaticamente sem imprimir valores. Configure nele `TASK009_TEST_DATABASE_URL` apontando para `lumina_task009_test` e use `TEST_CUSTOMER_1_EMAIL`/`TEST_CUSTOMER_2_EMAIL` (ou os nomes `TASK021_CUSTOMER_*`) com duas contas sintéticas `@example.invalid`. O endereço do banco deve existir e estar acessível; o script não cria bancos nem inicia serviços. Use uma conta STOCK e uma ADMIN como `PSCredential`; mantenha as senhas somente na sessão PowerShell. A API local deve estar conectada ao mesmo banco de teste e ter migrations aplicadas.

```powershell
$fixtureJson = node ./tests/manual/task-021/prepare-task-021-manual.mjs
if ($LASTEXITCODE -ne 0) { throw 'Preparação TASK-021 falhou' }
$fixture = $fixtureJson | ConvertFrom-Json
./tests/manual/task-021/run-task-021-manual-tests.ps1 `
  -ApiBaseUrl 'http://localhost:3001' `
  -StockCredential $stock -AdminCredential $admin `
  -CustomerCredential $customer1 -OtherCustomerCredential $customer2 `
  -SyntheticOrderId $fixture.released.orderId `
  -SyntheticPreorderOrderId $fixture.preorder.orderId `
  -SyntheticEditionId $fixture.released.editionId `
  -SyntheticPreorderEditionId $fixture.preorder.editionId `
  -SyntheticTestDatabaseConfirmed
```

O runner escreve o relatório sanitizado em `docs/testing/TASK-021-testes-manuais-resultado.md`. Fixtures são somente adicionadas ao banco de teste, com obras/pedidos/destinatário sintéticos; não apaga nem altera dados existentes. Revise o relatório manualmente. Os testes manuais permanecem NÃO EXECUTADOS até essa operação humana; não aprove o gate por inferência.

Nenhuma senha, token, PII real ou arquivo original será gravado no roteiro ou relatório. A documentação de relatório em `docs/testing/` é incidental mínima, exigida pelo padrão de testes manuais de `AGENTS.md`.
