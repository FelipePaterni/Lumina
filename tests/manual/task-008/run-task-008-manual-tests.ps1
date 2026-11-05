param(
  [string]$ApiBase = "http://localhost:3001",
  [string]$WebBase = "http://localhost:3000",
  [string]$ReportPath = "docs/testing/TASK-008-testes-manuais-resultado.md"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToUniversalTime().ToString("o")
function Get-Status([string]$url) {
  try { return [int](Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5).StatusCode }
  catch { if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }; return 0 }
}
$apiStatus = Get-Status "$ApiBase/works?search=termo-sintetico&page=1&limit=1"
$webStatus = Get-Status $WebBase
$dir = Split-Path -Parent $ReportPath
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$lines = @(
  "# Resultado dos testes manuais - TASK-008", "", "Executado em UTC: $timestamp", "", "Modo: verificação de pré-condições; nenhum cenário foi aprovado automaticamente.", "", "| ID | Cenário | Status | Evidência sanitizada |", "|---|---|---|---|",
  "| MT-008-01 a MT-008-08 | Roteiro de busca, filtros e paginação | NAO EXECUTADO | API HTTP $apiStatus; Web HTTP $webStatus; execução manual ainda necessária. |"
)
Set-Content -Path $ReportPath -Value $lines -Encoding utf8
Write-Output "Pré-condições registradas em $ReportPath. Execute o roteiro manual antes de aprovar qualquer cenário."
