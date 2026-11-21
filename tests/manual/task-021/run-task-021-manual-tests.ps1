[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $ApiBaseUrl,
  [Parameter(Mandatory)] [PSCredential] $StockCredential,
  [Parameter(Mandatory)] [PSCredential] $AdminCredential,
  [Parameter(Mandatory)] [PSCredential] $CustomerCredential,
  [Parameter(Mandatory)] [PSCredential] $OtherCustomerCredential,
  [Parameter(Mandatory)] [string] $SyntheticOrderId,
  [Parameter(Mandatory)] [string] $SyntheticPreorderOrderId,
  [Parameter(Mandatory)] [string] $SyntheticEditionId,
  [Parameter(Mandatory)] [string] $SyntheticPreorderEditionId,
  [Parameter(Mandatory)] [switch] $SyntheticTestDatabaseConfirmed
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$reportPath = Join-Path $root 'docs\testing\TASK-021-testes-manuais-resultado.md'
$results = [System.Collections.Generic.List[object]]::new()
$tokens = @{}

function Add-ScenarioResult([string] $scenario, [string] $status, [string] $evidence, [string] $failure = '') {
  $results.Add([pscustomobject]@{ Scenario = $scenario; Status = $status; Evidence = $evidence; Failure = $failure })
}

function Get-Token([PSCredential] $credential, [string] $baseUrl) {
  $body = @{ email = $credential.UserName; password = $credential.GetNetworkCredential().Password } | ConvertTo-Json -Compress
  $response = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType 'application/json' -Body $body
  if (-not $response.accessToken) { throw 'AUTHENTICATION_FAILED' }
  return $response.accessToken
}

function Invoke-TaskApi([string] $method, [string] $url, [string] $token, $body = $null) {
  try {
    $arguments = @{ Method = $method; Uri = $url; Headers = @{ Authorization = "Bearer $token" } }
    if ($null -ne $body) {
      $arguments.ContentType = 'application/json'
      $arguments.Body = $body | ConvertTo-Json -Compress -Depth 8
    }
    $result = Invoke-RestMethod @arguments
    return @{ Status = 200; Body = $result }
  } catch {
    $status = 0
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) { $status = [int]$_.Exception.Response.StatusCode }
    return @{ Status = $status; Body = $null }
  }
}

function Assert-Response($response, [int] $expectedStatus, [string] $label) {
  if ($response.Status -ne $expectedStatus) { throw "HTTP_STATUS_MISMATCH:$label" }
}

try {
  if (-not $SyntheticTestDatabaseConfirmed) { throw 'SYNTHETIC_DATABASE_CONFIRMATION_REQUIRED' }
  $uri = [uri]$ApiBaseUrl
  $addresses = if ($uri.HostNameType -eq 'Dns') { [System.Net.Dns]::GetHostAddresses($uri.Host) } else { @([System.Net.IPAddress]::Parse($uri.Host)) }
  if ($uri.Scheme -ne 'http' -or -not ($addresses | Where-Object { [System.Net.IPAddress]::IsLoopback($_) })) { throw 'API_MUST_USE_LOCAL_LOOPBACK' }
  foreach ($id in @($SyntheticOrderId, $SyntheticPreorderOrderId, $SyntheticEditionId, $SyntheticPreorderEditionId)) {
    if ($id -notmatch '^[0-9a-fA-F-]{36}$') { throw 'SYNTHETIC_FIXTURE_ID_INVALID' }
  }
  $baseUrl = $uri.AbsoluteUri.TrimEnd('/')
  $tokens.stock = Get-Token $StockCredential $baseUrl
  $tokens.admin = Get-Token $AdminCredential $baseUrl
  $tokens.customer = Get-Token $CustomerCredential $baseUrl
  $tokens.otherCustomer = Get-Token $OtherCustomerCredential $baseUrl
  foreach ($orderId in @($SyntheticOrderId, $SyntheticPreorderOrderId)) {
    $fixtureOrder = Invoke-TaskApi 'GET' "$baseUrl/orders/$orderId" $tokens.customer
    Assert-Response $fixtureOrder 200 'synthetic order ownership'
    if (@($fixtureOrder.Body.items | Where-Object { $_.format -eq 'PHYSICAL' -and $_.workTitle.StartsWith('TASK021 ', [StringComparison]::Ordinal) }).Count -lt 1) {
      throw 'ORDER_NOT_SYNTHETIC_TASK021'
    }
  }
  Add-ScenarioResult 'MT-021-00 — API local e autenticação dos papéis' 'APROVADO' 'API local autenticou estoque, Admin e dois clientes sintéticos.'

  $queue = Invoke-TaskApi 'GET' "$baseUrl/admin/logistics/orders?page=1&limit=100" $tokens.stock
  Assert-Response $queue 200 'stock queue'
  if (-not (@($queue.Body.items | Where-Object { $_.id -eq $SyntheticOrderId }).Count -eq 1)) { throw 'SYNTHETIC_ORDER_NOT_IN_STOCK_QUEUE' }
  $summary = Invoke-TaskApi 'GET' "$baseUrl/admin/warehouse/summary" $tokens.stock
  Assert-Response $summary 200 'stock summary'
  if (-not (@($summary.Body.alerts | Where-Object { $_.editionId -eq $SyntheticEditionId }).Count -ge 1)) { throw 'ZERO_STOCK_ALERT_MISSING' }
  $inventory = Invoke-TaskApi 'GET' "$baseUrl/inventory/$SyntheticEditionId" $tokens.stock
  Assert-Response $inventory 200 'inventory movement history'
  if (-not (@($inventory.Body.movements | Where-Object { $_.type -eq 'PHYSICAL_SALE' }).Count -ge 1)) { throw 'PHYSICAL_MOVEMENT_MISSING' }
  $adminSummary = Invoke-TaskApi 'GET' "$baseUrl/admin/warehouse/summary" $tokens.admin
  Assert-Response $adminSummary 200 'admin summary'
  Add-ScenarioResult 'MT-021-01 — fila, movimentos e alerta de estoque zerado' 'APROVADO' 'Estoque/Admin consultaram a fila; o movimento sintético e alerta de estoque zero foram encontrados.'

  foreach ($status in @('PICKING', 'SHIPPED', 'DELIVERED')) {
    $payload = @{ status = $status }
    if ($status -eq 'SHIPPED') { $payload.trackingCode = 'SYN-TASK021-TRACK-001' }
    $response = Invoke-TaskApi 'POST' "$baseUrl/admin/logistics/orders/$SyntheticOrderId/status" $tokens.stock $payload
    Assert-Response $response 200 "transition $status"
  }
  $repeat = Invoke-TaskApi 'POST' "$baseUrl/admin/logistics/orders/$SyntheticOrderId/status" $tokens.stock @{ status = 'DELIVERED' }
  Assert-Response $repeat 200 'idempotent delivered retry'
  if ($repeat.Body.history.Count -ne 3) { throw 'FULFILLMENT_HISTORY_INVALID' }
  $outboxJson = & node (Join-Path $PSScriptRoot 'verify-task-021-outbox.mjs') $SyntheticOrderId
  if ($LASTEXITCODE -ne 0) { throw 'FULFILLMENT_NOTIFICATIONS_INVALID' }
  $outbox = $outboxJson | ConvertFrom-Json
  if (-not $outbox.valid) { throw 'FULFILLMENT_NOTIFICATIONS_INVALID' }
  Add-ScenarioResult 'MT-021-02 — transições, rastreio e avisos únicos' 'APROVADO' 'Três transições válidas geraram histórico, rastreio e avisos enviados no outbox.'

  $preorderPicking = Invoke-TaskApi 'POST' "$baseUrl/admin/logistics/orders/$SyntheticPreorderOrderId/status" $tokens.stock @{ status = 'PICKING' }
  Assert-Response $preorderPicking 200 'preorder picking'
  $earlyShipment = Invoke-TaskApi 'POST' "$baseUrl/admin/logistics/orders/$SyntheticPreorderOrderId/status" $tokens.stock @{ status = 'SHIPPED'; trackingCode = 'SYN-TASK021-PREORDER' }
  Assert-Response $earlyShipment 409 'preorder before release'
  $preorderTracking = Invoke-TaskApi 'GET' "$baseUrl/orders/$SyntheticPreorderOrderId/tracking" $tokens.customer
  Assert-Response $preorderTracking 200 'preorder tracking state'
  if ($preorderTracking.Body.fulfillmentStatus -ne 'PICKING' -or @($preorderTracking.Body.history | Where-Object { $_.status -eq 'SHIPPED' }).Count -ne 0) { throw 'EARLY_SHIPMENT_CHANGED_ORDER' }
  Add-ScenarioResult 'MT-021-03 — pré-venda não pode ser enviada antes do lançamento' 'APROVADO' 'API recusou o envio antecipado sem alterar o status nem a trilha.'

  $tracking = Invoke-TaskApi 'GET' "$baseUrl/orders/$SyntheticOrderId/tracking" $tokens.customer
  Assert-Response $tracking 200 'customer tracking'
  if ($tracking.Body.trackingCode -ne 'SYN-TASK021-TRACK-001') { throw 'CUSTOMER_TRACKING_MISMATCH' }
  Add-ScenarioResult 'MT-021-04 — cliente consulta o próprio rastreio' 'APROVADO' 'Cliente dono do pedido recebeu o rastreio sintético.'

  $customerWrite = Invoke-TaskApi 'POST' "$baseUrl/admin/logistics/orders/$SyntheticPreorderOrderId/status" $tokens.customer @{ status = 'DELIVERED' }
  Assert-Response $customerWrite 403 'customer logistics write'
  $otherTracking = Invoke-TaskApi 'GET' "$baseUrl/orders/$SyntheticOrderId/tracking" $tokens.otherCustomer
  Assert-Response $otherTracking 404 'other customer tracking'
  Add-ScenarioResult 'MT-021-05 — autorização e isolamento entre clientes' 'APROVADO' 'Cliente não alterou logística nem consultou pedido de outro cliente.'
} catch {
  $code = $_.Exception.Message
  $scenario = if ($results.Count -eq 0) { 'MT-021-00 — pré-condições e API local' } else { 'MT-021 — execução interrompida' }
  $failure = if ($code -match '^HTTP_STATUS_MISMATCH:') { 'HTTP_STATUS_INESPERADO' } elseif ($code -match '^SYNTHETIC_|^API_|^AUTHENTICATION_|^ZERO_|^FULFILLMENT_|^EARLY_|^CUSTOMER_') { $code } else { 'ERRO_NAO_CLASSIFICADO' }
  Add-ScenarioResult $scenario 'REPROVADO' 'O cenário não satisfez a verificação; nenhum conteúdo pessoal foi registrado.' $failure
  foreach ($pending in @('MT-021-01','MT-021-02','MT-021-03','MT-021-04','MT-021-05')) {
    if (-not ($results.Scenario -match [regex]::Escape($pending))) { Add-ScenarioResult $pending 'BLOQUEADO' 'Dependente de pré-condição anterior.' 'EXECUCAO_INTERROMPIDA' }
  }
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss UTC')
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# TASK-021 — resultado dos testes manuais')
$lines.Add('')
$lines.Add("Execução: $timestamp")
$lines.Add('Ambiente: API local em loopback e banco sintético lumina_task009_test.')
$lines.Add('Credenciais, tokens, IDs, endereços e conteúdo dos pedidos foram omitidos.')
$lines.Add('')
$lines.Add('| Cenário | Status | Evidência resumida | Falha |')
$lines.Add('|---|---|---|---|')
foreach ($result in $results) {
  $evidence = ($result.Evidence -replace '\|', '\|' -replace '[\r\n]+', ' ')
  $failure = ($result.Failure -replace '\|', '\|' -replace '[\r\n]+', ' ')
  $lines.Add("| $($result.Scenario) | $($result.Status) | $evidence | $failure |")
}
$lines.Add('')
$lines.Add('Revisão humana: PENDENTE.')
Set-Content -LiteralPath $reportPath -Value $lines -Encoding utf8

if ($results.Status -contains 'REPROVADO') { exit 1 }
if ($results.Status -contains 'BLOQUEADO') { exit 2 }
exit 0
