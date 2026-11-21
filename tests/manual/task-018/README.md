# Roteiro manual TASK-018 — bundles e pré-vendas

O runner usa o ADMIN e os dois CUSTOMER sintéticos já definidos no `.env`; não é preciso criar contas extras. Execute em PowerShell 7 contra a API local conectada exclusivamente ao banco isolado `lumina_task009_test`. O script recusa URL fora de loopback e exige `-SyntheticTestDatabaseConfirmed`.

## Preparar ambiente local isolado

Confirme que os serviços locais atuais não contêm dados que devam ser preservados antes de iniciar o Compose. O banco e as compras criados pelo roteiro são sintéticos e não são apagados pelo runner.

Na mesma sessão PowerShell, suba Postgres e API com o nome da base isolada:

```powershell
$previousPostgresDb = $env:POSTGRES_DB
try {
  $env:POSTGRES_DB = 'lumina_task009_test'
  docker compose up -d postgres
  docker compose up -d --build api
} finally {
  if ($null -eq $previousPostgresDb) { Remove-Item Env:\POSTGRES_DB -ErrorAction SilentlyContinue }
  else { $env:POSTGRES_DB = $previousPostgresDb }
}
```

A configuração local da API aplica as migrações e sincroniza o ADMIN e os dois CUSTOMER do `.env` se `LOCAL_TEST_ACCOUNTS_ENABLED=true`. Se a API já estiver iniciada para outra base, reinicie somente após confirmar que não há execução local a preservar. Não use a base `lumina`.

## Executar com as contas do `.env`

O bloco abaixo carrega apenas os três pares de credenciais necessários, transforma as senhas em `PSCredential` em memória e não imprime os valores. Ele seleciona automaticamente três obras visíveis com edição DIGITAL visível, priorizando lançamento futuro, e cria/ajusta licenças digitais dentro da base isolada.

```powershell
$envValues = @{}
Get-Content .env | ForEach-Object {
  if ($_ -match '^\s*(ADMIN_SEED_EMAIL|ADMIN_SEED_PASSWORD|TEST_CUSTOMER_1_EMAIL|TEST_CUSTOMER_1_PASSWORD|TEST_CUSTOMER_2_EMAIL|TEST_CUSTOMER_2_PASSWORD)\s*=\s*(.*)\s*$') {
    $envValues[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
  }
}
function New-Task018Credential([string]$emailKey, [string]$passwordKey) {
  $secure = ConvertTo-SecureString $envValues[$passwordKey] -AsPlainText -Force
  [System.Management.Automation.PSCredential]::new($envValues[$emailKey], $secure)
}
$admin = New-Task018Credential 'ADMIN_SEED_EMAIL' 'ADMIN_SEED_PASSWORD'
$customer1 = New-Task018Credential 'TEST_CUSTOMER_1_EMAIL' 'TEST_CUSTOMER_1_PASSWORD'
$customer2 = New-Task018Credential 'TEST_CUSTOMER_2_EMAIL' 'TEST_CUSTOMER_2_PASSWORD'
$envValues.Clear()
$envValues = $null

.\tests\manual\task-018\run-task-018-manual-tests.ps1 `
  -ApiBaseUrl 'http://localhost:3001' `
  -AdminCredential $admin `
  -FullPurchaseCredential $customer1 `
  -PartialOwnerCredential $customer2 `
  -BundlePriceCents 2000 `
  -SyntheticTestDatabaseConfirmed
```

O runner mantém senhas e tokens somente em memória. O CUSTOMER de posse parcial compra sinteticamente dois componentes para preparar o cenário; o outro realiza uma compra integral simulada. O script gera um relatório sanitizado em `docs/testing/TASK-018-testes-manuais-resultado.md`, sem registrar credenciais, tokens, e-mails ou IDs. Ele não apaga compras ou bundles.

## Cenários

- MT-018-01: composição invertida duplicada retorna 409; CUSTOMER não cria bundle (403).
- MT-018-02: checkout do bundle confirma preço não negativo e cria uma linha para cada edição.
- MT-018-03: posse parcial reduz o preço pelos e-books já possuídos; posse total recusa o bundle.
- MT-018-04: estado `PREORDER` permanece até a data de lançamento e passa a `RELEASED` na data ou depois.

Revise manualmente o relatório. A execução automatizada não substitui essa revisão, e o TASK-018 não deve ser marcado `DONE` até a revisão humana e a conclusão do gate restante.
