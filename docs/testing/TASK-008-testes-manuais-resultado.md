# Resultado dos testes manuais - TASK-008

Executado em UTC: 2026-11-05 — evidências fornecidas pelo responsável.

Nenhum token, senha ou PII foi registrado.

| ID | CenÃ¡rio | Status | EvidÃªncia sanitizada |
|---|---|---|---|
| MT-008-01 | Busca por título | APROVADO | `search=Jardim` retornou 1 obra; `total=1`, `totalPages=1`. |
| MT-008-02 | Busca por autor | APROVADO | `search=Lia Campos` retornou 1 obra; `total=1`. |
| MT-008-03 | Filtros combinados | APROVADO | Categoria, idioma e faixa de preço combinados retornaram 1 obra. |
| MT-008-04 | Lançamento | APROVADO | Intervalo `2025-01-01` a `2026-12-31` retornou 2 obras. |
| MT-008-05 | Paginação | APROVADO | `page=1&limit=1` e `page=2&limit=1` retornaram itens distintos; `total=3`, `totalPages=3`. |
| MT-008-06 | Obra oculta | APROVADO | Obra ocultada não apareceu na busca; resposta `items=[]`, `total=0`. |
| MT-008-07 | Resultado vazio | APROVADO | Termo inexistente retornou `items=[]`, `total=0`, `totalPages=0`. |
| MT-008-08 | Limite de paginação | APROVADO | Solicitação `limit=999` foi limitada para `limit=50`, sem erro. |
| MT-008-UI | Busca na interface | APROVADO | Busca com filtro validada na interface Web em `http://localhost:3000`. |

## Conclusão

Todos os cenários manuais previstos foram executados e aprovados pelo responsável, com evidências sanitizadas.
