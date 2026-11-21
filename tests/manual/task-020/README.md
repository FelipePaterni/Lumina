# Roteiro manual TASK-020 — checkpoint PHASE-04

Este checkpoint agrega evidências aprovadas de TASK-017/018/019 e valida uma regressão nova de link digital após reembolso. A execução automatizada deve terminar antes da revisão humana. O roteiro não acessa `.env`, não exige credenciais e não usa API/banco.

## Pré-condições

- Executar na branch `feature/TASK-020-checkpoint-phase-04`.
- `npm test`, build, lint, Prisma e integração registrados como aprovados no relatório de gates.
- `TASK009_TEST_DATABASE_URL`, se usado nos gates de integração, deve apontar somente ao banco `lumina_task009_test`.
- Os relatórios sanitizados de TASK-017, TASK-018 e TASK-019 devem existir.

## Comandos

No PowerShell 7, na raiz do repositório:

```powershell
./tests/manual/task-020/run-task-020-manual-evidence.ps1
```

O comando verifica a presença dos relatórios e a aprovação humana predecessora. Ele não lê segredos nem declara que o responsável aprovou TASK-020. O relatório consolidado inicia como BLOQUEADO até a revisão humana explícita.

Após revisar toda a matriz, os resultados automatizados e as evidências anteriores, o responsável pode registrar a própria decisão:

```powershell
./tests/manual/task-020/run-task-020-manual-evidence.ps1 -HumanReviewConfirmed
```

Esse parâmetro significa que o responsável realizou a revisão integral descrita abaixo; não substitui os gates automatizados. Não o use se houver falha ou evidência ausente.

## Procedimento

1. Leia `docs/testing/TASK-020-planejamento-e-gates.md` e verifique as saídas dos gates desta branch.
2. Revise os quatro cenários aprovados da TASK-017, incluindo a aprovação humana da legibilidade da cópia personalizada.
3. Revise os quatro cenários aprovados da TASK-018, incluindo composição/posse e janela de lançamento.
4. Revise os cenários aprovados da TASK-019, incluindo o estado de reembolso e a reversão de estoque/licença documentada.
5. Confirme que o teste novo da TASK-020 negou o uso de link previamente emitido depois do reembolso, antes de ler o arquivo derivado.
6. Examine `docs/testing/TASK-020-testes-manuais-resultado.md`. Se tudo estiver consistente, execute o coletor com `-HumanReviewConfirmed`; caso contrário, deixe o status BLOQUEADO e descreva a falha sem dados pessoais.

## Esperado e evidência

- Os três relatórios predecessores são encontrados, sanitizados e registram aprovação humana.
- As evidências automatizadas atuais estão aprovadas e a suíte de integração usa exclusivamente o banco sintético isolado.
- Reembolso restaura a licença uma vez; a cópia original continua privada e um link antigo não contorna a revogação.
- Antes da confirmação humana, relatório consolidado: `BLOQUEADO`. Após revisão explícita sem falhas, relatório: `APROVADO`.
- Campos registrados: data, status, identificadores MT-020-01..05, evidência resumida, falhas e revisão humana. Nenhum segredo, PII, ID de pedido ou arquivo é armazenado.

Status inicial de todos os cenários: NÃO EXECUTADO.
