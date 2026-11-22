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
$summary = 'Resumo da suíte não disponível.'

try {
  $line = if (Test-Path -LiteralPath $envFile -PathType Leaf) {
    Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^TASK009_TEST_DATABASE_URL=' } | Select-Object -First 1
  }
  if (-not $line -and (Test-Path -LiteralPath $envExampleFile -PathType Leaf)) {
    $line = Get-Content -LiteralPath $envExampleFile | Where-Object { $_ -match '^TASK009_TEST_DATABASE_URL=' } | Select-Object -First 1
  }
  if (-not $line) { throw 'TASK009_TEST_DATABASE_URL_MISSING' }
  $url = ($line -split '=', 2)[1].Trim().Trim('"').Trim("'")
  $uri = [System.Uri]::new($url)
  if (-not $uri.IsLoopback) { throw 'DATABASE_HOST_NOT_LOOPBACK' }
  if ($uri.AbsolutePath.Trim('/') -ne $databaseName) { throw 'DATABASE_NAME_NOT_ISOLATED' }
  $env:TASK009_TEST_DATABASE_URL = $uri.AbsoluteUri
  $env:DATABASE_URL = $uri.AbsoluteUri

  Push-Location $root
  try {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $output = @(& npm run test:integration 2>&1 | ForEach-Object { "$_" })
    $exitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
  } finally { Pop-Location }
  $testsMatch = $output | Select-String -Pattern '^(?:#|ℹ) tests (\d+)$' | Select-Object -Last 1
  $passedMatch = $output | Select-String -Pattern '^(?:#|ℹ) pass (\d+)$' | Select-Object -Last 1
  $failedMatch = $output | Select-String -Pattern '^(?:#|ℹ) fail (\d+)$' | Select-Object -Last 1
  if ($testsMatch -and $passedMatch -and $failedMatch) {
    $tests = $testsMatch.Matches.Groups[1].Value
    $passed = $passedMatch.Matches.Groups[1].Value
    $failed = $failedMatch.Matches.Groups[1].Value
    $summary = "Testes: $tests; aprovados: $passed; falhas: $failed."
  } else {
    $summary = 'Runner finalizado sem resumo estruturado dos testes.'
  }
  if ($exitCode -ne 0) { throw 'INTEGRATION_SUITE_FAILED' }
  $status = 'APROVADO'
} catch {
  $failureCode = $_.Exception.Message -replace '[^A-Z0-9_\-]', '_'
} finally {
  Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  Remove-Item Env:TASK009_TEST_DATABASE_URL -ErrorAction SilentlyContinue
  $timestamp = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
  $failureEvidence = if ($failureCode) { "Falha: $failureCode." } else { 'Falhas: nenhuma.' }
  Add-Content -LiteralPath $reportPath -Encoding utf8 -Value @(
    "## Integração no banco isolado — $timestamp",
    '',
    '| Cenário | Status | Evidência resumida |',
    '|---|---|---|',
    "| Suíte de integração em ``$databaseName`` | $status | $summary $failureEvidence Nenhuma URL ou credencial registrada. |",
    ''
  )
}

Write-Output "Status: $status"
Write-Output $summary
if ($status -ne 'APROVADO') { exit 1 }
