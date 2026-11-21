[CmdletBinding()]
param(
  [string]$ApiBaseUrl = 'http://localhost:3001',
  [Parameter(Mandatory)][System.Management.Automation.PSCredential]$CatalogCredential,
  [Parameter(Mandatory)][System.Management.Automation.PSCredential]$FullPurchaseCredential,
  [Parameter(Mandatory)][System.Management.Automation.PSCredential]$PartialOwnerCredential,
  [Parameter(Mandatory)][System.Management.Automation.PSCredential]$AllOwnedCredential,
  [Parameter(Mandatory)][ValidateCount(2, 50)][string[]]$WorkIds,
  [Parameter(Mandatory)][ValidateRange(0, 2147483647)][int]$BundlePriceCents,
  [switch]$SyntheticTestDatabaseConfirmed
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$reportPath = Join-Path $root 'docs\testing\TASK-018-testes-manuais-resultado.md'
$apiUri = [uri]$ApiBaseUrl
$runAt = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
$scenarios = [ordered]@{
  'MT-018-01' = [ordered]@{ title = 'Composição única e controle de acesso de catálogo'; status = 'BLOQUEADO'; evidence = '' }
  'MT-018-02' = [ordered]@{ title = 'Bundle cobra preço não negativo e concede itens separadamente'; status = 'BLOQUEADO'; evidence = '' }
  'MT-018-03' = [ordered]@{ title = 'Posse parcial ajusta o preço e posse total bloqueia compra'; status = 'BLOQUEADO'; evidence = '' }
  'MT-018-04' = [ordered]@{ title = 'Pré-venda mostra liberação somente na data de lançamento'; status = 'BLOQUEADO'; evidence = '' }
}
$failure = ''
$tokens = [System.Collections.Generic.List[string]]::new()
$libraryByUser = @{}

function Write-SanitizedReport {
  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.Add('# TASK-018 — Resultado dos testes manuais')
  $lines.Add('')
  $lines.Add("- Execução UTC: $runAt")
  $lines.Add("- Alvo: API local $($apiUri.Host):$($apiUri.Port)")
  $lines.Add('- Dados: somente obras, bundles, contas e compras sintéticas; credenciais, tokens, e-mails e identificadores não são registrados')
  $lines.Add('- Revisão humana: PENDENTE')
  $lines.Add('')
  $lines.Add('| Cenário | Resultado | Evidência resumida |')
  $lines.Add('|---|---|---|')
  foreach ($id in $scenarios.Keys) {
    $evidence = if ($scenarios[$id].evidence) { $scenarios[$id].evidence } else { 'Não executado.' }
    $lines.Add("| $id — $($scenarios[$id].title) | $($scenarios[$id].status) | $evidence |")
  }
  if ($failure) { $lines.Add(''); $lines.Add("Falha/bloqueio: $failure") }
  $lines.Add('')
  $lines.Add('Pré-requisitos: API local conectada exclusivamente ao banco isolado `lumina_task009_test`; CUSTOMERs sintéticos confirmados com carrinhos vazios; a conta parcial possui pelo menos um, mas não todos, e a conta total possui todos os e-books indicados; obras têm edição digital visível e inventário configurado.')
  Set-Content -LiteralPath $reportPath -Value $lines -Encoding utf8
}

function Invoke-Api {
  param([string]$Method, [string]$Path, [string]$Token, [object]$Body, [string]$Key)
  $headers = @{}
  if ($Token) { $headers.Authorization = "Bearer $Token" }
  if ($Key) { $headers['Idempotency-Key'] = $Key }
  $request = @{ Uri = [uri]::new($apiUri, $Path); Method = $Method; Headers = $headers; SkipHttpErrorCheck = $true; ErrorAction = 'Stop' }
  if ($null -ne $Body) { $request.ContentType = 'application/json'; $request.Body = $Body | ConvertTo-Json -Depth 8 -Compress }
  try {
    $response = Invoke-WebRequest @request
    $parsed = $null
    if ($response.Content) { try { $parsed = ConvertFrom-Json -InputObject $response.Content } catch { $parsed = $null } }
    return [pscustomobject]@{ Status = [int]$response.StatusCode; Json = $parsed }
  } catch {
    return [pscustomobject]@{ Status = 0; Json = $null }
  }
}

function Get-Token {
  param([System.Management.Automation.PSCredential]$Credential)
  $password = $Credential.GetNetworkCredential().Password
  try {
    $response = Invoke-Api -Method 'POST' -Path '/auth/login' -Token '' -Body @{ email = $Credential.UserName; password = $password } -Key ''
    if ($response.Status -ne 201 -or -not $response.Json.accessToken) { throw 'Autenticação sintética indisponível.' }
    $token = [string]$response.Json.accessToken
    $tokens.Add($token)
    return $token
  } finally {
    $password = $null
  }
}

function Set-Scenario {
  param([string]$Id, [string]$Status, [string]$Evidence)
  $scenarios[$Id].status = $Status
  $scenarios[$Id].evidence = $Evidence
  Write-SanitizedReport
}

try {
  Write-SanitizedReport
  if (-not $apiUri.IsLoopback) { throw 'Use somente uma API local de loopback.' }
  if (-not $SyntheticTestDatabaseConfirmed) { throw 'Confirme -SyntheticTestDatabaseConfirmed somente após conectar a API ao banco lumina_task009_test.' }
  $normalizedWorkIds = @($WorkIds | ForEach-Object { $_.ToLowerInvariant() } | Sort-Object -Unique)
  if ($normalizedWorkIds.Count -lt 2 -or $normalizedWorkIds.Count -ne $WorkIds.Count) { throw 'Informe pelo menos dois WorkIds UUID distintos.' }

  $catalogToken = Get-Token $CatalogCredential
  $fullToken = Get-Token $FullPurchaseCredential
  $partialToken = Get-Token $PartialOwnerCredential
  $allOwnedToken = Get-Token $AllOwnedCredential
  $credentialNames = @($CatalogCredential.UserName, $FullPurchaseCredential.UserName, $PartialOwnerCredential.UserName, $AllOwnedCredential.UserName)
  if (@($credentialNames | Sort-Object -Unique).Count -ne 4) { throw 'Use quatro contas sintéticas distintas.' }

  $fullCart = Invoke-Api -Method 'GET' -Path '/cart' -Token $fullToken -Body $null -Key ''
  $partialCart = Invoke-Api -Method 'GET' -Path '/cart' -Token $partialToken -Body $null -Key ''
  $ownedCart = Invoke-Api -Method 'GET' -Path '/cart' -Token $allOwnedToken -Body $null -Key ''
  $customerCarts = @($fullCart, $partialCart, $ownedCart)
  if (@($customerCarts | Where-Object { $_.Status -ne 200 -or $_.Json.items.Count -gt 0 -or $_.Json.bundles.Count -gt 0 }).Count -gt 0) { throw 'As três contas CUSTOMER precisam ter carrinhos vazios.' }

  foreach ($credential in @($FullPurchaseCredential, $PartialOwnerCredential, $AllOwnedCredential)) {
    $libraryToken = if ($credential.UserName -eq $FullPurchaseCredential.UserName) { $fullToken } elseif ($credential.UserName -eq $PartialOwnerCredential.UserName) { $partialToken } else { $allOwnedToken }
    $library = Invoke-Api -Method 'GET' -Path '/library' -Token $libraryToken -Body $null -Key ''
    if ($library.Status -ne 200) { throw 'Não foi possível consultar a biblioteca sintética.' }
    $libraryByUser[$credential.UserName] = @($library.Json)
  }

  $create = Invoke-Api -Method 'POST' -Path '/bundles' -Token $catalogToken -Body @{ name = "TASK018 manual $([guid]::NewGuid().ToString('N'))"; priceCents = $BundlePriceCents; workIds = $normalizedWorkIds } -Key ''
  if ($create.Status -ne 201 -or -not $create.Json.id) { throw "Criação de bundle respondeu $($create.Status)." }
  $bundle = $create.Json
  $duplicate = Invoke-Api -Method 'POST' -Path '/bundles' -Token $catalogToken -Body @{ name = 'TASK018 duplicate'; priceCents = $BundlePriceCents; workIds = @($normalizedWorkIds | Sort-Object -Descending) } -Key ''
  if ($duplicate.Status -ne 409) { Set-Scenario 'MT-018-01' 'REPROVADO' "Composição invertida respondeu $($duplicate.Status), esperado 409."; throw 'A composição duplicada não foi recusada.' }
  $unauthorized = Invoke-Api -Method 'POST' -Path '/bundles' -Token $fullToken -Body @{ name = 'TASK018 denied'; priceCents = $BundlePriceCents; workIds = $normalizedWorkIds } -Key ''
  if ($unauthorized.Status -ne 403) { Set-Scenario 'MT-018-01' 'REPROVADO' "CUSTOMER respondeu $($unauthorized.Status), esperado 403."; throw 'Papel CUSTOMER conseguiu criar bundle.' }
  Set-Scenario 'MT-018-01' 'APROVADO' 'Composição invertida respondeu 409; papel CUSTOMER respondeu 403.'

  $itemEditionIds = @($bundle.items | ForEach-Object { $_.editionId })
  $partialOwned = @($libraryByUser[$PartialOwnerCredential.UserName] | Where-Object { $_.editionId -in $itemEditionIds })
  $allOwned = @($libraryByUser[$AllOwnedCredential.UserName] | Where-Object { $_.editionId -in $itemEditionIds })
  if ($partialOwned.Count -lt 1 -or $partialOwned.Count -ge $itemEditionIds.Count -or $allOwned.Count -ne $itemEditionIds.Count) { throw 'As contas não correspondem às pré-condições de posse parcial/total.' }

  $expectedPartialPrice = [Math]::Max(0, [int]$bundle.priceCents - [int](($bundle.items | Where-Object { $_.editionId -in $partialOwned.editionId } | Measure-Object -Property currentPriceCents -Sum).Sum))
  $partialAdd = Invoke-Api -Method 'POST' -Path '/cart/bundles' -Token $partialToken -Body @{ bundleId = $bundle.id } -Key ''
  if ($partialAdd.Status -ne 201 -or $partialAdd.Json.subtotalCents -ne $expectedPartialPrice) { Set-Scenario 'MT-018-03' 'REPROVADO' 'Preço com posse parcial não correspondeu ao valor ajustado.'; throw 'Preço de posse parcial incorreto.' }
  $partialRemove = Invoke-Api -Method 'DELETE' -Path "/cart/bundles/$($bundle.id)" -Token $partialToken -Body $null -Key ''
  if ($partialRemove.Status -ne 200) { throw 'Não foi possível limpar o bundle de teste do carrinho parcial.' }
  $allOwnedAdd = Invoke-Api -Method 'POST' -Path '/cart/bundles' -Token $allOwnedToken -Body @{ bundleId = $bundle.id } -Key ''
  if ($allOwnedAdd.Status -ne 409) { Set-Scenario 'MT-018-03' 'REPROVADO' "Posse total respondeu $($allOwnedAdd.Status), esperado 409."; throw 'Bundle integralmente possuído não foi bloqueado.' }
  Set-Scenario 'MT-018-03' 'APROVADO' 'Posse parcial recalculou o preço sem valor negativo; posse total respondeu 409.'

  $fullOwned = @($libraryByUser[$FullPurchaseCredential.UserName] | Where-Object { $_.editionId -in $itemEditionIds })
  if ($fullOwned.Count -ne 0) { throw 'A conta de compra integral já possui item do bundle.' }
  $fullAdd = Invoke-Api -Method 'POST' -Path '/cart/bundles' -Token $fullToken -Body @{ bundleId = $bundle.id } -Key ''
  if ($fullAdd.Status -ne 201 -or $fullAdd.Json.subtotalCents -lt 0) { throw "Inclusão do bundle respondeu $($fullAdd.Status) ou preço inválido." }
  $checkout = Invoke-Api -Method 'POST' -Path '/checkout' -Token $fullToken -Body @{} -Key "task018-manual-$([guid]::NewGuid().ToString('N'))"
  if ($checkout.Status -ne 201 -or $checkout.Json.bundles.Count -ne 1 -or $checkout.Json.bundles[0].items.Count -ne $itemEditionIds.Count) { Set-Scenario 'MT-018-02' 'REPROVADO' 'Checkout não concedeu cada edição do bundle separadamente.'; throw 'Checkout ou concessão item a item falhou.' }
  $granted = @($checkout.Json.bundles[0].items | ForEach-Object { $_.editionId })
  if (@($itemEditionIds | Where-Object { $_ -notin $granted }).Count -gt 0) { throw 'Uma edição do bundle não apareceu no pedido.' }
  Set-Scenario 'MT-018-02' 'APROVADO' "Checkout confirmou subtotal não negativo e $($granted.Count) edições em linhas separadas."

  $expectedPreorder = @($bundle.items | Where-Object { ([DateTimeOffset]::Parse($_.releaseAt)).UtcDateTime -gt [DateTime]::UtcNow })
  $orderPreorders = @($checkout.Json.bundles[0].items | Where-Object { $_.preorderStatus -eq 'PREORDER' })
  if ($expectedPreorder.Count -ne $orderPreorders.Count) { Set-Scenario 'MT-018-04' 'REPROVADO' 'Estado de pré-venda não correspondeu às datas de lançamento.'; throw 'Data de liberação de pré-venda incorreta.' }
  Set-Scenario 'MT-018-04' 'APROVADO' 'Pedido sinalizou PREORDER antes do lançamento e RELEASED na data ou depois.'
} catch {
  $failure = 'Execução interrompida; consulte os cenários BLOQUEADOS e confira os pré-requisitos, sem compartilhar credenciais ou tokens.'
  foreach ($id in $scenarios.Keys) {
    if ($scenarios[$id].status -eq 'BLOQUEADO') { $scenarios[$id].evidence = 'Não executado após interrupção.' }
  }
} finally {
  $tokens.Clear()
  $catalogToken = $null; $fullToken = $null; $partialToken = $null; $allOwnedToken = $null
  $password = $null
  Write-SanitizedReport
  Write-Output "Relatório sanitizado criado/atualizado: $reportPath"
  if ($failure) { Write-Output 'Execução BLOQUEADA; verifique o banco local isolado e as pré-condições descritas no README.' }
}
