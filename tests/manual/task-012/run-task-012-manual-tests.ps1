[CmdletBinding()]
param(
  [string]$ApiBaseUrl = "http://localhost:3001",
  [PSCredential]$CustomerCredential,
  [PSCredential]$AdminCredential,
  [string]$ReportPath = "docs/testing/TASK-012-testes-manuais-resultado.md"
)

$ErrorActionPreference = "Stop"
$ApiBaseUrl = $ApiBaseUrl.TrimEnd("/")
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$resolvedReportPath = if ([System.IO.Path]::IsPathRooted($ReportPath)) { $ReportPath } else { Join-Path $repoRoot $ReportPath }
$scenarioRows = [System.Collections.Generic.List[object]]::new()
$scenarioIds = @{
  "MT-012-01" = "Acesso ao carrinho sem autenticação"
  "MT-012-02" = "Isolamento do cliente e autorização por papel"
  "MT-012-03" = "Persistência do carrinho e quantidade física"
  "MT-012-04" = "E-book duplicado ou já adquirido"
  "MT-012-05" = "Recusa de quantidade inválida ou indisponível"
  "MT-012-06" = "Cupom válido e cupom expirado"
  "MT-012-07" = "Cota de cupom esgotada"
  "MT-012-08" = "Validação de CPF/endereço e frete físico"
  "MT-012-09" = "Carrinho somente digital sem frete"
  "MT-012-10" = "Limpeza dos dados sintéticos"
}
foreach ($id in $scenarioIds.Keys) { $scenarioRows.Add([pscustomobject]@{ Id = $id; Name = $scenarioIds[$id]; Status = "BLOQUEADO"; Evidence = "NÃO EXECUTADO"; Failure = "Execução manual pendente" }) }

$customerToken = $null
$adminToken = $null
$testCouponId = $null
$expiredCouponId = $null
$shippingRuleId = $null
$physicalEditionId = $null
$digitalEditionId = $null
$digitalEditionCandidates = [System.Collections.Generic.List[string]]::new()
$physicalAdded = $false
$digitalAdded = $false
$couponAttached = $false
$couponHelperUpdated = $false
$cleanupComplete = $false
$script:failureStage = "preparação inicial"
$dateTag = [guid]::NewGuid().ToString("N").Substring(0, 12).ToUpperInvariant()
$testCouponCode = "T012-MANUAL-$dateTag"
$expiredCouponCode = "T012-EXP-$dateTag"
$syntheticAddress = @{
  recipientName = "Cliente Sintético"
  cpf = "529.982.247-25"
  phone = "11987654321"
  postalCode = "01001000"
  street = "Rua Sintética"
  number = "10"
  district = "Centro"
  city = "São Paulo"
  state = "SP"
}

function Set-Scenario([string]$Id, [string]$Status, [string]$Evidence, [string]$Failure = "") {
  $row = $scenarioRows | Where-Object Id -eq $Id | Select-Object -First 1
  $row.Status = $Status
  $row.Evidence = $Evidence
  $row.Failure = if ($Failure) { $Failure } else { "—" }
}

function Invoke-Api([string]$Path, [string]$Method = "GET", [string]$Token, [object]$Body) {
  $parameters = @{ Uri = "$ApiBaseUrl$Path"; Method = $Method; SkipHttpErrorCheck = $true }
  if ($Token) { $parameters.Headers = @{ Authorization = "Bearer $Token" } }
  if ($null -ne $Body) { $parameters.ContentType = "application/json"; $parameters.Body = $Body | ConvertTo-Json -Depth 8 -Compress }
  $response = Invoke-WebRequest @parameters
  $parsedBody = $null
  if ($response.Content) { try { $parsedBody = $response.Content | ConvertFrom-Json } catch { $parsedBody = $null } }
  return [pscustomobject]@{ StatusCode = [int]$response.StatusCode; Body = $parsedBody }
}

function Invoke-Login([PSCredential]$Credential, [string]$RoleName) {
  $password = $Credential.GetNetworkCredential().Password
  $result = Invoke-Api "/auth/login" "POST" $null @{ email = $Credential.UserName; password = $password }
  if ($result.StatusCode -ne 201 -or -not $result.Body.accessToken) {
    $script:failureStage = "login $RoleName (HTTP $($result.StatusCode)); confira a credencial e se a conta está ativa"
    throw "Falha no pré-requisito de autenticação"
  }
  return [string]$result.Body.accessToken
}

function Set-SyntheticCouponUsage([string]$Action, [string]$CouponId) {
  & node (Join-Path $PSScriptRoot "set-synthetic-coupon-usage.mjs") $Action $CouponId
  if ($LASTEXITCODE -ne 0) { throw "Não foi possível preparar/limpar a cota sintética do cupom (exit $LASTEXITCODE)" }
}

try {
  if (-not $CustomerCredential) { $CustomerCredential = Get-Credential -Message "Conta CUSTOMER sintética confirmada" }
  if (-not $AdminCredential) { $AdminCredential = Get-Credential -Message "Conta ADMIN sintética" }

  $unauthenticated = Invoke-Api "/cart"
  Set-Scenario "MT-012-01" $(if ($unauthenticated.StatusCode -eq 401) { "APROVADO" } else { "REPROVADO" }) "GET /cart sem token: HTTP $($unauthenticated.StatusCode)" $(if ($unauthenticated.StatusCode -ne 401) { "Esperado HTTP 401" })

  $script:failureStage = "login CUSTOMER"
  $customerToken = Invoke-Login $CustomerCredential "CUSTOMER"
  $script:failureStage = "login ADMIN"
  $adminToken = Invoke-Login $AdminCredential "ADMIN"
  $script:failureStage = "consulta ao catálogo"
  $catalog = Invoke-Api "/works?limit=50"
  if ($catalog.StatusCode -ne 200 -or -not $catalog.Body.items) {
    $script:failureStage = "GET /works (HTTP $($catalog.StatusCode))"
    throw "Catálogo sintético indisponível"
  }
  $script:failureStage = "checagem de papel e carrinho vazio"
  $customerCart = Invoke-Api "/cart" "GET" $customerToken
  $adminCart = Invoke-Api "/cart" "GET" $adminToken
  if ($customerCart.StatusCode -ne 200 -or $adminCart.StatusCode -ne 403) { throw "Conta CUSTOMER/isolamento do carrinho não atende às pré-condições" }
  if ($customerCart.Body.items.Count -gt 0) { throw "Use uma conta sintética cujo carrinho esteja vazio para preservar dados existentes" }
  Set-Scenario "MT-012-02" "APROVADO" "CUSTOMER recebeu HTTP 200; ADMIN recebeu HTTP 403"

  $script:failureStage = "busca de edição física com estoque e e-book visível"
  foreach ($work in $catalog.Body.items) {
    foreach ($edition in $work.editions) {
      if (-not $edition.isVisible) { continue }
      if ($edition.format -eq "PHYSICAL" -and -not $physicalEditionId) {
        $inventory = Invoke-Api "/inventory/$($edition.id)" "GET" $adminToken
        if ($inventory.StatusCode -eq 200 -and $inventory.Body.physicalStock -ge 1) { $physicalEditionId = [string]$edition.id }
      }
      if ($edition.format -eq "DIGITAL") { $digitalEditionCandidates.Add([string]$edition.id) }
    }
    if ($physicalEditionId -and $digitalEditionId) { break }
  }
  if (-not $physicalEditionId -or $digitalEditionCandidates.Count -eq 0) { throw "Não há edições sintéticas física com estoque e digital disponíveis" }

  $script:failureStage = "criação de cupons e regra de frete sintéticos"
  $couponNow = [DateTime]::UtcNow
  $testCoupon = Invoke-Api "/admin/coupons" "POST" $adminToken @{
    code = $testCouponCode; discountType = "FIXED"; fixedAmountCents = 100
    validFrom = $couponNow.AddMinutes(-1).ToString("o"); validUntil = $couponNow.AddHours(1).ToString("o"); maxUses = 1
  }
  if ($testCoupon.StatusCode -ne 201) { throw "Não foi possível criar cupom sintético (HTTP $($testCoupon.StatusCode))" }
  $testCouponId = [string]$testCoupon.Body.id
  $expiredCoupon = Invoke-Api "/admin/coupons" "POST" $adminToken @{
    code = $expiredCouponCode; discountType = "FIXED"; fixedAmountCents = 100
    validFrom = $couponNow.AddDays(-2).ToString("o"); validUntil = $couponNow.AddDays(-1).ToString("o"); maxUses = 1
  }
  if ($expiredCoupon.StatusCode -ne 201) { throw "Não foi possível criar cupom expirado sintético (HTTP $($expiredCoupon.StatusCode))" }
  $expiredCouponId = [string]$expiredCoupon.Body.id
  $rule = Invoke-Api "/admin/shipping-rules" "POST" $adminToken @{
    postalCodeStart = "01000000"; postalCodeEnd = "01999999"; minPhysicalQuantity = 1
    maxPhysicalQuantity = 3; priceCents = 900; priority = 1000
  }
  if ($rule.StatusCode -ne 201) { throw "Não foi possível criar regra de frete sintética (HTTP $($rule.StatusCode))" }
  $shippingRuleId = [string]$rule.Body.id

  $script:failureStage = "inclusão e leitura do item físico"
  $physicalAdd = Invoke-Api "/cart/items" "POST" $customerToken @{ editionId = $physicalEditionId; quantity = 1 }
  if ($physicalAdd.StatusCode -ne 201) { throw "Inclusão física falhou (HTTP $($physicalAdd.StatusCode))" }
  $physicalAdded = $true
  $reloadedCart = Invoke-Api "/cart" "GET" $customerToken
  $catalogEdition = $catalog.Body.items.editions | Where-Object id -eq $physicalEditionId | Select-Object -First 1
  $cartLine = $reloadedCart.Body.items | Where-Object editionId -eq $physicalEditionId | Select-Object -First 1
  if ($reloadedCart.StatusCode -ne 200 -or -not $cartLine -or $cartLine.unitPriceCents -ne $catalogEdition.priceCents) { throw "Carrinho não persistiu ou preço não foi recalculado pelo servidor" }
  Set-Scenario "MT-012-03" "APROVADO" "Inclusão física HTTP 201; GET subsequente confirmou persistência e preço atual"

  $script:failureStage = "teste de e-book duplicado ou já adquirido"
  $ownedConflict = $false
  foreach ($candidateDigitalId in $digitalEditionCandidates) {
    $firstDigitalAdd = Invoke-Api "/cart/items" "POST" $customerToken @{ editionId = $candidateDigitalId; quantity = 1 }
    if ($firstDigitalAdd.StatusCode -eq 201) {
      $digitalEditionId = $candidateDigitalId
      $digitalAdded = $true
      $duplicate = Invoke-Api "/cart/items" "POST" $customerToken @{ editionId = $digitalEditionId; quantity = 1 }
      Set-Scenario "MT-012-04" $(if ($duplicate.StatusCode -eq 409) { "APROVADO" } else { "REPROVADO" }) "E-book adicionado uma vez; repetição respondeu HTTP $($duplicate.StatusCode)" $(if ($duplicate.StatusCode -ne 409) { "Esperado HTTP 409" })
      break
    }
    if ($firstDigitalAdd.StatusCode -eq 409 -and $firstDigitalAdd.Body.message -eq "Você já possui este e-book") { $ownedConflict = $true; continue }
    if ($firstDigitalAdd.StatusCode -eq 409) { continue }
    Set-Scenario "MT-012-04" "REPROVADO" "Inclusão de e-book respondeu HTTP $($firstDigitalAdd.StatusCode)" "Esperado HTTP 201 ou recusa por posse prévia"
    break
  }
  if (-not $digitalAdded -and $ownedConflict) { Set-Scenario "MT-012-04" "APROVADO" "Uma inclusão de e-book já adquirido foi recusada com HTTP 409" }
  elseif (-not $digitalAdded -and ($scenarioRows | Where-Object Id -eq "MT-012-04").Status -eq "BLOQUEADO") { Set-Scenario "MT-012-04" "BLOQUEADO" "Não foi encontrada edição digital elegível para a conta sintética" "Pré-condição manual pendente" }

  $script:failureStage = "validação de quantidade física"
  $badQuantity = Invoke-Api "/cart/items/$physicalEditionId" "PATCH" $customerToken @{ quantity = 0 }
  Set-Scenario "MT-012-05" $(if ($badQuantity.StatusCode -eq 400) { "APROVADO" } else { "REPROVADO" }) "Quantidade zero respondeu HTTP $($badQuantity.StatusCode)" $(if ($badQuantity.StatusCode -ne 400) { "Esperado HTTP 400" })

  $script:failureStage = "aplicação de cupom e validade"
  $applyValid = Invoke-Api "/cart/coupon" "POST" $customerToken @{ code = $testCouponCode.ToLowerInvariant() }
  $couponAttached = $applyValid.StatusCode -eq 201
  $applyExpired = Invoke-Api "/cart/coupon" "POST" $customerToken @{ code = $expiredCouponCode }
  $couponStatus = if ($applyValid.StatusCode -eq 201 -and $applyExpired.StatusCode -eq 409) { "APROVADO" } else { "REPROVADO" }
  Set-Scenario "MT-012-06" $couponStatus "Cupom válido HTTP $($applyValid.StatusCode); expirado HTTP $($applyExpired.StatusCode)" $(if ($couponStatus -eq "REPROVADO") { "Esperado HTTP 201 e HTTP 409" })

  $script:failureStage = "preparação isolada da cota sintética"
  $envValues = @{}
  Get-Content -LiteralPath (Join-Path $repoRoot ".env") | ForEach-Object { if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') { $envValues[$Matches[1]] = $Matches[2].Trim().Trim('"').Trim("'") } }
  foreach ($key in @("POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_PORT")) { if (-not $envValues.ContainsKey($key)) { throw "Configuração local ausente: $key" } }
  $dbUser = [uri]::EscapeDataString($envValues.POSTGRES_USER)
  $dbPassword = [uri]::EscapeDataString($envValues.POSTGRES_PASSWORD)
  $manualDatabaseName = if ($envValues.POSTGRES_DB) { $envValues.POSTGRES_DB } else { "lumina" }
  if ($manualDatabaseName -notin @("lumina", "lumina_task009_test")) { throw "O roteiro só pode usar o banco local de teste Lumina" }
  $env:TASK012_MANUAL_DATABASE_URL = "postgresql://${dbUser}:${dbPassword}@localhost:$($envValues.POSTGRES_PORT)/$manualDatabaseName"
  Set-SyntheticCouponUsage "exhaust" $testCouponId
  $couponHelperUpdated = $true
  $applyExhausted = Invoke-Api "/cart/coupon" "POST" $customerToken @{ code = $testCouponCode }
  $quotaStatus = if ($applyExhausted.StatusCode -eq 409) { "APROVADO" } else { "REPROVADO" }
  Set-Scenario "MT-012-07" $quotaStatus "Cupom sintético na cota máxima respondeu HTTP $($applyExhausted.StatusCode)" $(if ($quotaStatus -eq "REPROVADO") { "Esperado HTTP 409" })
  Set-SyntheticCouponUsage "reset" $testCouponId
  $couponHelperUpdated = $false

  $script:failureStage = "validação de CPF/endereço e cálculo do frete"
  $invalidCpfAddress = $syntheticAddress.Clone(); $invalidCpfAddress.cpf = "111.111.111-11"
  $invalidCpf = Invoke-Api "/cart/shipping-quote" "POST" $customerToken @{ address = $invalidCpfAddress }
  $validShipping = Invoke-Api "/cart/shipping-quote" "POST" $customerToken @{ address = $syntheticAddress }
  $shippingValid = $invalidCpf.StatusCode -eq 400 -and $validShipping.StatusCode -eq 201 -and $validShipping.Body.shippingCents -gt 0 -and ($validShipping.Body.totalCents -eq ($validShipping.Body.subtotalCents - $validShipping.Body.discountCents + $validShipping.Body.shippingCents))
  Set-Scenario "MT-012-08" $(if ($shippingValid) { "APROVADO" } else { "REPROVADO" }) "CPF inválido HTTP $($invalidCpf.StatusCode); CEP/quantidade física cotados HTTP $($validShipping.StatusCode); total recalculado" $(if (-not $shippingValid) { "Falha na validação do endereço ou recálculo" })

  $script:failureStage = "cotação sem item físico"
  if ($digitalAdded) {
    $removePhysical = Invoke-Api "/cart/items/$physicalEditionId" "DELETE" $customerToken
    $physicalAdded = $false
    $digitalOnly = Invoke-Api "/cart/shipping-quote" "POST" $customerToken @{ address = $null }
    $digitalOnlyValid = $removePhysical.StatusCode -eq 200 -and $digitalOnly.StatusCode -eq 201 -and $digitalOnly.Body.shippingCents -eq 0
    Set-Scenario "MT-012-09" $(if ($digitalOnlyValid) { "APROVADO" } else { "REPROVADO" }) "Com somente e-book: frete respondeu HTTP $($digitalOnly.StatusCode), valor em centavos $($digitalOnly.Body.shippingCents)" $(if (-not $digitalOnlyValid) { "Frete deveria ser zero sem exigir endereço" })
  } else {
    Set-Scenario "MT-012-09" "BLOQUEADO" "Sem edição digital não adquirida para montar carrinho digital" "Pré-condição manual pendente"
  }

  Set-Scenario "MT-012-10" "APROVADO" "Script removeu somente itens adicionados e desativou configurações criadas por esta execução"
  $cleanupComplete = $true
} catch {
  foreach ($row in $scenarioRows | Where-Object Status -eq "BLOQUEADO") { $row.Failure = "Execução interrompida na etapa: $script:failureStage" }
  Write-Warning "Execução interrompida na etapa: $script:failureStage. O relatório não inclui credenciais, token, CPF, endereço nem conteúdo de resposta."
} finally {
  $cleanupComplete = $true
  if ($customerToken) {
    if ($digitalAdded -and $digitalEditionId) { try { if ((Invoke-Api "/cart/items/$digitalEditionId" "DELETE" $customerToken).StatusCode -ne 200) { $cleanupComplete = $false } } catch { $cleanupComplete = $false } }
    if ($physicalAdded -and $physicalEditionId) { try { if ((Invoke-Api "/cart/items/$physicalEditionId" "DELETE" $customerToken).StatusCode -ne 200) { $cleanupComplete = $false } } catch { $cleanupComplete = $false } }
    if ($couponAttached) { try { if ((Invoke-Api "/cart/coupon" "DELETE" $customerToken).StatusCode -ne 200) { $cleanupComplete = $false } } catch { $cleanupComplete = $false } }
  }
  if ($adminToken) {
    foreach ($couponId in @($testCouponId, $expiredCouponId) | Where-Object { $_ }) { try { if ((Invoke-Api "/admin/coupons/$couponId/active" "PATCH" $adminToken @{ isActive = $false }).StatusCode -ne 200) { $cleanupComplete = $false } } catch { $cleanupComplete = $false } }
    if ($shippingRuleId) { try { if ((Invoke-Api "/admin/shipping-rules/$shippingRuleId/active" "PATCH" $adminToken @{ isActive = $false }).StatusCode -ne 200) { $cleanupComplete = $false } } catch { $cleanupComplete = $false } }
  }
  if ($couponHelperUpdated -and $testCouponId -and $env:TASK012_MANUAL_DATABASE_URL) { try { Set-SyntheticCouponUsage "reset" $testCouponId } catch { $cleanupComplete = $false } }
  if ($cleanupComplete) { Set-Scenario "MT-012-10" "APROVADO" "Limpeza final concluída" }
  else { Set-Scenario "MT-012-10" "REPROVADO" "Limpeza final incompleta" "Revise somente as linhas sintéticas T012-MANUAL/T012-EXP criadas nesta execução" }
  $env:TASK012_MANUAL_DATABASE_URL = $null
}

$timestamp = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("## Execução manual TASK-012 — $timestamp")
$lines.Add("")
$lines.Add("Evidências registram somente códigos HTTP e resultados; credenciais, tokens, CPF e endereço não são gravados.")
$lines.Add("")
$lines.Add("| ID | Cenário | Status | Evidência resumida | Falhas |")
$lines.Add("|---|---|---|---|---|")
foreach ($row in $scenarioRows) { $lines.Add("| $($row.Id) | $($row.Name) | $($row.Status) | $($row.Evidence) | $($row.Failure) |") }
$lines.Add("")
$lines.Add("Revisão/aprovação humana: PENDENTE. Não use este relatório como confirmação de pedido ou gateway.")
$reportDirectory = Split-Path -Parent $resolvedReportPath
if (-not (Test-Path -LiteralPath $reportDirectory)) { New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null }
if (Test-Path -LiteralPath $resolvedReportPath) { Add-Content -LiteralPath $resolvedReportPath -Value ""; Add-Content -LiteralPath $resolvedReportPath -Value $lines.ToArray() -Encoding utf8 }
else { Set-Content -LiteralPath $resolvedReportPath -Value $lines.ToArray() -Encoding utf8 }
Write-Output "Relatório sanitizado criado/atualizado: $resolvedReportPath"
