# TASK-029 — implementação Web V1.1

Data: 2026-11-22. Branch: `feature/TASK-029-web-v11-pages`.

## Escopo executado

- Novas páginas de loja/cliente e administração usam os contratos existentes.
- Navegação global e sessão em memória; limites da API descritos em `docs/architecture/v11-web-route-map.md`.
- Nenhuma alteração em `apps/api/**`, schema ou migrações.

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| Lint | APROVADO | `npm run lint`. |
| Testes unitários/smoke | APROVADO | `npm test`: 98 testes aprovados. |
| Build Web | APROVADO | `npm run build --workspace @lumina/web`; Next.js gerou as rotas declaradas. |
| Script manual | APROVADO | `node --check tests/manual/task-029/verify-routes.mjs`. |
| Smoke HTTP das 31 rotas | BLOQUEADO | Tentativa contra servidor local na porta 3002 não recebeu conexão no processo Node nem no Chrome; relatório sanitizado registra 31 cenários `BLOQUEADO`. |
| Revisão visual e fluxos autenticados | PENDENTE | Requer navegador/servidor local acessível e revisão humana sem credenciais reais. |
| Integridade de API/schema | APROVADO | Diff restrito à Web, documentação, testes e `TASKS.md`; nenhuma mudança em `apps/api/**` ou `database/**`. |

O build comprova a compilação e a geração das rotas, mas não substitui o smoke HTTP nem a revisão visual. A tarefa permanece `IN_REVIEW` até a validação manual bloqueada poder ser repetida e os fluxos autenticados serem revisados.
