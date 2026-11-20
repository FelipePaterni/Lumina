[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$tasksPath = Join-Path $root "TASKS.md"
$reportPath = Join-Path $root "docs\testing\TASK-016-testes-manuais-resultado.md"
$predecessors = @("TASK-012", "TASK-013", "TASK-014", "TASK-015")
$problems = [System.Collections.Generic.List[string]]::new()
$tasks = Get-Content -LiteralPath $tasksPath -Raw

foreach ($id in $predecessors) {
  $number = [int]$id.Substring(5)
  $rowPattern = "(?m)^\|\s*$number\s*\|\s*$id\s*\|[^\r\n]*\|\s*DONE\s*\|"
  if (-not [regex]::IsMatch($tasks, $rowPattern)) {
    $problems.Add("$id não está DONE na tabela-resumo de TASKS.md.")
  }

  $plan = Join-Path $root "docs\testing\$id-planejamento-e-gates.md"
  $manual = Join-Path $root "docs\testing\$id-testes-manuais-resultado.md"
  foreach ($path in @($plan, $manual)) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
      $problems.Add("Artefato obrigatório ausente: $(Split-Path -Leaf $path).")
    }
  }

  if (Test-Path -LiteralPath $plan -PathType Leaf) {
    $planText = Get-Content -LiteralPath $plan -Raw
    $approvedGates = [regex]::Matches($planText, "(?m)^\|\s*GATE-[^|]+\|\s*APROVADO\s*\|").Count
    $expectedGates = if ($id -eq "TASK-015") { 5 } else { 7 }
    if ($approvedGates -lt $expectedGates) {
      $problems.Add("$id registra $approvedGates/$expectedGates gates aprovados no plano.")
    }
  }
}

$automatedStatus = if ($problems.Count -eq 0) { "APROVADO" } else { "BLOQUEADO" }
$problemLines = if ($problems.Count -eq 0) { "- Nenhuma." } else { ($problems | ForEach-Object { "- $_" }) -join "`n" }
$generatedAt = [DateTimeOffset]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
$report = @"
# TASK-016 — Resultado da revisão manual do checkpoint

- Coleta automatizada UTC: $generatedAt
- Verificação documental automatizada: $automatedStatus
- Revisão humana: PENDENTE
- Credenciais/tokens/PII: não solicitados nem coletados

## Verificação automatizada de artefatos

$(if ($problems.Count -eq 0) { "- Dependências TASK-012 a TASK-015 em DONE; planos com gates aprovados e relatórios manuais encontrados." } else { $problemLines })

## Cenário manual

| Cenário | Estado | Evidência resumida | Falhas |
|---|---|---|---|
| MT-016-01 — Revisão humana da cadeia e autorização do checkpoint | NÃO EXECUTADO | Aguardando conferência dos quatro pares de relatórios predecessores e revisão final de escopo. | Pendente |

## Registro do responsável humano

- Execução/revisão UTC: NÃO REGISTRADA
- Resultado: NÃO EXECUTADO
- Evidência documental resumida: PREENCHER APÓS REVISÃO
- Falhas: PREENCHER APÓS REVISÃO
- Autorização para tornar TASK-017 elegível: NÃO CONCEDIDA

O resultado automatizado verifica apenas estado e existência dos arquivos locais. Não aprova a revisão humana nem altera TASKS.md.
"@

$reportDirectory = Split-Path -Parent $reportPath
New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null
Set-Content -LiteralPath $reportPath -Value $report -Encoding utf8
Write-Output "Relatório sanitizado criado/atualizado: $reportPath"
Write-Output "Verificação documental automatizada: $automatedStatus; MT-016-01 permanece NÃO EXECUTADO até revisão humana."
if ($problems.Count -gt 0) {
  exit 1
}
