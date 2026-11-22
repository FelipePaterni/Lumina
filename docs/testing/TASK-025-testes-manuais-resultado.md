# TASK-025 — resultado de testes manuais

Data: 2026-11-22. Ambiente: Web `http://localhost:3000`, API `http://localhost:3001`, Google Chrome via navegador in-app; versão exata do navegador não exposta pela integração. Banco isolado não foi consultado ou alterado neste roteiro. Navegação autenticada não foi executada por falta de credenciais sintéticas fornecidas para esta sessão.

## Disponibilidade HTTP

O script `tests/manual/task-025/run-task-025.ps1` fez GETs sem registrar corpos de resposta:

| Cenário | Estado | Evidência resumida |
|---|---|---|
| `/` | APROVADO | HTTP 200; 131 ms |
| `/dashboard` | APROVADO | HTTP 200; 111 ms |
| `/catalog/dashboard` | APROVADO | HTTP 200; 24 ms |
| `/warehouse/dashboard` | APROVADO | HTTP 200; 21 ms |
| `/operations/dashboard` | APROVADO | HTTP 200; 17 ms |
| API `/works?limit=1&page=1` | APROVADO | HTTP 200; 49 ms |

Os tempos acima medem apenas respostas HTTP e não são usados como substitutos do tempo de tela pronta.

## Baseline Chrome — tela pronta

Métrica iniciada antes da navegação e concluída após `networkidle` e o elemento `main` visível. Rota protegida sem sessão mostrou o login, que é o conteúdo principal definido no README; a rota `/` carregou o catálogo sintético e sua chamada à API terminou antes de `networkidle`. Cada célula contém as cinco amostras em ms, seguida por mediana e máximo. Uma navegação de aquecimento foi descartada por combinação rota/viewport.

| Viewport | Rota | Amostras (ms) | Mediana | Máximo | Limite 20 s |
|---|---|---|---:|---:|---|
| 390×844 | `/` | 1056, 439, 470, 427, 502 | 470 | 1056 | APROVADO |
| 390×844 | `/dashboard` | 358, 335, 335, 379, 394 | 358 | 394 | APROVADO |
| 390×844 | `/catalog/dashboard` | 334, 449, 341, 363, 362 | 362 | 449 | APROVADO |
| 390×844 | `/warehouse/dashboard` | 358, 393, 355, 394, 597 | 393 | 597 | APROVADO |
| 390×844 | `/operations/dashboard` | 320, 465, 382, 408, 341 | 382 | 465 | APROVADO |
| 768×1024 | `/` | 733, 643, 834, 509, 463 | 643 | 834 | APROVADO |
| 768×1024 | `/dashboard` | 343, 414, 359, 407, 397 | 397 | 414 | APROVADO |
| 768×1024 | `/catalog/dashboard` | 368, 344, 327, 376, 422 | 368 | 422 | APROVADO |
| 768×1024 | `/warehouse/dashboard` | 315, 423, 568, 590, 727 | 568 | 727 | APROVADO |
| 768×1024 | `/operations/dashboard` | 324, 405, 314, 334, 327 | 327 | 405 | APROVADO |
| 1366×768 | `/` | 569, 546, 479, 446, 515 | 515 | 569 | APROVADO |
| 1366×768 | `/dashboard` | 590, 893, 663, 647, 487 | 647 | 893 | APROVADO |
| 1366×768 | `/catalog/dashboard` | 421, 323, 390, 468, 363 | 390 | 468 | APROVADO |
| 1366×768 | `/warehouse/dashboard` | 347, 363, 350, 405, 385 | 363 | 405 | APROVADO |
| 1366×768 | `/operations/dashboard` | 320, 365, 375, 341, 392 | 365 | 392 | APROVADO |

Resultado: 75/75 amostras foram menores ou iguais a 20 s. Essa medição descreve apenas a máquina e o ambiente local registrados neste roteiro; não fecha PD-001 nem caracteriza produção.

## Layout, navegação e revisão pendente

| Cenário | Estado | Evidência / pendência |
|---|---|---|
| Overflow horizontal em cinco rotas nos três viewports | APROVADO | 15 verificações no DOM; largura do documento não excedeu o viewport. Busca no mobile ficou com 343 px dentro do main de 375 px. |
| Link “Painéis da equipe” | APROVADO | Clique em `/` abriu `/dashboard`; conteúdo de login ficou visível. |
| Abertura direta das cinco rotas web | APROVADO | Todas retornaram HTTP 200; três rotas de painéis exibiram o login sem sessão. |
| Contraste/rótulos/feedback validado por teste automatizado | APROVADO | 3 testes dedicados passaram; conferir GATE-005. |
| Papéis, sessão, logout, carregamento de dados autenticado e acesso negado | BLOQUEADO | Requer contas sintéticas para Admin/Catálogo/Estoque e execução humana; nenhuma credencial foi colocada no relatório. |
| Revisão visual humana no Chrome | BLOQUEADO | A evidência técnica foi coletada; aprovação do responsável ainda necessária. |
| Compatibilidade nas duas versões recentes de Edge e Firefox | BLOQUEADO | Esses navegadores não estavam disponíveis no ambiente da sessão. |
| Estados vazio, erro da API e conexão indisponível por interface | NAO EXECUTADO | Cobertos parcialmente pelo código/testes; ainda exigem revisão manual humana em cenários controlados. |

## Privacidade

Relatório não inclui e-mails, nomes, IDs, credenciais, tokens, motivos, payloads ou corpos de resposta. Foram usados somente os três títulos sintéticos visíveis no seed local durante a observação inicial do catálogo.
