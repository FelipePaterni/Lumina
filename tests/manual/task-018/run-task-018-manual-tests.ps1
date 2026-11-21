[CmdletBinding()]
param(
  [string]$ApiBaseUrl = 'http://localhost:3001',
  [Parameter(Mandatory)][System.Management.Automation.PSCredential]$AdminCredential,
  [Parameter(Mandatory)][System.Management.Automation.PSCredential]$FullPurchaseCredential,
  [Parameter(Mandatory)][System.Management.Automation.PSCredential]$PartialOwnerCredential,
  [ValidateCount(3, 50)][string[]]$WorkIds,
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
  'MT-018-03' = [ordered]@{ title = 'Posse parcial ajusta preço e composição integralmente possuída é recusada'; status = 'BLOQUEADO'; evidence = '' }
  'MT-018-04' = [ordered]@{ title = 'Pré-venda mostra liberação somente na data de lançamento'; status = 'BLOQUEADO'; evidence = '' }
}
$failure = ''
$stage = 'validação inicial'
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
  $lines.Add('Pré-requisitos: API local conectada exclusivamente ao banco isolado `lumina_task009_test`; duas contas CUSTOMER sintéticas com carrinhos vazios e sem posse dos e-books informados; obras têm edição digital visível e inventário configurado. O runner prepara compras sintéticas para os cenários de posse parcial e total.')
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
  $normalizedWorkIds = @()

  $stage = 'autenticação das contas sintéticas'
  $adminToken = Get-Token $AdminCredential
  $fullToken = Get-Token $FullPurchaseCredential
  $partialToken = Get-Token $PartialOwnerCredential
  $credentialNames = @($AdminCredential.UserName, $FullPurchaseCredential.UserName, $PartialOwnerCredential.UserName)
  if (@($credentialNames | Sort-Object -Unique).Count -ne 3) { throw 'Use uma conta ADMIN e duas CUSTOMER sintéticas distintas.' }

  if ($WorkIds.Count -gt 0) {
    $normalizedWorkIds = @($WorkIds | ForEach-Object { $_.ToLowerInvariant() } | Sort-Object -Unique)
    if ($normalizedWorkIds.Count -lt 3 -or $normalizedWorkIds.Count -ne $WorkIds.Count) { throw 'Informe pelo menos três WorkIds UUID distintos.' }
  } else {
    $stage = 'descoberta e preparação de obras digitais sintéticas'
    $catalog = Invoke-Api -Method 'GET' -Path '/works?limit=50' -Token '' -Body $null -Key ''
    if ($catalog.Status -ne 200) { throw 'Não foi possível descobrir obras visíveis no catálogo local.' }
    $eligible = @($catalog.Json.items | Where-Object { $_.isVisible } | ForEach-Object {
      $work = $_
      $digital = @($work.editions | Where-Object { $_.format -eq 'DIGITAL' -and $_.isVisible })
      if ($digital.Count -gt 0) { [pscustomobject]@{ Work = $work; Edition = $digital[0] } }
    } | Sort-Object @{ Expression = { if ($_.Work.releaseDate -and ([DateTime]$_.Work.releaseDate).ToUniversalTime() -gt [DateTime]::UtcNow) { 0 } else { 1 } } }, @{ Expression = { $_.Work.id } })
    if ($eligible.Count -lt 3) { throw 'O catálogo local precisa de pelo menos três obras visíveis com edição DIGITAL visível.' }
    $selected = @($eligible | Select-Object -First 3)
    foreach ($entry in $selected) {
      $inventory = Invoke-Api -Method 'GET' -Path "/inventory/$($entry.Edition.id)" -Token $adminToken -Body $null -Key ''
      if ($inventory.Status -eq 404 -or ($inventory.Status -eq 200 -and -not $inventory.Json)) {
        $configured = Invoke-Api -Method 'PATCH' -Path "/inventory/$($entry.Edition.id)/digital" -Token $adminToken -Body @{ limit = $null; reason = 'TASK-018: licença sintética no banco isolado de teste' } -Key ''
        if ($configured.Status -ne 200) { throw 'Não foi possível configurar inventário digital sintético.' }
      } elseif ($inventory.Status -eq 200 -and $inventory.Json.digitalLicenseLimit -ne $null -and $inventory.Json.digitalAllocated -eq 0) {
        $configured = Invoke-Api -Method 'PATCH' -Path "/inventory/$($entry.Edition.id)/digital" -Token $adminToken -Body @{ limit = $null; reason = 'TASK-018: licença sintética no banco isolado de teste' } -Key ''
        if ($configured.Status -ne 200) { throw 'Não foi possível ampliar licença digital no banco isolado.' }
      } elseif ($inventory.Status -ne 200) { throw 'Inventário da edição digital não pôde ser consultado.' }
    }
    $normalizedWorkIds = @($selected | ForEach-Object { $_.Work.id })
  }

  $stage = 'validação dos carrinhos vazios'
  $fullCart = Invoke-Api -Method 'GET' -Path '/cart' -Token $fullToken -Body $null -Key ''
  $partialCart = Invoke-Api -Method 'GET' -Path '/cart' -Token $partialToken -Body $null -Key ''
  $customerCarts = @($fullCart, $partialCart)
  if (@($customerCarts | Where-Object { $_.Status -ne 200 -or $_.Json.items.Count -gt 0 -or $_.Json.bundles.Count -gt 0 }).Count -gt 0) { throw 'As duas contas CUSTOMER precisam ter carrinhos vazios.' }

  foreach ($credential in @($FullPurchaseCredential, $PartialOwnerCredential)) {
    $libraryToken = if ($credential.UserName -eq $FullPurchaseCredential.UserName) { $fullToken } else { $partialToken }
    $library = Invoke-Api -Method 'GET' -Path '/library' -Token $libraryToken -Body $null -Key ''
    if ($library.Status -ne 200) { throw 'Não foi possível consultar a biblioteca sintética.' }
    $libraryByUser[$credential.UserName] = @($library.Json)
  }

  $stage = 'criação e validação do bundle'
  $create = Invoke-Api -Method 'POST' -Path '/bundles' -Token $adminToken -Body @{ name = "TASK018 manual $([guid]::NewGuid().ToString('N'))"; priceCents = $BundlePriceCents; workIds = $normalizedWorkIds } -Key ''
  if ($create.Status -ne 201 -or -not $create.Json.id) { throw "Criação de bundle respondeu $($create.Status)." }
  $bundle = $create.Json
  $duplicate = Invoke-Api -Method 'POST' -Path '/bundles' -Token $adminToken -Body @{ name = 'TASK018 duplicate'; priceCents = $BundlePriceCents; workIds = @($normalizedWorkIds | Sort-Object -Descending) } -Key ''
  if ($duplicate.Status -ne 409) { Set-Scenario 'MT-018-01' 'REPROVADO' "Composição invertida respondeu $($duplicate.Status), esperado 409."; throw 'A composição duplicada não foi recusada.' }
  $unauthorized = Invoke-Api -Method 'POST' -Path '/bundles' -Token $fullToken -Body @{ name = 'TASK018 denied'; priceCents = $BundlePriceCents; workIds = $normalizedWorkIds } -Key ''
  if ($unauthorized.Status -ne 403) { Set-Scenario 'MT-018-01' 'REPROVADO' "CUSTOMER respondeu $($unauthorized.Status), esperado 403."; throw 'Papel CUSTOMER conseguiu criar bundle.' }
  Set-Scenario 'MT-018-01' 'APROVADO' 'Composição invertida respondeu 409; papel CUSTOMER respondeu 403.'

  $itemEditionIds = @($bundle.items | ForEach-Object { $_.editionId })
  if ($itemEditionIds.Count -lt 3) { throw 'O bundle exige pelo menos três edições digitais.' }
  $fullOwnedBefore = @($libraryByUser[$FullPurchaseCredential.UserName] | Where-Object { $_.editionId -in $itemEditionIds })
  $partialOwnedBefore = @($libraryByUser[$PartialOwnerCredential.UserName] | Where-Object { $_.editionId -in $itemEditionIds })
  if ($fullOwnedBefore.Count -ne 0 -or $partialOwnedBefore.Count -ne 0) { throw 'As duas contas precisam começar sem posse das obras informadas.' }

  $stage = 'preparação de posse parcial sintética'
  $ownerSeedItems = @($bundle.items | Select-Object -First 2)
  foreach ($item in $ownerSeedItems) {
    $seedAdd = Invoke-Api -Method 'POST' -Path '/cart/items' -Token $partialToken -Body @{ editionId = $item.editionId; quantity = 1 } -Key ''
    if ($seedAdd.Status -ne 201) { throw "Preparação sintética de posse respondeu $($seedAdd.Status)." }
    $seedOrder = Invoke-Api -Method 'POST' -Path '/checkout' -Token $partialToken -Body @{} -Key "task018-seed-$([guid]::NewGuid().ToString('N'))"
    if ($seedOrder.Status -ne 201) { throw "Compra sintética para preparar posse respondeu $($seedOrder.Status)." }
  }
  $partialLibrary = Invoke-Api -Method 'GET' -Path '/library' -Token $partialToken -Body $null -Key ''
  if ($partialLibrary.Status -ne 200) { throw 'Não foi possível conferir a posse sintética parcial.' }
  $partialOwned = @($partialLibrary.Json | Where-Object { $_.editionId -in $itemEditionIds })
  if ($partialOwned.Count -ne 2) { throw 'A conta sintética não ficou com exatamente dois e-books do bundle.' }

  $ownedWorkIds = @($ownerSeedItems | ForEach-Object { $_.workId })
  $allOwnedBundleResponse = Invoke-Api -Method 'POST' -Path '/bundles' -Token $adminToken -Body @{ name = "TASK018 all-owned $([guid]::NewGuid().ToString('N'))"; priceCents = $BundlePriceCents; workIds = $ownedWorkIds } -Key ''
  if ($allOwnedBundleResponse.Status -ne 201 -or -not $allOwnedBundleResponse.Json.id) { throw 'Não foi possível criar a composição sintética de posse total.' }
  $allOwnedBundleId = [string]$allOwnedBundleResponse.Json.id

  $stage = 'verificação dos ajustes por posse'
  $expectedPartialPrice = [Math]::Max(0, [int]$bundle.priceCents - [int](($bundle.items | Where-Object { $_.editionId -in $partialOwned.editionId } | Measure-Object -Property currentPriceCents -Sum).Sum))
  $partialAdd = Invoke-Api -Method 'POST' -Path '/cart/bundles' -Token $partialToken -Body @{ bundleId = $bundle.id } -Key ''
  if ($partialAdd.Status -ne 201 -or $partialAdd.Json.subtotalCents -ne $expectedPartialPrice) { Set-Scenario 'MT-018-03' 'REPROVADO' 'Preço com posse parcial não correspondeu ao valor ajustado.'; throw 'Preço de posse parcial incorreto.' }
  $partialRemove = Invoke-Api -Method 'DELETE' -Path "/cart/bundles/$($bundle.id)" -Token $partialToken -Body $null -Key ''
  if ($partialRemove.Status -ne 200) { throw 'Não foi possível limpar o bundle de teste do carrinho parcial.' }
  $allOwnedAdd = Invoke-Api -Method 'POST' -Path '/cart/bundles' -Token $partialToken -Body @{ bundleId = $allOwnedBundleId } -Key ''
  if ($allOwnedAdd.Status -ne 409) { Set-Scenario 'MT-018-03' 'REPROVADO' "Posse total respondeu $($allOwnedAdd.Status), esperado 409."; throw 'Bundle integralmente possuído não foi bloqueado.' }
  Set-Scenario 'MT-018-03' 'APROVADO' 'Posse parcial recalculou o preço sem valor negativo; posse total respondeu 409.'

  $stage = 'checkout integral e verificação de pré-venda'
  $fullAdd = Invoke-Api -Method 'POST' -Path '/cart/bundles' -Token $fullToken -Body @{ bundleId = $bundle.id } -Key ''
  if ($fullAdd.Status -ne 201 -or $fullAdd.Json.subtotalCents -lt 0) { throw "Inclusão do bundle respondeu $($fullAdd.Status) ou preço inválido." }
  $checkout = Invoke-Api -Method 'POST' -Path '/checkout' -Token $fullToken -Body @{} -Key "task018-manual-$([guid]::NewGuid().ToString('N'))"
  if ($checkout.Status -ne 201 -or $checkout.Json.bundles.Count -ne 1 -or $checkout.Json.bundles[0].items.Count -ne $itemEditionIds.Count) { Set-Scenario 'MT-018-02' 'REPROVADO' 'Checkout não concedeu cada edição do bundle separadamente.'; throw 'Checkout ou concessão item a item falhou.' }
  $granted = @($checkout.Json.bundles[0].items | ForEach-Object { $_.editionId })
  if (@($itemEditionIds | Where-Object { $_ -notin $granted }).Count -gt 0) { throw 'Uma edição do bundle não apareceu no pedido.' }
  Set-Scenario 'MT-018-02' 'APROVADO' "Checkout confirmou subtotal não negativo e $($granted.Count) edições em linhas separadas."

  $expectedPreorder = @($bundle.items | Where-Object { $_.releaseAt -and ([DateTime]$_.releaseAt).ToUniversalTime() -gt [DateTime]::UtcNow })
  $orderPreorders = @($checkout.Json.bundles[0].items | Where-Object { $_.preorderStatus -eq 'PREORDER' })
  if ($expectedPreorder.Count -ne $orderPreorders.Count) { Set-Scenario 'MT-018-04' 'REPROVADO' 'Estado de pré-venda não correspondeu às datas de lançamento.'; throw 'Data de liberação de pré-venda incorreta.' }
  Set-Scenario 'MT-018-04' 'APROVADO' 'Pedido sinalizou PREORDER antes do lançamento e RELEASED na data ou depois.'
} catch {
  $failure = "Execução interrompida durante $stage; confira os pré-requisitos sem compartilhar credenciais ou tokens."
  foreach ($id in $scenarios.Keys) {
    if ($scenarios[$id].status -eq 'BLOQUEADO') { $scenarios[$id].evidence = 'Não executado após interrupção.' }
  }
} finally {
  $tokens.Clear()
  $adminToken = $null; $fullToken = $null; $partialToken = $null
  $password = $null
  Write-SanitizedReport
  Write-Output "Relatório sanitizado criado/atualizado: $reportPath"
  if ($failure) { Write-Output 'Execução BLOQUEADA; verifique o banco local isolado e as pré-condições descritas no README.' }
}
