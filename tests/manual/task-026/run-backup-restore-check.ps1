[CmdletBinding()]
param(
  [ValidatePattern('^lumina_task026_restore_[a-f0-9]{8}$')]
  [string]$RestoreDatabaseName = "lumina_task026_restore_$(([Guid]::NewGuid().ToString('N').Substring(0, 8)).ToLowerInvariant())"
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$composeFile = Join-Path $repositoryRoot 'docker-compose.yml'
$reportPath = Join-Path $repositoryRoot 'docs/testing/TASK-026-backup-restore-result.md'
$sourceDatabase = 'lumina_task009_test'
$dumpPath = "/tmp/task026-$([Guid]::NewGuid().ToString('N')).dump"
$status = 'BLOQUEADO'
$stage = 'PREFLIGHT'
$failureCode = $null
$sourceTableCount = $null
$restoredTableCount = $null
$dumpCreated = $false
$cleanupFailed = $false
$preflightComplete = $false

function Invoke-DockerCompose {
  param([string[]]$Arguments)

  $output = & docker compose -f $composeFile @Arguments 2>$null
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "DOCKER_COMPOSE_EXIT_$exitCode"
  }
  return (($output | ForEach-Object { "$($_)" }) -join "`n").Trim()
}

function Invoke-PostgresShell {
  param([string]$Command)

  return Invoke-DockerCompose -Arguments @('exec', '-T', 'postgres', 'sh', '-c', $Command)
}

function Get-DatabaseTableCount {
  param([string]$DatabaseName)

  $query = "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'"
  $command = 'set -eu; psql -U "$POSTGRES_USER" -d "' + $DatabaseName + '" -Atc "' + $query + '"'
  $result = Invoke-PostgresShell -Command $command
  return [int]$result
}

try {
  if (-not (Test-Path -LiteralPath $composeFile -PathType Leaf)) {
    throw 'COMPOSE_FILE_MISSING'
  }

  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'DOCKER_CLI_UNAVAILABLE'
  }

  Invoke-DockerCompose -Arguments @('config', '--quiet') | Out-Null
  $ready = Invoke-PostgresShell -Command 'pg_isready -U "$POSTGRES_USER" -d postgres'
  if ($ready -notmatch 'accepting connections') {
    throw 'POSTGRES_NOT_READY'
  }

  $sourceExistsSql = "SELECT count(*) FROM pg_catalog.pg_database WHERE datname='$sourceDatabase'"
  $sourceExistsCommand = 'set -eu; psql -U "$POSTGRES_USER" -d postgres -Atc "' + $sourceExistsSql + '"'
  if ((Invoke-PostgresShell -Command $sourceExistsCommand) -ne '1') {
    throw 'ISOLATED_SOURCE_DATABASE_MISSING'
  }

  $targetExistsSql = "SELECT count(*) FROM pg_catalog.pg_database WHERE datname='$RestoreDatabaseName'"
  $targetExistsCommand = 'set -eu; psql -U "$POSTGRES_USER" -d postgres -Atc "' + $targetExistsSql + '"'
  if ((Invoke-PostgresShell -Command $targetExistsCommand) -ne '0') {
    throw 'RESTORE_DATABASE_ALREADY_EXISTS'
  }
  $preflightComplete = $true

  $stage = 'BACKUP'
  $backupCommand = 'set -eu; test ! -e "' + $dumpPath + '"; pg_dump -Fc -U "$POSTGRES_USER" -d "' + $sourceDatabase + '" -f "' + $dumpPath + '"; test -s "' + $dumpPath + '"; pg_restore --list "' + $dumpPath + '" >/dev/null'
  Invoke-PostgresShell -Command $backupCommand | Out-Null
  $dumpCreated = $true

  $stage = 'CREATE_RESTORE_DATABASE'
  $createCommand = 'set -eu; createdb -U "$POSTGRES_USER" "' + $RestoreDatabaseName + '"'
  Invoke-PostgresShell -Command $createCommand | Out-Null

  $stage = 'RESTORE'
  $restoreCommand = 'set -eu; pg_restore --no-owner --no-privileges -U "$POSTGRES_USER" -d "' + $RestoreDatabaseName + '" "' + $dumpPath + '"'
  Invoke-PostgresShell -Command $restoreCommand | Out-Null

  $stage = 'VERIFY'
  $sourceTableCount = Get-DatabaseTableCount -DatabaseName $sourceDatabase
  $restoredTableCount = Get-DatabaseTableCount -DatabaseName $RestoreDatabaseName
  if ($sourceTableCount -lt 1 -or $sourceTableCount -ne $restoredTableCount) {
    throw 'RESTORE_TABLE_COUNT_MISMATCH'
  }

  $status = 'APROVADO'
} catch {
  $failureCode = $_.Exception.Message -replace '[^A-Z0-9_\-]', '_'
  if (-not $preflightComplete) {
    $status = 'BLOQUEADO'
  } else {
    $status = 'REPROVADO'
  }
} finally {
  if ($dumpCreated) {
    try {
      $cleanupCommand = 'rm -f "' + $dumpPath + '"'
      Invoke-PostgresShell -Command $cleanupCommand | Out-Null
    } catch {
      $cleanupFailed = $true
    }
  }

  if ($cleanupFailed) {
    $status = 'REPROVADO'
    $failureCode = 'TEMPORARY_BACKUP_CLEANUP_FAILED'
  }

  $timestamp = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
  $tableEvidence = if ($null -ne $sourceTableCount -and $null -ne $restoredTableCount) {
    "Tabelas públicas: origem=$sourceTableCount; restauração=$restoredTableCount."
  } else {
    'Contagem de tabelas não concluída.'
  }
  $failureEvidence = if ($failureCode) { "Falha: $failureCode." } else { 'Falhas: nenhuma.' }
  $section = @(
    "## Ensaio de backup/restore — $timestamp",
    '',
    '| Cenário | Status | Evidência resumida |',
    '|---|---|---|',
    "| Dump e restauração do banco sintético isolado | $status | Origem ``$sourceDatabase``; destino ``$RestoreDatabaseName``; $tableEvidence $failureEvidence Dump temporário removido; banco restaurado mantido para inspeção. |",
    ''
  ) -join "`n"

  Add-Content -LiteralPath $reportPath -Value $section -Encoding utf8
}

Write-Output "Status: $status"
Write-Output "Banco de restauração: $RestoreDatabaseName"
if ($status -ne 'APROVADO') {
  exit 1
}
