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
| Build/lint/testes | APROVADO | `npm run lint`, `npm test` (108/108), builds API/Web (33 rotas) e integração HTTP/API (1/1). |
| Roteiro manual autenticado | BLOQUEADO | Executado sem `API_BASE_URL` e `ADMIN_TOKEN`; 4 cenários bloqueados por ausência de credencial/endereço do ambiente. Relatório em `docs/testing/TASK-030-testes-manuais-resultado.md`. |
| Revisão visual autenticada da Web | PENDENTE | Falta percorrer convite, catálogo e estoque em sessão Web autenticada em desktop/mobile/tablet. |
| Documentação/Scope Guard | APROVADO | README, mapa de rotas, relatório sanitizado e `git diff --check`; diff restrito às mudanças autorizadas, sem ações proibidas. |
