# TASK-005 — Etapa 002 — Matriz de evidências

## Identificação

- **TASK:** TASK-005 — Checkpoint PHASE-01
- **Etapa:** 002 — Matriz de evidências
- **Branch:** `feature/TASK-005-checkpoint-phase-01`
- **Escopo:** testes/configuração da PHASE-01 e documentação de qualidade
- **Fonte de critérios:** `AGENTS.md`, `README.md`, `TASKS.md`, ADR-001, ADR-002, ADR-003, ADR-006 e ADR-007
- **GATE anterior:** GATE-001 aprovado na Etapa 001

## Classificação das informações

- **FATO CONFIRMADO:** estado, arquivos, comandos e resultados observados no repositório ou na execução.
- **EVIDÊNCIA:** saída de comando, teste, inspeção de arquivo ou histórico Git que sustenta o fato.
- **INFERÊNCIA:** conclusão limitada derivada diretamente de fatos confirmados.
- **HIPÓTESE:** possibilidade não validada; não é usada para aprovar critério.
- **PENDÊNCIA:** validação ou correção ainda não realizada.

## Matriz verificável

| Critério | Evidência esperada | Comando/inspeção | Resultado observado | Responsável | Estado |
|---|---|---|---|---|---|
| Branch dedicada e working tree controlada | Branch específica da TASK-005, sem alterações alheias | `git status --short --branch`; `git log -1 --oneline` | Branch `feature/TASK-005-checkpoint-phase-01`; commit rastreável `655f290`; working tree limpa após o commit | Agente | APROVADO |
| Dependência TASK-004 concluída | TASK-004 em `DONE` e histórico rastreável | Inspeção de `TASKS.md`; `git log --oneline --all` | TASK-004 está `DONE`; commits de implementação, testes e conclusão existem | Agente | APROVADO |
| Artefatos das TASKs 001–004 presentes | Estrutura de API/web, persistência, identidade, auditoria e testes | Inspeção de `apps/api`, `apps/web`, `database` e `tests` | Artefatos de fundação, identidade, RBAC, auditoria e persistência presentes | Agente | APROVADO |
| Scope Guard da TASK-005 | Alterações limitadas a testes/configuração/documentação/TASKS | `git diff --stat`; `git diff --check`; inspeção do diff | Única alteração primária foi `TASKS.md` na Etapa 001; esta etapa adiciona somente esta documentação de qualidade | Agente | APROVADO |
| ADR-001 — arquitetura em camadas | ADR aceito e compatível com a base | Leitura de `docs/adr/ADR-001-arquitetura-em-camadas-monolito-modular.md` | Status `ACCEPTED`; monólito modular em camadas e contratos entre módulos | Agente | APROVADO |
| ADR-002 — stack | ADR aceito e stack executável | Leitura de `docs/adr/ADR-002-stack-typescript-e-postgresql.md`; `npm run build` | Status `ACCEPTED`; API/web TypeScript compilam e web gera build de produção | Agente | APROVADO |
| ADR-003 — identidade, privacidade e auditoria | Identidade local, RBAC, auditoria e privacidade cobertos | Leitura do ADR; `npm run test:unit`; `npm run test:integration` | Testes de papéis, auditoria sem PII explícita, ciclo de conta, tokens e autenticação passaram | Agente | APROVADO |
| ADR-006 — contêineres | Configuração Docker local disponível | Leitura do ADR e `docker compose ps` | Compose define PostgreSQL, API e web; PostgreSQL local ficou saudável em `localhost:5433` | Agente | APROVADO |
| ADR-007 — JWT e seed | JWT validado e seed controlado | Leitura do ADR; testes unitários e de integração de identidade | Adulteração de JWT é rejeitada; seed existente é preservado; nenhum segredo foi registrado | Agente | APROVADO |
| Build | API e web compilam em produção | `npm run build` | Primeira tentativa teve `EPERM` ambiental em `.next`; repetição com permissão adequada passou | Agente | APROVADO |
| Lint | ESLint sem warnings/erros | `npm run lint` | Exit code 0 | Agente | APROVADO |
| Testes unitários | Regras de identidade, RBAC, auditoria e segurança passam | `npm run test:unit` | 14 testes passaram; 0 falharam | Agente | APROVADO |
| Testes de integração | Persistência, migração, identidade, RBAC e auditoria passam | `npm run test:integration` | 4 testes passaram; 0 falharam; PostgreSQL local disponível | Agente | APROVADO |
| Smoke/regressão rápida | Fundação técnica e testes unitários integrados passam | `npm test` | 15 testes passaram; 0 falharam | Agente | APROVADO |
| Segurança aplicável | Hash adaptativo, tokens, RBAC, sanitização e negação de acesso cobertos | Inspeção dos testes `tests/unit/identity`, `tests/unit/audit` e `tests/integration/identity` | Cenários de hash, JWT, tokens opacos, papéis, auditoria e ausência de PII explícita passaram | Agente | APROVADO |
| Aceitação da TASK-005 | Build/lint/unidade/integração/segurança passam; ADRs e matriz conferem | Consolidação das linhas desta matriz | Critérios automatizados e inspeções documentais cobertos | Agente | APROVADO |
| DoD — nenhum bloqueador de fundação conhecido | Falhas impeditivas ausentes e pendências explicitadas | Revisão da matriz e do estado Git | Nenhum bloqueador de fundação identificado; pendências não impeditivas registradas abaixo | Agente | APROVADO |

## Pendências e limites

1. `npm run format:check` encontra formatação preexistente em 72 arquivos. O comando não é um critério de aceite declarado da TASK-005; os arquivos estão fora do escopo e não foram formatados.
2. Testes manuais de interface e validação visual não foram executados nesta etapa. A matriz registra evidências automatizadas e documentais, sem tratar automação como substituta de teste manual.
3. O PostgreSQL local foi iniciado somente para a execução dos testes de integração; não há alteração de configuração, schema ou dados versionados nesta etapa.

## Arquivos

### Criado

- `docs/testing/TASK-005-etapa-002-matriz-evidencias.md`

### Alterado anteriormente nesta TASK

- `TASKS.md` — correção de estado `BLOCKED` para `READY`, commit `655f290`.

### Não tocado nesta etapa

- Código de domínio e funcionalidades PHASE-02+.
- Migrations, schema, fixtures, segredos, arquivos originais e integrações externas.

## Conclusão do GATE-002

**GATE-002 — Matriz de evidências: APROVADO.** A matriz cobre os critérios de aceite e DoD, referencia evidências observadas sem expor dados sensíveis e mantém pendências não impeditivas separadas de resultados aprovados.
