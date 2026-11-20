## Execução do roteiro manual — 2026-11-20T11:45:39Z

Credenciais e tokens sintéticos foram mantidos apenas em memória e omitidos do relatório.

| ID | Cenário | Status | Evidência sanitizada |
|---|---|---|---|
| MT-010-01 | Rejeitar consulta sem autenticação | APROVADO | GET sem token retornou HTTP 401. |
| MT-010-02 | Autenticar clientes sintéticos | APROVADO | Duas contas CUSTOMER autenticadas; credenciais e tokens omitidos. |
| MT-010-03 | Adicionar obra à lista própria | APROVADO | POST retornou HTTP 201. |
| MT-010-04 | Recusar obra duplicada | APROVADO | POST duplicado retornou HTTP 409. |
| MT-010-05 | Isolar lista entre clientes | APROVADO | Cliente B recebeu HTTP 200; item da conta A não apareceu. |
| MT-010-06 | Recusar remoção de item alheio | APROVADO | DELETE como cliente B retornou HTTP 404. |
| MT-010-07 | Preservar item após tentativa de terceiro | APROVADO | Cliente A recebeu HTTP 200; item continua na lista. |
| MT-010-08 | Remover item da lista própria | APROVADO | DELETE pelo cliente A retornou HTTP 200. |
