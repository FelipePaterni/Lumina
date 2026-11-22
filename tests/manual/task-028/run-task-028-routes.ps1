param(
  [string]$WebBaseUrl = "http://localhost:3000",
  [string]$ReportPath = "docs/testing/TASK-028-testes-manuais-resultado.md"
)

$ErrorActionPreference = "Stop"
$baseUrl = $WebBaseUrl.TrimEnd("/")
$routes = @("/dashboard", "/catalog/dashboard", "/warehouse/dashboard", "/operations/dashboard")
$results = @()

foreach ($route in $routes) {
  $routeAvailable = $false
  try {
    $response = Invoke-WebRequest -Uri "$baseUrl$route" -Method Get -UseBasicParsing -TimeoutSec 10
    $status = if ($response.StatusCode -eq 200) { "APROVADO" } else { "REPROVADO" }
    $evidence = "HTTP $($response.StatusCode)"
    $failure = if ($response.StatusCode -eq 200) { "Nenhuma" } else { "Rota não retornou HTTP 200" }
    $routeAvailable = $response.StatusCode -eq 200
  } catch {
    $responseStatus = $_.Exception.Response.StatusCode.value__
    if ($responseStatus) {
      $status = "REPROVADO"
      $evidence = "HTTP $responseStatus"
      $failure = "Rota não retornou HTTP 200"
    } else {
      $status = "BLOQUEADO"
      $evidence = "Servidor web indisponível ou inacessível"
      $failure = "Não foi possível verificar a rota por HTTP"
    }
  }

  $results += [pscustomobject]@{
    Scenario = "Abertura direta de $route"
    Status = $status
    Evidence = $evidence
    Failure = $failure
  }

  if ($routeAvailable) {
    $assetPaths = [regex]::Matches($response.Content, '(?:src|href)="(?<asset>/_next/static/[^"]+)"') |
      ForEach-Object { $_.Groups["asset"].Value } |
      Sort-Object -Unique
    $failedAssets = 0
    foreach ($assetPath in $assetPaths) {
      try {
        $assetResponse = Invoke-WebRequest -Uri "$baseUrl$assetPath" -Method Get -UseBasicParsing -TimeoutSec 10
        if ($assetResponse.StatusCode -ne 200) { $failedAssets++ }
      } catch {
        $failedAssets++
      }
    }
    $assetStatus = if ($assetPaths.Count -gt 0 -and $failedAssets -eq 0) { "APROVADO" } else { "REPROVADO" }
    $assetEvidence = "$($assetPaths.Count) assets; $failedAssets falhas"
    $assetFailure = if ($assetStatus -eq "APROVADO") { "Nenhuma" } elseif ($assetPaths.Count -eq 0) { "HTML não referenciou assets estáticos" } else { "Um ou mais assets não retornaram HTTP 200" }
    $results += [pscustomobject]@{
      Scenario = "Assets estáticos de $route"
      Status = $assetStatus
      Evidence = $assetEvidence
      Failure = $assetFailure
    }
  }
}

$date = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
$reportDirectory = Split-Path -Parent $ReportPath
if ($reportDirectory) {
  New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null
}

$lines = @(
  "# TASK-028 — Verificação HTTP das rotas web",
  "",
  "Data: $date",
  "Base web: $baseUrl",
  "",
  "| Cenário | Status | Evidência resumida | Falha |",
  "|---|---|---|---|"
)
foreach ($result in $results) {
  $lines += "| $($result.Scenario) | $($result.Status) | $($result.Evidence) | $($result.Failure) |"
}
$lines += ""
$lines += "A validação HTTP não substitui a revisão visual humana de login, navegação por papel e chamadas à API. Nenhuma credencial é solicitada ou registrada por este script."
Set-Content -LiteralPath $ReportPath -Value $lines -Encoding utf8

$results | Format-Table -AutoSize
"Relatório sanitizado: $ReportPath"

if ($results.Status -contains "REPROVADO") { exit 1 }
if ($results.Status -contains "BLOQUEADO") { exit 2 }
