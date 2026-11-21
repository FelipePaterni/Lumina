# Roteiro manual TASK-019 — cancelamentos e reembolsos

O runner exerce as rotas de cliente e Admin usando `PSCredential` e exige confirmação do banco sintético. Passe apenas IDs de pedido/item de teste cujo título da obra comece com `TASK019 `; o runner valida esse prefixo antes de alterar qualquer dado. Não use pedidos reais.

Pré-condições: API local conectada a `lumina_task009_test`, migrações aplicadas, um pedido e um item sintéticos `TASK019` existentes, uma conta CUSTOMER e uma conta ADMIN do `.env`. O runner não cria nem apaga pedidos. Para preparar uma base nova, execute as integrações automatizadas e prepare uma fixture sintética própria antes do roteiro. Nunca conecte a base `lumina`.

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

./tests/manual/task-019/run-task-019-manual-tests.ps1 `
  -ApiBaseUrl 'http://localhost:3001' `
  -CustomerCredential $customer `
  -AdminCredential $admin `
  -SyntheticOrderId '<uuid-do-pedido-task019>' `
  -SyntheticOrderItemId '<uuid-do-item-task019>' `
  -SyntheticTestDatabaseConfirmed
```

O relatório sanitizado é escrito em `docs/testing/TASK-019-testes-manuais-resultado.md`. Revise-o manualmente; o script não aprova o gate humano nem conclui a TASK. A chave de idempotência da solicitação é gerada em memória pelo runner.

## Cenários

- MT-019-00: API local disponível e contas autenticadas.
- MT-019-01: proteção contra alteração de pedido que não seja fixture TASK019.
- MT-019-02: cliente solicita cancelamento e Admin decide quando a solicitação requer análise; aceita estado final `PROCESSED` ou `AWAITING_RETURN`, conforme fulfillment.
- MT-019-03: repetição com a mesma chave idempotente retorna a solicitação existente.

Para cobrir janela de download, revogação de link já emitido, pré-venda e devolução após entrega, use fixtures isoladas correspondentes e registre uma execução separada. O roteiro não declara esses cenários aprovados por inferência.
