# TASK-009 — ETAPA 001 — Recontextualização e prontidão

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
- Escopo autorizado: `modules/catalog/assets/**`; `modules/inventory/**`; `storage/**`; `database/**`; `tests/**`; `TASKS.md`.
- Escopo proibido: endpoint público de download; pedidos.

## 4. ENTRADAS NECESSÁRIAS

- Estado atual de TASKS.md, incluindo dependências e Definition of Ready.
- Critérios de aceite e DoD da TASK; se ausentes, registre a lacuna.
- Evidências produzidas pelas TASKs predecessoras, quando existirem.

## 5. ARQUIVOS E COMPONENTES ENVOLVIDOS

Somente os caminhos autorizados no Scope Guard e artefatos mínimos diretamente necessários. Antes de editar, liste arquivos existentes, arquivos novos e arquivos que não serão tocados.

## 6. PROCEDIMENTO DETALHADO

Leia as fontes obrigatórias e os ADRs relacionados. Inspecione branch, `git status`, commits/branches relevantes, código e testes existentes. Verifique Definition of Ready e predecessores. Registre fatos, evidências, hipóteses e pendências; não mude status da TASK nesta etapa.

## 7. RESTRIÇÕES

- Alterações mínimas; não refatorar, redesenhar, criar dependências ou mudar contratos sem autorização.
- Diferencie explicitamente FATO CONFIRMADO, EVIDÊNCIA, INFERÊNCIA, HIPÓTESE e PENDÊNCIA.
- Não exponha segredos, tokens, PII ou arquivos originais em logs, fixtures ou relatórios.
- Testes automatizados não substituem a etapa de testes manuais.

## 8. VALIDAÇÕES

Confirme dependências: `DEPENDS_ON: TASK-007`; registre artefatos/testes ausentes como bloqueio.

## 9. TRATAMENTO DE FALHAS

Interrompa o avanço. Registre comando/operação, código de saída, mensagem de erro e evidência. Classifique a causa como pertencente ou não ao escopo. Aplique somente a menor correção autorizada, reexecute a validação e atualize o GATE. Nunca ignore uma falha nem trate correção sem revalidação como aprovação.

## 10. SCOPE ESCALATION

Se a menor correção tocar FORBIDDEN_CHANGES, exceder ALLOWED_CHANGES ou exigir decisão ausente, não a implemente. Emita: problema, impacto, motivo fora do escopo, alteração/arquivos necessários, riscos, alternativas, recomendação e DECISÃO NECESSÁRIA; mantenha a etapa bloqueada.

## 11. CRITÉRIOS DE APROVAÇÃO

TASK, contexto, dependências, branch, working tree e Scope Guard foram comprovadamente verificados.

## 12. GATE DA ETAPA

- [ ] TASK, contexto, dependências, branch, working tree e Scope Guard foram comprovadamente verificados.
- [ ] Evidências (comandos, saídas e arquivos inspecionados) registradas sem segredos/PII.
- [ ] Nenhum gate anterior; iniciar a coleta de evidências.

STATUS: APROVADO somente com todos os itens marcados por evidência; caso contrário, BLOQUEADO.

## 13. STATUS ACUMULADO DOS GATES

GATE-001 — Recontextualização e prontidão: EM EXECUÇÃO

GATES CONCLUÍDOS: [PREENCHER]/7
GATES PENDENTES: [PREENCHER]/7
GATES BLOQUEADOS: [PREENCHER]/7

## 14. RESULTADO OBRIGATÓRIO

Finalize a resposta exatamente com o bloco abaixo, preenchendo somente dados comprovados:

==================================================
TASK: TASK-009
ETAPA: 001
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
ETAPA 002 — Contexto histórico e pré-condições

PRÓXIMA ETAPA HABILITADA:
SIM | NÃO

MOTIVO:
A próxima etapa só é habilitada se o GATE atual for aprovado por evidência.
==================================================
