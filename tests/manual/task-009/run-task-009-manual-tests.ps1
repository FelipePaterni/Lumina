[CmdletBinding()]
param(
  [string]$ApiBase = "http://localhost:3001",
  [string]$WebBase = "http://localhost:3000",
  [string]$ReportPath = "docs/testing/TASK-009-testes-manuais-resultado.md",
  [Parameter(Mandatory = $true)]
  [string]$PhysicalEditionId,
  [Parameter(Mandatory = $true)]
  [string]$DigitalEditionId,
  [Parameter(Mandatory = $true)]
  [PSCredential]$AdminCredential,
  [PSCredential]$CustomerCredential,
  [switch]$PublicRouteInventoryReviewed,
  [string]$PostgresService = "postgres",
  [string]$PostgresUser = "lumina",
  [string]$PostgresDatabase = "lumina"
)

$ErrorActionPreference = "Stop"
$ApiBase = $ApiBase.TrimEnd("/")
$WebBase = $WebBase.TrimEnd("/")
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path
$resolvedReportPath = if ([System.IO.Path]::IsPathRooted($ReportPath)) { $ReportPath } else { Join-Path $repoRoot $ReportPath }
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$results = [System.Collections.Generic.List[object]]::new()
$script:task009OriginalChecksum = $null

function Add-Result([string]$Id, [string]$Name, [string]$Status, [string]$Evidence) {
  $safeEvidence = $Evidence.Replace("|", "/").Replace("`r", " ").Replace("`n", " ")
  $results.Add([pscustomobject]@{ Id = $Id; Name = $Name; Status = $Status; Evidence = $safeEvidence })
}

function Invoke-Api(
  [string]$Method,
  [string]$Path,
  [object]$Body = $null,
  [hashtable]$Headers = @{}
) {
  try {
    $request = @{
      Uri                = "$ApiBase$Path"
      Method             = $Method
      Headers            = $Headers
      SkipHttpErrorCheck = $true
      TimeoutSec         = 15
    }
    if ($null -ne $Body) {
      $request.ContentType = "application/json"
      $request.Body = ConvertTo-Json -InputObject $Body -Depth 8 -Compress
    }
    $response = Invoke-WebRequest @request
    return [pscustomobject]@{ Status = [int]$response.StatusCode; Content = [string]$response.Content }
  } catch {
    return [pscustomobject]@{ Status = 0; Content = "" }
  }
}

function Convert-JsonContent([string]$Content) {
  try { return $Content | ConvertFrom-Json }
  catch { return $null }
}

function Get-Audit([string]$Action) {
  $response = Invoke-Api GET "/admin/audit-logs?action=$Action&limit=100" $null $adminHeaders
  if ($response.Status -ne 200) { return $null }
  return Convert-JsonContent $response.Content
}

function Has-NewAudit($AuditResult, [string]$TargetId, [datetime]$Since) {
  if (-not $AuditResult) { return $false }
  return [bool]($AuditResult.items | Where-Object {
    $_.targetId -eq $TargetId -and ([datetime]$_.createdAt).ToUniversalTime() -ge $Since
  })
}

function Run-Scenario([string]$Id, [string]$Name, [scriptblock]$Action) {
  try {
    $outcome = & $Action
    $status = if ($outcome.Pass) { "APROVADO" } else { "REPROVADO" }
    Add-Result $Id $Name $status $outcome.Evidence
  } catch {
    Add-Result $Id $Name "BLOQUEADO" "Falha de execução sem detalhes potencialmente sensíveis; revisar o erro localmente."
  }
}

function Write-Report {
  $directory = Split-Path -Parent $resolvedReportPath
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
  $lines = @(
    "## Execução automatizada — $timestamp",
    "",
    "Dados sintéticos. Tokens, senhas, e-mails, IDs, conteúdo de arquivos e PII foram omitidos.",
    "",
    "| ID | Cenário | Status | Evidência sanitizada |",
    "|---|---|---|---|"
  )
  foreach ($result in $results) {
    $lines += "| $($result.Id) | $($result.Name) | $($result.Status) | $($result.Evidence) |"
  }
  $lines += "", "API: $ApiBase; Web HTTP: $webStatus; banco: PostgreSQL local do Compose."
  if (Test-Path -LiteralPath $resolvedReportPath) {
    Add-Content -LiteralPath $resolvedReportPath -Value (@("", "---", "") + $lines) -Encoding utf8
  } else {
    Set-Content -LiteralPath $resolvedReportPath -Value (@("# Resultado dos testes manuais - TASK-009", "") + $lines) -Encoding utf8
  }
}

# Pré-condições e autenticação. Segredos e tokens permanecem somente em memória.
try {
  $worksResponse = Invoke-Api GET "/works"
  $webStatus = 0
  try {
    $webResponse = Invoke-WebRequest -Uri $WebBase -SkipHttpErrorCheck -TimeoutSec 10
    $webStatus = [int]$webResponse.StatusCode
  } catch { $webStatus = 0 }

  $adminPassword = $AdminCredential.GetNetworkCredential().Password
  $adminLogin = Invoke-Api POST "/auth/login" @{ email = $AdminCredential.UserName; password = $adminPassword }
  $adminUser = Convert-JsonContent $adminLogin.Content
  if ($worksResponse.Status -ne 200 -or $adminLogin.Status -notin 200, 201 -or $adminUser.user.role -ne "ADMIN") {
    foreach ($id in 1..10) {
      Add-Result ("MT-009-{0:D2}" -f $id) "Pré-condições TASK-009" "BLOQUEADO" "API indisponível ou login ADMIN sintético não validado."
    }
    Write-Report
    Write-Output "Pré-condições não atendidas. Relatório sanitizado: $resolvedReportPath"
    return
  }
  $adminHeaders = @{ Authorization = "Bearer $($adminUser.accessToken)" }

  try {
    if ($CustomerCredential) {
      $customerPassword = $CustomerCredential.GetNetworkCredential().Password
      $customerLogin = Invoke-Api POST "/auth/login" @{ email = $CustomerCredential.UserName; password = $customerPassword }
    } else {
      $suffix = [guid]::NewGuid().ToString("N").Substring(0, 10)
      $customerEmail = "task009-$suffix@example.invalid"
      $customerPassword = "Task009-" + [guid]::NewGuid().ToString("N") + "aA1!"
      $register = Invoke-Api POST "/auth/register" @{ email = $customerEmail; password = $customerPassword }
      if ($register.Status -in @(200, 201)) {
        $tokenQuery = "SELECT body FROM outbox_emails WHERE to_email = '$customerEmail' ORDER BY created_at DESC LIMIT 1;"
        $outboxBody = $tokenQuery | & docker compose exec -T $PostgresService psql -U $PostgresUser -d $PostgresDatabase -At
        $tokenMatch = [regex]::Match(($outboxBody -join "`n"), '([A-Za-z0-9_-]{40,})')
        if ($tokenMatch.Success) {
          $confirmation = Invoke-Api POST "/auth/confirm-email" @{ token = $tokenMatch.Groups[1].Value }
          if ($confirmation.Status -in @(200, 201)) {
            $customerLogin = Invoke-Api POST "/auth/login" @{ email = $customerEmail; password = $customerPassword }
          }
        }
      }
    }
  } catch {
    $customerLogin = $null
  }
  $customerUser = Convert-JsonContent $customerLogin.Content
  $customerHeaders = if ($customerLogin.Status -in @(200, 201) -and $customerUser.user.role -eq "CUSTOMER") {
    @{ Authorization = "Bearer $($customerUser.accessToken)" }
  } else { $null }
} catch {
  foreach ($id in 1..10) {
    Add-Result ("MT-009-{0:D2}" -f $id) "Pré-condições TASK-009" "BLOQUEADO" "Falha ao preparar ambiente sintético; detalhes omitidos."
  }
  $webStatus = 0
  Write-Report
  Write-Output "Falha nas pré-condições. Relatório sanitizado: $resolvedReportPath"
  return
}

Run-Scenario "MT-009-01" "Ajustar estoque físico válido" {
  $since = (Get-Date).ToUniversalTime()
  $patch = Invoke-Api PATCH "/inventory/$PhysicalEditionId/physical" @{ stock = 5; reason = "Teste sintético TASK-009" } $adminHeaders
  $inventoryResponse = Invoke-Api GET "/inventory/$PhysicalEditionId" $null $adminHeaders
  $inventory = Convert-JsonContent $inventoryResponse.Content
  $audit = Get-Audit "INVENTORY_PHYSICAL_ADJUSTED"
  $movement = $inventory.movements | Where-Object { $_.type -eq "PHYSICAL_ADJUSTMENT" -and $_.quantity -eq 5 } | Select-Object -First 1
  $auditFound = Has-NewAudit $audit $PhysicalEditionId $since
  [pscustomobject]@{ Pass = ($patch.Status -eq 200 -and $inventoryResponse.Status -eq 200 -and $inventory.physicalStock -eq 5 -and $movement -and $auditFound); Evidence = "PATCH $($patch.Status); GET $($inventoryResponse.Status); stock $($inventory.physicalStock); movement $([bool]$movement); audit $auditFound." }
}

Run-Scenario "MT-009-02" "Rejeitar estoque físico negativo" {
  $beforeResponse = Invoke-Api GET "/inventory/$PhysicalEditionId" $null $adminHeaders
  $before = Convert-JsonContent $beforeResponse.Content
  $patch = Invoke-Api PATCH "/inventory/$PhysicalEditionId/physical" @{ stock = -1; reason = "Teste sintético TASK-009" } $adminHeaders
  $afterResponse = Invoke-Api GET "/inventory/$PhysicalEditionId" $null $adminHeaders
  $after = Convert-JsonContent $afterResponse.Content
  [pscustomobject]@{ Pass = ($patch.Status -eq 400 -and $before.physicalStock -eq $after.physicalStock); Evidence = "PATCH $($patch.Status); stock antes/depois $($before.physicalStock)/$($after.physicalStock)." }
}

Run-Scenario "MT-009-03" "Configurar licença digital numerada" {
  $since = (Get-Date).ToUniversalTime()
  $patch = Invoke-Api PATCH "/inventory/$DigitalEditionId/digital" @{ limit = 10; reason = "Teste sintético TASK-009" } $adminHeaders
  $get = Invoke-Api GET "/inventory/$DigitalEditionId" $null $adminHeaders
  $inventory = Convert-JsonContent $get.Content
  $auditFound = Has-NewAudit (Get-Audit "INVENTORY_DIGITAL_LIMIT_CHANGED") $DigitalEditionId $since
  [pscustomobject]@{ Pass = ($patch.Status -eq 200 -and $get.Status -eq 200 -and $inventory.digitalLicenseLimit -eq 10 -and $inventory.digitalAllocated -le 10 -and $auditFound); Evidence = "PATCH $($patch.Status); GET $($get.Status); limit $($inventory.digitalLicenseLimit); allocated $($inventory.digitalAllocated); audit $auditFound." }
}

Run-Scenario "MT-009-04" "Configurar licença digital ilimitada" {
  $since = (Get-Date).ToUniversalTime()
  $patch = Invoke-Api PATCH "/inventory/$DigitalEditionId/digital" @{ limit = $null; reason = "Teste sintético TASK-009" } $adminHeaders
  $get = Invoke-Api GET "/inventory/$DigitalEditionId" $null $adminHeaders
  $inventory = Convert-JsonContent $get.Content
  $auditFound = Has-NewAudit (Get-Audit "INVENTORY_DIGITAL_LIMIT_CHANGED") $DigitalEditionId $since
  [pscustomobject]@{ Pass = ($patch.Status -eq 200 -and $get.Status -eq 200 -and $null -eq $inventory.digitalLicenseLimit -and $auditFound); Evidence = "PATCH $($patch.Status); GET $($get.Status); limit null $($null -eq $inventory.digitalLicenseLimit); audit $auditFound." }
}

Run-Scenario "MT-009-05" "Rejeitar limite digital inválido" {
  $before = Convert-JsonContent (Invoke-Api GET "/inventory/$DigitalEditionId" $null $adminHeaders).Content
  $patch = Invoke-Api PATCH "/inventory/$DigitalEditionId/digital" @{ limit = -1; reason = "Teste sintético TASK-009" } $adminHeaders
  $after = Convert-JsonContent (Invoke-Api GET "/inventory/$DigitalEditionId" $null $adminHeaders).Content
  [pscustomobject]@{ Pass = ($patch.Status -eq 400 -and $null -eq $before.digitalLicenseLimit -and $null -eq $after.digitalLicenseLimit); Evidence = "PATCH $($patch.Status); limit null antes/depois $($null -eq $before.digitalLicenseLimit)/$($null -eq $after.digitalLicenseLimit)." }
}

Run-Scenario "MT-009-06" "Negar alteração para CUSTOMER" {
  if (-not $customerHeaders) { throw "CUSTOMER sintético indisponível" }
  $before = Convert-JsonContent (Invoke-Api GET "/inventory/$PhysicalEditionId" $null $adminHeaders).Content
  $auditBefore = Get-Audit "INVENTORY_PHYSICAL_ADJUSTED"
  $beforeCount = @($auditBefore.items | Where-Object { $_.targetId -eq $PhysicalEditionId }).Count
  $patch = Invoke-Api PATCH "/inventory/$PhysicalEditionId/physical" @{ stock = 4; reason = "Teste sintético TASK-009" } $customerHeaders
  $after = Convert-JsonContent (Invoke-Api GET "/inventory/$PhysicalEditionId" $null $adminHeaders).Content
  $auditAfter = Get-Audit "INVENTORY_PHYSICAL_ADJUSTED"
  $afterCount = @($auditAfter.items | Where-Object { $_.targetId -eq $PhysicalEditionId }).Count
  [pscustomobject]@{ Pass = ($patch.Status -eq 403 -and $before.physicalStock -eq $after.physicalStock -and $beforeCount -eq $afterCount); Evidence = "CUSTOMER PATCH $($patch.Status); stock antes/depois $($before.physicalStock)/$($after.physicalStock); audit count $beforeCount/$afterCount." }
}

Run-Scenario "MT-009-07" "Criar versão de ativo privado" {
  $syntheticOriginal = "TASK-009 private original " + [guid]::NewGuid().ToString("N")
  $originalBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($syntheticOriginal))
  $assetSince = (Get-Date).ToUniversalTime()
  $assetBody = @{ contentBase64 = $originalBase64; extension = "txt"; mimeType = "text/plain"; isOriginal = $true; reason = "Teste sintético TASK-009" }
  $assetResponse = Invoke-Api POST "/catalog/assets/$DigitalEditionId/versions" $assetBody $adminHeaders
  $createdVersion = Convert-JsonContent $assetResponse.Content
  $assetGetResponse = Invoke-Api GET "/catalog/assets/$DigitalEditionId" $null $adminHeaders
  $asset = Convert-JsonContent $assetGetResponse.Content
  $assetAudit = Get-Audit "DIGITAL_ASSET_VERSION_CREATED"
  $assetAuditFound = if ($asset) { Has-NewAudit $assetAudit $asset.id $assetSince } else { $false }
  $versionProperties = if ($createdVersion) { @($createdVersion.PSObject.Properties.Name) } else { @() }
  $listedProperties = if ($asset -and $asset.versions.Count -gt 0) { @($asset.versions[0].PSObject.Properties.Name) } else { @() }
  $listedCreatedVersion = [bool]($asset.versions | Where-Object { $_.version -eq $createdVersion.version })
  $pass = (($assetResponse.Status -in @(200, 201)) -and $assetGetResponse.Status -eq 200 -and $createdVersion.checksum -and $listedCreatedVersion -and "storageKey" -notin $versionProperties -and "contentBase64" -notin $versionProperties -and "storageKey" -notin $listedProperties -and $assetAuditFound)
  if ($pass) { $script:task009OriginalChecksum = [string]$createdVersion.checksum }
  [pscustomobject]@{ Pass = $pass; Evidence = "POST $($assetResponse.Status); GET $($assetGetResponse.Status); versão $($createdVersion.version); checksum $([bool]$createdVersion.checksum); campos privados ausentes; audit $assetAuditFound." }
}

Run-Scenario "MT-009-08" "Rejeitar Base64 inválido" {
  $before = Convert-JsonContent (Invoke-Api GET "/catalog/assets/$DigitalEditionId" $null $adminHeaders).Content
  $invalidBody = @{ contentBase64 = "conteudo-invalido"; extension = "txt"; mimeType = "text/plain"; reason = "Teste sintético TASK-009" }
  $post = Invoke-Api POST "/catalog/assets/$DigitalEditionId/versions" $invalidBody $adminHeaders
  $after = Convert-JsonContent (Invoke-Api GET "/catalog/assets/$DigitalEditionId" $null $adminHeaders).Content
  [pscustomobject]@{ Pass = ($post.Status -eq 400 -and $before.versions.Count -eq $after.versions.Count); Evidence = "POST $($post.Status); versões antes/depois $($before.versions.Count)/$($after.versions.Count)." }
}

Run-Scenario "MT-009-09" "Versionar sem expor original" {
  $since = (Get-Date).ToUniversalTime()
  $revisionText = "TASK-009 private revision " + [guid]::NewGuid().ToString("N")
  $body = @{ contentBase64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($revisionText)); extension = "txt"; mimeType = "text/plain"; isOriginal = $false; reason = "Teste sintético TASK-009" }
  $post = Invoke-Api POST "/catalog/assets/$DigitalEditionId/versions" $body $adminHeaders
  $version = Convert-JsonContent $post.Content
  $get = Invoke-Api GET "/catalog/assets/$DigitalEditionId" $null $adminHeaders
  $listing = Convert-JsonContent $get.Content
  $newAudit = Has-NewAudit (Get-Audit "DIGITAL_ASSET_VERSION_CREATED") $listing.id $since
  $properties = if ($listing.versions.Count -gt 0) { @($listing.versions[0].PSObject.Properties.Name) } else { @() }
  $ordered = ($listing.versions.Count -ge 2 -and $listing.versions[0].version -eq $version.version -and $listing.versions[1].version -eq ($version.version - 1))
  [pscustomobject]@{ Pass = (($post.Status -in @(200, 201)) -and $get.Status -eq 200 -and $ordered -and "storageKey" -notin $properties -and $newAudit); Evidence = "POST $($post.Status); versões $($listing.versions.Count); sequência $ordered; storageKey ausente; audit $newAudit." }
}

Run-Scenario "MT-009-10" "Bloquear acesso público ao ativo" {
  if (-not $PublicRouteInventoryReviewed) { throw "Revise a superfície de rotas conforme o README manual e informe -PublicRouteInventoryReviewed" }
  if (-not $script:task009OriginalChecksum) { throw "MT-009-07 não confirmou a versão original desta execução" }
  $anonymous = Invoke-Api GET "/catalog/assets/$DigitalEditionId"
  $guessedPath = Invoke-Api GET "/storage/private/original/$($script:task009OriginalChecksum).txt"
  $returnedOriginal = $guessedPath.Content -ceq $syntheticOriginal
  [pscustomobject]@{ Pass = ($PublicRouteInventoryReviewed -and $anonymous.Status -eq 401 -and $guessedPath.Status -eq 404 -and -not $returnedOriginal); Evidence = "Inventário de rotas revisado; sem Authorization $($anonymous.Status); caminho presumido $($guessedPath.Status); conteúdo original retornado $returnedOriginal." }
}

Write-Report
$results | Select-Object Id, Status, Evidence | Format-Table -AutoSize
Write-Output "Relatório sanitizado atualizado: $resolvedReportPath"

# Remover referências explícitas a segredos e tokens da sessão do script.
$adminPassword = $null
$customerPassword = $null
$adminUser = $null
$customerUser = $null
$adminHeaders = $null
$customerHeaders = $null
