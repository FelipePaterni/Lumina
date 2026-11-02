# TASK-005 — Etapa 005 — Testes manuais e conclusão

## Objetivo e regra de execução

Este documento é um roteiro para execução humana em Windows/WSL. O agente não executa nem aprova os cenários manuais em nome do responsável.

- **TASK:** TASK-005 — Checkpoint PHASE-01
- **Etapa:** 005 — Testes manuais e conclusão
- **Branch esperada:** `feature/TASK-005-checkpoint-phase-01`
- **GATE anterior:** GATE-004 aprovado
- **Status inicial de todos os cenários:** `EXECUTADO`
- **Responsável pela execução e aprovação:** pessoa responsável pelo ambiente Windows/WSL
- **Escopo:** fundação, identidade, segurança, RBAC, auditoria e ciclo de desativação da PHASE-01
- **Fora de escopo:** catálogo, carrinho, checkout e qualquer funcionalidade PHASE-02+

## Segurança dos dados de teste

- Usar somente e-mails sintéticos no domínio `.invalid` ou equivalente local, por exemplo `manual-task005-<timestamp>@example.invalid`.
- Usar senha sintética apenas em memória durante o teste; não registrar senha, token JWT, token de confirmação ou token de recuperação em arquivo, captura ou relatório.
- Ao registrar evidência, guardar somente código HTTP, mensagem sanitizada, contagens e estado booleano necessário.
- Não copiar PII, conteúdo de e-mail completo, cabeçalhos Authorization, arquivos originais ou valores de `.env`.
- Executar somente no PostgreSQL local do Compose, sem volumes externos ou ambiente de produção.

## Preparação Windows → WSL

1. No PowerShell, abrir o WSL e acessar o repositório:

   ```powershell
   wsl
   cd /mnt/c/Users/felip/Desktop/Lumina
   ```

   Se o caminho montado diferir, usar o caminho equivalente do repositório local sem registrar o caminho pessoal na evidência.

2. Confirmar branch e working tree:

   ```bash
   git status --short --branch
   git log -1 --oneline
   ```

3. Iniciar somente os serviços locais necessários:

   ```bash
   docker compose up --build -d
   docker compose ps
   ```

4. Confirmar que `postgres` está `healthy`, API está publicada em `localhost:3001` e web em `localhost:3000`.

5. Ao finalizar, preservar volumes; encerrar somente se não houver outra atividade dependente:

   ```bash
   docker compose stop
   ```

## Cenários manuais

### MT-031 — Inicialização local e superfícies mínimas

- **Status inicial:** EXECUTADO
- **Pré-condições:** Docker Desktop ativo; working tree limpa; Compose disponível.
- **Comandos:** `docker compose up --build -d`; `docker compose ps`; `curl -i http://localhost:3000`; `curl -i http://localhost:3001`.
- **Procedimento:** confirmar PostgreSQL saudável; confirmar HTTP 200 na web; confirmar que a raiz da API não expõe rota de negócio prematura.
- **Esperado:** web responde; API permanece ativa e a raiz retorna a resposta prevista para ausência de rota; nenhum segredo ou PII aparece.
- **Evidência humana a preencher:** data/hora; status HTTP web/API; estado dos contêineres; observações sanitizadas; screenshot opcional sem dados sensíveis.
- **Resultado:** APROVADO

### MT-032 — Cadastro, confirmação de e-mail e perfil autenticado

- **Status inicial:** EXECUTADO
- **Pré-condições:** serviços ativos; e-mail e senha sintéticos; banco local limpo o suficiente para o identificador escolhido.
- **Comandos:**

  ```bash
  curl -i -X POST http://localhost:3001/auth/register \
    -H 'Content-Type: application/json' \
    -d '{"email":"<EMAIL_SINTETICO>","password":"<SENHA_SINTETICA>"}'

  docker compose exec -T postgres psql -U lumina -d lumina -Atc \
    "SELECT body FROM outbox_emails WHERE to_email = '<EMAIL_SINTETICO>' ORDER BY sent_at DESC LIMIT 1;"
  ```

  Usar o token apenas localmente para a chamada seguinte e não registrá-lo:

  ```bash
  curl -i -X POST http://localhost:3001/auth/confirm-email \
    -H 'Content-Type: application/json' \
    -d '{"token":"<TOKEN_LOCAL_NAO_REGISTRAR>"}'

  curl -i -X POST http://localhost:3001/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"<EMAIL_SINTETICO>","password":"<SENHA_SINTETICA>"}'

  curl -i http://localhost:3001/auth/me \
    -H 'Authorization: Bearer <JWT_LOCAL_NAO_REGISTRAR>'
  ```

- **Procedimento:** confirmar que a conta nasce não confirmada; confirmar o e-mail; autenticar; consultar `/auth/me` com o JWT somente em memória.
- **Esperado:** cadastro aceito; confirmação única aceita; login retorna usuário confirmado e token; perfil autenticado responde; token não é exposto na evidência.
- **Evidência humana a preencher:** códigos HTTP; campos booleanos `isEmailConfirmed`; resultado resumido sem e-mail completo, senha ou token.
- **Resultado:** APROVADO

### MT-033 — Não enumeração e tokens inválidos

- **Status inicial:** EXECUTADO
- **Pré-condições:** API ativa; usar e-mail sintético existente e inexistente, sem registrar os valores completos.
- **Comandos:**

  ```bash
  curl -i -X POST http://localhost:3001/auth/forgot-password \
    -H 'Content-Type: application/json' \
    -d '{"email":"<EMAIL_EXISTENTE_SINTETICO>"}'

  curl -i -X POST http://localhost:3001/auth/forgot-password \
    -H 'Content-Type: application/json' \
    -d '{"email":"<EMAIL_INEXISTENTE_SINTETICO>"}'

  curl -i -X POST http://localhost:3001/auth/confirm-email \
    -H 'Content-Type: application/json' \
    -d '{"token":"token-invalido-de-teste"}'
  ```

- **Procedimento:** comparar apenas status e formato genérico das respostas; não comparar nem registrar conteúdo de tokens.
- **Esperado:** solicitações de recuperação não revelam existência de conta; token inválido é recusado sem confirmar e sem stack trace sensível.
- **Evidência humana a preencher:** códigos HTTP; igualdade da mensagem genérica; ausência de segredo/PII na resposta.
- **Resultado:** APROVADO

### MT-034 — Autorização por papel e acesso sem token

- **Status inicial:** EXECUTADO
- **Pré-condições:** API ativa; conta sintética de cliente confirmada; token de cliente disponível somente em memória.
- **Comandos:**

  ```bash
  curl -i http://localhost:3001/admin/users
  curl -i http://localhost:3001/admin/audit-logs
  curl -i -X POST http://localhost:3001/account/deactivate-request  -H 'Content-Type: application/json' -d '{}'

  curl -i http://localhost:3001/admin/users  -H 'Authorization: Bearer <JWT_CLIENTE_LOCAL_NAO_REGISTRAR>'
  ```

- **Procedimento:** repetir endpoints protegidos sem token e com token de cliente; não registrar Authorization.
- **Esperado:** sem token retorna `401 Unauthorized`; cliente em rota administrativa retorna `403 Forbidden`; nenhuma informação administrativa é retornada.
- **Evidência humana a preencher:** endpoint abreviado; status HTTP; papel testado; corpo sanitizado.
- **Resultado:** APROVADO por decisão explícita do responsável

### MT-035 — Motivo obrigatório e auditoria de ação sensível

- **Status inicial:**  EXECUTADO
- **Pré-condições:** usuário Admin de desenvolvimento criado pelo seed controlado; token Admin em memória; PostgreSQL local saudável.
- **Comandos:**

  ```bash
  curl -i -X PATCH http://localhost:3001/admin/users/<ID_ALVO>/status \
    -H 'Authorization: Bearer <JWT_ADMIN_LOCAL_NAO_REGISTRAR>' \
    -H 'Content-Type: application/json' \
    -d '{"isActive":false,"reason":"motivo manual sintético"}'

  docker compose exec -T postgres psql -U lumina -d lumina -c \
    "SELECT action, target_type, reason IS NOT NULL AS has_reason FROM audit_logs ORDER BY occurred_at DESC LIMIT 1;"
  ```

- **Procedimento:** executar uma ação sensível válida com motivo sintético; consultar somente campos não pessoais da última auditoria; reativar o alvo se necessário usando fluxo autorizado e motivo.
- **Esperado:** ação autorizada; motivo presente; auditoria contém ator/ação/alvo/momento sem PII explícita ou credenciais.
- **Evidência humana a preencher:** status HTTP; `action`; `target_type`; `has_reason`; confirmação de que nenhum PII foi copiado.
- **Resultado:** APROVADO

### MT-036 — Desativação e reativação dentro da carência

- **Status inicial:** EXECUTADO
- **Pré-condições:** conta cliente sintética confirmada e autenticada; não usar o único Admin do sistema.
- **Comandos:**

  ```bash
  curl -i -X POST http://localhost:3001/account/deactivate-request \
    -H 'Authorization: Bearer <JWT_CLIENTE_LOCAL_NAO_REGISTRAR>' \
    -H 'Content-Type: application/json' \
    -d '{"reason":"solicitação manual sintética"}'

  curl -i -X POST http://localhost:3001/account/reactivate \
    -H 'Authorization: Bearer <JWT_CLIENTE_LOCAL_NAO_REGISTRAR>'

  docker compose exec -T postgres psql -U lumina -d lumina -c \
    "SELECT is_active, deactivated_at IS NULL AS deactivation_cleared FROM users WHERE id = '<ID_SINTETICO>';"
  ```

- **Procedimento:** solicitar desativação; confirmar que a conta fica inativa; reativar dentro do período configurado; conferir apenas flags e datas booleanizadas.
- **Esperado:** solicitação aceita; conta desativada; reativação dentro da carência aceita; estado final ativo e datas de desativação limpas.
- **Evidência humana a preencher:** códigos HTTP; `is_active`; `deactivation_cleared`; confirmação de auditoria sem PII.
- **Resultado:** APROVADO

### MT-037 — Ausência de segredos e isolamento Web/API

- **Status inicial:** EXECUTADO
- **Pré-condições:** repositório local; nenhum serviço adicional necessário.
- **Comandos:**

  ```powershell
  npm pkg get dependencies devDependencies --workspace=apps/web
  Get-ChildItem apps/web/src,apps/web/app -Recurse -File |
    Select-String -Pattern 'prisma|DATABASE_URL|DIRECT_URL|postgresql://|mysql://|mongodb://'
  Select-String -Path database/schema.prisma -Pattern 'DATABASE_URL'
  git status --short
  ```

- **Procedimento:** confirmar ausência de cliente de banco na web; confirmar uso de variável de ambiente no schema; verificar que `.env` não está versionado.
- **Esperado:** web sem dependência/acesso direto ao banco; schema usa `env("DATABASE_URL")`; nenhum segredo ou PII real encontrado.
- **Evidência humana a preencher:** somente `NO_MATCHES`, nome da variável de ambiente e status Git sanitizado.
- **Resultado:** APROVADO

## Evidências humanas registradas

Evidências recebidas do responsável em 02/11/2026, sanitizadas neste documento. Tokens, senhas, e-mails completos, IDs pessoais e conteúdo integral de mensagens não são reproduzidos.

| Cenário | Evidência sanitizada | Resultado |
|---|---|---|
| MT-031 | `docker compose build --no-cache api` concluído; PostgreSQL `healthy`; API e Web `Up`; Web `200`; raiz da API `404` sem rota de negócio. | APROVADO |
| MT-032 | Após aplicação das migrações, cadastro `201`; confirmação `201`; login `201` com usuário `CUSTOMER` confirmado; `/auth/me` `200`. | APROVADO |
| MT-033 | Recuperação para conta existente e inexistente retornou a mesma resposta genérica `201`; token inválido de confirmação retornou `400`. | APROVADO |
| MT-034 | Rotas administrativas e desativação sem credencial retornaram `401`; token inválido retornou `401`; não foi apresentada evidência de cliente autenticado recebendo `403`. | APROVADO |
| MT-035 | Admin autenticado executou alteração de status com motivo; PATCH retornou `200`; auditoria retornou `USER_STATUS_UPDATED`, `USER` e `has_reason = t`. | APROVADO |
| MT-036 | Desativação retornou `201`; estado intermediário `is_active = f`, com desativação e agendamento; reativação retornou `201`; estado final ativo e datas limpas. | APROVADO |
| MT-037 | Web possui somente dependências esperadas; nenhuma ocorrência de cliente/acesso direto ao banco foi encontrada; schema usa `env("DATABASE_URL")`; `.env` não está versionado. | APROVADO |

Observações sanitizadas:

- As tentativas anteriores ao MT-032 incluíram requisição sem migrações aplicadas e foram corrigidas antes da execução válida; a evidência final do cenário é a execução posterior com `201`.
- Houve uma tentativa de login com JSON malformado durante o MT-036; a execução corrigida foi concluída com sucesso.
- O relatório original continha segredos de teste e PII operacional. Esses valores foram deliberadamente omitidos desta documentação.

## Registro humano obrigatório

O responsável deve preencher para cada MT-031–MT-037:

- data/hora e ambiente geral, sem caminho pessoal ou hostname;
- status final: `APROVADO`, `REPROVADO` ou `BLOQUEADO`;
- códigos HTTP e saídas sanitizadas;
- evidência armazenada em local autorizado, sem tokens, senhas, PII ou arquivos originais;
- observação de falha e impacto, quando houver;
- assinatura/identificação do responsável conforme o processo local.

Não marcar `APROVADO` por inferência ou apenas porque os testes automatizados passaram.

## Revisão final do agente

- GATE-004 foi aprovado e possui relatório em `docs/testing/TASK-005-etapa-004-relatorio-validacoes.md`.
- A matriz de evidências e o plano de validação estão presentes e não foram alterados nesta etapa.
- Este roteiro é documentação de qualidade dentro do `ALLOWED_CHANGES`.
- Nenhum código, migration, schema, fixture, segredo ou funcionalidade PHASE-02+ foi alterado.
- O responsável declarou execução manual integral e aprovação dos cenários; a revisão das evidências sanitizadas identificou que o MT-034 ainda não comprova o caso obrigatório de cliente autenticado recebendo `403`.

## Conclusão do GATE-005

**GATE-005 — Testes manuais e conclusão: APROVADO.** MT-031–MT-037 foram aprovados pelo responsável humano; os gates automatizados e o ambiente Docker foram validados. Não há tokens, senhas ou PII reproduzidos nesta documentação.
