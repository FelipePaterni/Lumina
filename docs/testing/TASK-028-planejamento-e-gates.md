# TASK-028 — Planejamento e gates

## Escopo

Adicionar páginas web para os painéis Admin, Catálogo e Estoque; tornar a navegação entre elas explícita na URL; preservar a sessão de equipe apenas durante navegação cliente; negar telas incompatíveis com o papel antes de requisitar a API.

## Evidências de aceite

- `npm run build --workspace @lumina/web`: APROVADO; listou `/dashboard`, `/catalog/dashboard` e `/warehouse/dashboard`. Build da imagem web também aprovado.
- `npm run lint`: APROVADO.
- `npm test`: APROVADO, 95/95.
- `tests/manual/task-028/run-task-028-routes.ps1`: APROVADO, 3/3 rotas e 33/33 assets HTTP 200. Relatório sanitizado em `docs/testing/TASK-028-testes-manuais-resultado.md`.
- Integração API: não executada; não houve mudança na API e `TASK009_TEST_DATABASE_URL` não está configurada. TASK-023 já cobre autorização/contratos de API.
- Revisão visual humana: login, cliques, URL, requisições API, RBAC, logout, reload, estado vazio e falha de rede. Pendente; aprovação não presumida.

## Scope Guard

Primárias: `apps/web/app/**`, `apps/web/src/features/dashboard/**`, testes e documentação de TASK-028. Incidental: nenhuma prevista. Nenhum endpoint, payload, schema ou regra de autorização do backend será alterado.

## Estado inicial

Planejamento registrado antes da implementação na branch `fix/TASK-028-rotas-paineis-equipe`. Os comandos e resultados são registrados após execução; não se presume aprovação manual.
