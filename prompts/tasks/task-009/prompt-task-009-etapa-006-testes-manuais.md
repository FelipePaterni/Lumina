# TASK-009 — ETAPA 006 — Testes manuais

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

Registre evidências em `docs/testing/TASK-009-gates.md` e acrescente execuções ao relatório sem substituir resultados anteriores.

## 6. PROCEDIMENTO DETALHADO

Crie roteiro manual para Windows/WSL sem marcá-lo executado. Cada teste deve conter ID, objetivo, pré-condições, comandos identificados na etapa 002, procedimento, resultado esperado, campos de evidência e status inicial NÃO EXECUTADO. Inclua cenários de aceitação e negação/segurança. Para PowerShell, verifique se `Invoke-WebRequest` oferece `-SkipHttpErrorCheck` antes da execução. O script deve acrescentar execução datada ao relatório existente, nunca substituí-lo.

## 7. RESTRIÇÕES

- Alterações mínimas; não refatorar, redesenhar, criar dependências ou mudar contratos sem autorização.
- Diferencie explicitamente FATO CONFIRMADO, EVIDÊNCIA, INFERÊNCIA, HIPÓTESE e PENDÊNCIA.
- Não exponha segredos, tokens, PII ou arquivos originais em logs, fixtures ou relatórios.
- Testes automatizados não substituem a etapa de testes manuais.

## 8. VALIDAÇÕES

Roteiro não presume tecnologias; se o ambiente ainda não existir, forneça instrução para descobrir o comando real e marque bloqueio. O cenário de privacidade deve combinar inspeção da superfície de rotas implementada com requisições anônimas; um único caminho presumido retornando 404 não prova ausência de outra rota pública.

## 9. TRATAMENTO DE FALHAS

Interrompa o avanço. Registre comando/operação, código de saída, mensagem de erro e evidência. Classifique a causa como pertencente ou não ao escopo. Aplique somente a menor correção autorizada, reexecute a validação e atualize o GATE. Nunca ignore uma falha nem trate correção sem revalidação como aprovação.

## 10. SCOPE ESCALATION

Se a menor correção tocar FORBIDDEN_CHANGES, exceder ALLOWED_CHANGES ou exigir decisão ausente, não a implemente. Emita: problema, impacto, motivo fora do escopo, alteração/arquivos necessários, riscos, alternativas, recomendação e DECISÃO NECESSÁRIA; mantenha a etapa bloqueada.

## 11. CRITÉRIOS DE APROVAÇÃO

Todos os cenarios obrigatorios possuem roteiro manual e nenhum e declarado aprovado sem execucao humana.

## 12. GATE DA ETAPA

- [ ] Todos os cenarios obrigatorios possuem roteiro manual e nenhum e declarado aprovado sem execucao humana.
- [ ] Evidências (comandos, saídas e arquivos inspecionados) registradas sem segredos/PII.
- [ ] GATE-005 aprovado e evidência disponível.

STATUS: APROVADO somente com todos os itens marcados por evidência; caso contrário, BLOQUEADO.

## 13. STATUS ACUMULADO DOS GATES

GATE-006 — Testes manuais: APROVADO em 2026-11-11; dez cenários executados e aprovados, revisão humana explícita registrada em `docs/testing/TASK-009-testes-manuais-resultado.md`.

GATES CONCLUÍDOS: 6/7
GATES PENDENTES: 1/7
GATES BLOQUEADOS: 0/7

## 14. RESULTADO OBRIGATÓRIO

Finalize a resposta exatamente com o bloco abaixo, preenchendo somente dados comprovados:

==================================================
TASK: TASK-009
ETAPA: 006
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
ETAPA 007 — Conclusão e rastreabilidade

PRÓXIMA ETAPA HABILITADA:
SIM | NÃO

MOTIVO:
A próxima etapa só é habilitada se o GATE atual for aprovado por evidência.
==================================================
