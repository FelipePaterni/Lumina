[CmdletBinding()]
param(
  [string]$ApiBaseUrl = 'http://localhost:3001',
  [Parameter(Mandatory)][System.Management.Automation.PSCredential]$CustomerCredential,
  [Parameter(Mandatory)][System.Management.Automation.PSCredential]$OtherCustomerCredential,
  [Parameter(Mandatory)][System.Management.Automation.PSCredential]$AdminCredential,
  [Parameter(Mandatory)][ValidatePattern('^[A-Za-z0-9-]{1,80}$')][string]$EditionId
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$reportPath = Join-Path $root 'docs\testing\TASK-017-testes-manuais-resultado.md'
$apiUri = [uri]$ApiBaseUrl
$runAt = [DateTimeOffset]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')
$scenarios = [ordered]@{
  'MT-017-01' = [ordered]@{ title = 'Biblioteca lista compra digital do cliente'; status = 'BLOQUEADO'; evidence = '' }
  'MT-017-02' = [ordered]@{ title = 'Isolamento impede acesso por outro cliente'; status = 'BLOQUEADO'; evidence = '' }
  'MT-017-03' = [ordered]@{ title = 'Admin não acessa biblioteca de cliente'; status = 'BLOQUEADO'; evidence = '' }
  'MT-017-04' = [ordered]@{ title = 'Link temporário renovável baixa cópia personalizada'; status = 'BLOQUEADO'; evidence = '' }
}
$failure = ''

function Write-SanitizedReport {
  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.Add('# TASK-017 — Resultado dos testes manuais')
  $lines.Add('')
  $lines.Add("- Execução UTC: $runAt")
  $lines.Add("- Alvo: API local $($apiUri.Host):$($apiUri.Port)")
  $lines.Add('- Dados: contas e compra sintéticas; credenciais, tokens, nome, e-mail, conteúdo e respostas HTTP não são registrados')
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
  $lines.Add('Pré-requisitos: API local iniciada, edição digital lançada com compra sintética confirmada e três contas locais. Consulte `tests/manual/task-017/README.md`.')
  Set-Content -LiteralPath $reportPath -Value $lines -Encoding utf8
}

function Invoke-Api {
  param([string]$Method, [string]$Path, [string]$Token, [object]$Body)
  $headers = @{}
  if ($Token) { $headers.Authorization = "Bearer $Token" }
  $request = @{ Uri = "$($apiUri.AbsoluteUri.TrimEnd('/'))$Path"; Method = $Method; Headers = $headers; SkipHttpErrorCheck = $true; ErrorAction = 'Stop' }
  if ($null -ne $Body) { $request.ContentType = 'application/json'; $request.Body = $Body | ConvertTo-Json -Compress }
  try {
    $response = Invoke-WebRequest @request
    $parsed = $null
    if ($response.Content) { try { $parsed = ConvertFrom-Json -InputObject $response.Content -NoEnumerate } catch { $parsed = $null } }
    return [pscustomobject]@{ Status = [int]$response.StatusCode; Json = $parsed; ContentType = [string]$response.Headers['Content-Type'] }
  } catch { return [pscustomobject]@{ Status = 0; Json = $null; ContentType = '' } }
}

function Invoke-Download {
  param([string]$Path, [string]$OutFile)
  $client = [System.Net.Http.HttpClient]::new()
  try {
    $uri = [uri]::new($apiUri, $Path)
    $response = $client.GetAsync($uri).GetAwaiter().GetResult()
    $status = [int]$response.StatusCode
    $contentType = [string]$response.Content.Headers.ContentType.MediaType
    if ($status -eq 200) {
      $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
      [System.IO.File]::WriteAllBytes($OutFile, $bytes)
    }
    return [pscustomobject]@{ Status = $status; ContentType = $contentType; ErrorType = '' }
  } catch {
    return [pscustomobject]@{ Status = 0; ContentType = ''; ErrorType = $_.Exception.GetType().Name }
  } finally {
    $client.Dispose()
  }
}

function Get-Token {
  param([System.Management.Automation.PSCredential]$Credential)
  $password = $Credential.GetNetworkCredential().Password
  $response = Invoke-Api -Method 'POST' -Path '/auth/login' -Token '' -Body @{ email = $Credential.UserName; password = $password }
  if ($response.Status -ne 201 -or -not $response.Json.accessToken) { throw 'Não foi possível autenticar uma conta sintética (sem registrar resposta).' }
  return [string]$response.Json.accessToken
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
  if ($CustomerCredential.UserName -eq $OtherCustomerCredential.UserName) { throw 'As duas contas CUSTOMER precisam ser distintas.' }
  $customerToken = Get-Token $CustomerCredential
  $otherToken = Get-Token $OtherCustomerCredential
  $adminToken = Get-Token $AdminCredential

  $listing = Invoke-Api -Method 'GET' -Path '/library' -Token $customerToken -Body $null
  $ownedItem = if ($listing.Json -is [array]) { @($listing.Json | Where-Object { $_.editionId -eq $EditionId }).Count -gt 0 } else { $false }
  if ($listing.Status -eq 200 -and $ownedItem) {
    Set-Scenario 'MT-017-01' 'APROVADO' 'GET /library 200; edição comprada presente.'
  } else { Set-Scenario 'MT-017-01' 'REPROVADO' "GET /library $($listing.Status); edição não encontrada." }

  $foreign = Invoke-Api -Method 'POST' -Path "/library/$EditionId/download" -Token $otherToken -Body @{ name = 'Cliente Sintético TASK-017' }
  if ($foreign.Status -eq 404) { Set-Scenario 'MT-017-02' 'APROVADO' 'POST de edição alheia respondeu 404.' }
  else { Set-Scenario 'MT-017-02' 'REPROVADO' "POST de edição alheia respondeu $($foreign.Status)." }

  $adminLibrary = Invoke-Api -Method 'GET' -Path '/library' -Token $adminToken -Body $null
  if ($adminLibrary.Status -eq 403) { Set-Scenario 'MT-017-03' 'APROVADO' 'GET /library para ADMIN respondeu 403.' }
  else { Set-Scenario 'MT-017-03' 'REPROVADO' "GET /library para ADMIN respondeu $($adminLibrary.Status)." }

  if (-not $ownedItem) { throw 'Não há edição própria elegível; download não foi solicitado.' }
  $link1 = Invoke-Api -Method 'POST' -Path "/library/$EditionId/download" -Token $customerToken -Body @{ name = 'Cliente Sintético TASK-017' }
  $link2 = Invoke-Api -Method 'POST' -Path "/library/$EditionId/download" -Token $customerToken -Body @{ name = 'Cliente Sintético TASK-017' }
  if ($link1.Status -ne 201 -and $link1.Status -ne 200) { throw "Emissão inicial respondeu $($link1.Status)." }
  if ($link2.Status -ne 201 -and $link2.Status -ne 200) { throw "Renovação respondeu $($link2.Status)." }
  if (-not $link1.Json.downloadUrl -or -not $link2.Json.downloadUrl -or $link1.Json.downloadUrl -eq $link2.Json.downloadUrl) { throw 'A renovação não emitiu dois links temporários distintos.' }
  $reviewFile = Join-Path ([System.IO.Path]::GetTempPath()) "lumina-task017-$([guid]::NewGuid().ToString('N')).bin"
  $download1 = Invoke-Download -Path $link1.Json.downloadUrl -OutFile $reviewFile
  $download2 = Invoke-Api -Method 'GET' -Path $link2.Json.downloadUrl -Token '' -Body $null
  if ($download1.Status -eq 200 -and $download2.Status -eq 200 -and ($download1.ContentType -match '^(application/pdf|application/epub\+zip)$') -and ($download2.ContentType -match 'application/(pdf|epub\+zip)')) {
    $extension = if ($download1.ContentType -eq 'application/epub+zip') { 'epub' } else { 'pdf' }
    $reviewFile = [System.IO.Path]::ChangeExtension($reviewFile, $extension)
    [System.IO.File]::Move([System.IO.Path]::ChangeExtension($reviewFile, 'bin'), $reviewFile)
    Set-Scenario 'MT-017-04' 'BLOQUEADO' 'Dois links baixaram PDF/EPUB; aguarda inspeção humana da cópia.'
    Write-Output "Abra a cópia personalizada temporária para inspeção humana: $reviewFile"
  } elseif ($download1.Status -eq 0 -or $download2.Status -eq 0) {
    $errorType = if ($download1.ErrorType) { $download1.ErrorType } else { 'falha de transporte' }
    Set-Scenario 'MT-017-04' 'BLOQUEADO' "Falha de transporte no download ($errorType); nenhuma resposta foi registrada. Repita após corrigir o ambiente."
  } else { Set-Scenario 'MT-017-04' 'REPROVADO' "Downloads responderam $($download1.Status)/$($download2.Status) ou MIME inesperado." }
} catch {
  $failure = [regex]::Replace($_.Exception.Message, '[\r\n|]', ' ')
  foreach ($id in $scenarios.Keys) {
    if ($scenarios[$id].status -eq 'BLOQUEADO') { $scenarios[$id].evidence = 'Execução interrompida antes do cenário.' }
  }
} finally {
  $customerToken = $null; $otherToken = $null; $adminToken = $null
  $password = $null
  if ($reviewFile -and [System.IO.Path]::GetExtension($reviewFile) -eq '.bin' -and (Test-Path -LiteralPath $reviewFile)) { Remove-Item -LiteralPath $reviewFile -Force }
  Write-SanitizedReport
  Write-Output "Relatório sanitizado criado/atualizado: $reportPath"
  if ($failure) { Write-Output 'Execução BLOQUEADA; consulte o relatório sanitizado e os pré-requisitos, sem compartilhar credenciais ou tokens.' }
}
