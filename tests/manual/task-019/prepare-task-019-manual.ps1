[CmdletBinding()]
param(
  [Parameter(Mandatory)] [PSCredential] $CustomerCredential
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$envValues = @{}
$variableNames = @('POSTGRES_DB', 'DATABASE_URL', 'TASK009_TEST_DATABASE_URL', 'TASK019_CUSTOMER_EMAIL')
$previousValues = @{}
foreach ($name in $variableNames) { $previousValues[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }

Push-Location $repoRoot
try {
  Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*(POSTGRES_USER|POSTGRES_PASSWORD|POSTGRES_PORT)\s*=\s*(.*)\s*$') {
      $envValues[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
  if (-not $envValues['POSTGRES_USER'] -or -not $envValues['POSTGRES_PASSWORD'] -or -not $envValues['POSTGRES_PORT']) {
    throw 'POSTGRES_USER, POSTGRES_PASSWORD e POSTGRES_PORT precisam existir no .env'
  }

  $dbUser = [uri]::EscapeDataString($envValues['POSTGRES_USER'])
  $dbPassword = [uri]::EscapeDataString($envValues['POSTGRES_PASSWORD'])
  $testDatabaseUrl = "postgresql://${dbUser}:${dbPassword}@localhost:$($envValues['POSTGRES_PORT'])/lumina_task009_test?schema=public"

  $env:POSTGRES_DB = 'lumina_task009_test'
  $env:DATABASE_URL = $testDatabaseUrl
  $env:TASK009_TEST_DATABASE_URL = $testDatabaseUrl
  $env:TASK019_CUSTOMER_EMAIL = $CustomerCredential.UserName

  docker compose up -d postgres
  if ($LASTEXITCODE -ne 0) { throw 'Não foi possível iniciar o PostgreSQL local' }
  npm run db:migrate
  if ($LASTEXITCODE -ne 0) { throw 'As migrações não foram aplicadas à base isolada' }
  docker compose up -d --build api
  if ($LASTEXITCODE -ne 0) { throw 'Não foi possível iniciar a API local' }

  $loginBody = @{
    email = $CustomerCredential.UserName
    password = $CustomerCredential.GetNetworkCredential().Password
  } | ConvertTo-Json
  $ready = $false
  for ($attempt = 0; $attempt -lt 30; $attempt += 1) {
    try {
      $login = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/auth/login' -ContentType 'application/json' -Body $loginBody
      if ($login.accessToken) { $ready = $true; break }
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  $loginBody = $null
  $login = $null
  if (-not $ready) { throw 'A API não ficou pronta ou a conta CUSTOMER não autenticou' }

  $seedOutput = & node tests/manual/task-019/seed-task-019-manual.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Não foi possível criar o pedido sintético TASK019' }
  $fixture = $seedOutput | ConvertFrom-Json
  if ($fixture.orderId -notmatch '^[0-9a-fA-F-]{36}$' -or $fixture.orderItemId -notmatch '^[0-9a-fA-F-]{36}$') {
    throw 'O preparador não retornou IDs sintéticos válidos'
  }
  return $fixture
} finally {
  $envValues.Clear()
  $envValues = $null
  foreach ($name in $variableNames) {
    $previousValue = $previousValues[$name]
    if ($null -eq $previousValue) { Remove-Item "Env:\$name" -ErrorAction SilentlyContinue }
    else { [Environment]::SetEnvironmentVariable($name, $previousValue, 'Process') }
  }
  $previousValues.Clear()
  Pop-Location
}
