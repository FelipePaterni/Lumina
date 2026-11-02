# TASK-006 — Etapa 003 — Planejamento de validação

## Identificação

- TASK: TASK-006 — Checkpoint de transição PHASE-01
- Etapa: 003 — Planejamento de validação
- Branch: `chore/TASK-006-recontextualizacao`
- GATE anterior: GATE-002 aprovado em `docs/testing/TASK-006-etapa-002-matriz-evidencias.md`
- Escopo: build, lint, testes, segurança, integração e revisão documental PHASE-01
- Fora de escopo: catálogo, comércio, refatorações e integrações externas

## Plano executável

| Ordem | Verificação | Comando/inspeção | Evidência | Critério |
|---:|---|---|---|---|
| 1 | Estado Git | `git status --short --branch`; `git log -5 --oneline` | branch, árvore e commits | branch dedicada e árvore controlada |
| 2 | Dependências/artefatos | inspeção de `TASKS.md`, `apps`, `database`, `tests`, ADRs e relatórios | estados e arquivos | TASK-001–005 `DONE`, artefatos presentes |
| 3 | Lint | `npm run lint` | código de saída | zero erros/warnings |
| 4 | Unitários | `npm run test:unit` | contagem pass/fail/skip | zero falhas |
| 5 | Smoke | `npm test` | contagem pass/fail/skip | zero falhas |
| 6 | PostgreSQL local | `docker compose up -d postgres`; `docker compose ps` | estado de saúde | serviço `healthy` na porta 5433 |
| 7 | Integração | `npm run test:integration` | persistência, migração, identidade e RBAC | zero falhas; rollback observado |
| 8 | Build | `npm run build` | compilação API/Web | código de saída 0 |
| 9 | Segurança | busca sanitizada por JWTs completos e inspeção de testes | contagem e resultados | nenhum segredo/token/PII exposto |
| 10 | Integridade final | `git diff --check`; inspeção do diff | whitespace e escopo | somente documentação autorizada |

## Dados e rollback

Usar somente PostgreSQL local do Compose e dados sintéticos. Não registrar senhas, tokens, PII, `.env` ou arquivos originais. A migração deve ser revertida pela rotina coberta pelo teste de integração. Não remover volumes.

## Critérios de parada

Parar diante de falha não explicada, indisponibilidade insegura do banco, exposição de segredo/PII, rollback inválido, conflito documental ou alteração fora do Scope Guard. Registrar a falha e reexecutar somente após correção autorizada.

## Classificação

- FATO CONFIRMADO: comandos e critérios definidos no repositório.
- EVIDÊNCIA: será registrada na Etapa 004.
- INFERÊNCIA/HIPÓTESE: não serão usadas para aprovar gates.
- PENDÊNCIA: testes manuais permanecem para a Etapa 005.

## Conclusão do GATE-003

**GATE-003 — Planejamento de validação: APROVADO.** O plano é executável, cobre os critérios da matriz e não invade PHASE-02+.
