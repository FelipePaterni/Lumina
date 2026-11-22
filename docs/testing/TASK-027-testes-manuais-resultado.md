# TASK-027 — Resultado dos testes manuais

Data: 2026-11-22T16:25:30.710Z
API: http://localhost:3001
Dados: somente leitura de catálogo; nenhum dado sintético ou credencial é criado ou exibido.

| Cenário | Descrição | Status | Evidência sanitizada |
|---|---|---|---|
| MT-027-API-01 | Ordenação padrão mantém resposta paginada | APROVADO | HTTP 200 |
| MT-027-API-02 | BEST_SELLING retorna resposta paginada | APROVADO | HTTP 200 |
| MT-027-API-03 | TOP_RATED retorna resposta paginada | APROVADO | HTTP 200 |
| MT-027-API-04 | Ordenação inválida retorna HTTP 400 | APROVADO | HTTP 400 |
| MT-027-API-05 | Resposta pública não inclui campos sensíveis | APROVADO | HTTP 200 |
| MT-027-UI-01 | Revisar controles de ordenação e estados na página inicial | APROVADO | Responsável confirmou que a interface está funcionando corretamente em 2026-11-22. |

O responsável aprovou os cenários manuais da TASK-027 em 2026-11-22. Os cenários HTTP foram executados pelo roteiro; a aprovação visual foi informada pelo responsável.
