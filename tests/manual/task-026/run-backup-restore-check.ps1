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
$envFile = Join-Path $repositoryRoot '.env'
$envExampleFile = Join-Path $repositoryRoot '.env.example'
$postgresUser = 'lumina'
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

function Invoke-PostgresCommand {
  param([string[]]$Arguments)

  return Invoke-DockerCompose -Arguments (@('exec', '-T', 'postgres') + $Arguments)
}

function Get-DatabaseTableCount {
  param([string]$DatabaseName)

  $schemaExpression = 'chr(' + ([int][char]'p') + ')||chr(' + ([int][char]'u') + ')||chr(' + ([int][char]'b') + ')||chr(' + ([int][char]'l') + ')||chr(' + ([int][char]'i') + ')||chr(' + ([int][char]'c') + ')'
  $typeExpression = 'chr(' + ([int][char]'B') + ')||chr(' + ([int][char]'A') + ')||chr(' + ([int][char]'S') + ')||chr(' + ([int][char]'E') + ')||chr(' + ([int][char]' ' ) + ')||chr(' + ([int][char]'T') + ')||chr(' + ([int][char]'A') + ')||chr(' + ([int][char]'B') + ')||chr(' + ([int][char]'L') + ')||chr(' + ([int][char]'E') + ')'
  $query = "SELECT count(*) FROM information_schema.tables WHERE table_schema=$schemaExpression AND table_type=$typeExpression"
  $result = Invoke-PostgresCommand -Arguments @('psql', '-U', $postgresUser, '-d', $DatabaseName, '-Atc', $query)
  return [int]$result
}

try {
  if (-not (Test-Path -LiteralPath $composeFile -PathType Leaf)) {
    throw 'COMPOSE_FILE_MISSING'
  }

  if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'DOCKER_CLI_UNAVAILABLE'
  }

  $userLine = if (Test-Path -LiteralPath $envFile -PathType Leaf) {
    Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^POSTGRES_USER=' } | Select-Object -First 1
  }
  if (-not $userLine -and (Test-Path -LiteralPath $envExampleFile -PathType Leaf)) {
    $userLine = Get-Content -LiteralPath $envExampleFile | Where-Object { $_ -match '^POSTGRES_USER=' } | Select-Object -First 1
  }
  if ($userLine) { $postgresUser = ($userLine -split '=', 2)[1].Trim().Trim('"').Trim("'") }
  if ($postgresUser -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') { throw 'POSTGRES_USER_INVALID' }

  Invoke-DockerCompose -Arguments @('config', '--quiet') | Out-Null
  $ready = Invoke-PostgresCommand -Arguments @('pg_isready', '-U', $postgresUser, '-d', 'postgres')
  if ($ready -notmatch 'accepting connections') {
    throw 'POSTGRES_NOT_READY'
  }

  $sourceNameExpression = ($sourceDatabase.ToCharArray() | ForEach-Object { 'chr(' + ([int][char]$_) + ')' }) -join '||'
  $sourceExistsSql = "SELECT count(*) FROM pg_catalog.pg_database WHERE datname=$sourceNameExpression"
  $sourceExistsCount = Invoke-PostgresCommand -Arguments @('psql', '-U', $postgresUser, '-d', 'postgres', '-Atc', $sourceExistsSql)
  if ($sourceExistsCount -ne '1') {
    throw "ISOLATED_SOURCE_DATABASE_PREFLIGHT_$sourceExistsCount"
  }

  $targetNameExpression = ($RestoreDatabaseName.ToCharArray() | ForEach-Object { 'chr(' + ([int][char]$_) + ')' }) -join '||'
  $targetExistsSql = "SELECT count(*) FROM pg_catalog.pg_database WHERE datname=$targetNameExpression"
  $targetExistsCount = Invoke-PostgresCommand -Arguments @('psql', '-U', $postgresUser, '-d', 'postgres', '-Atc', $targetExistsSql)
  if ($targetExistsCount -ne '0') {
    throw 'RESTORE_DATABASE_ALREADY_EXISTS'
  }
  $preflightComplete = $true

  $stage = 'BACKUP'
  Invoke-PostgresCommand -Arguments @('pg_dump', '-Fc', '-U', $postgresUser, '-d', $sourceDatabase, '-f', $dumpPath) | Out-Null
  $dumpCheck = Invoke-PostgresCommand -Arguments @('pg_restore', '--list', $dumpPath)
  if (-not $dumpCheck) { throw 'BACKUP_DUMP_EMPTY' }
  $dumpCreated = $true

  $stage = 'CREATE_RESTORE_DATABASE'
  Invoke-PostgresCommand -Arguments @('createdb', '-U', $postgresUser, $RestoreDatabaseName) | Out-Null

  $stage = 'RESTORE'
  Invoke-PostgresCommand -Arguments @('pg_restore', '--no-owner', '--no-privileges', '-U', $postgresUser, '-d', $RestoreDatabaseName, $dumpPath) | Out-Null

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
      Invoke-PostgresCommand -Arguments @('rm', '-f', $dumpPath) | Out-Null
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
