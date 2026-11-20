# Roteiro manual TASK-015

O checkpoint reutiliza cenários manuais já implementados para checkout e notificações. O responsável deve executá-los no PowerShell do Windows; não execute contra produção nem contra o banco `lumina` principal.

## Pré-condições

- API e PostgreSQL locais preparados conforme os roteiros TASK-013 e TASK-014.
- Contas CUSTOMER/Admin sintéticas e confirmadas; carrinhos vazios.
- `DATABASE_URL` aponta para banco local Lumina isolado. Os scripts TASK-013/014 recusam hosts ou nomes de banco não locais.
- Nenhuma credencial ou token deve ser copiado para arquivo, terminal compartilhado ou relatório.

## Cenários, evidência e comandos

| Cenário | Roteiro | Resultado esperado | Evidência registrada |
|---|---|---|---|
| MT-015-01 — compra digital gratuita | TASK-013, MT-013-02 | `201`, total zero, pagamento `NOT_REQUIRED`, replay idempotente | Relatório sanitizado TASK-013 |
| MT-015-02 — compra híbrida paga | TASK-013, MT-013-03 | Pedido híbrido único, pagamento `APPROVED`, nenhuma sobre-venda física ou de licença | Status concorrentes e contadores agregados no relatório TASK-013 |
| MT-015-03 — concorrência de estoque e cupom | TASK-013, MT-013-03/04 | Uma confirmação e um conflito em cada disputa; estoque e cota consumidos uma vez | Relatório sanitizado TASK-013 |
| MT-015-04 — notificação e replay idempotente | TASK-014, MT-014-03 | Uma notificação para o pedido confirmado; replay sem duplicação | Relatório sanitizado TASK-014 |

## Execução

```powershell
$started = [DateTimeOffset]::UtcNow.ToString('o')
$customer1 = Get-Credential -Message 'Conta CUSTOMER sintética 1'
$customer2 = Get-Credential -Message 'Conta CUSTOMER sintética 2'
$admin = Get-Credential -Message 'Conta ADMIN sintética'

.\tests\manual\task-013\run-task-013-manual-tests.ps1 `
  -Customer1Credential $customer1 `
  -Customer2Credential $customer2 `
  -AdminCredential $admin
.\tests\manual\task-014\run-task-014-manual-tests.ps1 `
  -CustomerCredential $customer1
.\tests\manual\task-015\collect-task-015-results.ps1 `
  -ApiBaseUrl 'http://localhost:3001' `
  -ExecutionStartedAtUtc $started `
  -HumanReviewed
```

Os roteiros fonte recebem credenciais via parâmetros `PSCredential` e geram relatórios sanitizados próprios. O mesmo `$customer1` pode ser reutilizado no TASK-014, portanto são necessárias três contas distintas: dois CUSTOMER e um ADMIN. O coletor TASK-015 aceita somente relatórios atualizados após `$started`; não lê credenciais nem corpos HTTP. Sem aprovação humana, não use `-HumanReviewed` e não considere o gate aprovado.

O coletor cria/atualiza `docs/testing/TASK-015-testes-manuais-resultado.md` e retorna código diferente de zero enquanto houver cenário não aprovado. Campos para revisão: status de cada cenário, evidência resumida e confirmação de limpeza nos dois relatórios fonte.
