# TASK-005 — Etapa 003 — Planejamento de validação

## Identificação e limites

- **TASK:** TASK-005 — Checkpoint PHASE-01
- **Etapa:** 003 — Planejamento de validação
- **Branch:** `feature/TASK-005-checkpoint-phase-01`
- **GATE anterior:** GATE-002 aprovado em `docs/testing/TASK-005-etapa-002-matriz-evidencias.md`
- **Escopo:** validar build, lint, testes, segurança, integração e documentação da PHASE-01
- **Fora de escopo:** funcionalidades PHASE-02+, refatorações, redesign, integrações externas e alteração de contratos

## Fatos confirmados do ambiente

- O projeto usa npm workspaces, API TypeScript/NestJS, web Next.js e PostgreSQL local.
- Os comandos disponíveis estão definidos no `package.json`: `build`, `lint`, `test`, `test:unit`, `test:integration`, `db:generate`, `db:migrate` e `db:rollback`.
- O Compose define o serviço `postgres` na porta local `5433`, além de API e web.
- Os testes de integração usam o banco local e incluem conexão, migração, identidade, RBAC e auditoria.
- A execução ocorrerá somente na branch dedicada; a `main` não será alterada.

## Ambiente e dados seguros

### Pré-condições

1. Confirmar branch e working tree:

   ```text
   git status --short --branch
   git log -1 --oneline
   ```

2. Confirmar versões e scripts:

   ```text
   node --version
   npm --version
   npm run
   docker compose version
   ```

3. Confirmar configuração sem imprimir valores sensíveis. Não exibir `.env`, senhas, tokens ou valores de conexão em relatórios.

4. Usar somente o PostgreSQL local definido pelo Compose, com dados de desenvolvimento. Não usar produção, contas reais, arquivos originais ou PII real.

5. Se o banco local não estiver disponível, iniciar somente o serviço necessário:

   ```text
   docker compose up -d postgres
   docker compose ps
   ```

### Dados e isolamento

- Dados de seed devem permanecer sintéticos e controlados pelo ambiente local.
- Não adicionar fixtures com credenciais, tokens, e-mails reais ou arquivos de usuário.
- Não executar comandos destrutivos em diretórios amplos nem contra banco externo.
- A validação de migração deve usar a rotina já coberta pelo teste de integração, que executa rollback da migração avaliada.

## Plano de validação executável

| Ordem | Verificação | Comando real | Evidência a registrar | Critério de aprovação | Responsável |
|---:|---|---|---|---|---|
| 1 | Estado e rastreabilidade | `git status --short --branch`; `git log --oneline -5` | Branch, working tree e commits | Branch dedicada, sem alteração alheia | Agente |
| 2 | Build | `npm run build` | Exit code e resumo de API/web | Exit code 0 e compilação de produção concluída | Agente |
| 3 | Lint | `npm run lint` | Exit code e warnings/erros | Exit code 0 com `--max-warnings=0` | Agente |
| 4 | Testes unitários | `npm run test:unit` | Quantidade de pass/fail/skip | Todos passam; nenhuma falha | Agente |
| 5 | Smoke/regressão curta | `npm test` | Quantidade de pass/fail/skip | Todos passam; nenhuma falha | Agente |
| 6 | Serviço de persistência | `docker compose up -d postgres`; `docker compose ps` | Estado de saúde do PostgreSQL | Serviço saudável na configuração local | Agente |
| 7 | Testes de integração | `npm run test:integration` | Resultados de conexão, migração, identidade, RBAC e auditoria | Todos os testes passam; nenhum skip por indisponibilidade | Agente |
| 8 | Segurança aplicável | `npm run test:unit` e inspeção dos testes de identidade/auditoria | Evidência de hash, JWT, tokens, RBAC, sanitização e motivo obrigatório | Cenários de segurança passam sem PII/segredos nos logs | Agente |
| 9 | Revisão documental | Inspecionar `TASKS.md`, ADR-001/002/003/006/007, matriz e este plano | Estados, dependências, ADRs e escopo | Documentos consistentes e sem requisito presumido | Agente |
| 10 | Integridade final | `git diff --check`; `git status --short --branch` | Diff e estado final | Sem erro de whitespace e somente alterações autorizadas | Agente |

## Rollback e limpeza

- Não executar `git reset --hard`, `git checkout --` ou exclusões amplas.
- Se uma validação alterar apenas artefatos ignorados de build, preservar ou remover somente esses artefatos por comando específico e seguro, se necessário.
- A migração deve ser revertida pela própria rotina coberta em `tests/integration/persistence/migration.test.mjs`; registrar resultado sem expor dados.
- Ao finalizar a execução, o serviço local poderá ser parado com `docker compose stop postgres` se não houver outra atividade dependente dele. Não remover volumes ou dados sem autorização explícita.
- Se qualquer alteração rastreada aparecer fora do escopo, interromper, preservar o estado e registrar a ocorrência antes de continuar.

## Critérios de parada e tratamento de falhas

Interromper a execução e marcar o gate como bloqueado quando ocorrer qualquer uma destas condições:

1. comando de build, lint ou teste falhar sem explicação ambiental comprovada;
2. PostgreSQL, Docker ou dependência necessária não puder ser disponibilizado com segurança;
3. teste revelar falha de segurança, exposição de PII, segredo, token ou arquivo original;
4. migração não puder ser revertida pela rotina prevista;
5. alteração necessária exceder `ALLOWED_CHANGES` ou tocar `FORBIDDEN_CHANGES`;
6. houver conflito entre `TASKS.md`, ADRs, requisitos ou contratos;
7. resultado depender de dados reais, configuração de produção ou integração externa.

Para cada falha, registrar comando/operação, código de saída, mensagem resumida sem dados sensíveis, evidência, classificação (ambiental, pertencente ao escopo ou fora do escopo), impacto e decisão necessária. Não transformar retry em aprovação sem registrar a causa e o resultado da reexecução.

## Evidências e resultado

- Registrar resultados reais somente na Etapa 004.
- Este documento define verificações e critérios; não declara que os comandos foram executados nesta etapa.
- Testes automatizados não substituem validação manual de interface, acessibilidade ou comportamento visual; qualquer validação manual ausente deve permanecer como pendência explícita.
- A Etapa 004 só poderá ser aprovada se todos os critérios aplicáveis tiverem evidência e nenhuma condição de parada permanecer aberta.

## Arquivos

### Criado

- `docs/testing/TASK-005-etapa-003-plano-validacao.md`

### Não tocado nesta etapa

- `TASKS.md` e estados das tasks.
- Código de domínio, funcionalidades PHASE-02+, migrations, schema, fixtures e integrações externas.

## Conclusão do GATE-003

**GATE-003 — Planejamento de validação: APROVADO.** O plano usa comandos existentes, define ambiente e dados seguros, estabelece evidências, rollback, critérios de parada e limites de escopo sem executar a Etapa 004.
