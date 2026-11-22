# TASK-027 — Planejamento e gates

Data: 2026-11-22  
Branch: `feature/TASK-027-rankings-descoberta`

## Reavaliação de prontidão

- TASK-022 e TASK-023 estão `DONE`; foram localizados o relatório aprovado da TASK-022 e os gates HTTP/API da TASK-023.
- `GET /works` já implementa busca/filtros e paginação; o serviço inclui `averageRating` e `reviewCount` somente de avaliações visíveis.
- Fórmula para mais vendidos será a já aceita na TASK-023: pedidos confirmados historicamente, com subtração de quantidades em reembolsos `PROCESSED`.
- Índices existentes incluem `reviews(work_id, is_visible, created_at)`, `order_items(order_id)`, `order_items(edition_id)` e `editions(work_id, format)`; planos `EXPLAIN` foram consultados em `lumina_task009_test` após os testes de dados sintéticos.
- Se o plano demonstrar necessidade de índice novo, interromper e pedir scope escalation antes de alterar schema/migrações.
- Scope Guard alinhado para `apps/api/src/modules/catalog/search/**`, controller de catálogo, página web raiz, testes, documentação de contrato e evidências TASK-027.

## Contrato e aceite

- `GET /works?sort=BEST_SELLING|TOP_RATED`; sem `sort`, mantém a ordem atual; valor não aceito retorna HTTP 400.
- Ordenação combina com filtros existentes e precede paginação; obras ocultas permanecem fora dos resultados.
- Mais vendidos usa o agregado líquido de TASK-023; empate ordena por título e ID.
- Melhor avaliados usa apenas avaliações visíveis; sem avaliação fica no fim; empate ordena por título e ID. Não há mínimo de avaliações.
- Resposta existente de itens, contagem, paginação e agregados de avaliação permanece compatível.

## Gates

| Gate | Estado inicial | Evidência/critério |
|---|---|---|
| GATE-001 — Recontextualização e prontidão | APROVADO | Dependências DONE; branch própria e working tree limpa verificadas antes da alteração de estado. |
| GATE-002 — Contexto e pré-condições | APROVADO | RF/RN/RNF/UC, ADRs, API de busca, avaliações visíveis, schema e testes existentes inspecionados. |
| GATE-003 — Planejamento e Scope Guard | APROVADO | Aceitação e caminhos reais registrados; schema/migrações vedados sem scope escalation. |
| GATE-004 — Implementação | APROVADO | Endpoint `GET /works` aceita os rankings, filtros permanecem compostos, paginação ocorre após ordenação, interface expõe os controles e README documenta contrato. |
| GATE-005 — Gates automatizados | APROVADO | `npm test` 96/96; lint; build API; build Web; integração 1/1 em `lumina_task009_test`; `node --check` dos scripts; `git diff --check`. |
| GATE-006 — Testes manuais | EM REVISÃO | Roteiro HTTP 5/5 aprovado e relatório sanitizado gerado. Revisão visual humana MT-027-UI-01 permanece `NAO EXECUTADO`. |
| GATE-007 — Rastreabilidade e DoD | EM REVISÃO | Scope Guard e planos conferidos; aguarda aprovação visual humana e commit de encerramento. |

## Execução e evidências

- Implementação em `feature/TASK-027-rankings-descoberta`; TASKS avançada para `IN_REVIEW` após implementação e gates automatizados.
- Integração isolada: `tests/integration/catalog/task-027-rankings.integration.test.mjs` validou ordenação padrão, mais vendidos com reembolso processado, avaliações ocultas, empates, filtros, paginação, obra oculta, valor inválido e estado vazio.
- Testes manuais HTTP: `tests/manual/task-027/run-task-027-ranking-checks.mjs`; relatório sanitizado em `docs/testing/TASK-027-testes-manuais-resultado.md`. Os cinco cenários API passaram; o cenário visual segue pendente de revisão humana.
- Planos `EXPLAIN` foram consultados no banco isolado `lumina_task009_test`. No plano de vendas, PostgreSQL usou `refunds_order_item_id_status_requested_at_idx` para localizar reembolsos; tabelas de obras, pedidos e itens usaram varredura sequencial por seu baixo volume. No plano de avaliações visíveis, `reviews` usou varredura sequencial (estimativa de 30 linhas) e agregação em memória; não foi necessário índice novo para os dados avaliados. Nenhum schema/migration foi alterado.
- Escopo classificado: todas as alterações são `PRIMARY` autorizadas em `ALLOWED_CHANGES`; sem alterações incidentais ou proibidas.
- Commits de implementação serão registrados após a revisão humana obrigatória.
