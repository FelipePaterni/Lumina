param(
  [Parameter(Mandatory = $true)][string]$WorkId,
  [Parameter(Mandatory = $true)][string]$BuyerToken,
  [Parameter(Mandatory = $true)][string]$NonBuyerToken,
  [Parameter(Mandatory = $true)][string]$ReporterToken,
  [Parameter(Mandatory = $true)][string]$AdminToken,
  [string]$ApiBaseUrl = "http://localhost:3001",
  [string]$ReportPath = "docs/testing/TASK-022-testes-manuais-resultado.md"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$resolvedReportPath = if ([System.IO.Path]::IsPathRooted($ReportPath)) { $ReportPath } else { Join-Path $repoRoot $ReportPath }
$apiBase = $ApiBaseUrl.TrimEnd('/')
$results = [System.Collections.Generic.List[object]]::new()
$reviewId = $null

function Invoke-Api {
  param([string]$Path, [string]$Token, [string]$Method = "GET", [object]$Body)
  $headers = @{ Authorization = "Bearer $Token" }
  try {
    $parameters = @{ Uri = "$apiBase$Path"; Method = $Method; Headers = $headers; TimeoutSec = 15; ErrorAction = "Stop" }
    if ($null -ne $Body) {
      $parameters.ContentType = "application/json"
      $parameters.Body = ConvertTo-Json -InputObject $Body -Depth 5 -Compress
    }
    $response = Invoke-WebRequest @parameters
    $content = $null
    if ($response.Content) { $content = $response.Content | ConvertFrom-Json }
    return @{ StatusCode = [int]$response.StatusCode; Content = $content }
  } catch {
    $statusCode = 0
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }
    return @{ StatusCode = $statusCode; Content = $null }
  }
}

function Add-Result {
  param([string]$Id, [string]$Status, [string]$Evidence, [string]$Failure = "")
  $results.Add([pscustomobject]@{ Id = $Id; Status = $Status; Evidence = $Evidence; Failure = $Failure })
}

try {
  $reviewsPath = "/works/$WorkId/reviews"
  $initial = Invoke-Api -Path $reviewsPath
  if ($initial.StatusCode -eq 200 -and $null -ne $initial.Content.items) {
    Add-Result "MT-022-01" "APROVADO" "Consulta pública retornou lista de avaliações."
  } else {
    Add-Result "MT-022-01" "REPROVADO" "Consulta pública retornou HTTP $($initial.StatusCode)." "Esperado HTTP 200 com lista."
  }

  $created = Invoke-Api -Path $reviewsPath -Token $BuyerToken -Method "POST" -Body @{ rating = 5; comment = "Avaliação sintética TASK-022" }
  if ($created.StatusCode -eq 201 -and $created.Content.id) {
    $reviewId = [string]$created.Content.id
    Add-Result "MT-022-02" "APROVADO" "Cliente comprador criou avaliação publicada."
  } else {
    Add-Result "MT-022-02" "REPROVADO" "Criação retornou HTTP $($created.StatusCode)." "Esperado HTTP 201 para comprador confirmado."
  }

  if ($reviewId) {
    $afterCreate = Invoke-Api -Path $reviewsPath
    $averageOk = $afterCreate.StatusCode -eq 200 -and $afterCreate.Content.averageRating -ge 1 -and $afterCreate.Content.total -ge 1
    Add-Result "MT-022-03" $(if ($averageOk) { "APROVADO" } else { "REPROVADO" }) "Média pública após avaliação: HTTP $($afterCreate.StatusCode)." $(if (-not $averageOk) { "Média/lista não refletiu a avaliação visível." } else { "" })

    $nonBuyer = Invoke-Api -Path $reviewsPath -Token $NonBuyerToken -Method "POST" -Body @{ rating = 4; comment = "Tentativa sintética sem compra" }
    Add-Result "MT-022-04" $(if ($nonBuyer.StatusCode -eq 409) { "APROVADO" } else { "REPROVADO" }) "Tentativa sem aquisição retornou HTTP $($nonBuyer.StatusCode)." $(if ($nonBuyer.StatusCode -ne 409) { "Esperado HTTP 409." } else { "" })

    $report = Invoke-Api -Path "/reviews/$reviewId/reports" -Token $ReporterToken -Method "POST" -Body @{ reason = "Denúncia sintética TASK-022" }
    Add-Result "MT-022-05" $(if ($report.StatusCode -eq 201) { "APROVADO" } else { "REPROVADO" }) "Denúncia por usuário autenticado retornou HTTP $($report.StatusCode)." $(if ($report.StatusCode -ne 201) { "Esperado HTTP 201." } else { "" })

    $adminList = Invoke-Api -Path "/admin/review-reports" -Token $AdminToken
    $otherList = Invoke-Api -Path "/admin/review-reports" -Token $NonBuyerToken
    $accessOk = $adminList.StatusCode -eq 200 -and $otherList.StatusCode -eq 403
    Add-Result "MT-022-06" $(if ($accessOk) { "APROVADO" } else { "REPROVADO" }) "Lista Admin HTTP $($adminList.StatusCode); papel cliente HTTP $($otherList.StatusCode)." $(if (-not $accessOk) { "Esperados HTTP 200 e HTTP 403." } else { "" })

    $missingReason = Invoke-Api -Path "/admin/reviews/$reviewId" -Token $AdminToken -Method "DELETE" -Body @{}
    $removed = Invoke-Api -Path "/admin/reviews/$reviewId" -Token $AdminToken -Method "DELETE" -Body @{ reason = "Motivo sintético TASK-022" }
    $moderationOk = $missingReason.StatusCode -eq 400 -and $removed.StatusCode -eq 200
    Add-Result "MT-022-07" $(if ($moderationOk) { "APROVADO" } else { "REPROVADO" }) "Sem motivo HTTP $($missingReason.StatusCode); remoção Admin HTTP $($removed.StatusCode)." $(if (-not $moderationOk) { "Esperados HTTP 400 e HTTP 200." } else { "" })

    $afterRemoval = Invoke-Api -Path $reviewsPath
    $stillVisible = @($afterRemoval.Content.items | Where-Object { $_.id -eq $reviewId }).Count -gt 0
    $hiddenOk = $afterRemoval.StatusCode -eq 200 -and -not $stillVisible
    Add-Result "MT-022-08" $(if ($hiddenOk) { "APROVADO" } else { "REPROVADO" }) "Avaliação removida ausente da resposta pública HTTP $($afterRemoval.StatusCode)." $(if (-not $hiddenOk) { "Avaliação removida ainda aparece ou consulta falhou." } else { "" })
  } else {
    foreach ($id in @("MT-022-03", "MT-022-04", "MT-022-05", "MT-022-06", "MT-022-07", "MT-022-08")) {
      Add-Result $id "BLOQUEADO" "Avaliação compradora não foi criada; cenário dependente não executado." ""
    }
  }
} catch {
  Add-Result "MT-022-00" "BLOQUEADO" "Falha de conexão ou configuração durante a execução." "Confira API, token sintético, workId e conectividade; detalhes omitidos para evitar registrar credenciais."
} finally {
  $reportDirectory = Split-Path -Parent $resolvedReportPath
  if (-not (Test-Path -LiteralPath $reportDirectory)) { New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null }
  $lines = @(
    "# TASK-022 — resultado dos testes manuais",
    "",
    "Execução: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')",
    "Ambiente: API em $apiBase; dados e tokens sintéticos mantidos em memória.",
    "IDs de usuário, tokens, e-mails e conteúdo de credenciais foram omitidos.",
    "",
    "| Cenário | Status | Evidência resumida | Falha |",
    "|---|---|---|---|"
  )
  foreach ($result in $results) {
    $lines += "| $($result.Id) | $($result.Status) | $($result.Evidence) | $($result.Failure) |"
  }
  Set-Content -LiteralPath $resolvedReportPath -Value $lines -Encoding utf8
  Write-Output "Relatório sanitizado: $resolvedReportPath"
  if ($results.Where({ $_.Status -ne "APROVADO" }).Count -gt 0) { exit 1 }
}
