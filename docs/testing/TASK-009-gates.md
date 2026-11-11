# TASK-009 — matriz cumulativa de gates

Atualizado em 2026-11-11. O mantenedor autorizou avaliação retrospectiva com desvio de sequência explícito, sem retroagir datas. Aprovações retrospectivas são efetivas nesta data e não alegam que a ordem original foi cumprida.

## Responsáveis

- **Responsável técnico e executor do GATE-005:** agente de programação da TASK-009, responsável por executar os gates aplicáveis, registrar comandos/códigos de saída/evidências e aprovar o gate quando os pré-requisitos estiverem satisfeitos.
- **Operação do ambiente:** mantenedor/operador local deve disponibilizar banco de teste isolado para integração e migrações.
- **Revisão humana obrigatória:** aplica-se aos testes manuais no GATE-006; GATE-005 não exige aprovação humana separada. Decisões sobre escopo ou não aplicabilidade pertencem ao mantenedor.
- **Pessoa nominal:** não há pessoa atribuída nos arquivos, issue ou PR localizados. `felipePaterni` aparece como autor de commits, o que não prova atribuição de aprovador.

## Estado atual

| Gate | Estado | Evidência e pendência |
|---|---|---|
| GATE-001 | APROVADO RETROSPECTIVAMENTE | Dependência TASK-007 consta DONE; requisitos, branch específica, arquivos e Scope Guard foram conferidos em 2026-11-11. Referências: `TASKS.md`, ADR-004, `docs/testing/TASK-007-testes-manuais-resultado.md`, estado Git. |
| GATE-002 | APROVADO RETROSPECTIVAMENTE | Histórico da branch, commits da TASK-009, código e scripts reais revisados; baseline automatizado reexecutado. PostgreSQL de integração isolado disponível nesta revisão. |
| GATE-003 | APROVADO RETROSPECTIVAMENTE COM DESVIO | Plano mínimo documentado em `TASK-009-plano-retrospectivo.md` após a implementação. Não havia artefato de plano anterior à implementação; o mantenedor aceitou explicitamente registrar essa quebra de sequência sem backdating. |
| GATE-004 | APROVADO RETROSPECTIVAMENTE COM DESVIO | Implementação atual revisada contra critérios e Scope Guard; unitários, integração e build aprovados. A aprovação efetiva é desta data e reconhece a falta de registro contemporâneo de GATE-003. |
| GATE-005 | APROVADO | `npm run test` (26/26), `npm run lint`, `npm run build`, `npm run test:integration` (4/4, sem skips, em `lumina_task009_test`) e Prettier nos arquivos alterados da TASK-009 passaram. O primeiro build falhou com `EPERM` no cache `.next`; após limpar apenas o cache gerado, passou. A primeira integração falhou na desserialização `regclass`; cast para texto corrigido e repetição passou. `format:check` global falha em 77 arquivos alheios e é diagnóstico de baseline; não foram formatados arquivos de outras TASKs. |
| GATE-006 | APROVADO | Dez cenários manuais aprovados. MT-009-01 revalidado em 2026-11-11 após login de papel ADMIN: HTTP `200`, estoque `5`, movimento `PHYSICAL_ADJUSTMENT` de quantidade `5` e auditoria nova. Revisão/aprovação humana explícita do mantenedor recebida. A tentativa anterior HTTP `401` foi superada pela revalidação autenticada. Inspeção confirmou controladores protegidos por JWT/RBAC e ausência de serving estático no `AppModule`. Sintaxe do roteiro validada; script completo não executado. |
| GATE-007 | APROVADO | Revisão final confirmou escopo autorizado, ausência de alterações proibidas, evidências dos sete gates, DoD e commits rastreáveis `c65ec4b`, `6155e7d` e `eeb5dcb`. TASK-009 concluída como DONE. |

**Contagem final:** 7 concluídos, 0 pendentes, 0 bloqueados. GATE-001–004 foram avaliados retrospectivamente com desvio de sequência aceito; GATE-005–007 foram concluídos com evidências registradas.

## Evidências executadas em 2026-11-11

| Comando/operação | Resultado |
|---|---|
| `npm run test` | Exit 0; 26 aprovados, 0 falhas, 0 skips. |
| `npm run lint` | Exit 0. |
| `npm run build` | Exit 0; API/TypeScript e Web/Next.js compilados. A primeira execução encontrou `EPERM` no cache gerado `.next`; após removê-lo com nenhum serviço Node ativo, a repetição passou. |
| `npm run test:integration` | Exit 0; 4 aprovados, 0 falhas, 0 skips, usando `lumina_task009_test`. A primeira execução revelou incompatibilidade Prisma/`regclass`; o cast `::text` foi aplicado e a repetição passou. |
| `npx prettier --check` nos arquivos alterados da TASK-009 | Exit 0; todos os arquivos do escopo passaram. |
| `format:check` global (execução anterior) | Falhou em 77 arquivos alheios à TASK-009. Classificado como diagnóstico de baseline; nenhum arquivo de outra TASK foi alterado. |
| Parser PowerShell do roteiro manual | Sintaxe OK; o roteiro não foi executado nesta rodada. |
| `git diff --check` | Sem erros; apenas avisos de conversão LF/CRLF do Git. |

O GATE-005 foi aprovado nesta avaliação retrospectiva, após registrar GATE-004 com o desvio de sequência aceito pelo mantenedor.

## Fechamento da TASK-009

- Branch: `feature/TASK-009-inventario-ativos`.
- Commits: `c65ec4b` (implementação, migração e testes); `6155e7d` (roteiro manual); `eeb5dcb` (gates e revisão retrospectiva). O commit de fechamento registra GATE-007 e `TASKS.md` como DONE.
- Scope Guard: todas as alterações primárias estão em `ALLOWED_CHANGES`; nenhuma rota pública de arquivo ou alteração de pedidos foi introduzida. Mudanças incidentais: nenhuma.
- Definition of Done: implementação e documentação atualizadas, gates aprovados, revisão humana manual registrada, commits rastreáveis e `TASKS.md` atualizado.
- Pendências da TASK-009: nenhuma.
- Próxima TASK na ordem: TASK-010, ainda marcada BLOCKED; iniciar somente após revisão/autorização própria e atualização de prontidão.
