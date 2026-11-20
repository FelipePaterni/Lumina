# Roteiro manual TASK-015

O checkpoint executa novamente os cenários manuais do checkout. Para notificações, reutiliza a evidência manual já aprovada da TASK-014, dependência marcada `DONE`; não execute contra produção.

## Pré-condições

- API e PostgreSQL locais preparados conforme o roteiro TASK-013.
- Contas CUSTOMER/Admin sintéticas e confirmadas; carrinhos vazios.
- `DATABASE_URL` aponta para banco local Lumina. O script TASK-013 recusa hosts ou nomes de banco não locais.
- Nenhuma credencial ou token deve ser copiado para arquivo, terminal compartilhado ou relatório.

## Cenários, evidência e comandos

| Cenário | Roteiro | Resultado esperado | Evidência registrada |
|---|---|---|---|
| MT-015-01 — compra digital gratuita | TASK-013, MT-013-02 | `201`, total zero, pagamento `NOT_REQUIRED`, replay idempotente | Relatório sanitizado TASK-013 |
| MT-015-02 — compra híbrida paga | TASK-013, MT-013-03 | Pedido híbrido único, pagamento `APPROVED`, nenhuma sobre-venda física ou de licença | Status concorrentes e contadores agregados no relatório TASK-013 |
| MT-015-03 — concorrência de estoque e cupom | TASK-013, MT-013-03/04 | Uma confirmação e um conflito em cada disputa; estoque e cota consumidos uma vez | Relatório sanitizado TASK-013 |
| MT-015-04 — notificação e replay idempotente | TASK-014 concluída, MT-014-03 | Uma notificação para o pedido confirmado; replay sem duplicação | Relatório TASK-014 aprovado e versionado |

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
.\tests\manual\task-015\collect-task-015-results.ps1 `
  -ApiBaseUrl 'http://localhost:3001' `
  -ExecutionStartedAtUtc $started `
  -HumanReviewed
```

O roteiro TASK-013 recebe credenciais via parâmetros `PSCredential` e gera relatório sanitizado. São necessárias três contas distintas: dois CUSTOMER e um ADMIN. A execução anterior da TASK-014 foi aprovada pelo responsável e está registrada no histórico versionado; uma repetição posterior que falhou no pré-flight não executou cenários e não substitui essa evidência. O coletor TASK-015 exige relatório TASK-013 recente, valida o registro versionado da TASK-014 como `DONE`, e não lê credenciais nem corpos HTTP. Sem revisão humana, não use `-HumanReviewed`.

O coletor cria/atualiza `docs/testing/TASK-015-testes-manuais-resultado.md` e retorna código diferente de zero enquanto houver cenário não aprovado. Campos para revisão: status dos cenários, evidência resumida e limpeza do roteiro TASK-013.
