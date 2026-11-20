[CmdletBinding()]
param(
  [string]$ApiBaseUrl = "http://localhost:3001",
  [System.Management.Automation.PSCredential]$CustomerCredential
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$reportPath = Join-Path $root "docs\testing\TASK-014-testes-manuais-resultado.md"
$fixtureScript = Join-Path $PSScriptRoot "fixtures.mjs"
$apiUri = [uri]$ApiBaseUrl
$prefix = "t14-$([guid]::NewGuid().ToString('N').Substring(0, 24))"
$runAt = [DateTimeOffset]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
$oldEnvironment = @{}
foreach ($key in @("DATABASE_URL", "TASK014_MANUAL_PREFIX", "TASK014_MANUAL_USER_ID", "TASK014_MANUAL_BASELINE", "TASK014_MANUAL_ORDER_ID")) {
  $oldEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
}
$scenarios = [ordered]@{
  "MT-014-01" = [ordered]@{ title = "Recuperação de senha e anti-enumeração"; status = "BLOQUEADO"; evidence = "" }
  "MT-014-02" = [ordered]@{ title = "Notificações de exclusão e reativação de conta"; status = "BLOQUEADO"; evidence = "" }
  "MT-014-03" = [ordered]@{ title = "Pedido confirmado, replay idempotente e autorização"; status = "BLOQUEADO"; evidence = "" }
}
$cleanupStatus = "NÃO EXECUTADA"
$failure = ""
$currentStage = "validação local"
$httpClient = [System.Net.Http.HttpClient]::new()
$locationPushed = $false
$snapshotCreated = $false
$fixturePreparationStarted = $false
$deactivationStarted = $false
$accountReactivated = $false
$customerToken = ""
$userId = ""
$orderId = ""
$databaseUrl = $env:DATABASE_URL

function Write-SanitizedReport {
  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.Add("# TASK-014 — Resultado dos testes manuais")
  $lines.Add("")
  $lines.Add("- Execução UTC: $runAt")
  $lines.Add("- Alvo: API local $($apiUri.Host):$($apiUri.Port) e banco local Lumina")
  $lines.Add("- Dados: sintéticos; credenciais, tokens, destinatários, conteúdo de e-mail e corpos HTTP não são registrados")
  $lines.Add("- Limpeza: $cleanupStatus")
  $lines.Add("")
  $lines.Add("| Cenário | Resultado | Evidência resumida |")
  $lines.Add("|---|---|---|")
  foreach ($id in $scenarios.Keys) {
    $evidence = if ($scenarios[$id].evidence) { $scenarios[$id].evidence } else { "Execução não concluída." }
    $lines.Add("| $id — $($scenarios[$id].title) | $($scenarios[$id].status) | $evidence |")
  }
  if ($failure) {
    $lines.Add("")
    $lines.Add("Falha/bloqueio: $failure")
  }
  $lines.Add("")
  $lines.Add('Pré-requisitos locais: npm run db:migrate; docker compose up -d --build api. Execute este roteiro novamente no PowerShell do Windows.')
  Set-Content -LiteralPath $reportPath -Value $lines -Encoding utf8
}

function Invoke-Api {
  param([string]$Method, [string]$Path, [string]$Token, [object]$Body, [string]$Key)
  $headers = @{}
  if ($Token) { $headers.Authorization = "Bearer $Token" }
  if ($Key) { $headers["Idempotency-Key"] = $Key }
  $request = @{
    Uri = "$($apiUri.AbsoluteUri.TrimEnd('/'))$Path"
    Method = $Method
    Headers = $headers
    SkipHttpErrorCheck = $true
    ErrorAction = "Stop"
  }
  if ($null -ne $Body) {
    $request.ContentType = "application/json"
    $request.Body = $Body | ConvertTo-Json -Depth 8 -Compress
  }
  try {
    $response = Invoke-WebRequest @request
    $parsed = $null
    if ($response.Content) {
      try { $parsed = $response.Content | ConvertFrom-Json } catch { $parsed = $null }
    }
    return [pscustomobject]@{ Status = [int]$response.StatusCode; Json = $parsed }
  } catch {
    return [pscustomobject]@{ Status = 0; Json = $null }
  }
}

function Invoke-FixtureScript {
  param([string]$Mode)
  $result = & node $fixtureScript $Mode 2>$null
  if ($LASTEXITCODE -ne 0) { throw "Fixture local falhou no modo $Mode." }
  try { return ($result -join "`n") | ConvertFrom-Json } catch { throw "Resultado sanitizado da fixture inválido." }
}

function Set-Scenario {
  param([string]$Id, [string]$Status, [string]$Evidence)
  $scenarios[$Id].status = $Status
  $scenarios[$Id].evidence = $Evidence
  Write-SanitizedReport
}

try {
  $currentStage = "validar endpoint local"
  if (-not $apiUri.IsLoopback) { throw "Use somente uma API local de loopback." }
  $currentStage = "carregar configuração do banco local"
  if (-not $databaseUrl -and -not (Test-Path -LiteralPath (Join-Path $root ".env"))) {
    throw "Disponibilize o .env local do projeto ou configure DATABASE_URL na sessão."
  }
  if (-not $databaseUrl) {
    $envValues = @{}
    Get-Content -LiteralPath (Join-Path $root ".env") | ForEach-Object {
      if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
        $envValues[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
      }
    }
    foreach ($key in @("POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB", "POSTGRES_PORT")) {
      if (-not $envValues.ContainsKey($key)) { throw "Configuração local de banco incompleta." }
    }
    $databaseBuilder = [System.UriBuilder]::new("postgresql", "localhost", [int]$envValues.POSTGRES_PORT, $envValues.POSTGRES_DB)
    $databaseBuilder.UserName = [uri]::EscapeDataString($envValues.POSTGRES_USER)
    $databaseBuilder.Password = [uri]::EscapeDataString($envValues.POSTGRES_PASSWORD)
    $databaseUrl = $databaseBuilder.Uri.AbsoluteUri
  }
  $currentStage = "validar destino de banco local"
  $databaseUri = [uri]$databaseUrl
  if (-not $databaseUri.IsLoopback -or $databaseUri.AbsolutePath -notmatch '^/lumina(?:_[a-z0-9_]+)?$') {
    throw "Fixtures só são permitidas em banco local Lumina."
  }
  Push-Location $root
  $locationPushed = $true
  $env:DATABASE_URL = $databaseUrl
  $env:TASK014_MANUAL_PREFIX = $prefix
  $currentStage = "preflight GET /works"
  $health = Invoke-Api -Method "GET" -Path "/works?limit=1" -Token "" -Body $null -Key ""
  if ($health.Status -ne 200) { throw "API local indisponível (HTTP $($health.Status))." }
  $currentStage = "preflight POST /checkout sem autenticação"
  $routeCheck = Invoke-Api -Method "POST" -Path "/checkout" -Token "" -Body $null -Key "$prefix-preflight"
  if ($routeCheck.Status -ne 401) { throw "API local não confirmou o comportamento de autenticação do checkout." }
  $currentStage = "verificar schema de notificações"
  $schema = Invoke-FixtureScript -Mode "verify-schema"
  if (-not $schema.ready) { throw "Migration do outbox TASK-014 ausente; execute npm run db:migrate e reconstrua a API." }

  $currentStage = "autenticar cliente sintético"
  if (-not $CustomerCredential) { $CustomerCredential = Get-Credential -Message "Conta CUSTOMER sintética" }
  $login = Invoke-Api -Method "POST" -Path "/auth/login" -Token "" -Body @{
    email = $CustomerCredential.UserName
    password = $CustomerCredential.GetNetworkCredential().Password
  } -Key ""
  if ($login.Status -ne 201 -or $login.Json.user.role -ne "CUSTOMER" -or -not $login.Json.user.isEmailConfirmed) {
    throw "Login local falhou ou conta não é CUSTOMER ativa/confirmada."
  }
  $customerToken = $login.Json.accessToken
  $userId = $login.Json.user.id
  $env:TASK014_MANUAL_USER_ID = $userId
  $snapshot = Invoke-FixtureScript -Mode "snapshot"
  $env:TASK014_MANUAL_BASELINE = $snapshot | ConvertTo-Json -Depth 4 -Compress
  $snapshotCreated = $true
  $cart = Invoke-Api -Method "GET" -Path "/cart" -Token $customerToken -Body $null -Key ""
  if ($cart.Status -ne 200 -or $cart.Json.items.Count -gt 0 -or $cart.Json.coupon) {
    throw "Carrinho CUSTOMER deve estar vazio antes do roteiro."
  }

  $currentStage = "MT-014-01"
  $knownAccount = Invoke-Api -Method "POST" -Path "/auth/forgot-password" -Token "" -Body @{ email = $CustomerCredential.UserName } -Key ""
  $unknownAccount = Invoke-Api -Method "POST" -Path "/auth/forgot-password" -Token "" -Body @{ email = "missing-$([guid]::NewGuid().ToString('N'))@example.invalid" } -Key ""
  $resetState = Invoke-FixtureScript -Mode "verify-account"
  if ($knownAccount.Status -eq 201 -and $unknownAccount.Status -eq 201 -and
      $knownAccount.Json.message -eq $unknownAccount.Json.message -and $resetState.resetSent -eq 1) {
    Set-Scenario "MT-014-01" "APROVADO" "Respostas anti-enumeração iguais; notificação de recuperação registrada como SENT com uma tentativa."
  } else {
    Set-Scenario "MT-014-01" "REPROVADO" "Status HTTP: conta existente $($knownAccount.Status), inexistente $($unknownAccount.Status); evento SENT observado: $($resetState.resetSent)."
  }

  $currentStage = "MT-014-02"
  $deactivationStarted = $true
  $deactivation = Invoke-Api -Method "POST" -Path "/account/deactivate-request" -Token $customerToken -Body @{ reason = "Validação sintética TASK-014" } -Key ""
  $reactivation = Invoke-Api -Method "POST" -Path "/account/reactivate" -Token $customerToken -Body $null -Key ""
  if ($reactivation.Status -eq 201) { $accountReactivated = $true }
  $accountState = Invoke-FixtureScript -Mode "verify-account"
  if ($deactivation.Status -eq 201 -and $reactivation.Status -eq 201 -and
      $accountState.deletionSent -eq 2 -and $accountState.reactivationSent -eq 2 -and $accountState.unexpectedOrUnsent -eq 0) {
    Set-Scenario "MT-014-02" "APROVADO" "Solicitação e reativação confirmadas; duas notificações SENT por evento (cliente/admin), sem eventos pendentes."
  } else {
    Set-Scenario "MT-014-02" "REPROVADO" "Status HTTP: desativação $($deactivation.Status), reativação $($reactivation.Status); notificações SENT: exclusão $($accountState.deletionSent), reativação $($accountState.reactivationSent)."
  }

  $currentStage = "preparar pedido sintético"
  $fixturePreparationStarted = $true
  $fixtures = Invoke-FixtureScript -Mode "prepare"
  $addItem = Invoke-Api -Method "POST" -Path "/cart/items" -Token $customerToken -Body @{ editionId = $fixtures.editionId; quantity = 1 } -Key ""
  $currentStage = "MT-014-03"
  $unauthorized = Invoke-Api -Method "POST" -Path "/checkout" -Token "" -Body $null -Key "$prefix-unauth"
  $orderKey = "$prefix-purchase"
  $purchase = Invoke-Api -Method "POST" -Path "/checkout" -Token $customerToken -Body $null -Key $orderKey
  $replay = Invoke-Api -Method "POST" -Path "/checkout" -Token $customerToken -Body $null -Key $orderKey
  if ($purchase.Status -eq 201) {
    $orderId = $purchase.Json.id
    $env:TASK014_MANUAL_ORDER_ID = $orderId
  }
  $orderEvent = if ($orderId) { Invoke-FixtureScript -Mode "verify-order" } else { [pscustomobject]@{ count = 0; sent = 0 } }
  if ($addItem.Status -eq 201 -and $unauthorized.Status -eq 401 -and
      $purchase.Status -eq 201 -and $replay.Status -eq 201 -and $purchase.Json.id -eq $replay.Json.id -and
      $purchase.Json.totalCents -eq 0 -and $purchase.Json.payment.status -eq "NOT_REQUIRED" -and
      $orderEvent.count -eq 1 -and $orderEvent.sent -eq 1) {
    Set-Scenario "MT-014-03" "APROVADO" "Acesso sem token 401; pedido gratuito confirmado e replay idempotente; uma notificação SENT."
  } else {
    Set-Scenario "MT-014-03" "REPROVADO" "Status HTTP: item $($addItem.Status), sem token $($unauthorized.Status), compra $($purchase.Status), replay $($replay.Status); notificações SENT $($orderEvent.sent)."
  }
} catch {
  $preflight = @()
  if ($null -ne $health) { $preflight += "GET /works HTTP $($health.Status)" }
  if ($null -ne $routeCheck) { $preflight += "POST /checkout HTTP $($routeCheck.Status)" }
  if ($null -ne $schema) { $preflight += "notifications schema ready=$([bool]$schema.ready)" }
  $evidence = if ($preflight.Count) { "; evidência sanitizada: $($preflight -join ', ')" } else { "" }
  $failure = "Falha na etapa $currentStage ($($_.Exception.GetType().Name))$evidence; consulte os pré-requisitos e não compartilhe credenciais nem respostas HTTP."
} finally {
  if ($deactivationStarted -and -not $accountReactivated -and $customerToken) {
    try {
      $recovery = Invoke-Api -Method "POST" -Path "/account/reactivate" -Token $customerToken -Body $null -Key ""
      if ($recovery.Status -eq 201) { $accountReactivated = $true } else { $cleanupStatus = "FALHOU: restauração da conta" }
    } catch { $cleanupStatus = "FALHOU: restauração da conta" }
  }
  if ($snapshotCreated) {
    try {
      $cleanup = Invoke-FixtureScript -Mode "cleanup"
      if ($cleanup.cleaned -eq $true -and $cleanupStatus -ne "FALHOU: restauração da conta") { $cleanupStatus = "CONFIRMADA" }
    } catch { $cleanupStatus = "FALHOU" }
  } elseif ($cleanupStatus -eq "NÃO EXECUTADA") {
    $cleanupStatus = "NÃO NECESSÁRIA; fixtures e eventos de conta não criados"
  }
  Write-SanitizedReport
  $httpClient.Dispose()
  foreach ($key in $oldEnvironment.Keys) {
    [Environment]::SetEnvironmentVariable($key, $oldEnvironment[$key], "Process")
  }
  if ($locationPushed) { Pop-Location }
  Write-Output "Relatório sanitizado criado/atualizado: $reportPath"
  if ($failure) { Write-Output "Execução BLOQUEADA: $failure" }
}

if ($failure) { exit 1 }
if ($scenarios.Values.Where({ $_.status -ne "APROVADO" }).Count -gt 0 -or $cleanupStatus -ne "CONFIRMADA") { exit 1 }
