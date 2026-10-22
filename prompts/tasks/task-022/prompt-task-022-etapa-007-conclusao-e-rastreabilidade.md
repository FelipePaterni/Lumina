# TASK-022 — ETAPA 007 — Conclusão e rastreabilidade

## 1. OBJETIVO

Disponibilizar avaliação publicada, denúncia e remoção auditada.

## 2. CONTEXTO

TASK: TASK-022 — Avaliações, denúncia e moderação  
Dependências: `DEPENDS_ON: TASK-020`  
Relacionados: RF-019,022; RN-016,017.

Esta etapa faz parte de um workflow controlado. Não execute etapas posteriores, não altere TASKS.md nem implemente funcionalidades fora desta etapa sem que os gates anteriores estejam aprovados.

## 3. PRÉ-CONDIÇÕES

- Branch de trabalho específica da TASK; main não pode receber desenvolvimento direto.
- Working tree inspecionada e alterações alheias preservadas.
- Documentos obrigatórios lidos na ordem: AGENTS.md, README.md, TASKS.md, ADRs relacionados, código e testes existentes.
- Escopo autorizado: `modules/reviews/**`; `features/reviews/**`; `modules/audit/**`; `tests/**`; `TASKS.md`.
- Escopo proibido: aprovação prévia obrigatória; alteração de regras de compra.

## 4. ENTRADAS NECESSÁRIAS

- Estado atual de TASKS.md, incluindo dependências e Definition of Ready.
- Critérios de aceite e DoD da TASK; se ausentes, registre a lacuna.
- Evidências produzidas pelas TASKs predecessoras, quando existirem.

## 5. ARQUIVOS E COMPONENTES ENVOLVIDOS

Somente os caminhos autorizados no Scope Guard e artefatos mínimos diretamente necessários. Antes de editar, liste arquivos existentes, arquivos novos e arquivos que não serão tocados.

## 6. PROCEDIMENTO DETALHADO

Faça revisão final de critérios de aceite, DoD, documentação, Scope Guard e gates. Apresente matriz final de gates, estado de testes manuais e pendências. Só proponha `DONE` quando todos os gates e testes manuais obrigatórios estiverem aprovados; caso contrário use AGUARDANDO TESTES MANUAIS, BLOQUEADA ou AGUARDANDO DECISÃO.

## 7. RESTRIÇÕES

- Alterações mínimas; não refatorar, redesenhar, criar dependências ou mudar contratos sem autorização.
- Diferencie explicitamente FATO CONFIRMADO, EVIDÊNCIA, INFERÊNCIA, HIPÓTESE e PENDÊNCIA.
- Não exponha segredos, tokens, PII ou arquivos originais em logs, fixtures ou relatórios.
- Testes automatizados não substituem a etapa de testes manuais.

## 8. VALIDAÇÕES

Confirme que alterações primárias estão autorizadas e quaisquer incidentais foram justificadas.

## 9. TRATAMENTO DE FALHAS

Interrompa o avanço. Registre comando/operação, código de saída, mensagem de erro e evidência. Classifique a causa como pertencente ou não ao escopo. Aplique somente a menor correção autorizada, reexecute a validação e atualize o GATE. Nunca ignore uma falha nem trate correção sem revalidação como aprovação.

## 10. SCOPE ESCALATION

Se a menor correção tocar FORBIDDEN_CHANGES, exceder ALLOWED_CHANGES ou exigir decisão ausente, não a implemente. Emita: problema, impacto, motivo fora do escopo, alteração/arquivos necessários, riscos, alternativas, recomendação e DECISÃO NECESSÁRIA; mantenha a etapa bloqueada.

## 11. CRITÉRIOS DE APROVAÇÃO

Relatório final é rastreável, não inventa aprovações e indica corretamente a próxima etapa/TASK elegível.

## 12. GATE DA ETAPA

- [ ] Relatório final é rastreável, não inventa aprovações e indica corretamente a próxima etapa/TASK elegível.
- [ ] Evidências (comandos, saídas e arquivos inspecionados) registradas sem segredos/PII.
- [ ] GATE-006 aprovado e evidência disponível.

STATUS: APROVADO somente com todos os itens marcados por evidência; caso contrário, BLOQUEADO.

## 13. STATUS ACUMULADO DOS GATES

GATE-007 — Conclusão e rastreabilidade: EM EXECUÇÃO

GATES CONCLUÍDOS: [PREENCHER]/7
GATES PENDENTES: [PREENCHER]/7
GATES BLOQUEADOS: [PREENCHER]/7

## 14. RESULTADO OBRIGATÓRIO

Finalize a resposta exatamente com o bloco abaixo, preenchendo somente dados comprovados:

==================================================
TASK: TASK-022
ETAPA: 007
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
Nenhuma; aguardar decisão/execução manual conforme o estado final.

PRÓXIMA ETAPA HABILITADA:
SIM | NÃO

MOTIVO:
A próxima etapa só é habilitada se o GATE atual for aprovado por evidência.
==================================================
