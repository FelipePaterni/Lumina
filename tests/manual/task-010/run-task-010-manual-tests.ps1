[CmdletBinding()]
param(
  [string]$ApiBase = "http://localhost:3001",
  [Parameter(Mandatory = $true)] [string]$WorkId,
  [Parameter(Mandatory = $true)] [PSCredential]$CustomerA,
  [Parameter(Mandatory = $true)] [PSCredential]$CustomerB,
  [string]$ReportPath = "docs/testing/TASK-010-testes-manuais-resultado.md"
)

$ErrorActionPreference = "Stop"
$ApiBase = $ApiBase.TrimEnd("/")
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$resolvedReportPath = if ([System.IO.Path]::IsPathRooted($ReportPath)) { $ReportPath } else { Join-Path $repoRoot $ReportPath }
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$results = [System.Collections.Generic.List[object]]::new()
$tokenA = $null
$tokenB = $null

function Add-Result([string]$Id, [string]$Scenario, [string]$Status, [string]$Evidence) {
  $safeEvidence = $Evidence.Replace("|", "/").Replace("`r", " ").Replace("`n", " ")
  $results.Add([pscustomobject]@{ Id = $Id; Scenario = $Scenario; Status = $Status; Evidence = $safeEvidence })
}

function Invoke-Api([string]$Method, [string]$Path, [string]$Token = $null, [object]$Body = $null) {
  try {
    $request = @{ Uri = "$ApiBase$Path"; Method = $Method; SkipHttpErrorCheck = $true; TimeoutSec = 15 }
    if ($Token) { $request.Headers = @{ Authorization = "Bearer $Token" } }
    if ($null -ne $Body) { $request.ContentType = "application/json"; $request.Body = ConvertTo-Json -InputObject $Body -Compress }
    $response = Invoke-WebRequest @request
    return [pscustomobject]@{ Status = [int]$response.StatusCode; Content = [string]$response.Content }
  } catch {
    return [pscustomobject]@{ Status = 0; Content = "" }
  }
}

function Login([PSCredential]$Credential) {
  $password = $Credential.GetNetworkCredential().Password
  try {
    $response = Invoke-Api POST "/auth/login" $null @{ email = $Credential.UserName; password = $password }
    if ($response.Status -notin @(200, 201)) { return $null }
    $payload = $response.Content | ConvertFrom-Json
    return $payload.accessToken
  } finally { $password = $null }
}

function Check([string]$Id, [string]$Scenario, [bool]$Passed, [string]$Evidence) {
  Add-Result $Id $Scenario $(if ($Passed) { "APROVADO" } else { "REPROVADO" }) $Evidence
}

try {
  $unauthenticated = Invoke-Api GET "/wishlist"
  Check "MT-010-01" "Rejeitar consulta sem autenticação" ($unauthenticated.Status -eq 401) "GET sem token retornou HTTP $($unauthenticated.Status)."

  $tokenA = Login $CustomerA
  $tokenB = Login $CustomerB
  if (-not $tokenA -or -not $tokenB) {
    Add-Result "MT-010-02" "Autenticar clientes sintéticos" "BLOQUEADO" "Login de uma ou ambas as contas sintéticas não foi concluído."
    throw "Não foi possível autenticar as contas sintéticas."
  }
  Check "MT-010-02" "Autenticar clientes sintéticos" $true "Duas contas CUSTOMER autenticadas; credenciais e tokens omitidos."

  $add = Invoke-Api POST "/wishlist" $tokenA @{ workId = $WorkId }
  Check "MT-010-03" "Adicionar obra à lista própria" ($add.Status -eq 201) "POST retornou HTTP $($add.Status)."

  if ($add.Status -eq 201) {
    $duplicate = Invoke-Api POST "/wishlist" $tokenA @{ workId = $WorkId }
    Check "MT-010-04" "Recusar obra duplicada" ($duplicate.Status -eq 409) "POST duplicado retornou HTTP $($duplicate.Status)."

    $listB = Invoke-Api GET "/wishlist" $tokenB
    $visibleToB = $false
    if ($listB.Status -eq 200) {
      $itemsB = @($listB.Content | ConvertFrom-Json)
      $visibleToB = @($itemsB | Where-Object { $_.workId -eq $WorkId }).Count -gt 0
    }
    Check "MT-010-05" "Isolar lista entre clientes" ($listB.Status -eq 200 -and -not $visibleToB) "Cliente B recebeu HTTP $($listB.Status); item da conta A não apareceu."

    $deleteB = Invoke-Api DELETE "/wishlist/$([uri]::EscapeDataString($WorkId))" $tokenB
    Check "MT-010-06" "Recusar remoção de item alheio" ($deleteB.Status -eq 404) "DELETE como cliente B retornou HTTP $($deleteB.Status)."

    $listA = Invoke-Api GET "/wishlist" $tokenA
    $visibleToA = $false
    if ($listA.Status -eq 200) {
      $itemsA = @($listA.Content | ConvertFrom-Json)
      $visibleToA = @($itemsA | Where-Object { $_.workId -eq $WorkId }).Count -gt 0
    }
    Check "MT-010-07" "Preservar item após tentativa de terceiro" ($listA.Status -eq 200 -and $visibleToA) "Cliente A recebeu HTTP $($listA.Status); item continua na lista."

    $deleteA = Invoke-Api DELETE "/wishlist/$([uri]::EscapeDataString($WorkId))" $tokenA
    Check "MT-010-08" "Remover item da lista própria" ($deleteA.Status -eq 200) "DELETE pelo cliente A retornou HTTP $($deleteA.Status)."
  } else {
    foreach ($case in @(
      @("MT-010-04", "Recusar obra duplicada"),
      @("MT-010-05", "Isolar lista entre clientes"),
      @("MT-010-06", "Recusar remoção de item alheio"),
      @("MT-010-07", "Preservar item após tentativa de terceiro"),
      @("MT-010-08", "Remover item da lista própria")
    )) { Add-Result $case[0] $case[1] "BLOQUEADO" "Dependente de adição inicial bem-sucedida." }
  }
} catch {
  if (-not ($results | Where-Object Status -eq "BLOQUEADO")) {
    Add-Result "MT-010-99" "Execução do roteiro" "BLOQUEADO" "Falha operacional; revisar o ambiente local sem registrar credenciais ou tokens."
  }
} finally {
  if ($tokenA) {
    $null = Invoke-Api DELETE "/wishlist/$([uri]::EscapeDataString($WorkId))" $tokenA
  }
  $tokenA = $null
  $tokenB = $null
  $lines = @(
    "## Execução do roteiro manual — $timestamp",
    "",
    "Credenciais e tokens sintéticos foram mantidos apenas em memória e omitidos do relatório.",
    "",
    "| ID | Cenário | Status | Evidência sanitizada |",
    "|---|---|---|---|"
  )
  foreach ($result in $results) { $lines += "| $($result.Id) | $($result.Scenario) | $($result.Status) | $($result.Evidence) |" }
  $directory = Split-Path -Parent $resolvedReportPath
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
  Set-Content -LiteralPath $resolvedReportPath -Value $lines -Encoding utf8
  $results | ForEach-Object { "{0}: {1}" -f $_.Id, $_.Status }
  "Relatório sanitizado: $resolvedReportPath"
}
