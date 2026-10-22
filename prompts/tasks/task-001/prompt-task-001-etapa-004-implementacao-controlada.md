# TASK-001 — ETAPA 004 — Implementação controlada

## 1. OBJETIVO

Criar estrutura da stack decidida, ferramentas de build/lint/teste e convenções mínimas.

## 2. CONTEXTO

TASK: TASK-001 — Inicializar estrutura e qualidade  
Dependências: `DEPENDS_ON: NONE`  
Relacionados: ADR-001, ADR-002, ADR-006, RNF-012,013.

Esta etapa faz parte de um workflow controlado. Não execute etapas posteriores, não altere TASKS.md nem implemente funcionalidades fora desta etapa sem que os gates anteriores estejam aprovados.

## 3. PRÉ-CONDIÇÕES

- Branch de trabalho específica da TASK; main não pode receber desenvolvimento direto.
- Working tree inspecionada e alterações alheias preservadas.
- Documentos obrigatórios lidos na ordem: AGENTS.md, README.md, TASKS.md, ADRs relacionados, código e testes existentes.
- Escopo autorizado: arquivos-raiz de build e Docker; `apps/**`; `packages/**`; `tests/**`; documentação de execução; `TASKS.md`.
- Escopo proibido: requisitos/ADRs; integrações externas; regras de negócio.

## 4. ENTRADAS NECESSÁRIAS

- Estado atual de TASKS.md, incluindo dependências e Definition of Ready.
- Critérios de aceite e DoD da TASK; se ausentes, registre a lacuna.
- Evidências produzidas pelas TASKs predecessoras, quando existirem.

## 5. ARQUIVOS E COMPONENTES ENVOLVIDOS

Somente os caminhos autorizados no Scope Guard e artefatos mínimos diretamente necessários. Antes de editar, liste arquivos existentes, arquivos novos e arquivos que não serão tocados.

## 6. PROCEDIMENTO DETALHADO

Somente após os gates anteriores aprovados, implemente o plano aprovado em branch da TASK. Mantenha mudanças pequenas e coesas. Após cada alteração relevante, inspecione diff e execute a validação específica disponível.

## 7. RESTRIÇÕES

- Alterações mínimas; não refatorar, redesenhar, criar dependências ou mudar contratos sem autorização.
- Diferencie explicitamente FATO CONFIRMADO, EVIDÊNCIA, INFERÊNCIA, HIPÓTESE e PENDÊNCIA.
- Não exponha segredos, tokens, PII ou arquivos originais em logs, fixtures ou relatórios.
- Testes automatizados não substituem a etapa de testes manuais.

## 8. VALIDAÇÕES

Critérios de aceite: build, lint e teste vazio passam em ambiente limpo; a composição Docker inicia os serviços locais documentados; nenhuma chave real é criada. DoD: comandos nativos e Docker documentados; imagens são reproduzíveis e gates verdes.

## 9. TRATAMENTO DE FALHAS

Interrompa o avanço. Registre comando/operação, código de saída, mensagem de erro e evidência. Classifique a causa como pertencente ou não ao escopo. Aplique somente a menor correção autorizada, reexecute a validação e atualize o GATE. Nunca ignore uma falha nem trate correção sem revalidação como aprovação.

## 10. SCOPE ESCALATION

Se a menor correção tocar FORBIDDEN_CHANGES, exceder ALLOWED_CHANGES ou exigir decisão ausente, não a implemente. Emita: problema, impacto, motivo fora do escopo, alteração/arquivos necessários, riscos, alternativas, recomendação e DECISÃO NECESSÁRIA; mantenha a etapa bloqueada.

## 11. CRITÉRIOS DE APROVAÇÃO

Implementação atende aos critérios, não toca caminhos proibidos e cada mudança possui validação proporcional.

## 12. GATE DA ETAPA

- [ ] Implementação atende aos critérios, não toca caminhos proibidos e cada mudança possui validação proporcional.
- [ ] Evidências (comandos, saídas e arquivos inspecionados) registradas sem segredos/PII.
- [ ] GATE-003 aprovado e evidência disponível.

STATUS: APROVADO somente com todos os itens marcados por evidência; caso contrário, BLOQUEADO.

## 13. STATUS ACUMULADO DOS GATES

GATE-004 — Implementação controlada: EM EXECUÇÃO

GATES CONCLUÍDOS: [PREENCHER]/7
GATES PENDENTES: [PREENCHER]/7
GATES BLOQUEADOS: [PREENCHER]/7

## 14. RESULTADO OBRIGATÓRIO

Finalize a resposta exatamente com o bloco abaixo, preenchendo somente dados comprovados:

==================================================
TASK: TASK-001
ETAPA: 004
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
ETAPA 005 — Revisão e gates automatizados

PRÓXIMA ETAPA HABILITADA:
SIM | NÃO

MOTIVO:
A próxima etapa só é habilitada se o GATE atual for aprovado por evidência.
==================================================
