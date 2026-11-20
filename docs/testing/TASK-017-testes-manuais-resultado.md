# TASK-017 — Resultado dos testes manuais

- Execução UTC: NÃO EXECUTADA
- Alvo: API local, pendente de execução humana
- Dados: contas e compra sintéticas; nenhuma credencial, token, nome, e-mail, arquivo ou resposta HTTP registrado
- Revisão humana: PENDENTE

| Cenário | Resultado | Evidência resumida |
|---|---|---|
| MT-017-01 — Biblioteca lista compra digital do cliente | BLOQUEADO | Ainda não executado; aguarda runner e revisão humana. |
| MT-017-02 — Isolamento impede acesso por outro cliente | BLOQUEADO | Ainda não executado; aguarda runner e revisão humana. |
| MT-017-03 — Admin não acessa biblioteca de cliente | BLOQUEADO | Ainda não executado; aguarda runner e revisão humana. |
| MT-017-04 — Link temporário renovável baixa cópia personalizada | BLOQUEADO | Ainda não executado; aguarda runner e inspeção do PDF/EPUB. |

Pré-requisitos: API da branch TASK-017 iniciada, PostgreSQL local isolado ativo em `localhost:5433`, edição digital lançada e comprada pela conta CUSTOMER sintética. Instruções: `tests/manual/task-017/README.md`.

Não marcar cenários como aprovados apenas com base nos testes automatizados. Após executar o runner, revisar a cópia e atualizar manualmente este relatório; não executar novamente o runner depois da revisão, pois ele recria o relatório.
