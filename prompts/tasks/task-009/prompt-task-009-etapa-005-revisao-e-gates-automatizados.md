# TASK-009 — ETAPA 005 — Revisão e gates automatizados

## 1. OBJETIVO

Gerir estoque físico, licenças digitais e upload/versionamento privado local.

## 2. CONTEXTO

TASK: TASK-009 — Inventário e ativos privados  
Dependências: `DEPENDS_ON: TASK-007`  
Relacionados: RF-006,007; RN-003,004; ADR-004.

Esta etapa faz parte de um workflow controlado. Não execute etapas posteriores, não altere TASKS.md nem implemente funcionalidades fora desta etapa sem que os gates anteriores estejam aprovados.

## 3. PRÉ-CONDIÇÕES

- Branch de trabalho específica da TASK; main não pode receber desenvolvimento direto.
- Working tree inspecionada e alterações alheias preservadas.
- Documentos obrigatórios lidos na ordem: AGENTS.md, README.md, TASKS.md, ADRs relacionados, código e testes existentes.
- Escopo autorizado: `apps/api/src/modules/catalog/assets/**`; `apps/api/src/modules/inventory/**`; `apps/api/src/storage/**`; `storage/**`; `database/**`; `tests/**`; `docs/testing/TASK-009-*.md`; `prompts/tasks/task-009/**`; `TASKS.md`.
- Escopo proibido: endpoint público de download; pedidos.

## 4. ENTRADAS NECESSÁRIAS

- Estado atual de TASKS.md, incluindo dependências e Definition of Ready.
- Critérios de aceite e DoD da TASK; se ausentes, registre a lacuna.
- Evidências produzidas pelas TASKs predecessoras, quando existirem.

## 5. ARQUIVOS E COMPONENTES ENVOLVIDOS

Somente os caminhos autorizados no Scope Guard e artefatos mínimos diretamente necessários. Antes de editar, liste arquivos existentes, arquivos novos e arquivos que não serão tocados.

Registre a matriz em `docs/testing/TASK-009-gates.md`, preservando evidências anteriores.

### Responsáveis

- Responsável técnico e executor: agente de programação da TASK-009, que executa os gates, registra comando, código de saída e resultado, e só aprova o gate com pré-requisitos satisfeitos e evidências aprovadas.
- Operação do ambiente: mantenedor/operador local disponibiliza um banco de teste isolado; migrações e rollback não devem tocar o banco de desenvolvimento.
- A revisão humana obrigatória dos testes manuais ocorre no GATE-006. O GATE-005 não exige aprovação humana separada; decisões de escopo/não aplicabilidade precisam ser registradas pelo mantenedor.
- Não há uma pessoa nominalmente atribuída ao GATE-005. `felipePaterni` é autor de commits da branch, o que não equivale a atribuição formal.

## 6. PROCEDIMENTO DETALHADO

Revise `git status`, `git diff`, arquivos adicionados e ausência de material temporário. Execute build/lint/testes unitários, integração, API e segurança aplicáveis conforme scripts reais do repositório. Para PostgreSQL, use exclusivamente `lumina_task009_test`; nunca execute integração em banco padrão ou compartilhado. Classifique falhas e reexecute após correção autorizada.

## 7. RESTRIÇÕES

- Alterações mínimas; não refatorar, redesenhar, criar dependências ou mudar contratos sem autorização.
- Diferencie explicitamente FATO CONFIRMADO, EVIDÊNCIA, INFERÊNCIA, HIPÓTESE e PENDÊNCIA.
- Não exponha segredos, tokens, PII ou arquivos originais em logs, fixtures ou relatórios.
- Testes automatizados não substituem a etapa de testes manuais.

## 8. VALIDAÇÕES

Registre comandos, códigos de saída e resultados; não afirme execução não realizada. O `format:check` global serve como diagnóstico de baseline. Para aprovar a TASK-009, verifique com Prettier os arquivos alterados dentro do escopo; registre falhas em arquivos não relacionados sem ampliar alterações para outras TASKs.

## 9. TRATAMENTO DE FALHAS

Interrompa o avanço. Registre comando/operação, código de saída, mensagem de erro e evidência. Classifique a causa como pertencente ou não ao escopo. Aplique somente a menor correção autorizada, reexecute a validação e atualize o GATE. Nunca ignore uma falha nem trate correção sem revalidação como aprovação.

## 10. SCOPE ESCALATION

Se a menor correção tocar FORBIDDEN_CHANGES, exceder ALLOWED_CHANGES ou exigir decisão ausente, não a implemente. Emita: problema, impacto, motivo fora do escopo, alteração/arquivos necessários, riscos, alternativas, recomendação e DECISÃO NECESSÁRIA; mantenha a etapa bloqueada.

## 11. CRITÉRIOS DE APROVAÇÃO

Todos os gates automatizados aplicáveis passam e o diff respeita o Scope Guard. Falha, ausência de ambiente ou teste aplicável não executado mantém o GATE-005 BLOQUEADO. Registrar o bloqueio é obrigatório, mas não equivale a aprovação. Um gate só pode ser classificado como não aplicável com justificativa técnica e decisão explícita do mantenedor registradas; isso não dispensa gate aplicável reprovado.

## 12. GATE DA ETAPA

- [ ] Todos os gates automatizados aplicáveis passaram; qualquer gate não aplicável tem justificativa técnica e decisão do mantenedor registradas.
- [ ] Evidências (comandos, saídas e arquivos inspecionados) registradas sem segredos/PII.
- [ ] GATE-004 aprovado e evidência disponível.

STATUS: APROVADO somente com todos os itens marcados por evidência; caso contrário, BLOQUEADO.

## 13. STATUS ACUMULADO DOS GATES

GATE-005 — Revisão e gates automatizados: APROVADO EM 2026-11-11; ver matriz cumulativa e desvio aceito em `docs/testing/TASK-009-gates.md`.

GATES CONCLUÍDOS: 5/7
GATES PENDENTES: 2/7
GATES BLOQUEADOS: 0/7

## 14. RESULTADO OBRIGATÓRIO

Finalize a resposta exatamente com o bloco abaixo, preenchendo somente dados comprovados:

==================================================
TASK: TASK-009
ETAPA: 005
STATUS DA ETAPA: APROVADA | REPROVADA | BLOQUEADA
==================================================

GATE DA ETAPA:
[APROVADO | REPROVADO | BLOQUEADO]

GATES TOTAIS: 7
GATES CONCLUÍDOS: [PREENCHER]
GATES PENDENTES: [PREENCHER]
GATES BLOQUEADOS: [PREENCHER]

PROBLEMAS ENCONTRADOS:
- [PREENCHER]

CORREÇÕES REALIZADAS:
- [PREENCHER]

PENDÊNCIAS:
- [PREENCHER]

TESTES RELACIONADOS:
- [PREENCHER]

PRÓXIMA ETAPA:
ETAPA 006 — Testes manuais

PRÓXIMA ETAPA HABILITADA:
SIM | NÃO

MOTIVO:
A próxima etapa só é habilitada se o GATE atual for aprovado por evidência.
==================================================
