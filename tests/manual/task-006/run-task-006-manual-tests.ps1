[CmdletBinding()]
param(
  [string]$ApiBase = "http://localhost:3001",
  [string]$WebBase = "http://localhost:3000",
  [string]$ReportPath = "docs/testing/TASK-006-testes-manuais-resultado.md",
  [switch]$StartCompose
)

$ErrorActionPreference = "Stop"
$results = [System.Collections.Generic.List[object]]::new()
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$suffix = [Guid]::NewGuid().ToString("N").Substring(0, 10)
$customerEmail = "task006-$suffix@example.invalid"
$customerPassword = "Task006-$suffix-Password!"
$adminEmail = $env:TASK006_ADMIN_EMAIL
$adminPassword = $env:TASK006_ADMIN_PASSWORD

function Add-Result([string]$Id, [string]$Name, [string]$Status, [string]$Evidence) {
  $script:results.Add([pscustomobject]@{ Id=$Id; Name=$Name; Status=$Status; Evidence=$Evidence })
}

function Invoke-Api([string]$Method, [string]$Path, [object]$Body = $null, [string]$Token = $null) {
  $headers = @{}
  if ($Token) { $headers.Authorization = "Bearer $Token" }
  try {
    $params = @{ Method=$Method; Uri="$ApiBase$Path"; Headers=$headers; UseBasicParsing=$true }
    if ($null -ne $Body) { $params.ContentType = "application/json"; $params.Body = ($Body | ConvertTo-Json -Compress) }
    $response = Invoke-WebRequest @params
    [pscustomobject]@{ Status=[int]$response.StatusCode; Body=$response.Content }
  } catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
      $status = [int]$errorResponse.StatusCode
      [pscustomobject]@{ Status=$status; Body="http-error" }
    } else {
      [pscustomobject]@{ Status=0; Body="request-failed" }
    }
  }
}

function Get-TokenFromOutbox([string]$Email) {
  $row = docker compose exec -T postgres psql -U lumina -d lumina -Atc "SELECT body FROM outbox_emails WHERE to_email = '$Email' ORDER BY created_at DESC LIMIT 1" 2>$null
  if (-not $row) { return $null }
  $match = [regex]::Match(($row -join "`n"), '([A-Za-z0-9_-]{40,})')
  if ($match.Success) { return $match.Groups[1].Value }
  return $null
}

if ($StartCompose) {
  docker compose up -d postgres api web | Out-Null
  for ($attempt = 0; $attempt -lt 15; $attempt++) {
    try { $health = Invoke-WebRequest -Uri $WebBase -UseBasicParsing; if ($health.StatusCode -gt 0) { break } } catch { }
    Start-Sleep -Seconds 2
  }
}

try {
  $web = Invoke-WebRequest -Uri $WebBase -UseBasicParsing
  Add-Result "MT-006-01" "Superfícies locais" ($(if ($web.StatusCode -eq 200) { "APROVADO" } else { "REPROVADO" })) "Web HTTP $($web.StatusCode); API verificada separadamente."
} catch { Add-Result "MT-006-01" "Superfícies locais" "BLOQUEADO" "Web indisponível." }

$unauth = Invoke-Api GET "/admin/users"
$auditUnauth = Invoke-Api GET "/admin/audit-logs"
if ($unauth.Status -eq 401 -and $auditUnauth.Status -eq 401) { Add-Result "MT-006-02" "Acesso administrativo sem credencial" "APROVADO" "admin/users=$($unauth.Status); admin/audit-logs=$($auditUnauth.Status)." } else { Add-Result "MT-006-02" "Acesso administrativo sem credencial" "REPROVADO" "Status observados: $($unauth.Status), $($auditUnauth.Status)." }

$registered = Invoke-Api POST "/auth/register" @{ email=$customerEmail; password=$customerPassword }
$verifyToken = Get-TokenFromOutbox $customerEmail
if ($registered.Status -in 200,201 -and $verifyToken) {
  $confirmed = Invoke-Api POST "/auth/confirm-email" @{ token=$verifyToken }
  $login = Invoke-Api POST "/auth/login" @{ email=$customerEmail; password=$customerPassword }
  $loginJson = $login.Body | ConvertFrom-Json
  $customerToken = $loginJson.accessToken
  if ($confirmed.Status -eq 201 -and $login.Status -in 200,201 -and $customerToken) {
    $forbidden = Invoke-Api GET "/admin/users" $null $customerToken
    if ($forbidden.Status -eq 403) { Add-Result "MT-006-03" "Cliente em rota administrativa" "APROVADO" "Cliente CUSTOMER recebeu HTTP 403; token não registrado." } else { Add-Result "MT-006-03" "Cliente em rota administrativa" "REPROVADO" "Status observado: $($forbidden.Status)." }
    $deactivate = Invoke-Api POST "/account/deactivate-request" @{ reason="teste manual sintético" } $customerToken
    $reactivate = Invoke-Api POST "/account/reactivate" $null $customerToken
    if ($deactivate.Status -in 200,201 -and $reactivate.Status -in 200,201) { Add-Result "MT-006-05" "Desativação e reativação" "APROVADO" "Desativação=$($deactivate.Status); reativação=$($reactivate.Status)." } else { Add-Result "MT-006-05" "Desativação e reativação" "REPROVADO" "Status: $($deactivate.Status), $($reactivate.Status)." }
  } else { Add-Result "MT-006-03" "Cliente em rota administrativa" "BLOQUEADO" "Cadastro/login não concluído."; Add-Result "MT-006-05" "Desativação e reativação" "BLOQUEADO" "Cadastro/login não concluído." }
} else { Add-Result "MT-006-03" "Cliente em rota administrativa" "BLOQUEADO" "Cadastro HTTP $($registered.Status); token de confirmação encontrado: $([bool]$verifyToken)."; Add-Result "MT-006-05" "Desativação e reativação" "BLOQUEADO" "Cadastro HTTP $($registered.Status); cliente sintético não autenticado." }

if ($adminEmail -and $adminPassword) {
  $adminLogin = Invoke-Api POST "/auth/login" @{ email=$adminEmail; password=$adminPassword }
  if ($adminLogin.Status -in 200,201) {
    $adminToken = ($adminLogin.Body | ConvertFrom-Json).accessToken
    $audit = Invoke-Api GET "/admin/audit-logs" $null $adminToken
    Add-Result "MT-006-04" "Motivo e auditoria" ($(if ($audit.Status -eq 200) { "APROVADO" } else { "REPROVADO" })) "Consulta administrativa HTTP $($audit.Status); conteúdo não reproduzido."
  } else { Add-Result "MT-006-04" "Motivo e auditoria" "BLOQUEADO" "Credenciais administrativas sintéticas não autenticaram." }
} else { Add-Result "MT-006-04" "Motivo e auditoria" "BLOQUEADO" "Defina TASK006_ADMIN_EMAIL e TASK006_ADMIN_PASSWORD para executar este cenário." }

$webMatches = rg -n "prisma|DATABASE_URL|postgresql://|mysql://|mongodb://" apps/web 2>$null
if (-not $webMatches) { Add-Result "MT-006-06" "Isolamento Web/API e segredos" "APROVADO" "Nenhuma referência direta a banco encontrada em apps/web." } else { Add-Result "MT-006-06" "Isolamento Web/API e segredos" "REPROVADO" "Referências encontradas; revisar manualmente." }

$dir = Split-Path -Parent $ReportPath
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$lines = @("# Resultado dos testes manuais - TASK-006", "", "Executado em UTC: $timestamp", "", "Tokens, senhas e PII foram omitidos. O relatório contém somente resultados sanitizados.", "", "| ID | Cenario | Status | Evidencia sanitizada |", "|---|---|---|---|")
foreach ($r in $results) { $lines += "| $($r.Id) | $($r.Name) | $($r.Status) | $($r.Evidence.Replace('|','/')) |" }
$lines += "", "## Análise", "", "A aprovação da Etapa 005 depende de todos os cenários críticos aprovados e da revisão humana deste relatório. Cenários `BLOQUEADO` exigem correção de ambiente ou credenciais sintéticas e nova execução.", "", "## Ambiente", "", "API: $ApiBase; Web: $WebBase; dados: PostgreSQL local do Compose."
Set-Content -LiteralPath $ReportPath -Value $lines -Encoding utf8
$results | Format-Table -AutoSize
Write-Output "Relatório gerado: $ReportPath"
