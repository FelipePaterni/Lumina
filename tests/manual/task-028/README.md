# TASK-028 — Validação manual

## Verificação HTTP

Execute `tests/manual/task-028/run-task-028-routes.ps1`. O script valida HTTP 200 em `/dashboard`, `/catalog/dashboard`, `/warehouse/dashboard` e `/operations/dashboard` e grava um relatório sanitizado em `docs/testing/TASK-028-testes-manuais-resultado.md`. `-WebBaseUrl` permite apontar para outro servidor local.

## Revisão visual pendente

Usando contas sintéticas já disponíveis no ambiente, validar no navegador:

1. Admin abre `/dashboard`, clica Catálogo, Estoque e Operação, vê a URL correspondente mudar e confirma a chamada para a API em `localhost:3001`.
2. Catálogo autenticado fica em `/catalog/dashboard`; Estoque autenticado fica em `/warehouse/dashboard`.
3. Admin consegue retornar aos três painéis sem novo login; logout encerra a sessão e recarga volta à tela de login.
4. Operação abre `/operations/dashboard` e solicita `/admin/observability/dashboard`; papel CATALOG ou STOCK recebe negação sem essa chamada.
5. Acesso a painel de papel incompatível mostra negação sem requisição ao endpoint daquele painel.
6. Estados sem dados, API indisponível e falha de conexão exibem feedback visível.

Não registrar credenciais, tokens, dados de pedidos ou dados pessoais no relatório. Aprovação visual depende da revisão humana.
