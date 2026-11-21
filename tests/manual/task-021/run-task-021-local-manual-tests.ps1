[CmdletBinding()]
param([ValidateRange(1024, 65535)] [int] $ApiPort = 3002)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$envFile = Join-Path $root '.env'
$values = @{}
$savedEnvironment = @{}
$apiProcess = $null
$stdoutPath = $null
$stderrPath = $null
$wrapperExitCode = 0
$envNames = @(
  'TASK009_TEST_DATABASE_URL', 'DATABASE_URL', 'PORT', 'NODE_ENV',
  'LOCAL_TEST_ACCOUNTS_ENABLED', 'ADMIN_SEED_EMAIL', 'ADMIN_SEED_PASSWORD',
  'TEST_CUSTOMER_1_EMAIL', 'TEST_CUSTOMER_1_PASSWORD',
  'TEST_CUSTOMER_2_EMAIL', 'TEST_CUSTOMER_2_PASSWORD'
)

try {
  if (-not (Test-Path -LiteralPath $envFile)) { throw 'ARQUIVO_ENV_AUSENTE' }
  Get-Content -LiteralPath $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)\s*=\s*(.*)$') {
      $values[$Matches[1].Trim()] = $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
  foreach ($name in $envNames) { $savedEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }

  if (-not $values['DATABASE_URL'] -or -not $values['ADMIN_SEED_EMAIL'] -or -not $values['ADMIN_SEED_PASSWORD'] -or
      -not $values['TEST_CUSTOMER_1_EMAIL'] -or -not $values['TEST_CUSTOMER_1_PASSWORD'] -or
      -not $values['TEST_CUSTOMER_2_EMAIL'] -or -not $values['TEST_CUSTOMER_2_PASSWORD']) {
    throw 'CREDENCIAIS_SINTETICAS_AUSENTES_NO_ENV'
  }
  $baseUri = [uri]$values['DATABASE_URL']
  $baseDatabase = [System.Uri]::UnescapeDataString($baseUri.AbsolutePath.TrimStart('/'))
  if ($baseUri.Host -notin @('localhost', '127.0.0.1', '::1') -or $baseUri.Port -ne 5433 -or $baseDatabase -ne 'lumina') {
    throw 'DATABASE_URL_NAO_E_A_INSTANCIA_LOCAL_ESPERADA'
  }
  foreach ($emailName in @('ADMIN_SEED_EMAIL', 'TEST_CUSTOMER_1_EMAIL', 'TEST_CUSTOMER_2_EMAIL')) {
    if (-not $values[$emailName].EndsWith('@example.invalid')) { throw 'CONTA_NAO_USA_DOMINIO_SINTETICO' }
  }
  if (Test-NetConnection -ComputerName localhost -Port $ApiPort -InformationLevel Quiet -WarningAction SilentlyContinue) {
    throw 'PORTA_API_TESTE_JA_ESTA_EM_USO'
  }

  $testUriBuilder = [System.UriBuilder]$baseUri
  $testUriBuilder.Path = '/lumina_task009_test'
  $testUriBuilder.Query = 'schema=public'
  $testDatabaseUrl = $testUriBuilder.Uri.AbsoluteUri
  $env:TASK009_TEST_DATABASE_URL = $testDatabaseUrl
  $env:DATABASE_URL = $testDatabaseUrl
  $env:PORT = [string]$ApiPort
  $env:NODE_ENV = 'development'
  $env:LOCAL_TEST_ACCOUNTS_ENABLED = 'true'
  foreach ($name in @('ADMIN_SEED_EMAIL', 'ADMIN_SEED_PASSWORD', 'TEST_CUSTOMER_1_EMAIL', 'TEST_CUSTOMER_1_PASSWORD', 'TEST_CUSTOMER_2_EMAIL', 'TEST_CUSTOMER_2_PASSWORD')) {
    [Environment]::SetEnvironmentVariable($name, $values[$name], 'Process')
  }

  $node = (Get-Command node -ErrorAction Stop).Source
  $apiEntry = Join-Path $root 'apps\api\dist\main.js'
  if (-not (Test-Path -LiteralPath $apiEntry)) { throw 'BUILD_API_AUSENTE' }
  $runId = [guid]::NewGuid().ToString('N')
  $stdoutPath = Join-Path $env:TEMP "task021-api-$runId.out.log"
  $stderrPath = Join-Path $env:TEMP "task021-api-$runId.err.log"
  $apiProcess = Start-Process -FilePath $node -ArgumentList @($apiEntry) -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

  $ready = $false
  for ($attempt = 0; $attempt -lt 45; $attempt += 1) {
    $apiProcess.Refresh()
    if ($apiProcess.HasExited) { throw 'API_TESTE_NAO_INICIOU' }
    if (Test-NetConnection -ComputerName localhost -Port $ApiPort -InformationLevel Quiet -WarningAction SilentlyContinue) { $ready = $true; break }
    Start-Sleep -Seconds 1
  }
  if (-not $ready) { throw 'API_TESTE_TIMEOUT' }

  $fixtureJson = & $node (Join-Path $PSScriptRoot 'prepare-task-021-manual.mjs') 2>$null
  if ($LASTEXITCODE -ne 0) { throw 'PREPARACAO_SINTETICA_FALHOU' }
  $fixture = $fixtureJson | ConvertFrom-Json
  $fixtureJson = $null

  $stockSecure = ConvertTo-SecureString $fixture.stockCredential.password -AsPlainText -Force
  $stockCredential = [PSCredential]::new($fixture.stockCredential.email, $stockSecure)
  $fixture.stockCredential.password = $null
  $stockSecure = $null

  function New-Task021Credential([string] $email, [string] $password) {
    $securePassword = ConvertTo-SecureString $password -AsPlainText -Force
    [PSCredential]::new($email, $securePassword)
  }
  $adminCredential = New-Task021Credential $values['ADMIN_SEED_EMAIL'] $values['ADMIN_SEED_PASSWORD']
  $customerCredential = New-Task021Credential $values['TEST_CUSTOMER_1_EMAIL'] $values['TEST_CUSTOMER_1_PASSWORD']
  $otherCustomerCredential = New-Task021Credential $values['TEST_CUSTOMER_2_EMAIL'] $values['TEST_CUSTOMER_2_PASSWORD']
  $values.Clear()

  $result = & (Join-Path $PSScriptRoot 'run-task-021-manual-tests.ps1') `
    -ApiBaseUrl "http://localhost:$ApiPort" `
    -StockCredential $stockCredential `
    -AdminCredential $adminCredential `
    -CustomerCredential $customerCredential `
    -OtherCustomerCredential $otherCustomerCredential `
    -SyntheticOrderId $fixture.released.orderId `
    -SyntheticPreorderOrderId $fixture.preorder.orderId `
    -SyntheticEditionId $fixture.released.editionId `
    -SyntheticPreorderEditionId $fixture.preorder.editionId `
    -SyntheticTestDatabaseConfirmed

  Get-Content -LiteralPath $result.ReportPath
  if ($result.ExitCode -ne 0) { throw 'CENARIOS_MANUAIS_NAO_PASSARAM' }
} catch {
  Write-Output ("BLOQUEADO: " + $_.Exception.Message)
  $wrapperExitCode = 2
} finally {
  if ($apiProcess) {
    $apiProcess.Refresh()
    if (-not $apiProcess.HasExited) { Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue }
  }
  foreach ($name in $envNames) {
    if ($null -eq $savedEnvironment[$name]) { Remove-Item "Env:$name" -ErrorAction SilentlyContinue }
    else { [Environment]::SetEnvironmentVariable($name, $savedEnvironment[$name], 'Process') }
  }
  foreach ($logPath in @($stdoutPath, $stderrPath)) {
    if ($logPath -and (Test-Path -LiteralPath $logPath)) { Remove-Item -LiteralPath $logPath -Force -ErrorAction SilentlyContinue }
  }
}
if ($wrapperExitCode -ne 0) { exit $wrapperExitCode }
