# Roteiro manual TASK-019 — cancelamentos e reembolsos

O runner exerce as rotas de cliente e Admin usando `PSCredential` e exige confirmação do banco sintético. O preparador cria um pedido físico novo para o CUSTOMER informado, somente na base `lumina_task009_test`, e imprime os IDs sintéticos. O runner valida o título `TASK019 ` antes de alterar qualquer dado. Não use pedidos reais.

Pré-condições: API local conectada a `lumina_task009_test`, migrações aplicadas, uma conta CUSTOMER e uma conta ADMIN do `.env`. O preparador cria um novo pedido sintético e não apaga dados. Nunca conecte a base `lumina`.

Carregue somente as duas contas necessárias do `.env` na sessão PowerShell, mantendo as senhas em memória:

```powershell
$envValues = @{}
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*(ADMIN_SEED_EMAIL|ADMIN_SEED_PASSWORD|TEST_CUSTOMER_1_EMAIL|TEST_CUSTOMER_1_PASSWORD)\s*=\s*(.*)\s*$') {
    $envValues[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
  }
}
function New-Task019Credential([string] $emailKey, [string] $passwordKey) {
  $secure = ConvertTo-SecureString $envValues[$passwordKey] -AsPlainText -Force
  [PSCredential]::new($envValues[$emailKey], $secure)
}
$admin = New-Task019Credential 'ADMIN_SEED_EMAIL' 'ADMIN_SEED_PASSWORD'
$customer = New-Task019Credential 'TEST_CUSTOMER_1_EMAIL' 'TEST_CUSTOMER_1_PASSWORD'
$envValues.Clear()
$envValues = $null

$fixture = ./tests/manual/task-019/prepare-task-019-manual.ps1 -CustomerCredential $customer

./tests/manual/task-019/run-task-019-manual-tests.ps1 `
  -ApiBaseUrl 'http://localhost:3001' `
  -CustomerCredential $customer `
  -AdminCredential $admin `
  -SyntheticOrderId $fixture.orderId `
  -SyntheticOrderItemId $fixture.orderItemId `
  -SyntheticTestDatabaseConfirmed
```

O relatório sanitizado é escrito em `docs/testing/TASK-019-testes-manuais-resultado.md`. Revise-o manualmente; o script não aprova o gate humano nem conclui a TASK. A chave de idempotência da solicitação é gerada em memória pelo runner. O fixture é físico e não enviado: aprovação Admin deve repor uma unidade de estoque e concluir o reembolso; o pedido sintético fica na base isolada para auditoria.

## Cenários

- MT-019-00: API local disponível e contas autenticadas.
- MT-019-01: preparação e proteção de pedido sintético; rejeita conta inexistente ou fora do papel CUSTOMER.
- MT-019-02: cliente solicita cancelamento físico não enviado e Admin aprova; pedido passa a `REFUNDED` e estoque é reposto.
- MT-019-03: repetição com a mesma chave idempotente retorna a solicitação existente.
