# TASK-012 — Resultado dos testes manuais

Gerado em 2026-11-20. O bloco inicial registra o estado antes da execução humana; a execução mais recente e sua aprovação estão registradas ao final.

| ID | Cenário | Status | Evidência resumida | Falhas |
|---|---|---|---|---|
| MT-012-01 | Acesso ao carrinho sem autenticação | BLOQUEADO | NÃO EXECUTADO; aguarda responsável | Execução humana pendente |
| MT-012-02 | Isolamento do cliente e autorização por papel | BLOQUEADO | NÃO EXECUTADO; aguarda responsável | Execução humana pendente |
| MT-012-03 | Persistência do carrinho e quantidade física | BLOQUEADO | NÃO EXECUTADO; aguarda responsável | Execução humana pendente |
| MT-012-04 | E-book duplicado ou já adquirido | BLOQUEADO | NÃO EXECUTADO; aguarda responsável | Execução humana pendente |
| MT-012-05 | Recusa de quantidade inválida ou indisponível | BLOQUEADO | NÃO EXECUTADO; aguarda responsável | Execução humana pendente |
| MT-012-06 | Cupom válido e cupom expirado | BLOQUEADO | NÃO EXECUTADO; aguarda responsável | Execução humana pendente |
| MT-012-07 | Cota de cupom esgotada | BLOQUEADO | NÃO EXECUTADO; aguarda responsável | Execução humana pendente |
| MT-012-08 | Validação de CPF/endereço e frete físico | BLOQUEADO | NÃO EXECUTADO; aguarda responsável | Execução humana pendente |
| MT-012-09 | Carrinho somente digital sem frete | BLOQUEADO | NÃO EXECUTADO; aguarda responsável | Execução humana pendente |
| MT-012-10 | Limpeza dos dados sintéticos | BLOQUEADO | NÃO EXECUTADO; aguarda responsável | Execução humana pendente |

O script `tests/manual/task-012/run-task-012-manual-tests.ps1` acrescenta o resultado sanitizado de cada execução. Credenciais, tokens, CPF e endereço não devem ser incluídos.

## Execução manual TASK-012 — 2026-11-20T13:41:45Z

Evidências registram somente códigos HTTP e resultados; credenciais, tokens, CPF e endereço não são gravados.

| ID | Cenário | Status | Evidência resumida | Falhas |
|---|---|---|---|---|
| MT-012-07 | Cota de cupom esgotada | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-01 | Acesso ao carrinho sem autenticação | REPROVADO | GET /cart sem token: HTTP 404 | Esperado HTTP 401 |
| MT-012-04 | E-book duplicado ou já adquirido | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-10 | Limpeza dos dados sintéticos | APROVADO | Limpeza final concluída | — |
| MT-012-03 | Persistência do carrinho e quantidade física | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-06 | Cupom válido e cupom expirado | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-02 | Isolamento do cliente e autorização por papel | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-09 | Carrinho somente digital sem frete | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-05 | Recusa de quantidade inválida ou indisponível | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-08 | Validação de CPF/endereço e frete físico | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |

Revisão/aprovação humana: PENDENTE. Não use este relatório como confirmação de pedido ou gateway.

## Execução manual TASK-012 — 2026-11-20T13:50:54Z

Evidências registram somente códigos HTTP e resultados; credenciais, tokens, CPF e endereço não são gravados.

| ID | Cenário | Status | Evidência resumida | Falhas |
|---|---|---|---|---|
| MT-012-07 | Cota de cupom esgotada | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-01 | Acesso ao carrinho sem autenticação | APROVADO | GET /cart sem token: HTTP 401 | — |
| MT-012-04 | E-book duplicado ou já adquirido | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-10 | Limpeza dos dados sintéticos | APROVADO | Limpeza final concluída | — |
| MT-012-03 | Persistência do carrinho e quantidade física | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-06 | Cupom válido e cupom expirado | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-02 | Isolamento do cliente e autorização por papel | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-09 | Carrinho somente digital sem frete | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-05 | Recusa de quantidade inválida ou indisponível | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |
| MT-012-08 | Validação de CPF/endereço e frete físico | BLOQUEADO | NÃO EXECUTADO | Pré-condição ou execução interrompida; consulte o erro sanitizado exibido no terminal |

Revisão/aprovação humana: PENDENTE. Não use este relatório como confirmação de pedido ou gateway.

## Execução manual TASK-012 — 2026-11-20T13:54:28Z

Evidências registram somente códigos HTTP e resultados; credenciais, tokens, CPF e endereço não são gravados.

| ID | Cenário | Status | Evidência resumida | Falhas |
|---|---|---|---|---|
| MT-012-07 | Cota de cupom esgotada | BLOQUEADO | NÃO EXECUTADO | Execução interrompida na etapa: login ADMIN (HTTP 401); confira a credencial e se a conta está ativa |
| MT-012-01 | Acesso ao carrinho sem autenticação | APROVADO | GET /cart sem token: HTTP 401 | — |
| MT-012-04 | E-book duplicado ou já adquirido | BLOQUEADO | NÃO EXECUTADO | Execução interrompida na etapa: login ADMIN (HTTP 401); confira a credencial e se a conta está ativa |
| MT-012-10 | Limpeza dos dados sintéticos | APROVADO | Limpeza final concluída | — |
| MT-012-03 | Persistência do carrinho e quantidade física | BLOQUEADO | NÃO EXECUTADO | Execução interrompida na etapa: login ADMIN (HTTP 401); confira a credencial e se a conta está ativa |
| MT-012-06 | Cupom válido e cupom expirado | BLOQUEADO | NÃO EXECUTADO | Execução interrompida na etapa: login ADMIN (HTTP 401); confira a credencial e se a conta está ativa |
| MT-012-02 | Isolamento do cliente e autorização por papel | BLOQUEADO | NÃO EXECUTADO | Execução interrompida na etapa: login ADMIN (HTTP 401); confira a credencial e se a conta está ativa |
| MT-012-09 | Carrinho somente digital sem frete | BLOQUEADO | NÃO EXECUTADO | Execução interrompida na etapa: login ADMIN (HTTP 401); confira a credencial e se a conta está ativa |
| MT-012-05 | Recusa de quantidade inválida ou indisponível | BLOQUEADO | NÃO EXECUTADO | Execução interrompida na etapa: login ADMIN (HTTP 401); confira a credencial e se a conta está ativa |
| MT-012-08 | Validação de CPF/endereço e frete físico | BLOQUEADO | NÃO EXECUTADO | Execução interrompida na etapa: login ADMIN (HTTP 401); confira a credencial e se a conta está ativa |

Revisão/aprovação humana: PENDENTE. Não use este relatório como confirmação de pedido ou gateway.

## Execução manual TASK-012 — 2026-11-20T13:55:55Z

Evidências registram somente códigos HTTP e resultados; credenciais, tokens, CPF e endereço não são gravados.

| ID | Cenário | Status | Evidência resumida | Falhas |
|---|---|---|---|---|
| MT-012-07 | Cota de cupom esgotada | APROVADO | Cupom sintético na cota máxima respondeu HTTP 409 | — |
| MT-012-01 | Acesso ao carrinho sem autenticação | APROVADO | GET /cart sem token: HTTP 401 | — |
| MT-012-04 | E-book duplicado ou já adquirido | APROVADO | E-book adicionado uma vez; repetição respondeu HTTP 409 | — |
| MT-012-10 | Limpeza dos dados sintéticos | APROVADO | Limpeza final concluída | — |
| MT-012-03 | Persistência do carrinho e quantidade física | APROVADO | Inclusão física HTTP 201; GET subsequente confirmou persistência e preço atual | — |
| MT-012-06 | Cupom válido e cupom expirado | APROVADO | Cupom válido HTTP 201; expirado HTTP 409 | — |
| MT-012-02 | Isolamento do cliente e autorização por papel | APROVADO | CUSTOMER recebeu HTTP 200; ADMIN recebeu HTTP 403 | — |
| MT-012-09 | Carrinho somente digital sem frete | APROVADO | Com somente e-book: frete respondeu HTTP 201, valor em centavos 0 | — |
| MT-012-05 | Recusa de quantidade inválida ou indisponível | APROVADO | Quantidade zero respondeu HTTP 400 | — |
| MT-012-08 | Validação de CPF/endereço e frete físico | APROVADO | CPF inválido HTTP 400; CEP/quantidade física cotados HTTP 201; total recalculado | — |

Revisão/aprovação humana: APROVADA pelo responsável em 2026-11-20. Não use este relatório como confirmação de pedido ou gateway.
