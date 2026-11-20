# Roteiro manual TASK-016 — checkpoint de transição PHASE-03

Este roteiro valida a rastreabilidade do checkpoint antes de tornar TASK-017 elegível. Não executa cenários de compra, não usa API ou banco e não altera estado do backlog. A automação só verifica documentos locais; a decisão final é humana.

## Pré-condições

- Estar na branch `feature/TASK-016-checkpoint-transicao-phase-03`.
- Confirmar que TASK-012, TASK-013, TASK-014 e TASK-015 aparecem como `DONE` em `TASKS.md`.
- Conferir os planos e relatórios manuais dessas quatro dependências em `docs/testing/`.
- Não copiar credenciais, tokens, PII ou corpos HTTP para o relatório.

## Cenário MT-016-01 — Revisão da cadeia e aprovação do checkpoint

1. Execute o coletor em PowerShell na raiz do repositório:

   ```powershell
   .\tests\manual\task-016\collect-task-016-results.ps1
   ```

2. Abra `docs/testing/TASK-016-testes-manuais-resultado.md` e compare a lista de dependências e os gates com `TASKS.md` e os quatro planos versionados.
3. Inspecione os relatórios manuais predecessores e confirme que a evidência registrada corresponde à conclusão `DONE` de cada tarefa. A TASK-012 registra a aprovação consolidada dos dez cenários; TASK-013 registra quatro cenários; TASK-014 registra três; TASK-015 registra quatro.
4. Preencha no relatório a data/hora UTC da revisão, resultado `APROVADO` ou `REPROVADO`, evidência documental resumida e confirmação de que não há funcionalidade PHASE-04 antecipada. Não inclua dados pessoais ou segredos.
5. Se qualquer evidência estiver ausente ou contradizer a conclusão, registre `BLOQUEADO`, descreva a lacuna sem conteúdo sensível e não autorize TASK-017.

**Esperado:** cadeia 012–015 coerente, relatórios de gates presentes e aprovados, relatórios manuais consistentes com as conclusões, diff limitado ao checkpoint e decisão humana explícita.

**Evidência a registrar:** data/hora UTC; resultado; nome do artefato conferido (sem caminhos externos); resumo da conferência; falhas ou `nenhuma`; revisão humana confirmada.

**Status inicial:** NÃO EXECUTADO. Automação de leitura dos arquivos não substitui esta revisão.

Depois de preencher a seção humana do relatório, não execute novamente o coletor, pois ele recria o relatório e reinicializa o cenário como `NÃO EXECUTADO`.

## Resultado

O script de coleta não chama serviços externos, não lê credenciais e não altera o backlog. Não executar em produção; o roteiro é apenas para a cópia local do repositório.
