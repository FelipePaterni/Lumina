[CmdletBinding()]
param(
  [string]$ApiBaseUrl = "http://localhost:3001",
  [string]$ExecutionStartedAtUtc,
  [switch]$HumanReviewed
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$reportPath = Join-Path $root "docs\testing\TASK-015-testes-manuais-resultado.md"
$sourceReports = @{
  "TASK-013" = Join-Path $root "docs\testing\TASK-013-testes-manuais-resultado.md"
  "TASK-014" = Join-Path $root "docs\testing\TASK-014-testes-manuais-resultado.md"
}
$apiUri = [uri]$ApiBaseUrl
$started = $null
if (-not [string]::IsNullOrWhiteSpace($ExecutionStartedAtUtc)) {
  $started = [DateTimeOffset]::Parse($ExecutionStartedAtUtc).ToUniversalTime()
}
$caseMap = [ordered]@{
  "MT-015-01" = [pscustomobject]@{ title = "Compra digital gratuita"; source = "TASK-013"; pattern = "MT-013-02" }
  "MT-015-02" = [pscustomobject]@{ title = "Compra híbrida paga"; source = "TASK-013"; pattern = "MT-013-03" }
  "MT-015-03" = [pscustomobject]@{ title = "Concorrência de estoque e cupom"; source = "TASK-013"; pattern = "MT-013-(?:03|04)" }
  "MT-015-04" = [pscustomobject]@{ title = "Notificação e replay idempotente"; source = "TASK-014"; pattern = "MT-014-03" }
}

$sourceFresh = @{}
$sourceCleanup = @{}
foreach ($name in $sourceReports.Keys) {
  $sourceFresh[$name] = $false
  $sourceCleanup[$name] = $false
  if ($started -and (Test-Path -LiteralPath $sourceReports[$name])) {
    $sourceFresh[$name] = (Get-Item -LiteralPath $sourceReports[$name]).LastWriteTimeUtc -ge $started.UtcDateTime
    if ($sourceFresh[$name]) {
      $cleanupLine = Select-String -LiteralPath $sourceReports[$name] -Pattern "(?m)^- Limpeza:\s*(CONFIRMADA|NÃO NECESSÁRIA[^\r\n]*)\s*$" | Select-Object -First 1
      $sourceCleanup[$name] = $null -ne $cleanupLine
    }
  }
}

$results = [System.Collections.Generic.List[object]]::new()
foreach ($id in $caseMap.Keys) {
  $case = $caseMap[$id]
  $fresh = $sourceFresh[$case.source]
  $report = $sourceReports[$case.source]
  $sourceStatus = $null
  if ($fresh) {
    $content = Get-Content -LiteralPath $report -Raw
    $matches = [regex]::Matches($content, "(?m)^\|\s*$($case.pattern)\b.*\|\s*(APROVADO|REPROVADO|BLOQUEADO)\s*\|")
    $requiredCount = if ($id -eq "MT-015-03") { 2 } else { 1 }
    if ($matches.Count -ge $requiredCount -and @($matches | Where-Object { $_.Groups[1].Value -ne "APROVADO" }).Count -eq 0) {
      $sourceStatus = "APROVADO"
    } elseif ($matches.Count -ge $requiredCount) {
      $sourceStatus = ($matches | Where-Object { $_.Groups[1].Value -ne "APROVADO" } | Select-Object -First 1).Groups[1].Value
    }
  }

  $status = "NÃO EXECUTADO"
  $evidence = "Aguardando execução recente do roteiro $($case.source) e revisão humana."
  if ($fresh -and $sourceStatus -and $sourceCleanup[$case.source]) {
    if ($sourceStatus -eq "APROVADO" -and $HumanReviewed) {
      $status = "APROVADO"
      $evidence = "Relatório sanitizado recente de $($case.source) aprovado e revisão humana confirmada."
    } elseif ($sourceStatus -eq "REPROVADO") {
      $status = "REPROVADO"
      $evidence = "Relatório sanitizado recente de $($case.source) registra reprovação."
    } elseif ($sourceStatus -eq "BLOQUEADO") {
      $status = "BLOQUEADO"
      $evidence = "Relatório sanitizado recente de $($case.source) registra cenário bloqueado; confira a falha de pré-requisito no relatório fonte."
    } else {
      $status = "BLOQUEADO"
      $evidence = "Relatório fonte recente existe; revisão humana ou aprovação do cenário pendente."
    }
  } elseif ($fresh -and -not $sourceCleanup[$case.source]) {
    $status = "BLOQUEADO"
    $evidence = "Relatório fonte recente não confirma a limpeza dos dados sintéticos."
  }
  $results.Add([pscustomobject]@{ Id = $id; Title = $case.title; Status = $status; Evidence = $evidence })
}

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("# TASK-015 — Resultado dos testes manuais")
$lines.Add("")
$lines.Add("- Execução UTC: $([DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))")
$lines.Add("- Endpoint informado: $($apiUri.Host):$($apiUri.Port)")
$lines.Add("- Revisão humana: $(if ($HumanReviewed) { 'CONFIRMADA' } else { 'PENDENTE' })")
$lines.Add("- Dados: somente dados sintéticos nos roteiros predecessores")
$lines.Add("- Credenciais/tokens: usados apenas em memória pelos roteiros predecessores; não copiados para este relatório")
$lines.Add("")
$lines.Add("| Cenário | Estado | Evidência resumida |")
$lines.Add("|---|---|---|")
foreach ($result in $results) {
  $lines.Add("| $($result.Id) — $($result.Title) | $($result.Status) | $($result.Evidence) |")
}
$lines.Add("")
$lines.Add("Para validar, registre o horário UTC de início, execute os roteiros TASK-013 e TASK-014 no PowerShell do Windows, revise seus relatórios sanitizados e então execute este coletor com `-ExecutionStartedAtUtc` e `-HumanReviewed`. Os roteiros fonte recebem credenciais sintéticas por parâmetros `PSCredential`; não passe senhas em argumentos de texto nem grave tokens.")
Set-Content -LiteralPath $reportPath -Value $lines -Encoding utf8
Write-Output "Relatório sanitizado criado/atualizado: $reportPath"

if ($results.Where({ $_.Status -ne "APROVADO" }).Count -gt 0) { exit 1 }
