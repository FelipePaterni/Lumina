# TASK-027 — Roteiro manual de rankings

## Pré-condições e roteiro HTTP

- API compilada e disponível em `http://localhost:3001` (ou defina `TASK027_API_BASE`).
- Execute `node --check tests/manual/task-027/run-task-027-ranking-checks.mjs` antes do roteiro.
- Execute `node tests/manual/task-027/run-task-027-ranking-checks.mjs`. A API de catálogo é pública; não passe credenciais.
- O roteiro consulta apenas o catálogo, não grava dados e gera `docs/testing/TASK-027-testes-manuais-resultado.md` com status por cenário e evidência HTTP sanitizada.

| ID | Ação | Resultado esperado |
|---|---|---|
| MT-027-API-01 | Consultar ordenação padrão | HTTP 200 e estrutura de paginação atual. |
| MT-027-API-02 | Consultar `BEST_SELLING` | HTTP 200 e estrutura de paginação atual. |
| MT-027-API-03 | Consultar `TOP_RATED` | HTTP 200 e estrutura de paginação atual. |
| MT-027-API-04 | Consultar `sort=INVALID` | HTTP 400. |
| MT-027-API-05 | Inspecionar nomes de campos públicos | Nenhum campo pessoal, de autenticação, motivo ou identidade de avaliador. |

## Revisão humana da interface

Abrir a página inicial no navegador, selecionar “Mais vendidos” e “Melhor avaliados” e confirmar que a URL da chamada contém o parâmetro esperado, a listagem atualiza, o estado vazio permanece legível e falhas da API exibem mensagem. Verificar também que avaliação média e quantidade de avaliações visíveis aparecem corretamente. Registrar aprovação ou falha humana sem capturar respostas brutas, IDs ou dados pessoais. Esta revisão fica pendente até observação do responsável.
