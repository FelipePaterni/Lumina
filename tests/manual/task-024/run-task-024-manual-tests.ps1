param(
  [Parameter(Mandatory = $true)][string]$AdminToken,
  [Parameter(Mandatory = $true)][string]$CatalogToken,
  [Parameter(Mandatory = $true)][string]$StockToken,
  [Parameter(Mandatory = $true)][string]$CustomerToken,
  [string]$ApiBaseUrl = "http://localhost:3001",
  [string]$WebBaseUrl = "http://localhost:3000",
  [string]$ReportPath = "docs/testing/TASK-024-testes-manuais-resultado.md"
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "../../..")).Path
$resolvedReportPath = if ([System.IO.Path]::IsPathRooted($ReportPath)) { $ReportPath } else { Join-Path $repoRoot $ReportPath }
$apiBase = $ApiBaseUrl.TrimEnd('/')
$webBase = $WebBaseUrl.TrimEnd('/')
$results = [System.Collections.Generic.List[object]]::new()
$customerDeactivated = $false

function Invoke-Task024Request {
  param([string]$BaseUrl, [string]$Path, [string]$Token = "", [string]$Method = "GET", [object]$Body = $null)
  try {
    $headers = @{}
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    $request = @{ Uri = "$BaseUrl$Path"; Method = $Method; Headers = $headers; TimeoutSec = 20; ErrorAction = "Stop" }
    if ($null -ne $Body) {
      $request.ContentType = "application/json"
      $request.Body = ConvertTo-Json -InputObject $Body -Compress -Depth 8
    }
    $response = Invoke-WebRequest @request -UseBasicParsing
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

function Add-Task024Result {
  param([string]$Id, [string]$Status, [string]$Evidence, [string]$Failure = "")
  $results.Add([pscustomobject]@{ Id = $Id; Status = $Status; Evidence = $Evidence; Failure = $Failure })
}

function Get-NotificationTotal {
  param($Summary)
  if ($null -eq $Summary.notifications) { return $null }
  return [int]$Summary.notifications.PENDING + [int]$Summary.notifications.PROCESSING + [int]$Summary.notifications.RETRY + [int]$Summary.notifications.SENT + [int]$Summary.notifications.FAILED
}

try {
  $anonymous = Invoke-Task024Request $apiBase "/admin/observability/dashboard"
  Add-Task024Result "MT-024-API-01" $(if ($anonymous.StatusCode -eq 401) { "APROVADO" } else { "REPROVADO" }) "Acesso sem token: HTTP $($anonymous.StatusCode)." $(if ($anonymous.StatusCode -ne 401) { "Esperado HTTP 401." } else { "" })

  $admin = Invoke-Task024Request $apiBase "/admin/observability/dashboard" $AdminToken
  $shapeOk = $admin.StatusCode -eq 200 -and $null -ne $admin.Content.health -and $null -ne $admin.Content.alerts
  $noPii = $false
  if ($shapeOk) {
    $serialized = ConvertTo-Json -InputObject $admin.Content -Depth 12 -Compress
    $noPii = $serialized -notmatch '(?i)"(?:email|name|phone|cpf|address|userId|targetId|reason|subject|body)"\s*:'
  }
  $shapeStatus = if ($admin.StatusCode -eq 200 -and ($admin.Content.health.database -in @("UP", "UNAVAILABLE")) -and ($null -eq $admin.Content.notifications -or $null -ne $admin.Content.notifications.PENDING) -and ($null -eq $admin.Content.accountDeletion -or $null -ne $admin.Content.accountDeletion.pendingRequests) -and ($null -ne $admin.Content.alerts)) { "APROVADO" } else { "REPROVADO" }
  Add-Task024Result "MT-024-API-02" $shapeStatus "Admin: HTTP $($admin.StatusCode); estrutura agregada da API/banco, notificações e solicitações verificada." $(if ($shapeStatus -ne "APROVADO") { "Esperados HTTP 200 e campos agregados documentados." } else { "" })
  Add-Task024Result "MT-024-SEC-01" $(if ($shapeOk -and $noPii) { "APROVADO" } else { "REPROVADO" }) "Resposta administrativa contém somente campos operacionais agregados; inspeção estrutural concluída." $(if (-not ($shapeOk -and $noPii)) { "Resposta ausente ou contém nomes de campos pessoais/proibidos." } else { "" })

  $roleCodes = @(
    (Invoke-Task024Request $apiBase "/admin/observability/dashboard" $CatalogToken).StatusCode,
    (Invoke-Task024Request $apiBase "/admin/observability/dashboard" $StockToken).StatusCode,
    (Invoke-Task024Request $apiBase "/admin/observability/dashboard" $CustomerToken).StatusCode
  )
  $rolesOk = @($roleCodes | Where-Object { $_ -ne 403 }).Count -eq 0
  Add-Task024Result "MT-024-SEC-02" $(if ($rolesOk) { "APROVADO" } else { "REPROVADO" }) "Papéis Catálogo/Estoque/Cliente: HTTP $($roleCodes -join ',')." $(if (-not $rolesOk) { "Esperado HTTP 403 para cada papel não Admin." } else { "" })

  if ($admin.StatusCode -eq 200 -and $null -ne $admin.Content.accountDeletion) {
    $beforeTotal = Get-NotificationTotal $admin.Content
    $deactivation = Invoke-Task024Request $apiBase "/account/deactivate-request" $CustomerToken "POST" @{ reason = "Teste sintético TASK-024" }
    $customerDeactivated = $deactivation.StatusCode -eq 201
    $afterDeactivation = Invoke-Task024Request $apiBase "/admin/observability/dashboard" $AdminToken
    $deactivationOk = $customerDeactivated -and $afterDeactivation.StatusCode -eq 200 -and $afterDeactivation.Content.accountDeletion.pendingRequests -ge ($admin.Content.accountDeletion.pendingRequests + 1) -and $null -ne $deactivation.Content.scheduledDeletionAt
    Add-Task024Result "MT-024-API-03" $(if ($deactivationOk) { "APROVADO" } else { "REPROVADO" }) "Solicitação sintética: HTTP $($deactivation.StatusCode); contador agregado atualizado sem identificar a conta." $(if (-not $deactivationOk) { "Esperada desativação HTTP 201, data prevista e incremento agregado." } else { "" })

    $reactivation = if ($customerDeactivated) { Invoke-Task024Request $apiBase "/account/reactivate" $CustomerToken "POST" } else { @{ StatusCode = 0; Content = $null } }
    $customerDeactivated = $false
    $afterReactivation = Invoke-Task024Request $apiBase "/admin/observability/dashboard" $AdminToken
    $notificationsAfter = if ($afterReactivation.StatusCode -eq 200) { Get-NotificationTotal $afterReactivation.Content } else { $null }
    $notificationsOk = $null -ne $beforeTotal -and $null -ne $notificationsAfter -and $notificationsAfter -ge ($beforeTotal + 4)
    Add-Task024Result "MT-024-API-04" $(if ($reactivation.StatusCode -eq 201 -and $afterReactivation.StatusCode -eq 200 -and $afterReactivation.Content.accountDeletion.pendingRequests -le $admin.Content.accountDeletion.pendingRequests -and $notificationsOk) { "APROVADO" } else { "REPROVADO" }) "Reativação: HTTP $($reactivation.StatusCode); solicitações agregadas e total de eventos de notificação conferidos." $(if (-not ($reactivation.StatusCode -eq 201 -and $afterReactivation.StatusCode -eq 200 -and $notificationsOk)) { "Esperada reativação HTTP 201 e persistência dos quatro eventos sintéticos de solicitação/reativação." } else { "" })
  } else {
    Add-Task024Result "MT-024-API-03" "BLOQUEADO" "Admin não retornou resumo utilizável; fluxo de solicitação não foi executado." "Pré-condição do painel Admin não satisfeita."
    Add-Task024Result "MT-024-API-04" "BLOQUEADO" "Admin não retornou resumo utilizável; reativação não foi executada." "Pré-condição do painel Admin não satisfeita."
  }

  $web = Invoke-Task024Request $webBase "/dashboard"
  Add-Task024Result "MT-024-WEB-01" $(if ($web.StatusCode -eq 200) { "APROVADO" } else { "BLOQUEADO" }) "Rota web /dashboard: HTTP $($web.StatusCode)." $(if ($web.StatusCode -ne 200) { "Web indisponível; revisão visual permanece necessária." } else { "" })
} catch {
  Add-Task024Result "MT-024-EXEC" "BLOQUEADO" "Execução interrompida antes de concluir todos os cenários." "Falha inesperada; detalhes omitidos para proteger credenciais e dados sintéticos."
} finally {
  if ($customerDeactivated) {
    $null = Invoke-Task024Request $apiBase "/account/reactivate" $CustomerToken "POST"
  }
  $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss zzz")
  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.Add("# TASK-024 — resultado dos testes manuais")
  $lines.Add("")
  $lines.Add("Execução: $timestamp")
  $lines.Add("Ambiente: API/Web local e banco de teste isolado; contas sintéticas mantidas em memória durante a execução.")
  $lines.Add("Credenciais, tokens, e-mails, IDs e respostas brutas foram omitidos.")
  $lines.Add("")
  $lines.Add("| Cenário | Status | Evidência resumida | Falha |")
  $lines.Add("|---|---|---|---|")
  foreach ($result in $results) {
    $evidence = $result.Evidence.Replace('|', '\|')
    $failure = $result.Failure.Replace('|', '\|')
    $lines.Add("| $($result.Id) | $($result.Status) | $evidence | $failure |")
  }
  $lines.Add("")
  $lines.Add("| MT-024-UI-01 a MT-024-UI-03 | BLOQUEADO | Revisão visual não executada; requer navegador e aprovação do responsável. | Evidência humana pendente. |")
  $reportDirectory = Split-Path -Parent $resolvedReportPath
  if (-not (Test-Path $reportDirectory)) { New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null }
  Set-Content -LiteralPath $resolvedReportPath -Value $lines -Encoding UTF8
  $results | Select-Object Id, Status, Evidence | Format-Table -AutoSize
  Write-Output "Relatório sanitizado gerado em docs/testing/TASK-024-testes-manuais-resultado.md."
  $AdminToken = $null; $CatalogToken = $null; $StockToken = $null; $CustomerToken = $null
}
