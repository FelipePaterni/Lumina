[CmdletBinding()]
param(
  [string]$ApiBaseUrl = 'http://localhost:3001',
  [System.Management.Automation.PSCredential]$CustomerCredential,
  [System.Management.Automation.PSCredential]$AdminCredential
)

$ErrorActionPreference = 'Stop'
$apiUri = [uri]$ApiBaseUrl
if (-not $apiUri.IsLoopback) { throw 'Use somente uma API local de loopback.' }
if (-not $CustomerCredential) { $CustomerCredential = Get-Credential -Message 'CUSTOMER sintético e confirmado' }
if (-not $AdminCredential) { $AdminCredential = Get-Credential -Message 'ADMIN sintético' }

function Invoke-Api {
  param([string]$Method, [string]$Path, [string]$Token, [object]$Body, [string]$IdempotencyKey)
  $headers = @{}
  if ($Token) { $headers.Authorization = "Bearer $Token" }
  if ($IdempotencyKey) { $headers['Idempotency-Key'] = $IdempotencyKey }
  $request = @{ Uri = "$($apiUri.AbsoluteUri.TrimEnd('/'))$Path"; Method = $Method; Headers = $headers; SkipHttpErrorCheck = $true; ErrorAction = 'Stop' }
  if ($null -ne $Body) { $request.ContentType = 'application/json'; $request.Body = $Body | ConvertTo-Json -Depth 8 -Compress }
  $response = Invoke-WebRequest @request
  $parsed = $null
  if ($response.Content) { try { $parsed = $response.Content | ConvertFrom-Json } catch { $parsed = $null } }
  return [pscustomobject]@{ Status = [int]$response.StatusCode; Json = $parsed }
}

function Get-Token {
  param([System.Management.Automation.PSCredential]$Credential, [string]$ExpectedRole)
  $response = Invoke-Api -Method 'POST' -Path '/auth/login' -Token '' -Body @{ email = $Credential.UserName; password = $Credential.GetNetworkCredential().Password } -IdempotencyKey ''
  if ($response.Status -ne 201 -or -not $response.Json.accessToken) { throw "Login da conta sintética falhou (HTTP $($response.Status)); confira o e-mail digitado e a senha no diálogo de credencial." }
  if ($response.Json.user.role -ne $ExpectedRole) { throw "A conta autenticada precisa ter papel $ExpectedRole." }
  return [string]$response.Json.accessToken
}

$customerToken = $null
$adminToken = $null
try {
  $route = Invoke-Api -Method 'GET' -Path '/library' -Token '' -Body $null -IdempotencyKey ''
  if ($route.Status -ne 401) { throw "A API esperada não está ativa: GET /library respondeu HTTP $($route.Status). Reconstrua o serviço API da TASK-017." }

  $customerToken = Get-Token $CustomerCredential 'CUSTOMER'
  $adminToken = Get-Token $AdminCredential 'ADMIN'
  $cart = Invoke-Api -Method 'GET' -Path '/cart' -Token $customerToken -Body $null -IdempotencyKey ''
  if ($cart.Status -ne 200) { throw "Não foi possível consultar o carrinho (HTTP $($cart.Status))." }
  if (@($cart.Json.items).Count -gt 0) { throw 'O carrinho do CUSTOMER não está vazio. Confira os itens antes de continuar; nenhuma nova compra foi criada.' }

  $suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
  $pdfBase64 = node --input-type=module -e 'import { PDFDocument } from "pdf-lib"; import { Buffer } from "node:buffer"; const pdf=await PDFDocument.create(); pdf.addPage().drawText("Conteúdo sintético TASK-017"); process.stdout.write(Buffer.from(await pdf.save()).toString("base64"));'
  if ($LASTEXITCODE -ne 0 -or -not $pdfBase64) { throw 'Não foi possível gerar o PDF sintético.' }

  $workResponse = Invoke-Api -Method 'POST' -Path '/works' -Token $adminToken -IdempotencyKey '' -Body @{
    title = "Livro Sintético $suffix"
    slug = "livro-sintetico-$suffix"
    author = "Autor Sintético $suffix"
    publisher = "Editora Sintética $suffix"
    synopsis = 'Obra sintética para validar a biblioteca.'
    releaseDate = '2026-01-01'
    reason = 'Preparação de compra sintética TASK-017'
    editions = @(@{ format = 'DIGITAL'; priceCents = 100; isVisible = $true })
  }
  if ($workResponse.Status -ne 201 -or -not $workResponse.Json.editions[0].id) { throw "Criação da obra sintética falhou (HTTP $($workResponse.Status))." }
  $editionId = [string]$workResponse.Json.editions[0].id

  $inventory = Invoke-Api -Method 'PATCH' -Path "/inventory/$editionId/digital" -Token $adminToken -IdempotencyKey '' -Body @{ limit = $null; reason = 'Licença sintética TASK-017' }
  if ($inventory.Status -ne 200) { throw "Configuração da licença digital falhou (HTTP $($inventory.Status))." }

  $asset = Invoke-Api -Method 'POST' -Path "/catalog/assets/$editionId/versions" -Token $adminToken -IdempotencyKey '' -Body @{
    contentBase64 = $pdfBase64
    extension = 'pdf'
    mimeType = 'application/pdf'
    isOriginal = $true
    reason = 'Arquivo original sintético TASK-017'
  }
  if ($asset.Status -ne 201 -or -not $asset.Json.isOriginal) { throw "Upload do original sintético falhou (HTTP $($asset.Status))." }

  $added = Invoke-Api -Method 'POST' -Path '/cart/items' -Token $customerToken -IdempotencyKey '' -Body @{ editionId = $editionId; quantity = 1 }
  if ($added.Status -ne 201) { throw "Inclusão do e-book no carrinho falhou (HTTP $($added.Status))." }
  $order = Invoke-Api -Method 'POST' -Path '/checkout' -Token $customerToken -IdempotencyKey "task017-$suffix" -Body @{}
  if ($order.Status -ne 201 -or $order.Json.status -ne 'CONFIRMED') { throw "Checkout sintético não foi confirmado (HTTP $($order.Status))." }

  $library = Invoke-Api -Method 'GET' -Path '/library' -Token $customerToken -Body $null -IdempotencyKey ''
  $item = @($library.Json | Where-Object { $_.editionId -eq $editionId }) | Select-Object -First 1
  if ($library.Status -ne 200 -or -not $item -or -not $item.downloadAvailable) { throw 'Compra confirmada, mas a edição não apareceu disponível na biblioteca.' }
  [pscustomobject]@{
    EditionId = $editionId
    OrderId = [string]$order.Json.id
    DownloadAvailable = [bool]$item.downloadAvailable
  }
} finally {
  $customerToken = $null
  $adminToken = $null
  $pdfBase64 = $null
}
