# Roteiro manual TASK-008

Pré-condições: GATE-005 aprovado, containers ativos, API em `http://localhost:3001`, Web em `http://localhost:3000` e ao menos duas obras sintéticas visíveis, com autores, categorias, idiomas, preços e datas diferentes. Nenhum ranking de vendas/avaliações deve ser usado.

| ID | Cenário | Procedimento | Resultado esperado | Status inicial |
|---|---|---|---|---|
| MT-008-01 | Busca por título | `GET /works?search=Livro` e usar o campo de busca na Web | Retorna somente obras cujo título contém o termo, sem diferenciar maiúsculas/minúsculas | NAO EXECUTADO |
| MT-008-02 | Busca por autor | `GET /works?search=Autor` | Retorna obras do autor correspondente | NAO EXECUTADO |
| MT-008-03 | Filtros combinados | Combinar `search`, `category`, `language`, `minPriceCents` e `maxPriceCents` | Todos os filtros são aplicados simultaneamente | NAO EXECUTADO |
| MT-008-04 | Lançamento | Usar `releaseFrom` e `releaseTo` | Somente obras dentro do intervalo são retornadas | NAO EXECUTADO |
| MT-008-05 | Paginação | Usar `page=1&limit=1` e `page=2&limit=1` | Itens não se repetem; resposta informa `page`, `limit`, `total` e `totalPages` | NAO EXECUTADO |
| MT-008-06 | Ocultação | Ocultar uma obra e repetir busca/filtros | Obra oculta não aparece, mesmo com termo exato | NAO EXECUTADO |
| MT-008-07 | Vazio acessível | Buscar termo inexistente e navegar por `Tab` na Web | Resposta contém `items: []`, paginação consistente e campo operável por teclado | NAO EXECUTADO |
| MT-008-08 | Limite de paginação | Solicitar `limit=999` | API limita o tamanho máximo sem erro interno | NAO EXECUTADO |

Os resultados devem ser registrados com HTTP/status observado, contagens e critérios sanitizados. Não registrar tokens, senhas ou PII.
