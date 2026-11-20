[CmdletBinding()]
param(
  [string]$ApiBaseUrl = "http://localhost:3001",
  [System.Management.Automation.PSCredential]$Customer1Credential,
  [System.Management.Automation.PSCredential]$Customer2Credential,
  [System.Management.Automation.PSCredential]$AdminCredential
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$reportPath = Join-Path $root "docs\testing\TASK-013-testes-manuais-resultado.md"
$fixtureScript = Join-Path $PSScriptRoot "fixtures.mjs"
$apiUri = [uri]$ApiBaseUrl
$prefix = "t13-$([guid]::NewGuid().ToString('N').Substring(0, 24))"
$runAt = [DateTimeOffset]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
$oldEnvironment = @{
  DATABASE_URL = $env:DATABASE_URL
  TASK013_MANUAL_PREFIX = $env:TASK013_MANUAL_PREFIX
  TASK013_MANUAL_SHIPPING_RULE_ID = $env:TASK013_MANUAL_SHIPPING_RULE_ID
  TASK013_MANUAL_PHYSICAL_EDITION_ID = $env:TASK013_MANUAL_PHYSICAL_EDITION_ID
  TASK013_MANUAL_HYBRID_DIGITAL_EDITION_ID = $env:TASK013_MANUAL_HYBRID_DIGITAL_EDITION_ID
  TASK013_MANUAL_COUPON_CODE = $env:TASK013_MANUAL_COUPON_CODE
}
$scenarios = [ordered]@{
  "MT-013-01" = [ordered]@{ title = "Autenticação, papel e carrinho vazio"; status = "BLOQUEADO"; evidence = "" }
  "MT-013-02" = [ordered]@{ title = "Pedido digital gratuito e idempotência"; status = "BLOQUEADO"; evidence = "" }
  "MT-013-03" = [ordered]@{ title = "Pedido híbrido e concorrência de estoque/licença"; status = "BLOQUEADO"; evidence = "" }
  "MT-013-04" = [ordered]@{ title = "Concorrência na cota do cupom"; status = "BLOQUEADO"; evidence = "" }
}
$cleanupStatus = "NÃO EXECUTADA"
$failure = ""
$couponPreparationStatuses = [System.Collections.Generic.List[string]]::new()
$currentStage = "validação local"
$httpClient = [System.Net.Http.HttpClient]::new()
$locationPushed = $false
$fixturePreparationStarted = $false
$databaseUrl = $env:DATABASE_URL

function Write-SanitizedReport {
  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.Add("# TASK-013 — Resultado dos testes manuais")
  $lines.Add("")
  $lines.Add("- Execução UTC: $runAt")
  $lines.Add("- Alvo: API local $($apiUri.Host):$($apiUri.Port) e banco local Lumina")
  $lines.Add("- Dados: sintéticos; credenciais, tokens, CPF, endereço e corpos HTTP não são gravados neste relatório")
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
  $lines.Add("Para preparar ambiente local: npm run db:migrate; docker compose up -d --build api. Em seguida, execute este roteiro novamente.")
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
    # Preserve only the exception type for troubleshooting; never write the
    # exception message, request body, headers, or credentials to the report.
    return [pscustomobject]@{ Status = 0; Json = $null; TransportError = $_.Exception.GetType().Name }
  }
}

function New-CheckoutRequest {
  param([string]$Token, [string]$Key, [object]$Address)
  $request = [System.Net.Http.HttpRequestMessage]::new(
    [System.Net.Http.HttpMethod]::Post,
    "$($apiUri.AbsoluteUri.TrimEnd('/'))/checkout"
  )
  $request.Headers.Authorization = [System.Net.Http.Headers.AuthenticationHeaderValue]::new("Bearer", $Token)
  $request.Headers.Add("Idempotency-Key", $Key)
  if ($null -ne $Address) {
    $json = @{ shippingAddress = $Address } | ConvertTo-Json -Depth 8 -Compress
    $request.Content = [System.Net.Http.StringContent]::new($json, [System.Text.Encoding]::UTF8, "application/json")
  }
  return $httpClient.SendAsync($request)
}

function Get-ResponsePayload {
  param($Response)
  $content = $Response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  if (-not $content) { return $null }
  try { return $content | ConvertFrom-Json } catch { return $null }
}

function Invoke-FixtureScript {
  param([string]$Mode)
  $result = & node $fixtureScript $Mode 2>$null
  if ($LASTEXITCODE -ne 0) { throw "Banco local não preparou/limpou os dados sintéticos." }
  try { return ($result -join "`n") | ConvertFrom-Json } catch { throw "Resposta sanitizada da preparação local inválida." }
}

function Set-Scenario {
  param([string]$Id, [string]$Status, [string]$Evidence)
  $scenarios[$Id].status = $Status
  $scenarios[$Id].evidence = $Evidence
  Write-SanitizedReport
}

try {
  $currentStage = "verificar API local"
  if (-not $apiUri.IsLoopback) { throw "Use somente uma API local de loopback." }
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
  $databaseUri = [uri]$databaseUrl
  if (-not $databaseUri.IsLoopback -or $databaseUri.AbsolutePath -notmatch '^/lumina(?:_[a-z0-9_]+)?$') {
    throw "Fixtures só são permitidos em um banco local Lumina." 
  }

  if (-not $Customer1Credential) { $Customer1Credential = Get-Credential -Message "Conta CUSTOMER sintética 1" }
  if (-not $Customer2Credential) { $Customer2Credential = Get-Credential -Message "Conta CUSTOMER sintética 2" }
  if (-not $AdminCredential) { $AdminCredential = Get-Credential -Message "Conta ADMIN local" }
  if ($Customer1Credential.UserName -eq $Customer2Credential.UserName) { throw "Use duas contas CUSTOMER distintas." }

  Push-Location $root
  $locationPushed = $true
  $env:DATABASE_URL = $databaseUrl
  $env:TASK013_MANUAL_PREFIX = $prefix
  $env:TASK013_MANUAL_SHIPPING_RULE_ID = ""

  $health = Invoke-Api -Method "GET" -Path "/works?limit=1" -Token "" -Body $null -Key ""
  if ($health.Status -ne 200) {
    if ($health.Status -eq 0) { throw "API local sem conexão HTTP (falha de transporte: $($health.TransportError)); confira o serviço e a URL local." }
    throw "API local respondeu HTTP $($health.Status) em /works; confira se o serviço correto está na porta configurada."
  }
  $routeCheck = Invoke-Api -Method "POST" -Path "/checkout" -Token "" -Body $null -Key "$prefix-preflight"
  if ($routeCheck.Status -ne 401) { throw "API não expõe a rota TASK-013; aplique a migração e reconstrua o serviço api." }

  $currentStage = "autenticar usuários sintéticos"
  $customer1Login = Invoke-Api -Method "POST" -Path "/auth/login" -Token "" -Body @{
    email = $Customer1Credential.UserName
    password = $Customer1Credential.GetNetworkCredential().Password
  } -Key ""
  $customer2Login = Invoke-Api -Method "POST" -Path "/auth/login" -Token "" -Body @{
    email = $Customer2Credential.UserName
    password = $Customer2Credential.GetNetworkCredential().Password
  } -Key ""
  $adminLogin = Invoke-Api -Method "POST" -Path "/auth/login" -Token "" -Body @{
    email = $AdminCredential.UserName
    password = $AdminCredential.GetNetworkCredential().Password
  } -Key ""
  if ($customer1Login.Status -ne 201 -or $customer2Login.Status -ne 201 -or $adminLogin.Status -ne 201) {
    throw "Login local falhou; confira se as três contas estão ativas e confirmadas." 
  }
  $customer1Token = $customer1Login.Json.accessToken
  $customer2Token = $customer2Login.Json.accessToken
  $adminToken = $adminLogin.Json.accessToken
  if ($customer1Login.Json.user.role -ne "CUSTOMER" -or $customer2Login.Json.user.role -ne "CUSTOMER" -or $adminLogin.Json.user.role -ne "ADMIN") {
    throw "Papéis das contas não correspondem aos parâmetros esperados." 
  }

  $currentStage = "verificar carrinhos de teste vazios"
  foreach ($entry in @(@($customer1Token, "cliente 1"), @($customer2Token, "cliente 2"))) {
    $cart = Invoke-Api -Method "GET" -Path "/cart" -Token $entry[0] -Body $null -Key ""
    if ($cart.Status -ne 200 -or $cart.Json.items.Count -gt 0 -or $cart.Json.coupon) {
      throw "Carrinho da $($entry[1]) deve estar vazio e sem cupom antes do roteiro." 
    }
  }

  $currentStage = "verificar migração da TASK-013"
  $schema = Invoke-FixtureScript -Mode "verify-schema"
  if (-not $schema.orders -or -not $schema.orderItems -or -not $schema.payments) {
    throw "Migração da TASK-013 ausente no banco local; execute npm run db:migrate e repita." 
  }
  $currentStage = "preparar dados sintéticos"
  $fixturePreparationStarted = $true
  $fixtures = Invoke-FixtureScript -Mode "prepare"
  $env:TASK013_MANUAL_SHIPPING_RULE_ID = $fixtures.shippingRuleId
  $env:TASK013_MANUAL_PHYSICAL_EDITION_ID = $fixtures.physicalEditionId
  $env:TASK013_MANUAL_HYBRID_DIGITAL_EDITION_ID = $fixtures.hybridDigitalEditionId
  $env:TASK013_MANUAL_COUPON_CODE = $fixtures.couponCode
  $address = @{
    recipientName = "Destinatário Sintético"
    cpf = "529.982.247-25"
    phone = "11987654321"
    postalCode = "99999-999"
    street = "Rua Sintética"
    number = "10"
    district = "Centro"
    city = "São Paulo"
    state = "SP"
  }

  $currentStage = "MT-013-01"
  $adminDenied = Invoke-Api -Method "POST" -Path "/checkout" -Token $adminToken -Body $null -Key "$prefix-admin"
  $missingKey = Invoke-Api -Method "POST" -Path "/checkout" -Token $customer1Token -Body $null -Key ""
  $emptyCart = Invoke-Api -Method "POST" -Path "/checkout" -Token $customer1Token -Body $null -Key "$prefix-empty"
  if ($adminDenied.Status -eq 403 -and $missingKey.Status -eq 400 -and $emptyCart.Status -eq 409) {
    Set-Scenario "MT-013-01" "APROVADO" "ADMIN 403; chave ausente 400; carrinho vazio 409."
  } else {
    Set-Scenario "MT-013-01" "REPROVADO" "Status observados: ADMIN $($adminDenied.Status), chave $($missingKey.Status), vazio $($emptyCart.Status)."
  }

  $currentStage = "MT-013-02"
  $freeAdd = Invoke-Api -Method "POST" -Path "/cart/items" -Token $customer1Token -Body @{ editionId = $fixtures.freeEditionId; quantity = 1 } -Key ""
  $freeKey = "$prefix-free"
  $freeOrder = Invoke-Api -Method "POST" -Path "/checkout" -Token $customer1Token -Body $null -Key $freeKey
  $freeReplay = Invoke-Api -Method "POST" -Path "/checkout" -Token $customer1Token -Body $null -Key $freeKey
  if ($freeAdd.Status -eq 201 -and $freeOrder.Status -eq 201 -and $freeReplay.Status -eq 201 -and
      $freeOrder.Json.totalCents -eq 0 -and $freeOrder.Json.payment.status -eq "NOT_REQUIRED" -and
      $freeOrder.Json.id -eq $freeReplay.Json.id) {
    Set-Scenario "MT-013-02" "APROVADO" "Pedido de R$ 0,00 sem pagamento; repetição devolveu o mesmo pedido."
  } else {
    Set-Scenario "MT-013-02" "REPROVADO" "Status observados: inclusão $($freeAdd.Status), pedido $($freeOrder.Status), repetição $($freeReplay.Status)."
  }

  $currentStage = "MT-013-03"
  foreach ($token in @($customer1Token, $customer2Token)) {
    $physicalAdd = Invoke-Api -Method "POST" -Path "/cart/items" -Token $token -Body @{ editionId = $fixtures.physicalEditionId; quantity = 1 } -Key ""
    $digitalAdd = Invoke-Api -Method "POST" -Path "/cart/items" -Token $token -Body @{ editionId = $fixtures.hybridDigitalEditionId; quantity = 1 } -Key ""
    if ($physicalAdd.Status -ne 201 -or $digitalAdd.Status -ne 201) { throw "Não foi possível preparar ambos os carrinhos híbridos." }
  }
  $race = @(
    (New-CheckoutRequest -Token $customer1Token -Key "$prefix-hybrid-a" -Address $address),
    (New-CheckoutRequest -Token $customer2Token -Key "$prefix-hybrid-b" -Address $address)
  )
  [System.Threading.Tasks.Task]::WaitAll([System.Threading.Tasks.Task[]]$race)
  $raceResponses = @($race | ForEach-Object { $_.Result })
  $raceStatuses = @($raceResponses | ForEach-Object { [int]$_.StatusCode } | Sort-Object)
  $winningOrder = $null
  foreach ($response in $raceResponses) {
    if ([int]$response.StatusCode -eq 201) { $winningOrder = Get-ResponsePayload -Response $response }
  }
  if (($raceStatuses -join ",") -eq "201,409" -and $winningOrder.items.Count -eq 2 -and $winningOrder.payment.status -eq "APPROVED") {
    $hybridState = Invoke-FixtureScript -Mode "verify-hybrid"
    if ($hybridState.physicalStock -eq 0 -and $hybridState.digitalAllocated -eq 1 -and $hybridState.hybridOrders -eq 1) {
      Set-Scenario "MT-013-03" "APROVADO" "Uma confirmação 201 e um conflito 409; estoque 0, licença alocada 1 e um pedido híbrido."
    } else {
      Set-Scenario "MT-013-03" "REPROVADO" "Contadores do banco isolado não correspondem a uma única venda híbrida."
    }
  } else {
    Set-Scenario "MT-013-03" "REPROVADO" "Status concorrentes: $($raceStatuses -join ','); nenhum detalhe de resposta foi registrado."
  }

  $currentStage = "MT-013-04"
  $customerIndex = 0
  foreach ($token in @($customer1Token, $customer2Token)) {
    $customerIndex++
    foreach ($editionId in @($fixtures.physicalEditionId, $fixtures.hybridDigitalEditionId)) {
      $null = Invoke-Api -Method "DELETE" -Path "/cart/items/$editionId" -Token $token -Body $null -Key ""
    }
    $couponEditionAdd = Invoke-Api -Method "POST" -Path "/cart/items" -Token $token -Body @{ editionId = $fixtures.couponEditionId; quantity = 1 } -Key ""
    $couponApply = Invoke-Api -Method "POST" -Path "/cart/coupon" -Token $token -Body @{ code = $fixtures.couponCode } -Key ""
    $couponPreparationStatuses.Add("cliente ${customerIndex}: inclusão HTTP $($couponEditionAdd.Status), cupom HTTP $($couponApply.Status)")
    if ($couponEditionAdd.Status -ne 201 -or $couponApply.Status -ne 201) { throw "Não foi possível preparar a concorrência de cupom." }
  }
  $couponRace = @(
    (New-CheckoutRequest -Token $customer1Token -Key "$prefix-coupon-a" -Address $null),
    (New-CheckoutRequest -Token $customer2Token -Key "$prefix-coupon-b" -Address $null)
  )
  [System.Threading.Tasks.Task]::WaitAll([System.Threading.Tasks.Task[]]$couponRace)
  $couponStatuses = @($couponRace | ForEach-Object { [int]$_.Result.StatusCode } | Sort-Object)
  if (($couponStatuses -join ",") -eq "201,409") {
    $couponState = Invoke-FixtureScript -Mode "verify-coupon"
    if ($couponState.usageCount -eq 1 -and $couponState.couponOrders -eq 1) {
      Set-Scenario "MT-013-04" "APROVADO" "Cota 1: uma confirmação 201, um conflito 409 e um único uso/pedido no banco local."
    } else {
      Set-Scenario "MT-013-04" "REPROVADO" "Contador de uso ou pedidos do cupom divergiu da cota de 1."
    }
  } else {
    Set-Scenario "MT-013-04" "REPROVADO" "Status concorrentes: $($couponStatuses -join ',')."
  }
} catch {
  $exceptionType = $_.Exception.GetType().Name
  if ($currentStage -eq "verificar API local" -and $health -and $health.Status -eq 0 -and $health.TransportError) {
    $exceptionType = $health.TransportError
  }
  if ($currentStage -eq "MT-013-04" -and $couponPreparationStatuses.Count -gt 0) {
    $failure = "Falha na etapa $currentStage ($exceptionType); status sanitizados da preparação: $($couponPreparationStatuses -join '; ')."
  } else {
    $failure = "Falha na etapa $currentStage ($exceptionType); confira o serviço local e repita sem compartilhar credenciais ou conteúdo HTTP."
  }
} finally {
  if ($fixturePreparationStarted) {
    try {
      $cleanup = Invoke-FixtureScript -Mode "cleanup"
      if ($cleanup.cleaned -eq $true) { $cleanupStatus = "CONFIRMADA" } else { $cleanupStatus = "FALHOU" }
    } catch { $cleanupStatus = "FALHOU" }
  } elseif ($cleanupStatus -eq "NÃO EXECUTADA") {
    $cleanupStatus = "NÃO NECESSÁRIA; fixtures não criadas"
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
