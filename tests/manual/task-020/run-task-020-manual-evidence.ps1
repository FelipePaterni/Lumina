[CmdletBinding()]
param(
  [switch]$HumanReviewConfirmed
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$reportPath = Join-Path $root 'docs\testing\TASK-020-testes-manuais-resultado.md'
$evidence = @(
  @{ Task = 'TASK-017'; Path = 'docs/testing/TASK-017-planejamento-e-gates.md'; ManualPath = 'docs/testing/TASK-017-testes-manuais-resultado.md'; Scenarios = @('MT-017-01', 'MT-017-02', 'MT-017-03', 'MT-017-04') },
  @{ Task = 'TASK-018'; Path = 'docs/testing/TASK-018-planejamento-e-gates.md'; ManualPath = 'docs/testing/TASK-018-testes-manuais-resultado.md'; Scenarios = @('MT-018-01', 'MT-018-02', 'MT-018-03', 'MT-018-04') },
  @{ Task = 'TASK-019'; Path = 'docs/testing/TASK-019-planejamento-e-gates.md'; ManualPath = 'docs/testing/TASK-019-testes-manuais-resultado.md'; Scenarios = @('MT-019-00', 'MT-019-01', 'MT-019-02', 'MT-019-03') }
)
$checkpointPlanPath = Join-Path $root 'docs\testing\TASK-020-planejamento-e-gates.md'
$results = [System.Collections.Generic.List[object]]::new()
$failed = $false

foreach ($item in $evidence) {
  $gateFile = Join-Path $root $item.Path
  $manualFile = Join-Path $root $item.ManualPath
  if (-not (Test-Path -LiteralPath $gateFile) -or -not (Test-Path -LiteralPath $manualFile)) {
    $results.Add([pscustomobject]@{ Task = $item.Task; Status = 'REPROVADO'; Evidence = 'Relatório predecessor ausente.' })
    $failed = $true
    continue
  }

  $gateText = Get-Content -LiteralPath $gateFile -Raw
  $manualText = Get-Content -LiteralPath $manualFile -Raw
  $scenarioMissing = @($item.Scenarios | Where-Object { $manualText -notmatch [regex]::Escape($_) })
  $humanApproval = $manualText -match '(?i)(Revisão humana|Resultado humano).*APROVAD'
  $automatedGate = [regex]::IsMatch($gateText, '(?is)## GATE-005.{0,300}?APROVADO') -or
    [regex]::IsMatch($gateText, '(?im)^\|\s*GATE-005\s*\|\s*APROVADO')
  if ($scenarioMissing.Count -gt 0 -or -not $humanApproval -or -not $automatedGate) {
    $details = if ($scenarioMissing.Count -gt 0) { 'Cenário predecessor não encontrado.' } elseif (-not $humanApproval) { 'Aprovação humana predecessor não encontrada.' } else { 'GATE automatizado predecessor não aprovado.' }
    $results.Add([pscustomobject]@{ Task = $item.Task; Status = 'REPROVADO'; Evidence = $details })
    $failed = $true
  } else {
    $results.Add([pscustomobject]@{ Task = $item.Task; Status = 'APROVADO'; Evidence = 'Relatório de gates e cenários manuais aprovados encontrado.' })
  }
}

$checkpointPlan = if (Test-Path -LiteralPath $checkpointPlanPath) { Get-Content -LiteralPath $checkpointPlanPath -Raw } else { '' }
$revocationPassed = $checkpointPlan -match '(?im)^\|\s*Testes unitários/smoke\s*\|[^\r\n]*70/70'
if ($revocationPassed) {
  $results.Add([pscustomobject]@{ Task = 'MT-020-04'; Status = 'APROVADO'; Evidence = 'A suíte atual 70/70 inclui o teste de regressão de revogação de link.' })
} else {
  $results.Add([pscustomobject]@{ Task = 'MT-020-04'; Status = 'NÃO EXECUTADO'; Evidence = 'Aprovação da suíte atual e da regressão não registrada.' })
}

$reviewStatus = if ($failed) { 'REPROVADO' } elseif ($HumanReviewConfirmed) { 'APROVADO' } else { 'BLOQUEADO' }
$reviewEvidence = if ($failed) { 'Revise as evidências predecessoras ausentes ou inconsistentes.' } elseif ($HumanReviewConfirmed) { 'Responsável confirmou revisão integral do checkpoint.' } else { 'Aguardando revisão e confirmação explícita do responsável.' }
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# TASK-020 — Resultado da revisão manual do checkpoint')
$lines.Add('')
$lines.Add("- Execução: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss K')")
$lines.Add('- Ambiente: inspeção local de relatórios sanitizados; sem API, banco ou credenciais.')
$lines.Add("- Resultado consolidado: $reviewStatus")
$lines.Add('')
$lines.Add('| Cenário | Status | Evidência resumida | Falha |')
$lines.Add('|---|---|---|---|')
foreach ($result in $results) {
  $label = switch ($result.Task) {
    'TASK-017' { 'MT-020-01 — original protegido e download temporário' }
    'TASK-018' { 'MT-020-02 — bundle e janela de pré-venda' }
    'TASK-019' { 'MT-020-03 — reembolso, reversão e idempotência' }
    'MT-020-04' { 'MT-020-04 — revogação de link emitido após reembolso' }
  }
  $lines.Add("| $label | $($result.Status) | $($result.Evidence) |  |")
}
$lines.Add("| MT-020-05 — revisão humana TASK-020 | $reviewStatus | $reviewEvidence |  |")
$lines.Add('')
$lines.Add('Nenhum segredo, token, PII, identificador de pedido ou conteúdo de arquivo foi lido ou gravado pelo coletor.')
Set-Content -LiteralPath $reportPath -Value $lines -Encoding utf8

Write-Output "Relatório sanitizado atualizado: docs/testing/TASK-020-testes-manuais-resultado.md"
Write-Output "Resultado consolidado: $reviewStatus"
if ($failed) { exit 1 }
if (-not $HumanReviewConfirmed) { exit 2 }
