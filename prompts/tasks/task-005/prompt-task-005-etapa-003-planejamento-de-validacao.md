# TASK-005 — ETAPA 003 — Planejamento de validação

## 1. OBJETIVO

Validar base, identidade, segurança e rastreabilidade da fase.

## 2. CONTEXTO

TASK: TASK-005 — Checkpoint PHASE-01  
Dependências: `DEPENDS_ON: TASK-004`  
Relacionados: RNF-001–003,012.

Esta etapa faz parte de um workflow controlado. Não execute etapas posteriores, não altere TASKS.md nem implemente funcionalidades fora desta etapa sem que os gates anteriores estejam aprovados.

## 3. PRÉ-CONDIÇÕES

- Branch de trabalho específica da TASK; main não pode receber desenvolvimento direto.
- Working tree inspecionada e alterações alheias preservadas.
- Documentos obrigatórios lidos na ordem: AGENTS.md, README.md, TASKS.md, ADRs relacionados, código e testes existentes.
- Escopo autorizado: testes/configuração das fases 01; documentação de qualidade; `TASKS.md`.
- Escopo proibido: funcionalidades PHASE-02+.

## 4. ENTRADAS NECESSÁRIAS

- Estado atual de TASKS.md, incluindo dependências e Definition of Ready.
- Critérios de aceite e DoD da TASK; se ausentes, registre a lacuna.
- Evidências produzidas pelas TASKs predecessoras, quando existirem.

## 5. ARQUIVOS E COMPONENTES ENVOLVIDOS

Somente os caminhos autorizados no Scope Guard e artefatos mínimos diretamente necessários. Antes de editar, liste arquivos existentes, arquivos novos e arquivos que não serão tocados.

## 6. PROCEDIMENTO DETALHADO

Defina apenas verificações permitidas: build, lint, testes, segurança, integração e revisão documental conforme a TASK. Liste os comandos reais após identificar a tecnologia; não presuma npm, Docker ou banco disponível.

## 7. RESTRIÇÕES

- Alterações mínimas; não refatorar, redesenhar, criar dependências ou mudar contratos sem autorização.
- Diferencie explicitamente FATO CONFIRMADO, EVIDÊNCIA, INFERÊNCIA, HIPÓTESE e PENDÊNCIA.
- Não exponha segredos, tokens, PII ou arquivos originais em logs, fixtures ou relatórios.
- Testes automatizados não substituem a etapa de testes manuais.

## 8. VALIDAÇÕES

Plano aponta ambiente, dados de teste seguros, comandos, evidências, rollback e critérios de parada.

## 9. TRATAMENTO DE FALHAS

Interrompa o avanço. Registre comando/operação, código de saída, mensagem de erro e evidência. Classifique a causa como pertencente ou não ao escopo. Aplique somente a menor correção autorizada, reexecute a validação e atualize o GATE. Nunca ignore uma falha nem trate correção sem revalidação como aprovação.

## 10. SCOPE ESCALATION

Se a menor correção tocar FORBIDDEN_CHANGES, exceder ALLOWED_CHANGES ou exigir decisão ausente, não a implemente. Emita: problema, impacto, motivo fora do escopo, alteração/arquivos necessários, riscos, alternativas, recomendação e DECISÃO NECESSÁRIA; mantenha a etapa bloqueada.

## 11. CRITÉRIOS DE APROVAÇÃO

Plano de validação é executável e não invade funcionalidades da fase seguinte.

## 12. GATE DA ETAPA

- [ ] Plano de validação é executável e não invade funcionalidades da fase seguinte.
- [ ] Evidências (comandos, saídas e arquivos inspecionados) registradas sem segredos/PII.
- [ ] GATE-002 aprovado e evidência disponível.

STATUS: APROVADO somente com todos os itens marcados por evidência; caso contrário, BLOQUEADO.

## 13. STATUS ACUMULADO DOS GATES

GATE-003 — Planejamento de validação: EM EXECUÇÃO

GATES CONCLUÍDOS: [PREENCHER]/5
GATES PENDENTES: [PREENCHER]/5
GATES BLOQUEADOS: [PREENCHER]/5

## 14. RESULTADO OBRIGATÓRIO

Finalize a resposta exatamente com o bloco abaixo, preenchendo somente dados comprovados:

==================================================
TASK: TASK-005
ETAPA: 003
STATUS DA ETAPA: APROVADA | REPROVADA | BLOQUEADA
==================================================

GATE DA ETAPA:
[APROVADO | REPROVADO | BLOQUEADO]

GATES TOTAIS: 5
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
ETAPA 004 — Execução das validações

PRÓXIMA ETAPA HABILITADA:
SIM | NÃO

MOTIVO:
A próxima etapa só é habilitada se o GATE atual for aprovado por evidência.
==================================================
