# TASK-026 — planejamento e gates

Data: 2026-11-22. Branch: `feature/TASK-026-checkpoint-v1`. Base revisada: `main` em `f895b1e`.

## GATE-001 — Recontextualização e prontidão

**Status: APROVADO.** A TASK estava `BLOCKED` sem justificativa de bloqueio registrada. Após o pull da `main`, a inspeção confirmou que todas as dependências estão `DONE`; o responsável autorizou reclassificar para `READY` caso não restasse bloqueio de início. Os PDs abertos abaixo bloqueiam publicação, conforme a DoD, mas a aceitação da TASK determina explicitamente como tratá-los e permite executar o checkpoint local.

| Dependência | Estado | Evidência consultada |
|---|---|---|
| TASK-021 | DONE | `TASKS.md`; `docs/testing/TASK-021-testes-manuais-resultado.md` |
| TASK-022 | DONE | `TASKS.md`; `docs/testing/TASK-022-planejamento-e-gates.md`; `docs/testing/TASK-022-testes-manuais-resultado.md` |
| TASK-023 | DONE | `TASKS.md`; `docs/testing/TASK-023-testes-manuais-resultado.md` |
| TASK-024 | DONE | `TASKS.md`; `docs/testing/TASK-024-planejamento-e-gates.md`; `docs/testing/TASK-024-testes-manuais-resultado.md` |
| TASK-025 | DONE | `TASKS.md`; `docs/testing/TASK-025-planejamento-e-gates.md`; `docs/testing/TASK-025-testes-manuais-resultado.md` |
| TASK-027 | DONE | `TASKS.md`; `docs/testing/TASK-027-planejamento-e-gates.md`; `docs/testing/TASK-027-testes-manuais-resultado.md` |

Os gates e resultados das dependências estão documentados como aprovados em `TASKS.md` e nos artefatos listados. A TASK-023 não possui arquivo separado `TASK-023-planejamento-e-gates.md`; seu estado/gates estão registrados em `TASKS.md` e o relatório de execução manual está presente. Isso não omite um artefato esperado pela definição da TASK-023.

ADRs revisados: ADR-001 a ADR-007 estão `ACCEPTED`; ADR-008 está `Aprovado`. Critérios, testes, objetivo, DoD e Scope Guard da TASK-026 estão definidos em `TASKS.md` e `prompts/tasks/task-026/README.md`.

## Decisões de produto abertas

| Decisão | Estado e impacto registrado |
|---|---|
| PD-001 — escala esperada | Pendente; a baseline local de RNF-004 não representa produção. Bloqueia publicação até avaliação de capacidade. |
| PD-002 — retenção/exclusão definitiva | Pendente de revisão jurídica; o comportamento técnico vigente é desativação reativável por 30 dias configuráveis. Bloqueia publicação até política validada. |
| PD-003 — hospedagem, e-mail e armazenamento | Pendente; integrações/provedor estão fora da V1 local. Bloqueia publicação até definição de implantação. |

A DoD da TASK-026 permite marcar cada PD explicitamente como aceito ou como bloqueio de publicação. Não se presume aceitação dos PDs nesta etapa.

## Scope Guard e condições

- **Permitido:** testes, documentação, configuração de qualidade e `TASKS.md`.
- **Proibido:** novas funcionalidades fora de escopo e infraestrutura/integrações reais.
- **Aceitação:** gates completos, rastreabilidade, ensaio de backup/restore e testes de regressão aprovados; V1 elegível para revisão humana, com PDs resolvidos ou bloqueando publicação.
- Working tree estava limpa antes de abrir a branch própria. Nenhuma alteração de produção ou de banco foi feita nesta etapa.

GATE-001 foi concluído após confirmar dependências, artefatos, ADRs, Scope Guard, critérios e bloqueios de publicação. A TASK foi promovida de `BLOCKED` para `READY` e seguirá o workflow controlado nas etapas 002–005.

## GATE-002 — Matriz de evidências

**Status: APROVADO.** A matriz cobre os requisitos funcionais, regras, requisitos não funcionais, ADRs, gates, regressão, rastreabilidade, backup/restore e decisões abertas. Os resultados de execução do checkpoint ainda serão registrados no GATE-004; esta matriz não antecipa aprovação.

| Requisito / critério | Cobertura e evidência esperada | Verificação do checkpoint |
|---|---|---|
| RF-001–002; RN-001, RN-018, RN-021 | Identidade, confirmação, RBAC e exclusão reativável: TASK-003, TASK-004, TASK-024; evidências e testes nos relatórios das tarefas. | Conferir resultados anteriores; avaliar limites legais em PD-002. |
| RF-003–007; RN-002–004 | Catálogo, obras, edições, busca e inventário: TASK-007–009; teste de rankings em TASK-027; relatórios e código da dependência. | Regressão unitária, integração/API e rastreabilidade. |
| RF-008; UC-008 | Wishlist: TASK-010. | Regressão unitária e integração quando aplicável. |
| RF-009–012; RN-004, RN-008–011 | Carrinho, cupom, frete e checkout transacional: TASK-012–016; integrações de pedidos e relatório do checkpoint PHASE-03. | Regressão unitária e integração no banco isolado. |
| RF-013–016; RN-005–007, RN-012–014 | Biblioteca, downloads protegidos, bundles, pré-vendas e reembolsos: TASK-017–020; relatórios da PHASE-04. | Regressão e conferência de segurança dos artefatos existentes. |
| RF-017–018; RN-015 | Logística física e reembolsos: TASK-019, TASK-021. | Relatórios manuais, transições e integração documentada. |
| RF-019; RN-016 | Avaliações e moderação: TASK-022. | Relatório, testes unitários/integração e auditoria. |
| RF-020, RF-022; RN-017–019 | Notificações, privacidade e auditoria: TASK-014, TASK-024. | Integração/outbox, sanitização e relatório manual. |
| RF-021, RF-023; RN-020–021 | Painéis e acesso por papel: TASK-023, TASK-028; testes e aprovações manuais registrados. | Regressão de rotas, autorização e contratos. |
| RNF-001–003 | Hash, tokens, RBAC, minimização e logs: ADR-003/007; testes de identidade/auditoria; evidências TASK-004, TASK-022, TASK-024. | `npm audit --omit=dev`; testes de regressão; inspeção de logs/config sem imprimir segredos. |
| RNF-004–006 | Baseline local, responsividade, navegadores e meta WCAG A: TASK-025; 75 amostras Chrome e revisões humanas registradas. | Verificar evidência; produção continua condicionada a PD-001. |
| RNF-007 | Backup semanal criptografado e restauração ensaiada. | Executar somente backup/restore do banco sintético `lumina_task009_test`, restaurando para banco temporário único; nunca usar `lumina` nem volumes de produção. |
| RNF-008 | Observabilidade sem PII e alertas: TASK-024. | Testes/relatório TASK-024 e inspeção de contratos/logs sanitizados. |
| RNF-009 | Consistência sob concorrência: TASK-013/015; integração de pedidos e checkout. | Suite de integração completa no banco isolado. |
| RNF-010 | Originais privados, downloads temporários: TASK-009/017. | Testes de storage/link e inspeção das rotas cobertas. |
| RNF-011 | Validação, paginação, abuso e erros consistentes: módulos de catálogo, identidade e comércio; testes de API existentes. | Suite completa de integração e lint/build. |
| RNF-012 | Camadas e contratos testáveis: ADR-001/002 e cobertura unitária/integração por módulo. | Testes completos e builds API/Web. |
| RNF-013 | Execução reproduzível em contêineres: ADR-006, Dockerfiles e Compose. | `docker compose config` e estado dos serviços locais, sem remover volumes. |
| Rastreabilidade | Matriz README §18, TASKS.md, commits, relatórios e gates das dependências. | Conferência cruzada e registro das lacunas. |
| PD-001–003 | README §19: escala, política jurídica de retenção/exclusão e provedor de implantação. | Registrar como `BLOQUEIA PUBLICAÇÃO` até decisão explícita; não presumir aceite. |
| DoD da TASK-026 | Todos os gates completos; backup/restore ensaiado; regressão aprovada; V1 elegível para revisão humana ou publicação bloqueada pelos PDs. | Resultado final rastreável em `TASKS.md` e relatório sanitizado. |

### Comandos planejados

- `npm run lint`
- `npm test`
- `npm run test:integration` com `TASK009_TEST_DATABASE_URL` e `DATABASE_URL` apontando exclusivamente para `lumina_task009_test`.
- `npm run build --workspace @lumina/api`
- `npm run build --workspace @lumina/web`
- `npm audit --omit=dev`
- `docker compose config`
- Script manual da TASK-026 para backup/restore sintético, após validar sintaxe e escopo.

GATE-002 cobre também a lacuna documental: não existe relatório de planejamento separado da TASK-023; seu status/gates constam em `TASKS.md` e o resultado manual existe. A ausência não invalida os artefatos de aceitação da dependência.

## GATE-003 — Planejamento de validação

**Status: APROVADO.** As validações planejadas são locais, reprodutíveis e não alteram requisitos ou funcionalidades. A integração e o ensaio de backup/restore usarão exclusivamente `lumina_task009_test`, com dados sintéticos; nenhum comando apontará para `lumina`.

| Verificação | Procedimento e critério | Evidência / segurança |
|---|---|---|
| Configuração | `docker compose config --quiet`; `docker compose ps --services --status running`. | Não imprimir `.env`; confirmar somente nomes/estados dos serviços. |
| Lint e regressão unitária/smoke | `npm run lint`; `npm test`. | Registrar código e contagem; não corrigir falhas fora do escopo. |
| Integração / APIs / persistência | Validar `TASK009_TEST_DATABASE_URL` em memória para loopback e nome `lumina_task009_test`; atribuir a `TASK009_TEST_DATABASE_URL` e `DATABASE_URL`; executar `npm run test:integration`. | Testes sequenciais; nenhum banco normal/produtivo; manter URL fora da saída e relatório. |
| Builds | `npm run build --workspace @lumina/api`; `npm run build --workspace @lumina/web`. | Registrar códigos e resultado; sem alterações de produção. |
| Segurança de dependências | `npm audit --omit=dev`. | Se a rede/registro estiver indisponível, registrar `BLOQUEADO`; não atualizar dependências sem scope escalation. |
| Backup/restore | Roteiro PowerShell valida Docker, usa `pg_dump` do banco sintético, cria banco temporário de nome único apenas se ausente, restaura e compara contagens de tabelas; nunca apaga o banco restaurado nem altera o original. | Dump temporário fica no contêiner PostgreSQL e é removido em `finally`; relatório sanitizado inclui data, status, evidência resumida e falhas, sem URL/credenciais/dados. |
| Revisão de segurança/documentos | Conferir rastreabilidade RF/RN/RNF/UC/ADR, registros de gates, limites de V1 e PDs. | PII/segredos não são copiados; PDs continuam como blockers de publicação. |
| Teste manual humano final | Roteiro separado com checklist de elegibilidade de revisão, ambiente isolado, evidência de backup/restore e aceite dos blockers de publicação. | O roteiro começa `NAO EXECUTADO`; aprovação humana não é presumida pelo checkpoint automatizado. |

Falha em serviço local externo, registro npm ou configuração do ambiente será registrada como `BLOQUEADO`, com impacto e próxima ação. Qualquer falha de teste é `REPROVADO` até análise e correção autorizada. Nenhum rollback de migration, remoção de volume Docker ou escrita no banco normal está planejado.

## Matriz de gates

| Gate | Estado | Evidência / pendência |
|---|---|---|
| GATE-001 — Recontextualização e prontidão | APROVADO | Dependências, ADRs, escopo e blockers de publicação confirmados; branch própria e prontidão em `TASKS.md`. |
| GATE-002 — Matriz de evidências | APROVADO | Rastreabilidade de requisitos, DoD, backup/restore, regressão e PDs neste documento. |
| GATE-003 — Planejamento | APROVADO | Plano local/não destrutivo e comandos reais documentados acima. |
| GATE-004 — Execução das validações | PENDENTE | Aguardar execução dos gates automatizados, segurança e ensaio backup/restore. |
| GATE-005 — Testes manuais e conclusão | PENDENTE | Criar roteiro humano final após GATE-004; aprovação manual continua necessária. |
