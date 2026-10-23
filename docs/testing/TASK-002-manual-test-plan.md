# TASK-002 — Roteiro de testes manuais

## Registro

Roteiro de testes manuais para validação humana da persistência, migrações e convenções de auditoria temporal em ambiente Windows/WSL.

## Preparação Windows → WSL

1. No PowerShell, confirme a saúde do contêiner PostgreSQL: `docker compose ps`. Se necessário, inicie com `docker compose up -d postgres`.
2. No WSL ou PowerShell, acesse o diretório raiz do repositório.
3. Confirme as variáveis de ambiente necessárias ou use o fallback padrão configurado para ambiente local (`postgresql://lumina:local-development-only@localhost:5433/lumina`).
4. Ao concluir os testes, preserve ou encerre os serviços conforme orientação (`docker compose down` sem remover volumes).

---

## Cenários de Teste

### MT-006 — Aplicação de Migração Inicial (db:migrate)

- **Status:**  EXECUTADO
- **Objetivo:** Confirmar que o comando de migração executa a baseline e cria a tabela `health_persistence` com campos de auditoria temporal.
- **Pré-condições:** Serviço PostgreSQL ativo e saudável na porta 5433.
- **Procedimento:**
  1. Executar no terminal: `npm run db:migrate`.
  2. Inspecionar o banco via CLI ou query para verificar a criação da tabela `health_persistence` e registro em `_prisma_migrations`.
- **Resultado esperado:**
  - Código de saída `0`.
  - Tabela `health_persistence` criada com colunas `id`, `status`, `created_at` (timestamptz) e `updated_at` (timestamptz).
  - Tabela `_prisma_migrations` registra a migração `20261022175313_init_baseline`.
- **Resultado / Evidência:**
  - Status pós-teste: 
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

1 migration found in prisma/migrations

Applying migration `20261022175313_init_baseline`

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
The following migration(s) have been applied:

migrations/
  └─ 20261022175313_init_baseline/
    └─ migration.sql
      
      ```
```bash
/ # postegre
/bin/sh: postegre: not found
/ #  psql -U postgres -d lumina
psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  role "postgres" does not exist
/ #  psql -U lumina  -d lumina
psql (17.11)
Type "help" for help.

lumina=# SELECT
lumina-#     table_schema,
lumina-#     table_name
lumina-# FROM information_schema.tables
lumina-# WHERE table_name = 'health_persistence';
 table_schema |     table_name     
--------------+--------------------
 public       | health_persistence
(1 row)

lumina=# SELECT
lumina-#     column_name,
lumina-#     data_type,
lumina-#     is_nullable,
lumina-#     column_default
lumina-# FROM information_schema.columns
lumina-# WHERE table_name = 'health_persistence'
lumina-# ORDER BY ordinal_position;
 column_name |        data_type         | is_nullable |  column_default   
-------------+--------------------------+-------------+-------------------
 id          | text                     | NO          | 
 status      | text                     | NO          | 'ok'::text
 created_at  | timestamp with time zone | NO          | CURRENT_TIMESTAMP
 updated_at  | timestamp with time zone | NO          | 
(4 rows)

lumina=# SELECT
lumina-#     migration_name,
lumina-#     started_at,
lumina-#     finished_at,
lumina-#     rolled_back_at,
lumina-#     logs
lumina-# FROM public."_prisma_migrations"
lumina-# ORDER BY started_at DESC;
        migration_name        |          started_at           |          finished_at          | rolled_back_at | logs 
------------------------------+-------------------------------+-------------------------------+----------------+------
 20261022175313_init_baseline | 2026-10-23 19:07:52.310624+00 | 2026-10-23 19:07:52.321169+00 |                | 
(1 row)

lumina=# 
```
---

### MT-007 — Rollback Controlado de Migração (db:rollback)

- **Status:** EXECUTADO
- **Objetivo:** Confirmar que a reversão controlada de migração desfaz as alterações e atualiza o rastreamento do banco de forma segura e idempotente.
- **Pré-condições:** Migração `20261022175313_init_baseline` aplicada.
- **Procedimento:**
  1. Executar no terminal: `npm run db:rollback`.
  2. Verificar no banco a remoção da tabela `health_persistence` e atualização em `_prisma_migrations`.
- **Resultado esperado:**
  - Código de saída `0`.
  - Tabela `health_persistence` removida com sucesso.
  - Migração removida do histórico ativo de `_prisma_migrations`.
- **Resultado / Evidência:**
```bash
PS C:\Users\felip\Desktop\Lumina> npm run db:rollback
npm notice run lumina-livros@0.1.0 db:rollback
npm notice run npm run db:rollback --workspace=@lumina/api
npm notice run @lumina/api@0.1.0 db:rollback
npm notice run node ../../database/scripts/rollback.mjs
Executing rollback for migration: 20261022175313_init_baseline...
Rollback completed successfully for 20261022175313_init_baseline
```
```bash
SELECT
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_name = 'health_persistence';
 table_schema | table_name 
--------------+------------
(0 rows)
SELECT
    migration_name,
    started_at,
    finished_at,
    rolled_back_at,
    logs
FROM public."_prisma_migrations"
ORDER BY started_at DESC;
 migration_name | started_at | finished_at | rolled_back_at | logs 
----------------+------------+-------------+----------------+------
(0 rows)
```

---

### MT-008 — Conexão e Auditoria Temporal na Persistência (Prisma)

- **Status:** EXECUTADO
- **Objetivo:** Validar a conexão da aplicação API via PrismaService e o preenchimento automático das datas de criação e atualização.
- **Pré-condições:** Tabela de baseline criada (`npm run db:migrate`).
- **Procedimento:**
  1. Executar a bateria de integração: `npm run test:integration`.
  2. Observar a criação e atualização de registros com validação dos timestamps.
- **Resultado esperado:**
  - Código de saída `0`.
  - Timestamps `created_at` e `updated_at` preenchidos automaticamente e preservados.
  - Zero falhas de conexão ou timeouts.
- **Resultado / Evidência:**
```bash
PS C:\Users\felip\Desktop\Lumina> npm run test:integration
npm notice run lumina-livros@0.1.0 test:integration
npm notice run node --test --test-concurrency=1 tests/integration/**/*.test.mjs
✔ PostgreSQL connection and health persistence via Prisma (48.4572ms)
Executing rollback for migration: 20261022175313_init_baseline...
Rollback completed successfully for 20261022175313_init_baseline
✔ Database migration up and rollback lifecycle (2887.9769ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3156.3646
```

```bash
lumina=# SELECT
lumina-#     id,
lumina-#     created_at,
lumina-#     updated_at
lumina-# FROM health_persistence
lumina-# ORDER BY created_at DESC;
 id | created_at | updated_at 
----+------------+------------
(0 rows)
```

---

### MT-009 — Negação de Acesso Direto da Camada Web ao Banco (DoD)

- **Status:** EXECUTADO
- **Objetivo:** Confirmar que a aplicação Web (`apps/web`) não possui dependência, importação ou acesso direto ao Prisma ou à conexão de banco de dados.
- **Pré-condições:** Código-fonte da camada Web inspecionado.
- **Procedimento:**
  1. Inspecionar `apps/web/package.json` para verificar ausência de `@prisma/client` ou drivers de banco.
  2. Buscar por referências a Prisma ou DATABASE_URL no diretório `apps/web/src` ou `apps/web/app`.
- **Resultado esperado:**
  - Nenhuma dependência de persistência direta presente em `apps/web`.
  - Isolamento estrito entre front-end e persistência de dados.
- **Resultado / Evidência:**
  - Status pós-teste:  APROVADO, sujeito à revisão de eventuais módulos compartilhados.
  - Evidência resumida: 

```bash
PS C:\Users\felip\Desktop\Lumina> npm pkg get dependencies devDependencies --workspace=apps/web
@lumina/web dependencies = { next: '^16.0.1', react: '^19.2.0', 'react-dom': '^19.2.0' }
Get-ChildItem apps/web/src, apps/web/app -Recurse -File -ErrorAction SilentlyContinue |
>>     Select-String -Pattern 'prisma|DATABASE_URL|DIRECT_URL|postgresql://|mysql://|mongodb://'
```

---

### MT-010 — Segurança e Ausência de Credenciais em Código

- **Status:**  EXECUTADO
- **Objetivo:** Garantir que nenhuma credencial de produção, segredo ou token real esteja presente nos arquivos de migração ou esquemas do banco.
- **Pré-condições:** Arquivos `database/**` e `apps/api/**` inspecionados.
- **Procedimento:**
  1. Inspecionar `database/schema.prisma` e confirmar que a URL usa `env("DATABASE_URL")`.
  2. Verificar que apenas valores locais mockados (`local-development-only`) existem como fallback.
- **Resultado esperado:**
  - Ausência de senhas reais, tokens ou credenciais de produção no repositório.
- **Resultado / Evidência:**
  - Status pós-teste: aprovado
  - Evidência resumida: database/schema.prisma: utiliza env("DATABASE_URL").

Fallback local: encontrado em database/scripts/migrate.mjs, database/scripts/rollback.mjs e apps/api/src/infrastructure/persistence/prisma.service.ts.

Migrações SQL: nenhuma correspondência encontrada nos padrões pesquisados.

Arquivos da API e banco: as correspondências identificadas coincidem com os fallbacks locais.

Histórico Git: existem commits anteriores; a auditoria histórica de segredos permanece pendente.

Conclusão: não foram identificadas credenciais reais nos resultados apresentados, mas a ausência de segredos no repositório e no histórico ainda não foi comprovada integralmente.
