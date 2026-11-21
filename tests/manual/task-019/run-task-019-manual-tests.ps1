[CmdletBinding()]
param(
  [Parameter(Mandatory)] [string] $ApiBaseUrl,
  [Parameter(Mandatory)] [PSCredential] $CustomerCredential,
  [Parameter(Mandatory)] [PSCredential] $AdminCredential,
  [Parameter(Mandatory)] [string] $SyntheticOrderId,
  [Parameter(Mandatory)] [string] $SyntheticOrderItemId,
  [Parameter(Mandatory)] [switch] $SyntheticTestDatabaseConfirmed
)

$ErrorActionPreference = 'Stop'
$reportPath = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path 'docs\testing\TASK-019-testes-manuais-resultado.md'
$results = [System.Collections.Generic.List[object]]::new()

function Add-ScenarioResult([string] $scenario, [string] $status, [string] $evidence, [string] $failure = '') {
  $results.Add([pscustomobject]@{ Scenario = $scenario; Status = $status; Evidence = $evidence; Failure = $failure })
}

function Get-AccessToken([PSCredential] $credential, [string] $baseUrl) {
  $body = @{
    email = $credential.UserName
    password = $credential.GetNetworkCredential().Password
  } | ConvertTo-Json
  $response = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType 'application/json' -Body $body
  if (-not $response.accessToken) { throw 'Login não retornou token de acesso' }
  return $response.accessToken
}

try {
  $uri = [uri] $ApiBaseUrl
  if (-not $SyntheticTestDatabaseConfirmed) { throw 'Confirme explicitamente o banco sintético com -SyntheticTestDatabaseConfirmed' }
  $addresses = if ($uri.HostNameType -eq 'Dns') { [System.Net.Dns]::GetHostAddresses($uri.Host) } else { @([System.Net.IPAddress]::Parse($uri.Host)) }
  if ($uri.Scheme -ne 'http' -or -not ($addresses | Where-Object { [System.Net.IPAddress]::IsLoopback($_) })) {
    throw 'A API deve usar HTTP em loopback (localhost/127.0.0.1/::1)'
  }
  if ($SyntheticOrderId -notmatch '^[0-9a-fA-F-]{36}$' -or $SyntheticOrderItemId -notmatch '^[0-9a-fA-F-]{36}$') {
    throw 'IDs sintéticos inválidos'
  }

  $baseUrl = $uri.AbsoluteUri.TrimEnd('/')
  $customerToken = Get-AccessToken $CustomerCredential $baseUrl
  $adminToken = Get-AccessToken $AdminCredential $baseUrl
  Add-ScenarioResult 'MT-019-00 API local e autenticação' 'APROVADO' 'API local aceitou as contas de teste.'
  $order = Invoke-RestMethod -Method Get -Uri "$baseUrl/orders/$SyntheticOrderId" -Headers @{ Authorization = "Bearer $customerToken" }
  $item = @($order.items | Where-Object { $_.id -eq $SyntheticOrderItemId }) | Select-Object -First 1
  if (-not $item -or -not $item.workTitle.StartsWith('TASK019 ', [StringComparison]::Ordinal)) {
    throw 'O pedido e o item devem pertencer a dados sintéticos TASK019; nada foi alterado.'
  }
  Add-ScenarioResult 'MT-019-01 proteção de dados sintéticos' 'APROVADO' 'Pedido identificado como fixture sintética TASK019.'

  $idempotencyKey = "manual-task019-$([guid]::NewGuid().ToString('N'))"
  $requestBody = @{ orderItemId = $SyntheticOrderItemId; reason = 'Solicitação sintética TASK-019' } | ConvertTo-Json
  $refund = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$SyntheticOrderId/cancel" -Headers @{ Authorization = "Bearer $customerToken"; 'Idempotency-Key' = $idempotencyKey } -ContentType 'application/json' -Body $requestBody
  if ($refund.status -eq 'PENDING_REVIEW') {
    $decisionBody = @{ decision = 'APPROVE'; reason = 'Aprovação de teste sintético' } | ConvertTo-Json
    $refund = Invoke-RestMethod -Method Post -Uri "$baseUrl/admin/refunds/$($refund.id)/decision" -Headers @{ Authorization = "Bearer $adminToken" } -ContentType 'application/json' -Body $decisionBody
  }
  if ($refund.status -notin @('PROCESSED', 'AWAITING_RETURN')) { throw "Estado inesperado do reembolso: $($refund.status)" }
  Add-ScenarioResult 'MT-019-02 solicitação e decisão' 'APROVADO' "Fluxo terminou em $($refund.status); valor em centavos $($refund.amountCents)."

  $repeat = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$SyntheticOrderId/cancel" -Headers @{ Authorization = "Bearer $customerToken"; 'Idempotency-Key' = $idempotencyKey } -ContentType 'application/json' -Body $requestBody
  if ($repeat.id -ne $refund.id) { throw 'Repetição idempotente retornou outra solicitação' }
  Add-ScenarioResult 'MT-019-03 idempotência' 'APROVADO' 'A repetição retornou a solicitação existente.'
} catch {
  $message = $_.Exception.Message
  if ($results.Count -eq 0) {
    Add-ScenarioResult 'MT-019-00 preparação e fluxo' 'BLOQUEADO' 'Pré-condições ou API indisponíveis.' $message
  } else {
    Add-ScenarioResult 'MT-019-02 solicitação, decisão e idempotência' 'REPROVADO' 'Falha durante o fluxo.' $message
  }
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss UTC')
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('# TASK-019 — resultado dos testes manuais')
$lines.Add('')
$lines.Add("Execução: $timestamp")
$lines.Add('Ambiente: API local; roteiro exige confirmação do banco sintético.')
$lines.Add('Credenciais, tokens, IDs, e-mails e conteúdo dos pedidos foram omitidos.')
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
