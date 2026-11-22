# TASK-027 — Planejamento e gates

Data: 2026-11-22  
Branch: `feature/TASK-027-rankings-descoberta`

## Reavaliação de prontidão

- TASK-022 e TASK-023 estão `DONE`; foram localizados o relatório aprovado da TASK-022 e os gates HTTP/API da TASK-023.
- `GET /works` já implementa busca/filtros e paginação; o serviço inclui `averageRating` e `reviewCount` somente de avaliações visíveis.
- Fórmula para mais vendidos será a já aceita na TASK-023: pedidos confirmados historicamente, com subtração de quantidades em reembolsos `PROCESSED`.
- Índices existentes incluem `reviews(work_id, is_visible, created_at)`, `order_items(order_id)`, `order_items(edition_id)` e `editions(work_id, format)`; o plano será medido em banco isolado com dados sintéticos.
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
| GATE-004 — Implementação | PENDENTE | Aguardando código e documentação de contrato. |
| GATE-005 — Gates automatizados | PENDENTE | Build, lint, unitários, integração, sintaxe e `git diff --check`. |
| GATE-006 — Testes manuais | PENDENTE | Roteiro com dados sintéticos, relatório sanitizado e eventual revisão humana. |
| GATE-007 — Rastreabilidade e DoD | PENDENTE | Atualizar após gates e aceite. |
