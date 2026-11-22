param(
  [Parameter(Mandatory = $true)][string]$AdminToken,
  [Parameter(Mandatory = $true)][string]$CatalogToken,
  [Parameter(Mandatory = $true)][string]$StockToken,
  [Parameter(Mandatory = $true)][string]$CustomerToken,
  [string]$ApiBaseUrl = "http://localhost:3001",
  [string]$WebBaseUrl = "http://localhost:3000",
  [string]$ReportPath = "docs/testing/TASK-023-testes-manuais-resultado.md"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$resolvedReportPath = if ([System.IO.Path]::IsPathRooted($ReportPath)) { $ReportPath } else { Join-Path $repoRoot $ReportPath }
$apiBase = $ApiBaseUrl.TrimEnd('/')
$webBase = $WebBaseUrl.TrimEnd('/')
$results = [System.Collections.Generic.List[object]]::new()

function Invoke-DashboardRequest {
  param([string]$BaseUrl, [string]$Path, [string]$Token = "")
  try {
    $headers = @{}
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    $response = Invoke-WebRequest -Uri "$BaseUrl$Path" -Method Get -Headers $headers -TimeoutSec 15 -ErrorAction Stop
    $content = $null
    if ($response.Content -and $response.Headers["Content-Type"] -match "application/json") {
      $content = $response.Content | ConvertFrom-Json
    }
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
  $admin = Invoke-DashboardRequest $apiBase "/admin/dashboard" $AdminToken
  $catalog = Invoke-DashboardRequest $apiBase "/catalog/dashboard" $AdminToken
  $warehouse = Invoke-DashboardRequest $apiBase "/warehouse/dashboard" $AdminToken
  $adminShape = $admin.StatusCode -eq 200 -and $null -ne $admin.Content.netSalesCents -and $null -ne $admin.Content.activeCustomers -and $null -ne $admin.Content.confirmedOrders -and $null -ne $admin.Content.bestsellers
  $catalogShape = $catalog.StatusCode -eq 200 -and $null -ne $catalog.Content.licenses -and $null -ne $catalog.Content.coupons
  $warehouseShape = $warehouse.StatusCode -eq 200 -and $null -ne $warehouse.Content.orders -and $null -ne $warehouse.Content.inventory -and $null -ne $warehouse.Content.alerts
  $adminOk = $adminShape -and $catalogShape -and $warehouseShape
  Add-Result "MT-023-API-01" $(if ($adminOk) { "APROVADO" } else { "REPROVADO" }) "Admin: HTTP $($admin.StatusCode)/$($catalog.StatusCode)/$($warehouse.StatusCode); estrutura agregada verificada." $(if (-not $adminOk) { "Esperados três HTTP 200 com os campos agregados documentados." } else { "" })

  $catalogOwn = Invoke-DashboardRequest $apiBase "/catalog/dashboard" $CatalogToken
  $catalogAdmin = Invoke-DashboardRequest $apiBase "/admin/dashboard" $CatalogToken
  $catalogWarehouse = Invoke-DashboardRequest $apiBase "/warehouse/dashboard" $CatalogToken
  $catalogOk = $catalogOwn.StatusCode -eq 200 -and $catalogAdmin.StatusCode -eq 403 -and $catalogWarehouse.StatusCode -eq 403
  Add-Result "MT-023-API-02" $(if ($catalogOk) { "APROVADO" } else { "REPROVADO" }) "Catálogo: próprio HTTP $($catalogOwn.StatusCode); painéis alheios HTTP $($catalogAdmin.StatusCode)/$($catalogWarehouse.StatusCode)." $(if (-not $catalogOk) { "Esperados HTTP 200 no próprio painel e HTTP 403 nos demais." } else { "" })

  $stockOwn = Invoke-DashboardRequest $apiBase "/warehouse/dashboard" $StockToken
  $stockAdmin = Invoke-DashboardRequest $apiBase "/admin/dashboard" $StockToken
  $stockCatalog = Invoke-DashboardRequest $apiBase "/catalog/dashboard" $StockToken
  $stockOk = $stockOwn.StatusCode -eq 200 -and $stockAdmin.StatusCode -eq 403 -and $stockCatalog.StatusCode -eq 403
  Add-Result "MT-023-API-03" $(if ($stockOk) { "APROVADO" } else { "REPROVADO" }) "Estoque: próprio HTTP $($stockOwn.StatusCode); painéis alheios HTTP $($stockAdmin.StatusCode)/$($stockCatalog.StatusCode)." $(if (-not $stockOk) { "Esperados HTTP 200 no próprio painel e HTTP 403 nos demais." } else { "" })

  $customerCodes = @(
    (Invoke-DashboardRequest $apiBase "/admin/dashboard" $CustomerToken).StatusCode,
    (Invoke-DashboardRequest $apiBase "/catalog/dashboard" $CustomerToken).StatusCode,
    (Invoke-DashboardRequest $apiBase "/warehouse/dashboard" $CustomerToken).StatusCode
  )
  $anonymousCodes = @(
    (Invoke-DashboardRequest $apiBase "/admin/dashboard").StatusCode,
    (Invoke-DashboardRequest $apiBase "/catalog/dashboard").StatusCode,
    (Invoke-DashboardRequest $apiBase "/warehouse/dashboard").StatusCode
  )
  $accessOk = @($customerCodes | Where-Object { $_ -ne 403 }).Count -eq 0 -and @($anonymousCodes | Where-Object { $_ -ne 401 }).Count -eq 0
  Add-Result "MT-023-API-04" $(if ($accessOk) { "APROVADO" } else { "REPROVADO" }) "CUSTOMER HTTP $($customerCodes -join ','); visitante HTTP $($anonymousCodes -join ',')." $(if (-not $accessOk) { "Esperados HTTP 403 para CUSTOMER e HTTP 401 para visitante." } else { "" })

  $adminLegacy = Invoke-DashboardRequest $apiBase "/admin/warehouse/summary" $StockToken
  $warehouseNew = Invoke-DashboardRequest $apiBase "/warehouse/dashboard" $StockToken
  $compatibilityOk = $adminLegacy.StatusCode -eq 200 -and $warehouseNew.StatusCode -eq 200 -and (ConvertTo-Json $adminLegacy.Content -Depth 8 -Compress) -eq (ConvertTo-Json $warehouseNew.Content -Depth 8 -Compress)
  Add-Result "MT-023-API-05" $(if ($compatibilityOk) { "APROVADO" } else { "REPROVADO" }) "Rota de estoque atual HTTP $($adminLegacy.StatusCode); rota documentada HTTP $($warehouseNew.StatusCode); agregados equivalentes." $(if (-not $compatibilityOk) { "Esperados HTTP 200 e mesmos agregados." } else { "" })

  $sensitiveKey = '"(?:email|phone|postalCode|recipientName|address|password)"\s*:'
  $payloads = @($admin.Content, $catalog.Content, $warehouse.Content)
  $piiFound = @($payloads | ForEach-Object { ConvertTo-Json $_ -Depth 8 -Compress } | Where-Object { $_ -match $sensitiveKey }).Count -gt 0
  Add-Result "MT-023-API-06" $(if (-not $piiFound) { "APROVADO" } else { "REPROVADO" }) "Respostas dos três painéis verificadas por campos agregados; nenhum campo pessoal encontrado." $(if ($piiFound) { "Uma resposta incluiu campo pessoal não esperado." } else { "" })

  $web = Invoke-DashboardRequest $webBase "/dashboard"
  Add-Result "MT-023-WEB-01" $(if ($web.StatusCode -eq 200) { "APROVADO" } else { "REPROVADO" }) "Rota web /dashboard HTTP $($web.StatusCode)." $(if ($web.StatusCode -ne 200) { "Esperado HTTP 200." } else { "" })
} catch {
  Add-Result "MT-023-00" "BLOQUEADO" "Falha na configuração ou conexão; detalhes omitidos para evitar expor credenciais." "Confira API, Web e conectividade local."
} finally {
  $reportDirectory = Split-Path -Parent $resolvedReportPath
  if (-not (Test-Path -LiteralPath $reportDirectory)) { New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null }
  $lines = @(
    "# TASK-023 — resultado dos testes manuais",
    "",
    "Execução: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')",
    "Ambiente: API/Web local; dados e tokens sintéticos mantidos em memória.",
    "Tokens, IDs, e-mails, URLs completos e valores agregados foram omitidos.",
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
