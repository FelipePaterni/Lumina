# TASK-004 — Roteiro de Testes Manuais

## Registro

Roteiro de testes manuais para validação humana do RBAC (guardas de autorização por papel), trilha de auditoria estruturada e fluxo de solicitação de exclusão/desativação de conta em ambiente Windows/WSL.

## Preparação Windows → WSL

1. Certifique-se de que o Docker Desktop está ativo e o contêiner PostgreSQL está saudável:
   ```powershell
   docker compose ps
   # STATUS esperado: lumina-postgres-1 Up (healthy) na porta 5433
   # Se necessário:
   docker compose up -d postgres
   ```
2. No PowerShell, acesse o diretório raiz do repositório:
   ```powershell
   cd C:\Users\felip\Desktop\Lumina
   ```
3. Confirme que todas as migrações estão aplicadas:
   ```powershell
   npm run db:migrate
   # Esperado: "No pending migrations to apply" (3 migrations já aplicadas)
   ```
4. Compile a API antes de executar cenários de endpoint:
   ```powershell
   npm run build --workspace=apps/api
   ```
5. Inicie a API em terminal separado (mantenha-o aberto durante os testes):
   ```powershell
   # Defina variáveis de ambiente de teste ANTES de iniciar a API:
   $env:ADMIN_SEED_EMAIL = "admin-test@lumina.local"
   $env:ADMIN_SEED_PASSWORD = "AdminTeste!2026"
   npm run start --workspace=apps/api
   ```
   - Confirme que a API está ouvindo na porta esperada (verifique `apps/api/src/main.ts`, esperado: 3001).
6. **SEGURANÇA:** Nunca usar credenciais reais de produção nas variáveis de ambiente durante os testes.
7. Ao concluir, `Ctrl+C` na API e `docker compose down` sem remover volumes.

> **BLOQUEIO POTENCIAL:** Se a API não iniciar, verificar logs do NestJS no terminal antes de avançar.

---

## Cenários de Teste

### MT-021 — RBAC: Acesso Negado a Endpoint Administrativo para Cliente (RF-023 / RNF-002)

- **Status:** NÃO EXECUTADO — execução humana pendente; evidência automatizada disponível
- **Objetivo:** Confirmar que o `RolesGuard` nega acesso com HTTP 403 Forbidden quando um cliente tenta acessar endpoint restrito a `ADMIN`.
- **Pré-condições:**
  - API em execução.
  - Usuário `CUSTOMER` cadastrado e autenticado (reutilizar usuário criado na TASK-003 ou registrar novo via `POST /auth/register`).
- **Procedimento:**
  1. Obter token JWT de um usuário com papel `CUSTOMER`:
     ```powershell
     $response = Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/login" `
       -ContentType "application/json" `
       -Body '{"email":"manual-test@lumina.local","password":"NovaSenha!2026"}'
     $customerToken = $response.accessToken
     ```
  2. Tentar acessar endpoint administrativo com token de `CUSTOMER`:
     ```powershell
     try {
       Invoke-RestMethod -Method GET -Uri "http://localhost:3001/admin/users" `
         -Headers @{ Authorization = "Bearer $customerToken" }
     } catch { $_.Exception.Response.StatusCode }
     ```
  3. Tentar `PATCH /admin/users/:id/role` com token de `CUSTOMER`:
     ```powershell
     try {
       Invoke-RestMethod -Method PATCH -Uri "http://localhost:3001/admin/users/qualquer-id/role" `
         -ContentType "application/json" `
         -Headers @{ Authorization = "Bearer $customerToken" } `
         -Body '{"role":"ADMIN","reason":"Tentativa indevida"}'
     } catch { $_.Exception.Response.StatusCode }
     ```
  4. Tentar `GET /admin/audit-logs` com token de `CUSTOMER`:
     ```powershell
     try {
       Invoke-RestMethod -Method GET -Uri "http://localhost:3001/admin/audit-logs" `
         -Headers @{ Authorization = "Bearer $customerToken" }
     } catch { $_.Exception.Response.StatusCode }
     ```
- **Resultado esperado:**
  - Todas as requisições retornam HTTP **403 Forbidden**.
  - Mensagem de erro indicando negação por papel insuficiente (sem vazamento de detalhes internos).
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** código de status HTTP de cada tentativa, corpo da resposta de erro.

---

### MT-022 — RBAC: Acesso Autorizado para Admin a Endpoints Administrativos (RF-023)

- **Status:** NÃO EXECUTADO — execução humana pendente; evidência automatizada disponível
- **Objetivo:** Confirmar que um usuário com papel `ADMIN` acessa com sucesso os endpoints protegidos por `@Roles(Role.ADMIN)`.
- **Pré-condições:**
  - API em execução com `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` definidos.
  - Admin já criado via seed (verificável no banco).
- **Procedimento:**
  1. Autenticar como Admin:
     ```powershell
     $adminResponse = Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/login" `
       -ContentType "application/json" `
       -Body '{"email":"admin-test@lumina.local","password":"AdminTeste!2026"}'
     $adminToken = $adminResponse.accessToken
     ```
  2. Listar usuários via `GET /admin/users`:
     ```powershell
     $users = Invoke-RestMethod -Method GET -Uri "http://localhost:3001/admin/users" `
       -Headers @{ Authorization = "Bearer $adminToken" }
     $users | ConvertTo-Json -Depth 3
     ```
  3. Verificar que a resposta contém `users` (array) e `total` (número) sem `passwordHash`.
  4. Consultar trilha de auditoria via `GET /admin/audit-logs`:
     ```powershell
     $logs = Invoke-RestMethod -Method GET -Uri "http://localhost:3001/admin/audit-logs" `
       -Headers @{ Authorization = "Bearer $adminToken" }
     $logs | ConvertTo-Json -Depth 3
     ```
- **Resultado esperado:**
  - `GET /admin/users` → HTTP 200 com lista de usuários (sem `passwordHash` nos objetos).
  - `GET /admin/audit-logs` → HTTP 200 com lista de logs de auditoria contendo `id`, `actorId`, `actorRole`, `action`, `targetType`, `reason`, `createdAt`.
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** status HTTP, corpo de resposta (redatando dados pessoais antes de registrar), ausência de `passwordHash`.

---

### MT-023 — RBAC: Alteração de Papel com Motivo Obrigatório (RF-023 / RN-017 / DoD)

- **Status:** NÃO EXECUTADO — execução humana pendente; evidência automatizada disponível
- **Objetivo:** Confirmar que `PATCH /admin/users/:id/role` exige motivo (`reason`) obrigatório e registra auditoria (`USER_ROLE_UPDATED`); sem motivo, retorna erro.
- **Pré-condições:**
  - Admin autenticado (`$adminToken` obtido em MT-022).
  - ID de um usuário `CUSTOMER` existente disponível (obtido via `GET /admin/users`).
- **Procedimento:**
  1. Obter o ID do usuário `CUSTOMER` de teste:
     ```powershell
     $targetUserId = ($users.users | Where-Object { $_.role -eq "CUSTOMER" } | Select-Object -First 1).id
     Write-Output $targetUserId
     ```
  2. **Cenário de negação — sem motivo:**
     ```powershell
     try {
       Invoke-RestMethod -Method PATCH `
         -Uri "http://localhost:3001/admin/users/$targetUserId/role" `
         -ContentType "application/json" `
         -Headers @{ Authorization = "Bearer $adminToken" } `
         -Body '{"role":"CATALOG"}'
     } catch { $_.Exception.Response.StatusCode }
     ```
  3. **Cenário de negação — motivo muito curto (< 5 chars):**
     ```powershell
     try {
       Invoke-RestMethod -Method PATCH `
         -Uri "http://localhost:3001/admin/users/$targetUserId/role" `
         -ContentType "application/json" `
         -Headers @{ Authorization = "Bearer $adminToken" } `
         -Body '{"role":"CATALOG","reason":"ok"}'
     } catch { $_.Exception.Response.StatusCode }
     ```
  4. **Cenário de aceite — motivo válido:**
     ```powershell
     Invoke-RestMethod -Method PATCH `
       -Uri "http://localhost:3001/admin/users/$targetUserId/role" `
       -ContentType "application/json" `
       -Headers @{ Authorization = "Bearer $adminToken" } `
       -Body '{"role":"CATALOG","reason":"Promovido para gerência de catálogo"}'
     ```
  5. Verificar no banco que o papel foi alterado:
     ```sql
     SELECT id, email, role FROM users WHERE id = '<targetUserId>';
     ```
  6. Verificar registro de auditoria criado:
     ```sql
     SELECT action, actor_role, target_id, reason, created_at
     FROM audit_logs WHERE action = 'USER_ROLE_UPDATED' ORDER BY created_at DESC LIMIT 1;
     ```
- **Resultado esperado:**
  - Sem `reason` → HTTP 400.
  - `reason` muito curto → HTTP 400.
  - Com `reason` válido → HTTP 200, papel alterado para `CATALOG`.
  - Registro em `audit_logs` com `action = 'USER_ROLE_UPDATED'`, `reason` preenchido, `metadata` sem PII.
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** resposta de cada cenário, query SQL de verificação do papel e do log de auditoria.

---

### MT-024 — Auditoria Estruturada: Trilha sem PII Explícita (RN-017 / RNF-003 / RNF-008)

- **Status:** NÃO EXECUTADO — execução humana pendente; evidência automatizada disponível
- **Objetivo:** Confirmar que a tabela `audit_logs` não armazena dados pessoais explícitos (senha, e-mail, CPF, token) em `metadata` ou `reason`, apenas referências por IDs.
- **Pré-condições:**
  - Pelo menos uma ação sensível gerou registro em `audit_logs` (MT-023 executado).
- **Procedimento:**
  1. Inspecionar o campo `metadata` do último log de `USER_ROLE_UPDATED`:
     ```sql
     SELECT id, action, actor_id, target_id, reason, metadata
     FROM audit_logs
     WHERE action = 'USER_ROLE_UPDATED'
     ORDER BY created_at DESC LIMIT 3;
     ```
  2. Confirmar que `metadata` não contém valores de e-mail, senha, token ou documentos:
     - `metadata` deve conter apenas campos não-sensíveis (ex.: `newRole: "CATALOG"`).
     - Campos sensíveis devem aparecer como `[REDACTED]` se presentes.
  3. Verificar ausência de dados pessoais explícitos em `reason`:
     ```sql
     SELECT reason FROM audit_logs WHERE action = 'ACCOUNT_DELETION_REQUESTED' LIMIT 5;
     ```
  4. Confirmar que nenhuma coluna de `audit_logs` armazena `password_hash`, e-mails ou documentos em texto livre:
     ```sql
     SELECT column_name, data_type FROM information_schema.columns
     WHERE table_name = 'audit_logs';
     ```
- **Resultado esperado:**
  - Campo `metadata` contém apenas valores não-sensíveis ou `[REDACTED]` para campos marcados como PII.
  - Coluna `reason` contém texto de negócio, não dados pessoais explícitos.
  - Esquema da tabela não possui colunas destinadas a armazenar senhas, tokens ou documentos.
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** output do SELECT de audit_logs (sem copiar valores potencialmente sensíveis nos registros).

---

### MT-025 — Solicitação de Exclusão de Conta (POST /account/deactivate-request / RN-018)

- **Status:** NÃO EXECUTADO — execução humana pendente; evidência automatizada disponível
- **Objetivo:** Confirmar que o cliente pode solicitar a exclusão de sua conta, que a conta é imediatamente desativada (`isActive = false`), que o prazo de 30 dias é definido corretamente em `scheduledDeletionAt` e que dois e-mails simulados são gerados (cliente e admin).
- **Pré-condições:**
  - API em execução.
  - Usuário `CUSTOMER` ativo e autenticado.
- **Procedimento:**
  1. Autenticar como cliente:
     ```powershell
     $custResponse = Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/login" `
       -ContentType "application/json" `
       -Body '{"email":"manual-test@lumina.local","password":"NovaSenha!2026"}'
     $custToken = $custResponse.accessToken
     ```
  2. Solicitar exclusão da conta:
     ```powershell
     $deactivation = Invoke-RestMethod -Method POST `
       -Uri "http://localhost:3001/account/deactivate-request" `
       -ContentType "application/json" `
       -Headers @{ Authorization = "Bearer $custToken" } `
       -Body '{"reason":"Não tenho mais interesse no serviço"}'
     $deactivation | ConvertTo-Json
     ```
  3. Verificar campos `deactivatedAt` e `scheduledDeletionAt` na resposta.
  4. Verificar no banco que `isActive = false` e os timestamps estão corretos:
     ```sql
     SELECT id, is_active, deactivated_at, scheduled_deletion_at
     FROM users WHERE email = 'manual-test@lumina.local';
     ```
  5. Verificar que dois `OutboxEmail` foram gerados (um para o cliente, um para o admin):
     ```sql
     SELECT to_email, subject, created_at
     FROM outbox_emails
     ORDER BY created_at DESC LIMIT 5;
     ```
  6. Verificar registro em `audit_logs` com `action = 'ACCOUNT_DELETION_REQUESTED'`:
     ```sql
     SELECT action, actor_role, reason, created_at
     FROM audit_logs WHERE action = 'ACCOUNT_DELETION_REQUESTED'
     ORDER BY created_at DESC LIMIT 1;
     ```
  7. **Tentativa de reuso após desativação** — Login deve retornar `isEmailConfirmed` e `isActive = false` (se o JWT for aceito) ou verificar comportamento da API:
     ```powershell
     Invoke-RestMethod -Method GET -Uri "http://localhost:3001/auth/me" `
       -Headers @{ Authorization = "Bearer $custToken" }
     ```
- **Resultado esperado:**
  - HTTP 200 com `message`, `deactivatedAt` e `scheduledDeletionAt` (≈ 30 dias após `deactivatedAt`).
  - `isActive = false` no banco; `deactivated_at` e `scheduled_deletion_at` preenchidos.
  - 2 registros em `outbox_emails`.
  - Registro em `audit_logs` com `action = 'ACCOUNT_DELETION_REQUESTED'` e `reason` preenchido.
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** resposta da requisição, queries SQL (sem expor e-mails reais).

---

### MT-026 — Reativação de Conta Dentro do Prazo (POST /account/reactivate / RN-018)

- **Status:** NÃO EXECUTADO — execução humana pendente; evidência automatizada disponível
- **Objetivo:** Confirmar que o usuário pode reativar a conta dentro da janela de 30 dias, que `isActive` volta a `true` e que os timestamps de desativação são limpos.
- **Pré-condições:**
  - Conta desativada (MT-025 executado com sucesso).
  - Token JWT do usuário ainda válido (obtido antes da desativação).
- **Procedimento:**
  1. Solicitar reativação com token obtido antes da desativação:
     ```powershell
     $reactivation = Invoke-RestMethod -Method POST `
       -Uri "http://localhost:3001/account/reactivate" `
       -Headers @{ Authorization = "Bearer $custToken" }
     $reactivation | ConvertTo-Json
     ```
  2. Verificar no banco que `isActive = true` e os campos de desativação foram limpos:
     ```sql
     SELECT is_active, deactivated_at, scheduled_deletion_at
     FROM users WHERE email = 'manual-test@lumina.local';
     ```
  3. Verificar que um novo `OutboxEmail` de reativação foi gerado:
     ```sql
     SELECT to_email, subject, created_at
     FROM outbox_emails ORDER BY created_at DESC LIMIT 2;
     ```
  4. Verificar registro em `audit_logs` com `action = 'ACCOUNT_REACTIVATED'`:
     ```sql
     SELECT action, actor_role, reason, created_at
     FROM audit_logs WHERE action = 'ACCOUNT_REACTIVATED'
     ORDER BY created_at DESC LIMIT 1;
     ```
- **Resultado esperado:**
  - HTTP 200 com `message` confirmando reativação e `isActive: true`.
  - `is_active = true`, `deactivated_at = NULL`, `scheduled_deletion_at = NULL` no banco.
  - Novo registro em `outbox_emails` para o cliente.
  - Registro em `audit_logs` com `action = 'ACCOUNT_REACTIVATED'`.
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** resposta da requisição, queries SQL.

---

### MT-027 — Proteção contra Auto-Desativação do Único Admin (RN-018 / Regra de Segurança)

- **Status:** NÃO EXECUTADO — execução humana pendente; evidência automatizada disponível
- **Objetivo:** Confirmar que o sistema impede que o único Administrador ativo desative sua própria conta via `POST /account/deactivate-request`.
- **Pré-condições:**
  - API em execução.
  - Exatamente 1 Admin ativo no banco.
  - Admin autenticado.
- **Procedimento:**
  1. Verificar que há exatamente 1 admin ativo:
     ```sql
     SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND is_active = true;
     ```
  2. Tentar desativar a conta com token de Admin:
     ```powershell
     try {
       Invoke-RestMethod -Method POST `
         -Uri "http://localhost:3001/account/deactivate-request" `
         -ContentType "application/json" `
         -Headers @{ Authorization = "Bearer $adminToken" } `
         -Body '{"reason":"Quero sair do sistema"}'
     } catch { Write-Output $_.Exception.Response.StatusCode; $_ | ConvertTo-Json }
     ```
  3. Verificar que o Admin ainda está ativo no banco:
     ```sql
     SELECT is_active, deactivated_at FROM users WHERE email = 'admin-test@lumina.local';
     ```
- **Resultado esperado:**
  - HTTP **403 Forbidden** com mensagem indicando que não é permitido desativar o único Administrador ativo.
  - Admin permanece com `is_active = true` e `deactivated_at = NULL` no banco.
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** código de status HTTP, mensagem de erro, query SQL de verificação.

---

### MT-028 — Proteção contra Auto-Rebaixamento de Papel do Admin (RF-023 / Regra de Segurança)

- **Status:** NÃO EXECUTADO — execução humana pendente; evidência automatizada disponível
- **Objetivo:** Confirmar que um Administrador não pode alterar o próprio papel para um papel não-`ADMIN` via `PATCH /admin/users/:id/role`.
- **Pré-condições:**
  - Admin autenticado (`$adminToken` e ID do admin disponíveis).
  - Verificar o ID do Admin:
    ```sql
    SELECT id FROM users WHERE email = 'admin-test@lumina.local';
    ```
- **Procedimento:**
  1. Obter o `sub` (ID do admin) decodificando o JWT:
     ```powershell
     $payload = $adminToken.Split('.')[1]
     $padded = $payload + "=" * ((4 - $payload.Length % 4) % 4)
     [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($padded))
     ```
  2. Tentar alterar o próprio papel para `CUSTOMER`:
     ```powershell
     $adminId = "<ID_DO_ADMIN>"  # obtido do payload JWT acima
     try {
       Invoke-RestMethod -Method PATCH `
         -Uri "http://localhost:3001/admin/users/$adminId/role" `
         -ContentType "application/json" `
         -Headers @{ Authorization = "Bearer $adminToken" } `
         -Body '{"role":"CUSTOMER","reason":"Rebaixamento de teste"}'
     } catch { $_.Exception.Response.StatusCode }
     ```
  3. Verificar que o papel do Admin permanece `ADMIN` no banco:
     ```sql
     SELECT role FROM users WHERE email = 'admin-test@lumina.local';
     ```
- **Resultado esperado:**
  - HTTP **403 Forbidden** com mensagem indicando que o Administrador não pode revogar o próprio papel.
  - Papel do usuário permanece `ADMIN` no banco.
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** código de status HTTP, mensagem de erro, query SQL de verificação.

---

### MT-029 — Acesso Sem Token a Endpoints Protegidos (RNF-002)

- **Status:** NÃO EXECUTADO — execução humana pendente; evidência automatizada disponível
- **Objetivo:** Confirmar que todos os endpoints protegidos por `JwtAuthGuard` retornam HTTP 401 Unauthorized para requisições sem token.
- **Pré-condições:** API em execução.
- **Procedimento:**
  1. Tentar `GET /admin/users` sem token:
     ```powershell
     try { Invoke-RestMethod -Method GET -Uri "http://localhost:3001/admin/users" }
     catch { $_.Exception.Response.StatusCode }
     ```
  2. Tentar `POST /account/deactivate-request` sem token:
     ```powershell
     try {
       Invoke-RestMethod -Method POST -Uri "http://localhost:3001/account/deactivate-request" `
         -ContentType "application/json" -Body '{}'
     } catch { $_.Exception.Response.StatusCode }
     ```
  3. Tentar `GET /admin/audit-logs` sem token:
     ```powershell
     try { Invoke-RestMethod -Method GET -Uri "http://localhost:3001/admin/audit-logs" }
     catch { $_.Exception.Response.StatusCode }
     ```
- **Resultado esperado:**
  - Todas as requisições sem token retornam HTTP **401 Unauthorized**.
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** código de status HTTP de cada endpoint.

---

### MT-030 — Segurança: Ausência de Credenciais em Migrações e Código de Auditoria

- **Status:** NÃO EXECUTADO — execução humana pendente; evidência automatizada disponível
- **Objetivo:** Confirmar que os novos artefatos da TASK-004 não contêm segredos, tokens reais ou PII hardcoded nos arquivos de migração, schema ou código de serviço.
- **Pré-condições:** Acesso ao repositório local.
- **Procedimento:**
  1. Verificar migration SQL por padrões suspeitos:
     ```powershell
     Get-ChildItem "database\migrations\20261026120000_audit_and_account_deletion" -Recurse -File |
       Select-String -Pattern "password|secret|token|Bearer|api_key" -CaseSensitive:$false
     ```
  2. Verificar módulo de auditoria por credenciais hardcoded:
     ```powershell
     Get-ChildItem "apps\api\src\modules\audit" -Recurse -File |
       Select-String -Pattern "sk-|Bearer [A-Za-z0-9+/]{20,}" -CaseSensitive:$false
     ```
  3. Verificar decorators e guards de RBAC por segredos:
     ```powershell
     Get-ChildItem "apps\api\src\modules\identity\presentation\decorators",
       "apps\api\src\modules\identity\presentation\guards\roles.guard.ts" -Recurse -File |
       Select-String -Pattern "password\s*=|secret\s*=" -CaseSensitive:$false
     ```
  4. Verificar que o schema.prisma ainda usa `env("DATABASE_URL")`:
     ```powershell
     Select-String -Path "database\schema.prisma" -Pattern "DATABASE_URL"
     ```
- **Resultado esperado:**
  - Nenhuma credencial real, token ou PII hardcoded nos arquivos da migração ou nos novos módulos.
  - `database/schema.prisma` usa exclusivamente `env("DATABASE_URL")`.
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** output de cada varredura.

---

## Tabela de Status

| ID     | Descrição                                                            | Status        |
|--------|----------------------------------------------------------------------|---------------|
| MT-021 | RBAC: acesso negado (403) ao cliente em endpoint de Admin            | NÃO EXECUTADO |
| MT-022 | RBAC: acesso autorizado (200) ao Admin em endpoints administrativos  | NÃO EXECUTADO |
| MT-023 | Alteração de papel com motivo obrigatório e auditoria gerada         | NÃO EXECUTADO |
| MT-024 | Auditoria estruturada sem PII explícita em metadata e reason         | NÃO EXECUTADO |
| MT-025 | Solicitação de exclusão de conta — desativação em 30 dias            | NÃO EXECUTADO |
| MT-026 | Reativação de conta dentro do prazo                                  | NÃO EXECUTADO |
| MT-027 | Bloqueio de auto-desativação do único Admin (403)                    | NÃO EXECUTADO |
| MT-028 | Bloqueio de auto-rebaixamento de papel do Admin (403)               | NÃO EXECUTADO |
| MT-029 | Acesso sem token retorna 401 em todos os endpoints protegidos        | NÃO EXECUTADO |
| MT-030 | Segurança: ausência de credenciais nos artefatos da TASK-004         | NÃO EXECUTADO |

---

## Observações Finais

- **Execução:** 29/10/2026, API local em `http://localhost:3001`, PostgreSQL local em `localhost:5433`; sem credenciais reais.
- **EVIDÊNCIA AUTOMATIZADA, NÃO MANUAL:** foram observados os resultados esperados de MT-021–030 em ambiente local; esses resultados não alteram o status dos testes, que permanece `NÃO EXECUTADO` até execução humana.
- **PENDÊNCIA HUMANA:** preencher `Resultado / Evidência` e os campos de registro de cada cenário após execução manual.
- **MT-030 — preparação:** a varredura automatizada encontrou 0 matches de credenciais na migration, módulo de auditoria e guards/decorators; `database/schema.prisma` usa `env("DATABASE_URL")`.
- **Gates aprovados:** build da API, lint, `npm test` (15/15) e integração específica `rbac-and-audit.test.mjs` (passou contra PostgreSQL real).
- **GATE-005:** após a correção do rollback e do teste de ciclo de migration, `npm run test:integration` terminou 4/4 testes passando; `npm run db:migrate` confirmou que não há migrations pendentes.
