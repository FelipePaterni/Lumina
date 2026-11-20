[CmdletBinding()]
param(
  [string]$ReportPath = "docs/testing/TASK-011-testes-manuais-resultado.md"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$resolvedReportPath = if ([System.IO.Path]::IsPathRooted($ReportPath)) { $ReportPath } else { Join-Path $repoRoot $ReportPath }
if (Test-Path -LiteralPath $resolvedReportPath) {
  Write-Output "Relatório já existe; preservando resultados manuais: $resolvedReportPath"
  exit 0
}
$reportDirectory = Split-Path -Parent $resolvedReportPath
if (-not (Test-Path -LiteralPath $reportDirectory)) {
  New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null
}
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$scenarios = @(
  @{ Id = "MT-011-01"; Name = "Catálogo sem autenticação" },
  @{ Id = "MT-011-02"; Name = "Operação de catálogo por papel não autorizado" },
  @{ Id = "MT-011-03"; Name = "Busca, filtros e paginação" },
  @{ Id = "MT-011-04"; Name = "Inventário por papel" },
  @{ Id = "MT-011-05"; Name = "Original digital privado" },
  @{ Id = "MT-011-06"; Name = "Wishlist isolada" },
  @{ Id = "MT-011-07"; Name = "Índices e plano de consulta" }
)

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("# TASK-011 — Resultado dos testes manuais")
$lines.Add("")
$lines.Add("Data de geração: $timestamp")
$lines.Add("Execução: NÃO EXECUTADA pelo script; cenários aguardam o responsável humano.")
$lines.Add("")
$lines.Add("| ID | Cenário | Status | Evidência sanitizada | Falhas |")
$lines.Add("|---|---|---|---|---|")
foreach ($scenario in $scenarios) {
  $lines.Add("| $($scenario.Id) | $($scenario.Name) | NÃO EXECUTADO | PREENCHER PELO RESPONSÁVEL | PREENCHER PELO RESPONSÁVEL |")
}
$lines.Add("")
$lines.Add("Aprovação humana: PENDENTE. Não inclua senhas, tokens, PII, conteúdo original ou valores de storageKey.")
Set-Content -LiteralPath $resolvedReportPath -Value $lines -Encoding utf8
Write-Output "Relatório inicial sanitizado criado; nenhum cenário foi executado: $resolvedReportPath"
