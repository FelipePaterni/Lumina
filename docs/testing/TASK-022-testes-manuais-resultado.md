# TASK-022 — resultado dos testes manuais

Execução: 2026-11-22 00:05:35 -03:00
Ambiente: API em http://127.0.0.1:3101; dados e tokens sintéticos mantidos em memória.
IDs de usuário, tokens, e-mails e conteúdo de credenciais foram omitidos.

| Cenário | Status | Evidência resumida | Falha |
|---|---|---|---|
| MT-022-01 | APROVADO | Consulta pública retornou lista de avaliações. |  |
| MT-022-02 | APROVADO | Cliente comprador criou avaliação publicada. |  |
| MT-022-03 | APROVADO | Média pública após avaliação: HTTP 200. |  |
| MT-022-04 | APROVADO | Tentativa sem aquisição retornou HTTP 409. |  |
| MT-022-05 | APROVADO | Denúncia por usuário autenticado retornou HTTP 201. |  |
| MT-022-06 | APROVADO | Lista Admin HTTP 200; papel cliente HTTP 403. |  |
| MT-022-07 | APROVADO | Sem motivo HTTP 400; remoção Admin HTTP 200. |  |
| MT-022-08 | APROVADO | Avaliação removida ausente da resposta pública HTTP 200. |  |
