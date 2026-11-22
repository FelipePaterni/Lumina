param(
  [string]$WebBaseUrl = "http://localhost:3000",
  [string]$ApiBaseUrl = "http://localhost:3001"
)

$ErrorActionPreference = "Stop"
$routes = @("/", "/dashboard", "/catalog/dashboard", "/warehouse/dashboard", "/operations/dashboard")
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(25)
$results = [System.Collections.Generic.List[object]]::new()

foreach ($route in $routes) {
  $timer = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $response = $client.GetAsync(($WebBaseUrl.TrimEnd("/") + $route)).GetAwaiter().GetResult()
    $timer.Stop()
    $status = if ($response.IsSuccessStatusCode) { "APROVADO" } else { "REPROVADO" }
    $results.Add([pscustomobject]@{
      scenario = "web-route$route"
      status = $status
      evidence = "HTTP $([int]$response.StatusCode); resposta em $($timer.ElapsedMilliseconds) ms; corpo omitido"
      failure = if ($response.IsSuccessStatusCode) { $null } else { "HTTP_STATUS_$([int]$response.StatusCode)" }
    })
  } catch {
    $timer.Stop()
    $results.Add([pscustomobject]@{
      scenario = "web-route$route"
      status = "BLOQUEADO"
      evidence = "sem resposta HTTP; corpo e exceção omitidos"
      failure = "WEB_ENDPOINT_UNAVAILABLE"
    })
  }
}

$timer = [System.Diagnostics.Stopwatch]::StartNew()
try {
  $response = $client.GetAsync(($ApiBaseUrl.TrimEnd("/") + "/works?limit=1&page=1")).GetAwaiter().GetResult()
  $timer.Stop()
  $status = if ($response.IsSuccessStatusCode) { "APROVADO" } else { "REPROVADO" }
  $results.Add([pscustomobject]@{
    scenario = "api-catalog-readiness"
    status = $status
    evidence = "HTTP $([int]$response.StatusCode); resposta em $($timer.ElapsedMilliseconds) ms; corpo omitido"
    failure = if ($response.IsSuccessStatusCode) { $null } else { "HTTP_STATUS_$([int]$response.StatusCode)" }
  })
} catch {
  $timer.Stop()
  $results.Add([pscustomobject]@{
    scenario = "api-catalog-readiness"
    status = "BLOQUEADO"
    evidence = "sem resposta HTTP; corpo e exceção omitidos"
    failure = "API_ENDPOINT_UNAVAILABLE"
  })
}

$outDir = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../../../docs/testing"))
if (-not (Test-Path -LiteralPath $outDir -PathType Container)) {
  throw "Diretório de relatórios não encontrado."
}
$reportPath = Join-Path $outDir "TASK-025-testes-manuais-resultado.json"
$manualBrowserReview = "NAO EXECUTADO"
$performanceMeasurements = "NAO EXECUTADO"
$manualScenarios = @()
$automationChecks = @()
if (Test-Path -LiteralPath $reportPath -PathType Leaf) {
  try {
    $previous = Get-Content -Raw -LiteralPath $reportPath | ConvertFrom-Json
    if ($previous.manualBrowserReview -and $previous.manualBrowserReview -ne "NAO EXECUTADO") {
      $manualBrowserReview = $previous.manualBrowserReview
    }
    if ($previous.performanceMeasurements -and $previous.performanceMeasurements -ne "NAO EXECUTADO") {
      $performanceMeasurements = $previous.performanceMeasurements
    }
    if ($previous.manualScenarios) {
      $manualScenarios = @($previous.manualScenarios)
    }
    if ($previous.automationChecks) {
      $automationChecks = @($previous.automationChecks)
    }
  } catch {
    throw "O relatório anterior não pôde ser validado; preservação de evidências interrompida."
  }
}

$report = [pscustomobject]@{
  task = "TASK-025"
  date = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
  webOrigin = ([uri]$WebBaseUrl).GetLeftPart([System.UriPartial]::Authority)
  apiOrigin = ([uri]$ApiBaseUrl).GetLeftPart([System.UriPartial]::Authority)
  scenarios = $results
  automationChecks = $automationChecks
  manualScenarios = $manualScenarios
  manualBrowserReview = $manualBrowserReview
  performanceMeasurements = $performanceMeasurements
}

$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $reportPath -Encoding utf8
$client.Dispose()
Write-Output "Relatório sanitizado: $reportPath"
