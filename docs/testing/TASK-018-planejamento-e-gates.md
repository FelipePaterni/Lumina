# TASK-018 — Plano e evidências dos gates

Data: 2026-11-20. Branch: `feature/TASK-018-bundles-pre-vendas`.

## GATE-001 — Recontextualização e prontidão

**Estado: APROVADO.** TASK-001 a TASK-017 estavam `DONE`; TASK-018 era a próxima tarefa topológica. `TASKS.md` contém objetivo, dependência, RF/RN, critérios de aceitação, DoD, testes e Scope Guard. TASK-017 tem estado `DONE`, relatórios de GATE-001 a GATE-007 e commit no histórico.

O relatório manual da TASK-017 registra horários `2026-11-21T00:08:58Z` e `00:10:24Z`. Convertidos de UTC para o fuso `America/Sao_Paulo` (UTC−03), correspondem a 20/11/2026 às 21:08 e 21:10; o histórico Git da tarefa também mostra commits em 20/11. A dependência e suas evidências são cronologicamente consistentes.

Foi criada a branch específica antes da implementação. A árvore estava limpa no início; nenhum trabalho alheio foi encontrado.

## GATE-002 — Contexto histórico e pré-condições

**Estado: APROVADO.** Foram lidos `AGENTS.md`, `README.md`, `TASKS.md`, ADR-004 e ADR-005, prompts da TASK-018, schema, migrações, módulos existentes de catálogo, carrinho, pedidos e biblioteca, além dos testes relacionados.

### Fatos confirmados

- `Work.releaseDate` já representa a data de lançamento.
- O carrinho e o checkout existentes operavam somente sobre `CartItem`/`Edition`; não havia entidade Bundle.
- A biblioteca deriva posse digital de `OrderItem` confirmado e já bloqueava download antes do lançamento.
- O checkout serializável já faz locks de carrinho, inventário e cupom; a implementação de bundle expande os locks às edições componentes.
- Não há fluxo de expedição/logística nesta fase. A guarda concreta de envio deve entrar quando esse fluxo for criado na TASK-021.
- ADR-004 e ADR-005 estão `ACCEPTED`.

## GATE-003 — Planejamento mínimo

**Estado: APROVADO após decisão explícita do responsável em 2026-11-20.** A necessidade de persistência e integração do carrinho foi registrada em `TASKS.md`; o responsável autorizou `database/schema.prisma`, `database/migrations/**`, `apps/api/src/modules/cart/**`, registro mínimo em `apps/api/src/app.module.ts` e `docs/testing/TASK-018-*.md`.

O plano cria Bundle/BundleItem, uma chave de composição canônica e única, itens de bundle no carrinho e snapshots de compra. O cálculo continua em centavos: preço = máximo entre zero e preço cadastrado menos a soma dos preços individuais atuais dos e-books possuídos. O bundle é limitado a edições digitais com inventário configurado. A compra concede cada edição ainda não possuída em um `OrderItem` separado; isso integra a biblioteca existente sem duplicar direitos.

Rollback de banco: script aditivo em `database/migrations/20261120213000_task_018_bundles_preorders/rollback.sql`. A validação manual usa somente API loopback e exige confirmação do banco isolado `lumina_task009_test`; o relatório não recebe credenciais, tokens ou identificadores.

## GATE-004 — Implementação controlada

**Estado: APROVADO.** Implementados:

- Criação/listagem de bundles, autorização ADMIN/CATALOG, auditoria e rejeição de composições duplicadas mesmo com ordem diferente.
- `CartBundle`, endpoints de inclusão/remoção e preço por posse calculado no servidor.
- Checkout transacional de bundles, validação de posse total, estoque de licenças, idempotência e snapshots com linhas de pedido por edição.
- Exposição de `releaseAt`/`preorderStatus` no carrinho e pedido; download de biblioteca usa a regra comum de lançamento.
- Migração aditiva e rollback; testes unitários, integração e roteiro manual.

Não foram implementados descontos fora de RN-007 nem um fluxo de expedição. `assertPreorderReleased` fornece a regra reutilizável; a integração ao despacho é prevista para TASK-021.

## GATE-005 — Revisão e gates automatizados

**Estado: APROVADO.** Validações finais executadas após as alterações:

| Gate | Comando | Resultado |
|---|---|---|
| Schema Prisma | `npx prisma validate --schema database/schema.prisma` | APROVADO |
| Build completo | `npm run build` | APROVADO; API TypeScript e web Next.js |
| Lint | `npm run lint` | APROVADO |
| Testes unitários/smoke | `npm test` | APROVADO; 64/64 |
| Integração | `npm run test:integration` | APROVADO; 9/9, somente `lumina_task009_test` |
| Runner manual | Parser PowerShell 7 (`Parser.ParseFile`) | APROVADO; sintaxe válida |
| Diff | `git diff --check` | APROVADO |

As integrações aplicaram as migrações repetidamente no banco isolado. A suíte da TASK-018 validou criação e duplicidade de composição, autorização, ajuste de preço até zero, bloqueio com posse total, compra, concessão separada, alocação de licenças e `PREORDER`/`RELEASED`. Uma execução de integração dentro do sandbox não alcançou `localhost:5433`; a rodada final fora do sandbox, autorizada e limitada ao banco isolado, passou integralmente.

## GATE-006 — Testes manuais

**Estado: EXECUTADO; revisão humana pendente.** O runner foi executado em 2026-11-20 (horário local) contra uma instância isolada da API em `localhost:3002`, conectada a `lumina_task009_test`. Foram usadas as contas ADMIN e os dois CUSTOMER do `.env`; nenhuma credencial foi registrada. Três obras de catálogo sintéticas foram preparadas e os quatro cenários MT-018-01 a MT-018-04 passaram. O runner criou bundles e pedidos sintéticos que permanecem apenas na base isolada. Evidência sanitizada: `docs/testing/TASK-018-testes-manuais-resultado.md`. O responsável ainda precisa revisar o resultado antes de aprovar GATE-006.

## GATE-007 — Conclusão e rastreabilidade

**Estado: PENDENTE.** GATE-001 a GATE-005 estão aprovados e o Scope Guard foi cumprido. A execução automatizada de GATE-006 passou, mas aguarda revisão humana. TASK-018 permanece `IN_REVIEW` e TASK-019 bloqueada até a revisão e aprovação do responsável.

## Scope Guard

Alterações primárias: `modules/bundles/**`, `modules/preorders/**`, `modules/orders/**`, `modules/library/**`, `modules/cart/**`, schema/migração, registro de módulo, testes e documentos autorizados. A ampliação foi aprovada explicitamente. **Incidental Changes: NONE.** Nenhuma alteração implementa despacho antes do lançamento ou descontos não especificados.
