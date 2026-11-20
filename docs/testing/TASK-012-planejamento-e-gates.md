# TASK-012 — Plano e evidências dos gates

Atualizado em 2026-11-20. Branch: `feature/TASK-012-carrinho-cupom-frete`.

## Fatos confirmados e evidências

- TASK-011 está `DONE`; `docs/testing/TASK-011-checkpoint-phase-02.md` registra os gates e aprovação humana.
- TASK-012 estava `READY`, depende somente da TASK-011 e possui critérios de aceite/DoD em `TASKS.md`.
- O repositório usa NestJS, Prisma e PostgreSQL; `Edition.priceCents` e `Inventory` já existem. Ainda não havia módulos de carrinho, cupom ou frete, nem persistência de propriedade na biblioteca.
- A árvore de trabalho estava limpa ao entrar na branch específica da TASK.
- Baseline executado nesta branch: `npm run test` passou (30/30); `npm run lint` passou; `npm run build` passou; `git diff --check` passou.
- Em 2026-11-20, o responsável autorizou ampliar o escopo para persistência e integração mínima necessária. A ampliação consta em `TASKS.md` e no README/prompts desta TASK.

## Plano mínimo aprovado (GATE-003)

| Área | Mudança autorizada | Critério/mitigação |
|---|---|---|
| Persistência | `Cart`, `CartItem`, `Coupon`, `ShippingRule` e projeção mínima `LibraryItem`; migrações Prisma forward-only | FK/uniquidade/índices; integração somente no banco `lumina_task009_test`; sem rollback destrutivo |
| Carrinho | API JWT do cliente para ler/adicionar/alterar/remover edições | Preço, visibilidade e formato sempre lidos do catálogo; e-book quantidade 1; duplicação própria/posse existente recusada; estoque nunca reservado |
| Cupom | Gestão ADMIN/CATALOG; cliente valida/aplica/remove um cupom global | Código normalizado; validade e cota conferidas no servidor; desconto em centavos; consumo da cota fica para a confirmação atômica da TASK-013 |
| Frete | Gestão ADMIN de faixas de CEP/quantidade e cotação de item físico | Nunca calcular frete para carrinho apenas digital; cotação exige endereço e CPF válidos, usados em memória e descartados sem persistir/logar |
| Web | Interface `features/checkout` integrada ao catálogo | Token fica em memória; sem gravar senha/token em localStorage, URL ou logs; sem confirmação de pedido |
| Testes | Unitários de domínio/serviços, integração de migração isolada, build/lint e roteiro manual PowerShell | Dados sintéticos; relatório manual começa `NÃO EXECUTADO`; sem declarar aprovação humana |

## Arquivos

**Existentes a alterar:** `TASKS.md`; `database/schema.prisma`; `apps/api/src/app.module.ts`; `apps/web/app/page.tsx`; `prompts/tasks/task-012/**`.

**Novos previstos:** módulos `apps/api/src/modules/cart/**`, `coupons/**`, `shipping/**` e `library/ownership/**`; `apps/web/src/features/checkout/**`; migrações `database/migrations/*_task_012_*/**`; testes `tests/unit/{cart,coupons,shipping}/**`, `tests/integration/commerce/**`; `tests/manual/task-012/**`; `docs/testing/TASK-012-*.md`.

**Não serão tocados:** checkout/ordem confirmada, pagamentos, estoque consumido, reserva de carrinho, gateway, módulos de download/biblioteca além da consulta mínima de posse, logs com CPF/endereço ou tokens.

## Riscos e rollback

- Mudanças de schema são aditivas e aplicadas por migração versionada; dados existentes não são apagados nem modificados.
- A migração pode ser repetida apenas pelo fluxo Prisma deploy. Não executar rollback automático; em caso de falha, interromper e registrar no banco isolado.
- Estoque/licenças e cota de cupom podem mudar entre cotação e confirmação. A TASK-013 deverá revalidar e consumir atomicamente, conforme ADR-005; TASK-012 não reserva nem consome.
- A regra de CPF é apenas validação sintática de dígitos/checksum para requisito de formulário, sem verificar titularidade.

## Estado dos gates

| Gate | Estado | Evidência |
|---|---|---|
| GATE-001 — Prontidão | APROVADO | Dependência `DONE`, DoR conferido, branch específica e árvore inicial limpa; caminhos explicitados após autorização de ampliação. |
| GATE-002 — Contexto histórico | APROVADO | ADR-001/002/005/008, README, código, testes, checkpoint TASK-011 e baseline confirmados. |
| GATE-003 — Planejamento mínimo | APROVADO | Plano desta tabela, mitigação e rollback; nenhuma confirmação de pedido/gateway no plano. |
| GATE-004 — Implementação | APROVADO | API, módulos, migrações aditivas e interface entregues; revisão de diff confirmou ausência de pedido/pagamento. |
| GATE-005 — Gates automatizados | APROVADO | `npm run build`, `npm run lint`, `npm run test` (38/38), `npm run test:integration` (6/6 no banco isolado), `npx prisma validate`, migrações idempotentes e parser PowerShell passaram. |
| GATE-006 — Testes manuais | BLOQUEADO | Roteiro e relatório inicial preparados; a TASK exige execução/revisão humana. Todos cenários permanecem `NÃO EXECUTADO`/`BLOQUEADO`. |
| GATE-007 — Conclusão | PENDENTE | Depende de execução e aprovação humana do GATE-006. |

## Revisão e pendências de conclusão

TASK-012 foi movida para `IN_REVIEW`. Cinco gates foram aprovados; o GATE-006 aguarda a execução manual do responsável. Nenhum relatório manual foi marcado como aprovado. Por isso a TASK não está `DONE`, e a TASK-013 segue `BLOCKED`.

O roteiro para Windows/PowerShell e a tabela de cenários estão em `tests/manual/task-012/README.md`; execução: `./tests/manual/task-012/run-task-012-manual-tests.ps1`. O relatório inicial está em `docs/testing/TASK-012-testes-manuais-resultado.md` e será atualizado pelo script.
