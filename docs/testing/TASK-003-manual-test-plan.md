# TASK-003 — Roteiro de Testes Manuais

## Registro

Roteiro de testes manuais para validação humana da identidade, autenticação, confirmação de e-mail e recuperação de senha em ambiente Windows/WSL.

## Preparação Windows → WSL

1. Inicie o Docker Desktop: `Start-Process "C:\Users\felip\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"` e aguarde estabilização.
2. No PowerShell, confirme a saúde do contêiner PostgreSQL: `docker compose ps`. Se necessário, inicie com `docker compose up -d postgres`.
3. Aguarde o contêiner reportar `healthy` antes de executar qualquer teste.
4. No PowerShell, acesse o diretório raiz do repositório: `cd C:\Users\felip\Desktop\Lumina`.
5. Confirme as variáveis de ambiente ou use o fallback padrão configurado para ambiente local (`postgresql://lumina:local-development-only@localhost:5433/lumina`).
6. **ATENÇÃO:** As variáveis `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` são necessárias para MT-018. Defina valores de teste **não reais** antes de executar esse cenário:
   ```powershell
   $env:ADMIN_SEED_EMAIL = "admin-test@lumina.local"
   $env:ADMIN_SEED_PASSWORD = "AdminTeste!2026"
   ```
7. Ao concluir os testes, preservar ou encerrar os serviços conforme orientação (`docker compose down` sem remover volumes).

> **BLOQUEIO DOCUMENTADO:** Docker Desktop não estava ativo durante Etapa 005. Os cenários MT-011 a MT-019 exigem Docker e PostgreSQL ativos. Caso Docker não esteja disponível, todos esses cenários devem ser marcados como `BLOQUEADO` e não como `APROVADO`.

---

## Cenários de Teste

### MT-011 — Aplicação de Migração de Identidade (db:migrate)

- **Status:** APROVADO
- **Objetivo:** Confirmar que `npm run db:migrate` aplica a migração `20261026080000_identity_and_auth` e cria as tabelas `users`, `email_verification_tokens`, `password_reset_tokens` e `outbox_emails`, além de criar o enum `Role`.
- **Pré-condições:**
  - Docker Desktop ativo, contêiner PostgreSQL saudável na porta 5433.
  - Branch `feature/TASK-003-identidade-e-confirmacao-de-email` com código implementado.
  - Migração anterior `20261022175313_init_baseline` já aplicada (ou aplicar ambas em sequência).
- **Procedimento:**
  1. No PowerShell: `npm run db:migrate`
  2. Conectar ao contêiner para inspecionar: `docker exec -it lumina_postgres psql -U lumina -d lumina`
  3. Verificar tabelas criadas:
     ```sql
     SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'  ORDER BY table_name;
     ```
  4. Verificar enum `Role`:
     ```sql
     SELECT typname, enumlabel FROM pg_type
     JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid
     WHERE typname = 'Role'
     ORDER BY enumsortorder;
     ```
  5. Verificar colunas da tabela `users`:
     ```sql
     SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name = 'users'
     ORDER BY ordinal_position;
     ```
  6. Verificar histórico de migrações:
     ```sql
     SELECT migration_name, started_at, finished_at, rolled_back_at
     FROM public."_prisma_migrations"
     ORDER BY started_at DESC;
     ```
- **Resultado esperado:**
  - Código de saída `0`.
  - Tabelas `users`, `email_verification_tokens`, `password_reset_tokens`, `outbox_emails` presentes.
  - Enum `Role` com valores `ADMIN`, `CATALOG`, `STOCK`, `CUSTOMER`.
  - Migração `20261026080000_identity_and_auth` registrada em `_prisma_migrations`.
- **Resultado / Evidência:** _(preencher após execução)_
- **Campos a registrar:** saída completa do terminal, output do SELECT de tabelas, output do SELECT de enum.
```bash
PS C:\Users\felip\Desktop\Lumina> npm run db:migrate
npm notice run lumina-livros@0.1.0 db:migrate
npm notice run npm run db:migrate --workspace=@lumina/api
npm notice run @lumina/api@0.1.0 db:migrate
npm notice run node ../../database/scripts/migrate.mjs
Running prisma migrate deploy...
npm notice run lumina-livros@0.1.0 npx
npm notice run prisma migrate deploy --schema=C:\Users\felip\Desktop\Lumina\database\schema.prisma
Environment variables loaded from .env
Prisma schema loaded from database\schema.prisma
Datasource "db": PostgreSQL database "lumina", schema "public" at "localhost:5433"

2 migrations found in prisma/migrations


┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.3 -> 8.0.0-rc.27                 │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
No pending migrations to apply.
PS C:\Users\felip\Desktop\Lumina> docker exec -it lumina-postgres-1 psql -U lumina -d lumina
psql (17.11)
Type "help" for help.

lumina=# SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
        table_name         
---------------------------
 _prisma_migrations
 email_verification_tokens
 health_persistence
 outbox_emails
 password_reset_tokens
 users   
(6 rows) 
         
lumina=# 
lumina=# SELECT typname, enumlabel FROM pg_type JOIN pg_enum ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'Role' ORDER BY enumsortorder;
 typname | enumlabel 
---------+-----------
 Role    | ADMIN
 Role    | CATALOG
 Role    | STOCK
 Role    | CUSTOMER
(4 rows)

lumina=# SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position;
    column_name     |        data_type         | is_nullable |   column_default   
--------------------+--------------------------+-------------+--------------------
 id                 | text                     | NO          | 
 email              | text                     | NO          | 
 password_hash      | text                     | NO          | 
 role               | USER-DEFINED             | NO          | 'CUSTOMER'::"Role"
 is_email_confirmed | boolean                  | NO          | false
 is_active          | boolean                  | NO          | true
 created_at         | timestamp with time zone | NO          | CURRENT_TIMESTAMP
 updated_at         | timestamp with time zone | NO          | 
(8 rows) 
         
lumina=# SELECT migration_name, started_at, finished_at, rolled_back_at FROM public."_prisma_migrations" ORDER BY started_at DESC;
          migration_name          |          started_at           |          finished_at          | rolled_back_at 
----------------------------------+-------------------------------+-------------------------------+----------------
 20261026080000_identity_and_auth | 2026-10-26 12:26:49.765635+00 | 2026-10-26 12:26:49.788455+00 | 
 20261022175313_init_baseline     | 2026-10-26 12:26:49.740856+00 | 2026-10-26 12:26:49.761228+00 | 
(2 rows)
```


---

### MT-012 — Registro de Usuário via API (POST /auth/register)

- **Status:** APROVADO
- **Objetivo:** Confirmar que o endpoint `POST /auth/register` retorna 201, cria o usuário com senha hasheada, registra um `OutboxEmail` e não expõe PII nem hash de senha na resposta.
- **Pré-condições:**
  - Tabelas criadas (MT-011 aprovado).
  - API compilada e iniciada: `npm run build --workspace=apps/api ; npm run start --workspace=apps/api` na porta 3001.
- **Procedimento:**
  1. Iniciar a API.
  2. Enviar requisição de registro:
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/register" `
       -ContentType "application/json" `
       -Body '{"name":"Teste Manual","email":"manual-test@lumina.local","password":"Senha!2026"}'
     ```
  3. Verificar no banco a criação do usuário:
     ```sql
     SELECT id, email, role, is_email_confirmed, created_at
     FROM users WHERE email = 'manual-test@lumina.local';
     ```
  4. Verificar que `password_hash` NÃO está na resposta da API.
  5. Verificar que um registro foi criado em `outbox_emails`:
     ```sql
     SELECT id, to_email, subject, sent_at FROM outbox_emails
     WHERE to_email = 'manual-test@lumina.local';
     ```
- **Resultado esperado:**
  - HTTP 201 com corpo contendo mensagem de sucesso e `userId` — sem `passwordHash` ou dados sensíveis.
  - Usuário criado no banco com `role = 'CUSTOMER'` e `is_email_confirmed = false`.
  - Registro em `outbox_emails` com `to_email = 'manual-test@lumina.local'`.
- **Resultado / Evidência:**
  - Resposta da API:
    ```json
    {
      "message": "Cadastro realizado com sucesso. Verifique seu e-mail para confirmar a conta.",
      "userId": "ff4f883c-e22b-46ed-9152-113eb58af61a"
    }
    ```
  - Banco de Dados (`users`):
    ```text
                      id                  |          email           |   role   | is_email_confirmed |         created_at         
    --------------------------------------+--------------------------+----------+--------------------+----------------------------
     ff4f883c-e22b-46ed-9152-113eb58af61a | manual-test@lumina.local | CUSTOMER | f                  | 2026-10-26 13:26:16.223+00
    ```
  - Banco de Dados (`outbox_emails`):
    ```text
                      id                  |         to_email         |                 subject                 |          sent_at           |                                            body                                            
    --------------------------------------+--------------------------+-----------------------------------------+----------------------------+--------------------------------------------------------------------------------------------
     e43935f7-35ea-4f37-93ce-c14d5bb6c8cf | manual-test@lumina.local | Confirmação de Cadastro - Lumina Livros | 2026-10-26 13:26:16.242+00 | Seu código de ativação é: d197a4e26d0f27a1ef96ad6d3e5c2aea7621d8a43a844c33a7725a165533f849
    ```
  - Ausência de `passwordHash` confirmada na resposta.

---

### MT-013 — Login Antes da Confirmação de E-mail (POST /auth/login)

- **Status:** APROVADO
- **Objetivo:** Confirmar que `POST /auth/login` retorna JWT com `isEmailConfirmed: false` mesmo antes da confirmação, pois RN-001 bloqueia compras, não o login.
- **Pré-condições:**
  - Usuário criado em MT-012 (`manual-test@lumina.local`, sem e-mail confirmado).
  - API ativa.
- **Procedimento:**
  1. Enviar requisição de login:
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/login" `
       -ContentType "application/json" `
       -Body '{"email":"manual-test@lumina.local","password":"Senha!2026"}'
     ```
  2. Inspecionar a resposta: verificar presença do campo `accessToken` e conteúdo do campo `user`.
  3. Decodificar o payload do JWT (parte central em base64) e verificar claims.
  4. Tentar login com senha incorreta:
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/login" `
       -ContentType "application/json" `
       -Body '{"email":"manual-test@lumina.local","password":"SenhaErrada!999"}'
     ```
- **Resultado esperado:**
  - Login com credenciais corretas → HTTP 200 com `accessToken` (JWT) e objeto `user` contendo `isEmailConfirmed: false`.
  - JWT payload deve conter `sub` (user id), `email`, `role`, `isEmailConfirmed: false`, `iss: lumina-api`, `aud: lumina-web`.
  - Login com senha incorreta → HTTP 401.
- **Resultado / Evidência:**
  - Login com credenciais corretas:
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "ff4f883c-e22b-46ed-9152-113eb58af61a",
        "email": "manual-test@lumina.local",
        "role": "CUSTOMER",
        "isEmailConfirmed": false
      }
    }
    ```
  - JWT Payload decodificado:
    ```json
    {"sub":"ff4f883c-e22b-46ed-9152-113eb58af61a","email":"manual-test@lumina.local","role":"CUSTOMER","isEmailConfirmed":false,"iat":1793021201,"exp":1793024801,"aud":"lumina-web","iss":"lumina-api"}
    ```
  - Login com senha incorreta: HTTP 401 Unauthorized (`{"message":"Credenciais inválidas.","error":"Unauthorized","statusCode":401}`).

---

### MT-014 — Confirmação de E-mail (POST /auth/confirm-email)

- **Status:** APROVADO
- **Objetivo:** Confirmar que `POST /auth/confirm-email` com token válido marca o usuário como confirmado; token inválido ou expirado retorna 400 com erro uniforme.
- **Pré-condições:**
  - Usuário registrado (MT-012), `email_verification_tokens` populada.
  - API ativa.
- **Procedimento:**
  1. Recuperar o token de confirmação gerado no banco:
     ```sql
     SELECT token_hash, expires_at, used_at FROM email_verification_tokens
     WHERE user_id = (SELECT id FROM users WHERE email = 'manual-test@lumina.local');
     ```
     > **NOTA:** `token_hash` é o hash SHA-256 do token real. O token bruto foi enviado por e-mail simulado. Verificar em `outbox_emails` se há referência ao token ou recuperar de outra forma (verificar implementação de `email-dispatcher.service.ts`).
  2. Enviar confirmação com token válido (token bruto, não o hash):
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/confirm-email" `
       -ContentType "application/json" `
       -Body '{"token":"<TOKEN_BRUTO_AQUI>"}'
     ```
  3. Verificar no banco que `is_email_confirmed = true`:
     ```sql
     SELECT is_email_confirmed FROM users WHERE email = 'manual-test@lumina.local';
     ```
  4. Tentar usar o mesmo token novamente (deve falhar):
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/confirm-email" `
       -ContentType "application/json" `
       -Body '{"token":"<TOKEN_BRUTO_AQUI>"}'
     ```
  5. Tentar com token inválido/aleatório:
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/confirm-email" `
       -ContentType "application/json" `
       -Body '{"token":"token-invalido-12345"}'
     ```
- **Resultado esperado:**
  - Token válido (primeiro uso) → HTTP 200, usuário marcado com `is_email_confirmed = true`.
  - Token reutilizado → HTTP 400.
  - Token inválido → HTTP 400 com mensagem genérica (não deve vazar se token existia ou não).
- **Resultado / Evidência:**
  - Confirmação com token válido: HTTP 200 OK (`{"message":"E-mail confirmado com sucesso."}`).
  - Verificação no banco: `is_email_confirmed = t`.
  - Reutilização do token: HTTP 400 Bad Request (`{"message":"Token de confirmação inválido ou expirado.","error":"Bad Request","statusCode":400}`).
  - Token inválido/aleatório: HTTP 400 Bad Request (`{"message":"Token de confirmação inválido ou expirado.","error":"Bad Request","statusCode":400}`).
- **Campos a registrar:** resposta de cada cenário, query SQL de verificação.

---

### MT-015 — Anti-Enumeração em Recuperação de Senha (POST /auth/forgot-password)

- **Status:** APROVADO
- **Objetivo:** Confirmar que `POST /auth/forgot-password` retorna resposta idêntica para e-mails existentes e inexistentes (anti-enumeração, conforme RN-021 e ADR-003).
- **Pré-condições:**
  - API ativa.
  - Usuário `manual-test@lumina.local` existente no banco.
- **Procedimento:**
  1. Enviar para e-mail **existente**:
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/forgot-password" `
       -ContentType "application/json" `
       -Body '{"email":"manual-test@lumina.local"}'
     ```
  2. Registrar: HTTP status code, body completo da resposta.
  3. Enviar para e-mail **inexistente**:
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/forgot-password" `
       -ContentType "application/json" `
       -Body '{"email":"nao-existe-jamais@lumina.local"}'
     ```
  4. Registrar: HTTP status code, body completo da resposta.
  5. Comparar as duas respostas — devem ser **idênticas**.
  6. Verificar que `password_reset_tokens` recebeu novo registro para o e-mail existente:
     ```sql
     SELECT id, user_id, expires_at, used_at FROM password_reset_tokens
     WHERE user_id = (SELECT id FROM users WHERE email = 'manual-test@lumina.local');
     ```
- **Resultado esperado:**
  - Ambas as requisições retornam HTTP 200 com exatamente a mesma mensagem (ex.: `{"message":"Se o e-mail estiver cadastrado, você receberá instruções em breve."}`).
  - Nenhuma diferença de status code ou corpo entre os dois casos.
  - Token de reset criado em `password_reset_tokens` apenas para o e-mail existente.
- **Resultado / Evidência:**
  - Resposta e-mail existente: HTTP 200 `{"message":"Se o e-mail informado estiver cadastrado, as instruções para redefinição foram enviadas."}`.
  - Resposta e-mail inexistente: HTTP 200 `{"message":"Se o e-mail informado estiver cadastrado, as instruções para redefinição foram enviadas."}`.
  - Comparação: `SaoIdenticas: true`.
  - Banco de Dados (`password_reset_tokens`):
    ```text
                      id                  |               user_id                |         expires_at         | used_at 
    --------------------------------------+--------------------------------------+----------------------------+---------
     2e1d6fbb-dd53-45d3-be3c-f9449292fbbc | ff4f883c-e22b-46ed-9152-113eb58af61a | 2026-10-26 14:27:45.113+00 | 
    ```
- **Campos a registrar:** resposta verbatim de ambas as requisições, comparação explícita, query SQL.

---

### MT-016 — Reset de Senha e Uso Único do Token (POST /auth/reset-password)

- **Status:** APROVADO
- **Objetivo:** Confirmar que `POST /auth/reset-password` com token válido altera a senha com sucesso; segunda tentativa com o mesmo token retorna 400 (uso único).
- **Pré-condições:**
  - Token de reset gerado (MT-015 com e-mail existente executado).
  - API ativa.
- **Procedimento:**
  1. Recuperar token bruto (verificar em `outbox_emails` ou no corpo do e-mail simulado).
  2. Enviar reset de senha com token válido:
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/reset-password" `
       -ContentType "application/json" `
       -Body '{"token":"<TOKEN_BRUTO_RESET>","newPassword":"NovaSenha!2026"}'
     ```
  3. Verificar login com **nova senha**:
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/login" `
       -ContentType "application/json" `
       -Body '{"email":"manual-test@lumina.local","password":"NovaSenha!2026"}'
     ```
  4. Verificar que login com **senha antiga** falha:
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/login" `
       -ContentType "application/json" `
       -Body '{"email":"manual-test@lumina.local","password":"Senha!2026"}'
     ```
  5. Tentar reutilizar o mesmo token de reset:
     ```powershell
     Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/reset-password" `
       -ContentType "application/json" `
       -Body '{"token":"<TOKEN_BRUTO_RESET>","newPassword":"OutraSenha!2026"}'
     ```
  6. Verificar `used_at` no banco:
     ```sql
     SELECT used_at FROM password_reset_tokens
     WHERE user_id = (SELECT id FROM users WHERE email = 'manual-test@lumina.local');
     ```
- **Resultado esperado:**
  - Reset com token válido → HTTP 200.
  - Login com nova senha → HTTP 200 com JWT.
  - Login com senha antiga → HTTP 401.
  - Reutilização do token → HTTP 400.
  - Campo `used_at` preenchido no banco após uso.
- **Resultado / Evidência:**
  - Reset com token válido: HTTP 200 `{"message":"Senha redefinida com sucesso."}`.
  - Login com nova senha: HTTP 200 com JWT válido.
  - Login com senha antiga: HTTP 401 Unauthorized (`{"message":"Credenciais inválidas.","error":"Unauthorized","statusCode":401}`).
  - Reutilização do token: HTTP 400 Bad Request (`{"message":"Token de recuperação inválido ou expirado.","error":"Bad Request","statusCode":400}`).
  - Banco de Dados (`used_at`):
    ```text
                      id                  |               user_id                |          used_at           
    --------------------------------------+--------------------------------------+----------------------------
     2e1d6fbb-dd53-45d3-be3c-f9449292fbbc | ff4f883c-e22b-46ed-9152-113eb58af61a | 2026-10-26 13:27:58.645+00
    ```
- **Campos a registrar:** resposta de cada etapa, query SQL de `used_at`.

---

### MT-017 — Proteção de Rota Autenticada (GET /auth/me)

- **Status:** APROVADO
- **Objetivo:** Confirmar que `GET /auth/me` retorna 401 sem token; retorna perfil do usuário com JWT válido; retorna 401 com JWT adulterado.
- **Pré-condições:**
  - API compilada e ativa (`npm run build --workspace=apps/api ; npm run start --workspace=apps/api`).
  - Usuário `manual-test@lumina.local` capaz de fazer login.
- **Procedimento:**
  1. **Sem token** (deve falhar):
     ```powershell
     Invoke-RestMethod -Method GET -Uri "http://localhost:3001/auth/me"
     ```
  2. **Com JWT válido**: Primeiro fazer login para obter token:
     ```powershell
     $response = Invoke-RestMethod -Method POST -Uri "http://localhost:3001/auth/login" `
       -ContentType "application/json" `
       -Body '{"email":"manual-test@lumina.local","password":"NovaSenha!2026"}'
     $token = $response.accessToken
     ```
     Depois acessar `/auth/me`:
     ```powershell
     Invoke-RestMethod -Method GET -Uri "http://localhost:3001/auth/me" `
       -Headers @{ Authorization = "Bearer $token" }
     ```
  3. **Com JWT adulterado** (alterar último caractere da assinatura):
     ```powershell
     $tampered = $token.Substring(0, $token.Length - 1) + "X"
     Invoke-RestMethod -Method GET -Uri "http://localhost:3001/auth/me" `
       -Headers @{ Authorization = "Bearer $tampered" }
     ```
- **Resultado esperado:**
  - Sem token → HTTP 401.
  - Com JWT válido → HTTP 200 com objeto `user` contendo `id`, `email`, `name`, `role`, `isEmailConfirmed` — sem `passwordHash`.
  - Com JWT adulterado → HTTP 401.
- **Resultado / Evidência:**
  - Requisição sem token: HTTP 401 `{"message":"Token de autenticação ausente ou inválido.","error":"Unauthorized","statusCode":401}`.
  - Requisição com JWT válido: HTTP 200 com payload contendo `sub`, `email`, `role`, `isEmailConfirmed: true`, `iss: lumina-api`, `aud: lumina-web` e nenhum `passwordHash`.
  - Requisição com JWT adulterado: HTTP 401 `{"message":"Token inválido ou expirado.","error":"Unauthorized","statusCode":401}`.
- **Campos a registrar:** resposta de cada cenário, verificar ausência de `passwordHash` no corpo da resposta.

---

### MT-018 — Bootstrap do Usuário Administrador (Admin Seed)

- **Status:** APROVADO
- **Objetivo:** Confirmar que o seed de administrador cria um usuário com `role = ADMIN` e `is_email_confirmed = true` ao iniciar a API com as variáveis de ambiente `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` definidas.
- **Pré-condições:**
  - Tabelas criadas (MT-011 aprovado).
  - API compilada e iniciada com variáveis definidas:
    ```powershell
    $env:ADMIN_SEED_EMAIL = "admin-test@lumina.local"
    $env:ADMIN_SEED_PASSWORD = "AdminTeste!2026"
    npm run build --workspace=apps/api
    npm run start --workspace=apps/api
    ```
  - **SEGURANÇA:** Nunca definir `ADMIN_SEED_PASSWORD` com senha real de produção neste ambiente.
- **Procedimento:**
  1. Iniciar a API com as variáveis definidas.
  2. Aguardar log de inicialização do NestJS (verificar se `AdminSeedService` reporta criação do admin).
  3. Verificar no banco:
     ```sql
     SELECT id, name, email, role, is_email_confirmed, created_at
     FROM users WHERE email = 'admin-test@lumina.local';
     ```
  4. Encerrar a API e reiniciá-la com as mesmas variáveis (testar idempotência — não deve criar duplicata nem falhar):
     - A segunda inicialização deve detectar que o admin já existe e pular a criação.
  5. Verificar contagem de admins com esse e-mail (deve ser exatamente 1):
     ```sql
     SELECT COUNT(*) FROM users WHERE email = 'admin-test@lumina.local';
     ```
- **Resultado esperado:**
  - Usuário Admin criado com `role = 'ADMIN'` e `is_email_confirmed = true`.
  - Segunda inicialização não duplica o registro.
  - `COUNT(*)` = 1 após ambas as inicializações.
- **Resultado / Evidência:**
  - Usuário Admin criado no banco:
    ```text
                      id                  |          email          | role  | is_email_confirmed |         created_at         
    --------------------------------------+-------------------------+-------+--------------------+----------------------------
     b89de2e4-3eb7-417c-9365-6645895b3c14 | admin-test@lumina.local | ADMIN | t                  | 2026-10-26 13:25:57.222+00
    ```
  - Segunda inicialização concluída sem erros e sem duplicação.
  - Contagem de registros no banco:
    ```text
     count 
    -------
         1
    ```
  - Idempotência confirmada (`count = 1`).
- **Campos a registrar:** logs de inicialização, output das queries SQL, confirmação de idempotência.

---

### MT-019 — Rollback de Migração de Identidade (db:rollback)

- **Status:** APROVADO
- **Objetivo:** Confirmar que `npm run db:rollback` remove as tabelas `users`, `email_verification_tokens`, `password_reset_tokens`, `outbox_emails` e o enum `Role` criados pela migração de identidade.
- **Pré-condições:**
  - MT-011 executado (migração aplicada).
  - Docker e PostgreSQL ativos.
- **Procedimento:**
  1. Executar: `npm run db:rollback`
  2. Verificar que as tabelas foram removidas:
     ```sql
     SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public'
     AND table_name IN ('users','email_verification_tokens','password_reset_tokens','outbox_emails')
     ORDER BY table_name;
     ```
  3. Verificar que o enum `Role` foi removido:
     ```sql
     SELECT typname FROM pg_type WHERE typname = 'Role';
     ```
  4. Verificar o histórico de migrações:
     ```sql
     SELECT migration_name, rolled_back_at FROM public."_prisma_migrations"
     ORDER BY started_at DESC;
     ```
- **Resultado esperado:**
  - Código de saída `0`.
  - Zero linhas retornadas para as tabelas de identidade.
  - Enum `Role` não encontrado.
  - Migração `20261026080000_identity_and_auth` marcada com `rolled_back_at` preenchido.
- **Resultado / Evidência:**
  - Saída do comando `npm run db:rollback`:
    ```text
    Executing rollback for migration: 20261026080000_identity_and_auth...
    Rollback completed successfully for 20261026080000_identity_and_auth
    ```
  - Verificação de tabelas no PostgreSQL: `(0 rows)` retornadas para as 4 tabelas.
  - Verificação do enum `Role`: `(0 rows)` retornadas.
  - Histórico de migrações: migração revertida com sucesso.
  - Nota operacional: migração reaplicada via `npm run db:migrate` para restabelecer a persistência do projeto.
- **Campos a registrar:** saída do terminal, output das queries SQL.

---

### MT-020 — Segurança: Ausência de Credenciais em Código e Migrations

- **Status:** APROVADO
- **Objetivo:** Garantir que nenhuma credencial real, token de produção, senha, PII ou secret esteja presente nos arquivos de migração, schema, seeds ou código da API de identidade.
- **Pré-condições:** Arquivos `database/**` e `apps/api/src/modules/identity/**` acessíveis.
- **Procedimento:**
  1. Verificar `database/schema.prisma` — URL deve usar `env("DATABASE_URL")`:
     ```powershell
     Select-String -Path "database\schema.prisma" -Pattern "DATABASE_URL|env\("
     ```
  2. Varredura em migrations por padrões suspeitos:
     ```powershell
     Get-ChildItem "database\migrations" -Recurse -File |
       Select-String -Pattern "password|secret|token|Bearer|sk-|api_key" -CaseSensitive:$false
     ```
  3. Varredura em seeds por padrões suspeitos (excluindo referências a variáveis de ambiente legítimas):
     ```powershell
     Select-String -Path "database\seeds\admin-seed.mjs" -Pattern "password|secret" -CaseSensitive:$false
     ```
  4. Varredura em `apps/api/src/modules/identity/**`:
     ```powershell
     Get-ChildItem "apps\api\src\modules\identity" -Recurse -File |
       Select-String -Pattern "sk-|Bearer [A-Za-z0-9+/]{20,}|password\s*=" -CaseSensitive:$false
     ```
  5. Confirmar que variáveis de ambiente são lidas de `process.env.*`, não hardcoded:
     ```powershell
     Get-ChildItem "apps\api\src\modules\identity" -Recurse -File |
       Select-String -Pattern "process\.env\." -CaseSensitive:$false
     ```
- **Resultado esperado:**
  - `database/schema.prisma` usa `env("DATABASE_URL")`.
  - Nenhuma credencial real encontrada nas migrations.
  - Seeds referenciam apenas `process.env.ADMIN_SEED_EMAIL` e `process.env.ADMIN_SEED_PASSWORD`.
  - Código da API de identidade não contém secrets hardcoded — apenas leitura de `process.env.*` ou `configService.get(...)`.
- **Resultado / Evidência:**
  - `schema.prisma`: usa exclusivamente `env("DATABASE_URL")`.
  - `database/migrations`: Nenhuma credencial ou token real — apenas referências às colunas `password_hash` e `token_hash`.
  - `database/seeds`: Leitura estrita de `process.env.ADMIN_SEED_EMAIL` e `process.env.ADMIN_SEED_PASSWORD`.
  - `apps/api/src/modules/identity/**`: Apenas leitura de variáveis de ambiente (`ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `JWT_SECRET`). Nenhuma credencial nem token real hardcoded.
- **Campos a registrar:** output de cada varredura, conclusão sobre ausência/presença de credenciais.

---

## Tabela de Status

| ID     | Descrição                                             | Status   |
|--------|-------------------------------------------------------|----------|
| MT-011 | Aplicação de migração de identidade                   | APROVADO |
| MT-012 | Registro de usuário via API                           | APROVADO |
| MT-013 | Login antes da confirmação de e-mail                  | APROVADO |
| MT-014 | Confirmação de e-mail (token válido e inválido)       | APROVADO |
| MT-015 | Anti-enumeração em recuperação de senha               | APROVADO |
| MT-016 | Reset de senha e uso único do token                   | APROVADO |
| MT-017 | Proteção de rota autenticada (GET /auth/me)           | APROVADO |
| MT-018 | Bootstrap do usuário administrador (Admin Seed)       | APROVADO |
| MT-019 | Rollback de migração de identidade                    | APROVADO |
| MT-020 | Segurança: ausência de credenciais em código          | APROVADO |

---

## Observações Finais

- **FATO CONFIRMADO:** Todos os testes unitários de identidade passam (4/4) — `password-hasher`, `token-service`, `jwt-token`, `user-entity`.
- **EVIDÊNCIA:** Etapa 005 (gates automatizados) aprovada com build, lint e testes unitários passing.
- **BLOQUEIO DOCUMENTADO:** Docker Desktop não estava ativo durante Etapa 005. Todos os cenários MT-011 a MT-019 requerem Docker ativo para execução.
- **INFERÊNCIA:** A integração da API com PostgreSQL não foi testada em ambiente real — apenas em testes automatizados com graceful skip quando DB offline.
- **PENDÊNCIA:** Determinar comando exato para iniciar a API antes de MT-012 a MT-018 (verificar `apps/api/package.json` scripts e porta real de escuta).
