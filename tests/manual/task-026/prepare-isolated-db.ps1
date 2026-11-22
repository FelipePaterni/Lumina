[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$envFile = Join-Path $root '.env'
$envExampleFile = Join-Path $root '.env.example'
$reportPath = Join-Path $root 'docs/testing/TASK-026-backup-restore-result.md'
$databaseName = 'lumina_task009_test'
$status = 'BLOQUEADO'
$failureCode = $null
$created = $false
$migrated = $false
$seeded = $false

try {
  $line = if (Test-Path -LiteralPath $envFile -PathType Leaf) {
    Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^TASK009_TEST_DATABASE_URL=' } | Select-Object -First 1
  }
  if (-not $line -and (Test-Path -LiteralPath $envExampleFile -PathType Leaf)) {
    $line = Get-Content -LiteralPath $envExampleFile | Where-Object { $_ -match '^TASK009_TEST_DATABASE_URL=' } | Select-Object -First 1
  }
  if (-not $line) { throw 'TASK009_TEST_DATABASE_URL_MISSING' }
  $base = ($line -split '=', 2)[1].Trim().Trim('"').Trim("'")
  $uri = [System.Uri]::new($base)
  if ($uri.Scheme -notmatch '^postgres(ql)?$' -or -not $uri.IsLoopback) { throw 'DATABASE_HOST_NOT_LOOPBACK' }
  if ($uri.AbsolutePath.Trim('/') -ne $databaseName) { throw 'DATABASE_NAME_NOT_ISOLATED' }
  $isolatedUrl = $uri.AbsoluteUri
  $env:DATABASE_URL = $isolatedUrl
  $env:TASK009_TEST_DATABASE_URL = $isolatedUrl

  $composeFile = Join-Path $root 'docker-compose.yml'
  & docker compose -f $composeFile config --quiet
  if ($LASTEXITCODE -ne 0) { throw 'COMPOSE_CONFIG_FAILED' }
  $exists = & docker compose -f $composeFile exec -T postgres sh -c "psql -U `"`$POSTGRES_USER`" -d postgres -Atc `"SELECT count(*) FROM pg_catalog.pg_database WHERE datname='$databaseName'`""
  if ($LASTEXITCODE -ne 0) { throw 'DATABASE_PREFLIGHT_FAILED' }
  if (($exists | Out-String).Trim() -eq '0') {
    & docker compose -f $composeFile exec -T postgres sh -c "createdb -U `"`$POSTGRES_USER`" $databaseName"
    if ($LASTEXITCODE -ne 0) { throw 'DATABASE_CREATE_FAILED' }
    $created = $true
  }

  Push-Location $root
  try {
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) { throw 'MIGRATION_FAILED' }
    $migrated = $true
    npm run db:seed:catalog
    if ($LASTEXITCODE -ne 0) { throw 'SYNTHETIC_SEED_FAILED' }
    $seeded = $true
  } finally { Pop-Location }
  $status = 'APROVADO'
} catch {
  $failureCode = $_.Exception.Message -replace '[^A-Z0-9_\-]', '_'
} finally {
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:TASK009_TEST_DATABASE_URL -ErrorAction SilentlyContinue
  $timestamp = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
  $failed = if ($failureCode) { "Falha: $failureCode." } else { 'Falhas: nenhuma.' }
  Add-Content -LiteralPath $reportPath -Encoding utf8 -Value @(
    "## Preparação do banco isolado — $timestamp",
    '',
    '| Cenário | Status | Evidência resumida |',
    '|---|---|---|',
    "| Preparação de ``$databaseName`` com migrações e seed sintético | $status | Banco criado nesta execução: $created; migrações aplicadas: $migrated; catálogo sintético aplicado: $seeded. $failed Nenhum segredo ou URL registrado. |",
    ''
  )
}

Write-Output "Status: $status"
if ($status -ne 'APROVADO') { exit 1 }
