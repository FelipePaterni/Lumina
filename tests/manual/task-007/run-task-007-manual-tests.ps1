param(
  [string]$ApiBase = "http://localhost:3001",
  [string]$WebBase = "http://localhost:3000",
  [switch]$CheckOnly,
  [string]$ReportPath = "docs/testing/TASK-007-testes-manuais-resultado.md"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("o")
$results = @()
function Add-Result([string]$id, [string]$scenario, [string]$status, [string]$evidence) {
  $script:results += [pscustomobject]@{ Id = $id; Scenario = $scenario; Status = $status; Evidence = $evidence }
}
function Get-HttpStatus([string]$url) {
  try { return [int](Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5).StatusCode }
  catch { if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }; return 0 }
}

$apiStatus = Get-HttpStatus "$ApiBase/works"
$webStatus = Get-HttpStatus $WebBase
if ($apiStatus -eq 200) { Add-Result "MT-007-01" "Catálogo público disponível" "NAO EXECUTADO" "Pré-condição detectada: API respondeu 200; revisão humana ainda necessária." }
else { Add-Result "MT-007-01" "Catálogo público disponível" "BLOQUEADO" "API não disponível ou respondeu HTTP $apiStatus." }
if ($webStatus -eq 200) { Add-Result "MT-007-02" "Página de catálogo responsiva" "NAO EXECUTADO" "Pré-condição detectada: Web respondeu 200; validar visualmente em desktop/mobile." }
else { Add-Result "MT-007-02" "Página de catálogo responsiva" "BLOQUEADO" "Web não disponível ou respondeu HTTP $webStatus." }
if ($CheckOnly) {
  $dir = Split-Path -Parent $ReportPath; New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $lines = @("# Resultado dos testes manuais - TASK-007", "", "Executado em UTC: $timestamp", "", "Modo: verificação de pré-condições; nenhum cenário foi aprovado automaticamente.", "", "| ID | Cenário | Status | Evidência sanitizada |", "|---|---|---|---|")
  foreach ($result in $results) { $lines += "| $($result.Id) | $($result.Scenario) | $($result.Status) | $($result.Evidence) |" }
  Set-Content -Path $ReportPath -Value $lines -Encoding utf8
  exit 0
}
Write-Output "Roteiro criado. Execute com -CheckOnly para registrar somente pré-condições; a aprovação exige revisão humana."
