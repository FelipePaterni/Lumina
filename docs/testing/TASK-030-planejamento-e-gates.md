# TASK-030 — planejamento e gates

## Objetivo

Entregar gestão administrativa utilizável para convites de equipe, usuários, obras e disponibilidade de estoque, mantendo contratos públicos existentes compatíveis.

## Scope Guard

`ALLOWED_CHANGES`: `apps/web/**`, `apps/api/**`, `database/**`, `tests/**`, `docs/testing/TASK-030-*`, `docs/architecture/**`, `README.md`, `TASKS.md`.

`FORBIDDEN_CHANGES`: provedor real de e-mail, gateway/integrações externas, quebra incompatível de API pública, exclusão de compras/aquisições/ativos/movimentos/auditoria e mudanças fora da administração V1.1.

## Contratos e comportamento

- `POST /admin/users/invitations` cria usuário com papel `ADMIN`, `CATALOG` ou `STOCK`, registra auditoria e retorna um link de ativação único por 24 horas. O banco persiste apenas o hash do token; a Web exibe o link uma vez para cópia. O transporte de e-mail continua simulado.
- `POST /auth/accept-invitation` consome o link uma vez, define a senha e confirma o e-mail.
- `GET /admin/users` recebe `search`, `role`, `isActive`, `page` e `limit`, preservando as propriedades anteriores e adicionando paginação explícita.
- `GET /admin/works` e `GET /admin/works/:id` são protegidos para Admin/Catálogo, incluem obras ocultas e suportam busca, visibilidade e paginação.
- `GET /admin/inventory` é protegido para Admin/Estoque e lista edições e disponibilidade com busca e paginação.
- Atualização de obra preserva IDs/relações das edições existentes, cria formatos novos e não remove formatos omitidos. Edições são retiradas de venda por visibilidade.
- Extensão temporária de escopo: edição digital sem `Inventory` é ilimitada como `digitalLicenseLimit: null`; catálogo cria o registro para novas edições digitais e checkout cria/atualiza contador legado dentro da transação. Edição física sem inventário permanece indisponível; bundles aceitam e-books ilimitados sem registro e respeitam limites finitos.
- Sessão Web unificada de cliente/equipe fica em `sessionStorage` por aba, é restaurada apenas com token JWT não expirado e papel consistente; checkout usa o mesmo provedor da loja. Logout apaga a sessão; expiração exige novo login. Contratos HTTP permanecem os mesmos.

## Cenários de validação

- Convite: papéis válidos, e-mail duplicado inválido, razão obrigatória, ativação, senha criada, e-mail confirmado, token expirado/reutilizado recusado e role denial.
- Usuários: busca por e-mail, papel/status, paginação, alteração de papel/status com auditoria e sem PII/tokens nos metadados.
- Catálogo: localizar obra oculta no Admin e ausente na vitrine; editar obra com `LibraryItem` existente preservando ID de edição, inventário e histórico; adicionar edição inexistente e ocultar edição.
- Estoque: listar físico/digital, ajustar valores com motivo, negar formato incompatível e recusar chamadas de papel inadequado.
- Web: navegação por papel, estados carregando/vazio/erro, convite até login, catálogo e estoque em desktop/mobile/tablet.

## Gates

| Gate | Estado | Evidência |
|---|---|---|
| Escopo e DoR | APROVADO | `TASKS.md`; branch `feature/TASK-030-admin-management`; decisões de convite confirmadas. |
| Migration/schema | APROVADO | `npx prisma validate`; migration aplicada somente no banco isolado `lumina_task009_test`. |
| Build/lint/testes | APROVADO | `npm run lint`, `npm test` (116/116), builds API/Web (33 rotas), integração TASK-030 (1/1) e TASK-013 (1/1). |
| Roteiro manual autenticado | BLOQUEADO | Executado sem `API_BASE_URL` e `ADMIN_TOKEN`; 4 cenários bloqueados por ausência de credencial/endereço do ambiente. Relatório em `docs/testing/TASK-030-testes-manuais-resultado.md`. |
| Revisão visual autenticada da Web | ACEITO PELO RESPONSÁVEL | Em 2026-11-22, o responsável confirmou que os fluxos estão funcionando e autorizou encerrar a TASK-030. |
| Extensão de disponibilidade e sessão | APROVADO | Teste HTTP de checkout de e-book grátis sem Inventory e bundle sem Inventory; alocação criada para cada edição. Testes unitários cobrem criação/backfill digital e recuperação, role, expiração e limpeza de sessão. |
| Documentação/Scope Guard | APROVADO | README, mapa de rotas, relatório sanitizado e `git diff --check`; diff restrito às mudanças autorizadas, sem ações proibidas. |
