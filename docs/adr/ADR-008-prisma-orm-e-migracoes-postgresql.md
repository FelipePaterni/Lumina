# ADR: Escolha de ORM e Ferramental de Migração para PostgreSQL

**Status:** Aprovado

**Data:** 22/10/2026

**Contexto de Origem:** Complemento ao ADR-002 (TASK-002 — Base de Persistência)

---

## 1. Contexto

O **ADR-002** definiu o uso do PostgreSQL como banco de dados relacional e a obrigatoriedade de adotar um "ORM com suporte a migrações", porém sem especificar a tecnologia. A **TASK-002** (Etapa 002) foi temporariamente bloqueada pela ausência dessa definição concreta.

## 2. Decisão

Adotar o **Prisma ORM** e o **Prisma Migrate** como stack padrão para persistência de dados, modelagem de esquemas e execução de migrações no repositório backend Node.js / TypeScript.

### Principais Motivos

1. **Type-Safety End-to-End:** Geração automática de tipos TypeScript alinhados estritamente com o esquema do banco de dados (`schema.prisma`).
2. **Sistema Robusto de Migrações:** O `prisma migrate` gera arquivos SQL declarativos e rastreáveis no versionamento (`database/migrations` ou `prisma/migrations`), facilitando auditoria e rollbacks controlados.
3. **Developer Experience (DX):** Curva de aprendizado reduzida, integração nativa com ambientes containerizados Docker e automação de scripts via `npm`.

---

## 3. Padrão Estrutural & Convenções de Migração

### Localização dos Artefatos

- **Esquema e Migrações:** `apps/api/prisma/` (ou `database/migrations`)
- **Módulo de Infraestrutura:** `apps/api/src/infrastructure/persistence/`

### Comandos de Pipeline e Automação (`package.json`)

- `npm run db:migrate` — Aplica migrações pendentes no ambiente.
- `npm run db:generate` — Atualiza o cliente Prisma (`@prisma/client`).
- `npm run db:rollback` — Executa estratégia de revert/down migration via script SQL de rollback controlado.

---

## 4. Próximos Passos (Desbloqueio da TASK-002)

Com o ADR complementar formalizado, a **Etapa 002** da **TASK-002** passa do status **BLOQUEADA** para **APROVADA**.

Você está habilitado a prosseguir para a **ETAPA 003 — Planejamento Mínimo**.
