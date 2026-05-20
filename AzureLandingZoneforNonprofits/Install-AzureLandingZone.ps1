[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ConfigFile,

  [Parameter(Mandatory = $true)]
  [ValidateSet('validate', 'what-if', 'create')]
  [string]$Action,

  [string]$OutputFolder = '',

  [ValidateSet('Provider', 'ProviderNoRbac', 'Template')]
  [string]$ValidationLevel = $null,

  [switch]$NonInteractive,

  [switch]$AutoApprove
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-AlzInstallContextFromPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$StartPath
  )

  $current = Get-Item -LiteralPath $StartPath
  if ($current -isnot [System.IO.DirectoryInfo]) {
    $current = $current.Directory
  }

  while ($null -ne $current) {
    $packageScenarioManifestPath = Join-Path $current.FullName 'scenarios.json'
    if (Test-Path $packageScenarioManifestPath -PathType Leaf) {
      if ($current.Name -ieq 'cli' -and $null -ne $current.Parent -and (Test-Path (Join-Path $current.Parent.FullName 'infra') -PathType Container)) {
        return [ordered]@{
          root = $current.Parent.FullName
          scenarioManifestPath = $packageScenarioManifestPath
        }
      }

      return [ordered]@{
        root = $current.FullName
        scenarioManifestPath = $packageScenarioManifestPath
      }
    }

    $sourceScenarioManifestPath = Join-Path $current.FullName 'cli\scenarios.json'
    if (Test-Path $sourceScenarioManifestPath -PathType Leaf) {
      return [ordered]@{
        root = $current.FullName
        scenarioManifestPath = $sourceScenarioManifestPath
      }
    }

    $current = $current.Parent
  }

  throw "Could not locate Azure Landing Zone CLI scenario catalog from '$StartPath'."
}

$script:AlzContext = Get-AlzInstallContextFromPath -StartPath $PSScriptRoot
$script:AlzRoot = [string]$script:AlzContext.root
$script:ScenarioManifestPath = [string]$script:AlzContext.scenarioManifestPath
$script:LogFile = ''

function Write-InstallerLog {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Message,

    [ValidateSet('INFO', 'WARNING', 'ERROR', 'SUCCESS')]
    [string]$Level = 'INFO'
  )

  $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $line = "[$timestamp] [$Level] $Message"

  if (-not [string]::IsNullOrWhiteSpace($script:LogFile)) {
    Add-Content -Path $script:LogFile -Value $line -Encoding UTF8
  }

  switch ($Level) {
    'ERROR' { Write-Host $Message -ForegroundColor Red }
    'WARNING' { Write-Host $Message -ForegroundColor Yellow }
    'SUCCESS' { Write-Host $Message -ForegroundColor Green }
    default { Write-Host $Message }
  }
}

function Read-JsonDocument {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  return Get-Content -Path $Path -Raw -Encoding UTF8 | ConvertFrom-Json -AsHashtable -Depth 100
}

function Write-JsonDocument {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [object]$Value
  )

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path $directory)) {
    New-Item -Path $directory -ItemType Directory -Force | Out-Null
  }

  $json = $Value | ConvertTo-Json -Depth 100
  Set-Content -Path $Path -Value $json -Encoding UTF8
}

function Resolve-PathAgainstRoot {
  param(
    [Parameter(Mandatory = $true)]
    [string]$PathValue,

    [Parameter(Mandatory = $true)]
    [string]$ConfigDirectory
  )

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }

  $configRelative = [System.IO.Path]::GetFullPath((Join-Path $ConfigDirectory $PathValue))
  if (Test-Path $configRelative) {
    return $configRelative
  }

  return [System.IO.Path]::GetFullPath((Join-Path $script:AlzRoot $PathValue))
}

function Format-CommandLine {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $quoted = foreach ($argument in $Arguments) {
    if ($argument -match '\s') {
      '"{0}"' -f $argument
    }
    else {
      $argument
    }
  }

  return 'az ' + ($quoted -join ' ')
}

function Get-OutputValue {
  param(
    [hashtable]$Outputs,
    [string]$Name,
    [object]$DefaultValue = $null
  )

  if ($null -eq $Outputs -or -not $Outputs.ContainsKey($Name)) {
    return $DefaultValue
  }

  $output = $Outputs[$Name]
  if ($output -is [hashtable] -and $output.ContainsKey('value')) {
    return $output['value']
  }

  return $output
}

function Test-RequiredTooling {
  if ($PSVersionTable.PSVersion.Major -lt 7) {
    throw 'PowerShell 7 or later is required.'
  }

  if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw 'Azure CLI is required but was not found on PATH.'
  }

  $azVersionDocument = & az version -o json --only-show-errors 2>$null | Out-String
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($azVersionDocument)) {
    throw 'Unable to determine the Azure CLI version.'
  }

  try {
    $azVersion = ($azVersionDocument | ConvertFrom-Json -AsHashtable -Depth 20)['azure-cli']
  }
  catch {
    throw 'Unable to parse the Azure CLI version.'
  }

  if ([string]::IsNullOrWhiteSpace([string]$azVersion)) {
    throw 'Unable to parse the Azure CLI version.'
  }

  if ([version]$azVersion -lt [version]'2.76.0') {
    throw "Azure CLI 2.76.0 or later is required. Current version: $azVersion"
  }

  & az bicep version 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'Azure CLI Bicep support is required. Run az bicep install or az bicep upgrade.'
  }

  & az account show -o none 2>$null
  if ($LASTEXITCODE -ne 0) {
    throw 'Azure authentication is required. Run az login before using this installer.'
  }
}

function Resolve-ScenarioDefinition {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RequestedScenario,

    [Parameter(Mandatory = $true)]
    [hashtable]$ScenarioManifest
  )

  foreach ($scenario in $ScenarioManifest.scenarios) {
    foreach ($alias in $scenario.aliases) {
      if ($alias -ieq $RequestedScenario) {
        return $scenario
      }
    }
  }

  throw "Unsupported scenario '$RequestedScenario'."
}

function Test-ScenarioModeActivation {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ModeDefinition,

    [Parameter(Mandatory = $true)]
    [hashtable]$ParameterValues
  )

  if (-not $ModeDefinition.ContainsKey('activation') -or $null -eq $ModeDefinition.activation) {
    return $false
  }

  $activation = [hashtable]$ModeDefinition.activation
  $requiredParameters = @()
  if ($activation.ContainsKey('requiredParameters') -and $null -ne $activation.requiredParameters) {
    $requiredParameters = @($activation.requiredParameters)
  }

  foreach ($parameterName in $requiredParameters) {
    if (-not $ParameterValues.ContainsKey([string]$parameterName)) {
      return $false
    }

    $parameterValue = $ParameterValues[[string]$parameterName]
    if ($null -eq $parameterValue) {
      return $false
    }

    if ($parameterValue -is [string] -and [string]::IsNullOrWhiteSpace([string]$parameterValue)) {
      return $false
    }
  }

  if ($activation.ContainsKey('requiredParameterValues') -and $null -ne $activation.requiredParameterValues) {
    foreach ($parameterEntry in ([hashtable]$activation.requiredParameterValues).GetEnumerator()) {
      $parameterName = [string]$parameterEntry.Key
      $expectedValue = $parameterEntry.Value
      $hasValue = $ParameterValues.ContainsKey($parameterName)
      $actualValue = if ($hasValue) { $ParameterValues[$parameterName] } else { $null }

      if (-not $hasValue -or $actualValue -ne $expectedValue) {
        return $false
      }
    }
  }

  return $true
}

function Resolve-ScenarioMode {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ScenarioDefinition,

    [Parameter(Mandatory = $true)]
    [hashtable]$ParameterValues
  )

  $internalModes = @()
  if ($ScenarioDefinition.ContainsKey('internalModes') -and $null -ne $ScenarioDefinition.internalModes) {
    $internalModes = @($ScenarioDefinition.internalModes)
  }

  foreach ($internalMode in $internalModes) {
    if (-not (Test-ScenarioModeActivation -ModeDefinition ([hashtable]$internalMode) -ParameterValues $ParameterValues)) {
      continue
    }

    $resolvedScenarioDefinition = [ordered]@{}
    foreach ($entry in $ScenarioDefinition.GetEnumerator()) {
      if ($entry.Key -eq 'internalModes') {
        continue
      }

      $resolvedScenarioDefinition[$entry.Key] = $entry.Value
    }

    foreach ($entry in ([hashtable]$internalMode).GetEnumerator()) {
      if ($entry.Key -eq 'activation') {
        continue
      }

      $resolvedScenarioDefinition[$entry.Key] = $entry.Value
    }

    return $resolvedScenarioDefinition
  }

  return $ScenarioDefinition
}

function Resolve-SubscriptionReference {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionReference
  )

  $resultText = & az account show --subscription $SubscriptionReference -o json --only-show-errors 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "We could not access the selected subscription '$SubscriptionReference'."
  }

  return $resultText | ConvertFrom-Json -AsHashtable -Depth 20
}

function Resolve-ManagementGroupReference {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ManagementGroupReference
  )

  $resultText = & az account management-group show --name $ManagementGroupReference -o json --only-show-errors 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "We could not access the selected management group '$ManagementGroupReference'."
  }

  return $resultText | ConvertFrom-Json -AsHashtable -Depth 20
}

function Resolve-ResourceReference {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceId
  )

  $resultText = & az resource show --ids $ResourceId -o json --only-show-errors 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "We could not access the selected resource '$ResourceId'."
  }

  return $resultText | ConvertFrom-Json -AsHashtable -Depth 20
}

function Get-EffectiveParameterValues {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ParameterDocument
  )

  $values = @{}
  foreach ($entry in $ParameterDocument.parameters.GetEnumerator()) {
    if ($entry.Value -is [hashtable] -and $entry.Value.ContainsKey('value')) {
      $values[$entry.Key] = $entry.Value['value']
    }
  }

  return $values
}

function Get-OptionalStringParameterValue {
  param(
    [hashtable]$ParameterValues,
    [string]$Name
  )

  if ($null -eq $ParameterValues -or -not $ParameterValues.ContainsKey($Name) -or $null -eq $ParameterValues[$Name]) {
    return ''
  }

  return [string]$ParameterValues[$Name]
}

function Get-BooleanParameterValue {
  param(
    [hashtable]$ParameterValues,
    [string]$Name
  )

  if ($null -eq $ParameterValues -or -not $ParameterValues.ContainsKey($Name)) {
    return $false
  }

  $value = $ParameterValues[$Name]
  return $value -is [bool] -and $value
}

function Get-ArrayParameterValue {
  param(
    [hashtable]$ParameterValues,
    [string]$Name
  )

  if ($null -eq $ParameterValues -or -not $ParameterValues.ContainsKey($Name) -or $null -eq $ParameterValues[$Name]) {
    return @()
  }

  $value = $ParameterValues[$Name]
  if ($value -is [string]) {
    if ([string]::IsNullOrWhiteSpace([string]$value)) {
      return @()
    }

    return @([string]$value)
  }

  return @($value)
}

function Test-WarningParameterActive {
  param(
    [hashtable]$ParameterValues,
    [string]$Name
  )

  if ($null -eq $ParameterValues -or -not $ParameterValues.ContainsKey($Name) -or $null -eq $ParameterValues[$Name]) {
    return $false
  }

  $value = $ParameterValues[$Name]
  if ($value -is [bool]) {
    return [bool]$value
  }

  if ($value -is [byte] -or $value -is [sbyte] -or $value -is [short] -or $value -is [ushort] -or $value -is [int] -or $value -is [uint] -or $value -is [long] -or $value -is [ulong] -or $value -is [float] -or $value -is [double] -or $value -is [decimal]) {
    return [decimal]$value -gt 0
  }

  if ($value -is [string]) {
    $trimmedValue = ([string]$value).Trim()
    if ([string]::IsNullOrWhiteSpace($trimmedValue)) {
      return $false
    }

    $parsedBoolean = $false
    if ([bool]::TryParse($trimmedValue, [ref]$parsedBoolean)) {
      return $parsedBoolean
    }

    $parsedNumber = [decimal]0
    if ([decimal]::TryParse($trimmedValue, [System.Globalization.NumberStyles]::Number, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$parsedNumber)) {
      return $parsedNumber -gt 0
    }

    return $true
  }

  if ($value -is [System.Array]) {
    return @($value).Count -gt 0
  }

  return $true
}

function Test-ServiceOwnerParameterValue {
  param(
    [hashtable]$ParameterValues
  )

  $serviceOwner = Get-OptionalStringParameterValue -ParameterValues $ParameterValues -Name 'serviceOwner'
  return $serviceOwner -match '^[^\s@]+@[^\s@]+\.[^\s@]+$'
}

function Assert-ServiceOwnerParameterValue {
  param(
    [hashtable]$ParameterValues
  )

  if (-not (Test-ServiceOwnerParameterValue -ParameterValues $ParameterValues)) {
    throw "ServiceOwner must be a valid email address or shared mailbox alias, for example platform@example.org."
  }
}

function Test-ActionPatternMatch {
  param(
    [Parameter(Mandatory = $true)]
    [string]$ActionName,

    [Parameter(Mandatory = $true)]
    [string]$Pattern
  )

  if ([string]::IsNullOrWhiteSpace($Pattern)) {
    return $false
  }

  $escapedPattern = [regex]::Escape($Pattern).Replace('\*', '.*')
  return $ActionName -imatch ("^{0}$" -f $escapedPattern)
}

function Get-ScopePermissions {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Scope
  )

  $normalizedScope = $Scope.Trim()
  if ($normalizedScope.StartsWith('/')) {
    $normalizedScope = $normalizedScope.Substring(1)
  }

  $requestUrl = "https://management.azure.com/{0}/providers/Microsoft.Authorization/permissions?api-version=2015-07-01" -f $normalizedScope
  $resultText = & az rest --method get --url $requestUrl -o json --only-show-errors 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw "We could not determine effective permissions at scope '$Scope'."
  }

  $parsedResult = $resultText | ConvertFrom-Json -AsHashtable -Depth 50
  if ($parsedResult -is [hashtable] -and $parsedResult.ContainsKey('value') -and $null -ne $parsedResult.value) {
    return @($parsedResult.value)
  }

  return @($parsedResult)
}

function Test-ScopePermissionAvailable {
  param(
    [Parameter(Mandatory = $true)]
    [object[]]$PermissionEntries,

    [Parameter(Mandatory = $true)]
    [string]$ActionName
  )

  foreach ($permissionEntry in $PermissionEntries) {
    if ($permissionEntry -isnot [hashtable]) {
      continue
    }

    $allowedPatterns = if ($permissionEntry.ContainsKey('actions') -and $null -ne $permissionEntry.actions) {
      @($permissionEntry.actions)
    }
    else {
      @()
    }

    $deniedPatterns = if ($permissionEntry.ContainsKey('notActions') -and $null -ne $permissionEntry.notActions) {
      @($permissionEntry.notActions)
    }
    else {
      @()
    }

    $isAllowed = $false
    foreach ($pattern in $allowedPatterns) {
      if (Test-ActionPatternMatch -ActionName $ActionName -Pattern ([string]$pattern)) {
        $isAllowed = $true
        break
      }
    }

    if (-not $isAllowed) {
      continue
    }

    foreach ($pattern in $deniedPatterns) {
      if (Test-ActionPatternMatch -ActionName $ActionName -Pattern ([string]$pattern)) {
        $isAllowed = $false
        break
      }
    }

    if ($isAllowed) {
      return $true
    }
  }

  return $false
}

function Resolve-BudgetTargetSubscriptionId {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ScenarioDefinition,

    [Parameter(Mandatory = $true)]
    [hashtable]$ParameterValues,

    [hashtable]$SubscriptionMetadata
  )

  $foundationSubscriptionId = Get-OptionalStringParameterValue -ParameterValues $ParameterValues -Name 'foundationSubscriptionId'
  $managementSubscriptionId = Get-OptionalStringParameterValue -ParameterValues $ParameterValues -Name 'managementSubscriptionId'

  switch ([string]$ScenarioDefinition.id) {
    'foundation' {
      if ($null -ne $SubscriptionMetadata -and $SubscriptionMetadata.ContainsKey('id') -and -not [string]::IsNullOrWhiteSpace([string]$SubscriptionMetadata.id)) {
        return [string]$SubscriptionMetadata.id
      }

      return $foundationSubscriptionId
    }
    'expanded-platform' {
      return $managementSubscriptionId
    }
    default {
      return ''
    }
  }
}

function Resolve-BudgetWritePreflightState {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ScenarioDefinition,

    [Parameter(Mandatory = $true)]
    [hashtable]$ParameterDocument,

    [Parameter(Mandatory = $true)]
    [hashtable]$ParameterValues,

    [hashtable]$SubscriptionMetadata
  )

  $result = [ordered]@{
    targetSubscriptionId = ''
    attempted = $false
    confirmed = $false
    source = 'not-applicable'
    message = ''
  }

  $monthlyBudgetAmount = if ($ParameterValues.ContainsKey('monthlyBudgetAmount') -and $null -ne $ParameterValues['monthlyBudgetAmount']) {
    [int]$ParameterValues['monthlyBudgetAmount']
  }
  else {
    0
  }

  $budgetContactEmails = Get-ArrayParameterValue -ParameterValues $ParameterValues -Name 'budgetContactEmails'
  if ($monthlyBudgetAmount -le 0 -or $budgetContactEmails.Count -eq 0) {
    $result.source = 'not-requested'
    return $result
  }

  $targetSubscriptionId = Resolve-BudgetTargetSubscriptionId -ScenarioDefinition $ScenarioDefinition -ParameterValues $ParameterValues -SubscriptionMetadata $SubscriptionMetadata
  if ([string]::IsNullOrWhiteSpace($targetSubscriptionId)) {
    $result.source = 'not-in-scope'
    return $result
  }

  $result.targetSubscriptionId = $targetSubscriptionId
  $result.attempted = $true
  $budgetTargetLabel = if ([string]$ScenarioDefinition.id -eq 'expanded-platform') { 'Expanded Platform management subscription' } else { 'Foundation subscription' }

  try {
    $permissionEntries = Get-ScopePermissions -Scope ("subscriptions/{0}" -f $targetSubscriptionId)
    $budgetWriteAccessConfirmed = Test-ScopePermissionAvailable -PermissionEntries $permissionEntries -ActionName 'Microsoft.Consumption/budgets/write'

    $result.confirmed = $budgetWriteAccessConfirmed
    $result.source = 'automatic'
    $result.message = if ($budgetWriteAccessConfirmed) {
      "Budget write permission was confirmed automatically for $budgetTargetLabel '$targetSubscriptionId'."
    }
    else {
      "Budget write permission (Microsoft.Consumption/budgets/write) is NOT currently available at $budgetTargetLabel '$targetSubscriptionId' for the deployment identity. The deployment will fail on the budget step. Either grant Cost Management Contributor (or Contributor / Owner) at that subscription scope, or set monthlyBudgetAmount to 0 to skip the budget step. Newly created subscriptions may need up to 48 hours before Cost Management budget creation is available."
    }
  }
  catch {
    $result.source = 'fallback'
    $result.message = "Budget permission preflight could not be completed automatically for $budgetTargetLabel '$targetSubscriptionId'. The deployment will fail on the budget step if Microsoft.Consumption/budgets/write is missing. $($_.Exception.Message)"
  }

  return $result
}

function New-AuthorizationPermissionRequirement {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Scope,

    [Parameter(Mandatory = $true)]
    [string]$DisplayName,

    [Parameter(Mandatory = $true)]
    [string[]]$ActionNames
  )

  $normalizedScope = $Scope.Trim()
  if ($normalizedScope.StartsWith('/')) {
    $normalizedScope = $normalizedScope.Substring(1)
  }

  return [ordered]@{
    scope = $normalizedScope
    displayName = $DisplayName
    actionNames = @($ActionNames)
  }
}

function Get-AuthorizationPreflightSubscriptionId {
  param(
    [AllowNull()]
    [object]$SubscriptionMetadata,

    [string]$FallbackSubscriptionId = ''
  )

  if ($SubscriptionMetadata -is [hashtable]) {
    foreach ($key in @('id', 'subscriptionId')) {
      if ($SubscriptionMetadata.ContainsKey($key) -and -not [string]::IsNullOrWhiteSpace([string]$SubscriptionMetadata[$key])) {
        return [string]$SubscriptionMetadata[$key]
      }
    }
  }

  return $FallbackSubscriptionId
}

function Get-AuthorizationPreflightManagementGroupScope {
  param(
    [AllowNull()]
    [object]$ManagementGroupMetadata,

    [string]$FallbackManagementGroupId = ''
  )

  if ($ManagementGroupMetadata -is [hashtable]) {
    if ($ManagementGroupMetadata.ContainsKey('id') -and -not [string]::IsNullOrWhiteSpace([string]$ManagementGroupMetadata.id)) {
      return [string]$ManagementGroupMetadata.id
    }

    if ($ManagementGroupMetadata.ContainsKey('name') -and -not [string]::IsNullOrWhiteSpace([string]$ManagementGroupMetadata.name)) {
      return "providers/Microsoft.Management/managementGroups/{0}" -f [string]$ManagementGroupMetadata.name
    }
  }

  if ([string]::IsNullOrWhiteSpace($FallbackManagementGroupId)) {
    return ''
  }

  $trimmedManagementGroupId = $FallbackManagementGroupId.Trim()
  if ($trimmedManagementGroupId.StartsWith('/')) {
    $trimmedManagementGroupId = $trimmedManagementGroupId.Substring(1)
  }

  if ($trimmedManagementGroupId.StartsWith('providers/Microsoft.Management/managementGroups/', [System.StringComparison]::OrdinalIgnoreCase)) {
    return $trimmedManagementGroupId
  }

  return "providers/Microsoft.Management/managementGroups/{0}" -f $trimmedManagementGroupId
}

function Merge-AuthorizationPermissionRequirements {
  param(
    [Parameter(Mandatory = $true)]
    [object[]]$Requirements
  )

  $requirementMap = [ordered]@{}
  foreach ($requirement in $Requirements) {
    if ($requirement -isnot [System.Collections.IDictionary]) {
      continue
    }

    $scope = [string]$requirement.scope
    if ([string]::IsNullOrWhiteSpace($scope)) {
      continue
    }

    if (-not $requirementMap.Contains($scope)) {
      $requirementMap[$scope] = [ordered]@{
        scope = $scope
        displayName = [string]$requirement.displayName
        actionNames = @()
      }
    }

    foreach ($actionName in @($requirement.actionNames)) {
      if ([string]::IsNullOrWhiteSpace([string]$actionName)) {
        continue
      }

      $existingActionNames = @($requirementMap[$scope].actionNames)
      if ($existingActionNames -notcontains [string]$actionName) {
        $requirementMap[$scope].actionNames = $existingActionNames + [string]$actionName
      }
    }
  }

  return @($requirementMap.Values)
}

function Get-AuthorizationPreflightRequirements {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ScenarioDefinition,

    [Parameter(Mandatory = $true)]
    [hashtable]$ParameterValues,

    [AllowNull()]
    [hashtable]$SubscriptionMetadata,

    [object[]]$AccessibleSubscriptions = @(),

    [object[]]$AccessibleManagementGroups = @()
  )

  $requirements = @()
  $subscriptionAuthorizationActions = @(
    'Microsoft.Authorization/policyAssignments/write',
    'Microsoft.Authorization/roleAssignments/write'
  )

  switch ([string]$ScenarioDefinition.id) {
    'foundation' {
      $targetSubscriptionId = Get-AuthorizationPreflightSubscriptionId -SubscriptionMetadata $SubscriptionMetadata -FallbackSubscriptionId (Get-OptionalStringParameterValue -ParameterValues $ParameterValues -Name 'foundationSubscriptionId')
      if (-not [string]::IsNullOrWhiteSpace($targetSubscriptionId)) {
        $requirements += New-AuthorizationPermissionRequirement -Scope ("subscriptions/{0}" -f $targetSubscriptionId) -DisplayName "Foundation subscription '$targetSubscriptionId'" -ActionNames $subscriptionAuthorizationActions
      }
    }
    'expanded-platform' {
      $platformManagementGroupId = Get-OptionalStringParameterValue -ParameterValues $ParameterValues -Name 'platformManagementGroupId'
      $subscriptionActions = @($subscriptionAuthorizationActions) + 'Microsoft.Authorization/policySetDefinitions/write'

      $parameterSubscriptionNames = @('managementSubscriptionId', 'connectivitySubscriptionId')
      if ($ScenarioDefinition.ContainsKey('requires') -and $null -ne $ScenarioDefinition.requires) {
        $requires = [hashtable]$ScenarioDefinition.requires
        if ($requires.ContainsKey('parameterSubscriptions') -and $null -ne $requires.parameterSubscriptions) {
          $parameterSubscriptionNames = @($requires.parameterSubscriptions)
        }
      }

      $resolvedSubscriptions = @($AccessibleSubscriptions)
      for ($index = 0; $index -lt $parameterSubscriptionNames.Count; $index++) {
        $parameterName = [string]$parameterSubscriptionNames[$index]
        $subscriptionMetadata = if ($index -lt $resolvedSubscriptions.Count) { $resolvedSubscriptions[$index] } else { $null }
        $fallbackSubscriptionId = Get-OptionalStringParameterValue -ParameterValues $ParameterValues -Name $parameterName
        $subscriptionId = Get-AuthorizationPreflightSubscriptionId -SubscriptionMetadata $subscriptionMetadata -FallbackSubscriptionId $fallbackSubscriptionId

        if ([string]::IsNullOrWhiteSpace($subscriptionId)) {
          continue
        }

        $subscriptionLabel = switch ($parameterName) {
          'managementSubscriptionId' { 'management subscription' }
          'connectivitySubscriptionId' { 'connectivity subscription' }
          default { $parameterName }
        }

        $requirements += New-AuthorizationPermissionRequirement -Scope ("subscriptions/{0}" -f $subscriptionId) -DisplayName ("{0} '{1}'" -f $subscriptionLabel, $subscriptionId) -ActionNames $subscriptionActions
      }

      if (-not [string]::IsNullOrWhiteSpace($platformManagementGroupId)) {
        $resolvedManagementGroups = @($AccessibleManagementGroups)
        $managementGroupMetadata = if ($resolvedManagementGroups.Count -gt 0) { $resolvedManagementGroups[0] } else { $null }
        $managementGroupScope = Get-AuthorizationPreflightManagementGroupScope -ManagementGroupMetadata $managementGroupMetadata -FallbackManagementGroupId $platformManagementGroupId
        if (-not [string]::IsNullOrWhiteSpace($managementGroupScope)) {
          $requirements += New-AuthorizationPermissionRequirement -Scope $managementGroupScope -DisplayName ("Platform management group '{0}'" -f $platformManagementGroupId) -ActionNames @(
            'Microsoft.Authorization/policyAssignments/write',
            'Microsoft.Authorization/policySetDefinitions/write'
          )
        }
      }
    }
  }

  return Merge-AuthorizationPermissionRequirements -Requirements $requirements
}

function Resolve-AuthorizationPreflightState {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ScenarioDefinition,

    [Parameter(Mandatory = $true)]
    [hashtable]$ParameterValues,

    [AllowNull()]
    [hashtable]$SubscriptionMetadata,

    [object[]]$AccessibleSubscriptions = @(),

    [object[]]$AccessibleManagementGroups = @()
  )

  $result = [ordered]@{
    attempted = $false
    confirmed = $false
    source = 'not-applicable'
    checkedScopes = @()
    missingPermissions = @()
    message = ''
  }

  $requirements = @(Get-AuthorizationPreflightRequirements -ScenarioDefinition $ScenarioDefinition -ParameterValues $ParameterValues -SubscriptionMetadata $SubscriptionMetadata -AccessibleSubscriptions $AccessibleSubscriptions -AccessibleManagementGroups $AccessibleManagementGroups)
  if ($requirements.Count -eq 0) {
    return $result
  }

  $result.attempted = $true

  try {
    foreach ($requirement in $requirements) {
      $permissionEntries = Get-ScopePermissions -Scope ([string]$requirement.scope)
      $checkedActions = @()

      foreach ($actionName in @($requirement.actionNames)) {
        $available = Test-ScopePermissionAvailable -PermissionEntries $permissionEntries -ActionName ([string]$actionName)
        $checkedActions += [ordered]@{
          action = [string]$actionName
          available = $available
        }

        if (-not $available) {
          $result.missingPermissions += [ordered]@{
            scope = [string]$requirement.scope
            displayName = [string]$requirement.displayName
            action = [string]$actionName
          }
        }
      }

      $result.checkedScopes += [ordered]@{
        scope = [string]$requirement.scope
        displayName = [string]$requirement.displayName
        checkedActions = $checkedActions
      }
    }
  }
  catch {
    $result.source = 'fallback'
    $result.message = "Authorization permission preflight could not be completed automatically. The deployment identity still needs Owner or equivalent custom access for Azure Policy and Azure RBAC artifacts. $($_.Exception.Message)"
    return $result
  }

  $result.source = 'automatic'
  $result.confirmed = @($result.missingPermissions).Count -eq 0
  $scopeNames = @($requirements | ForEach-Object { [string]$_.displayName })
  $result.message = if ($result.confirmed) {
    "Authorization permissions were confirmed automatically for: {0}." -f ($scopeNames -join ', ')
  }
  else {
    $missingPermissionText = @($result.missingPermissions | ForEach-Object { "{0}: {1}" -f [string]$_.displayName, [string]$_.action })
    "Authorization permission preflight detected missing permissions for the deployment identity. Grant Owner or equivalent custom access before running create. Missing: {0}." -f ($missingPermissionText -join '; ')
  }

  return $result
}

function Get-NetworkingWarnings {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ScenarioDefinition,

    [Parameter(Mandatory = $true)]
    [hashtable]$ParameterValues
  )

  $warnings = @()
  $highCostWarnings = @()

  if (-not $ScenarioDefinition.ContainsKey('warnings')) {
    return @{
      warnings = $warnings
      highCostWarnings = $highCostWarnings
    }
  }

  foreach ($warning in $ScenarioDefinition.warnings) {
    if (Test-WarningParameterActive -ParameterValues $ParameterValues -Name $warning.parameter) {
      if ($warning.requiresExplicitApproval) {
        $highCostWarnings += $warning.message
      }
      else {
        $warnings += $warning.message
      }
    }
  }

  return @{
    warnings = $warnings
    highCostWarnings = $highCostWarnings
  }
}

function Resolve-TenantScenarioRequirements {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ScenarioDefinition,

    [Parameter(Mandatory = $true)]
    [hashtable]$ParameterValues
  )

  $displayName = [string]$ScenarioDefinition.displayName
  $accessibleSubscriptions = @()
  $accessibleManagementGroups = @()
  $validatedResources = @()
  $requires = if ($ScenarioDefinition.ContainsKey('requires') -and $null -ne $ScenarioDefinition.requires) {
    [hashtable]$ScenarioDefinition.requires
  }
  else {
    @{}
  }

  $requiredParameters = @()
  if ($requires.ContainsKey('requiredParameters') -and $null -ne $requires.requiredParameters) {
    $requiredParameters = @($requires.requiredParameters)
  }

  foreach ($parameterName in $requiredParameters) {
    $parameterValue = Get-OptionalStringParameterValue -ParameterValues $ParameterValues -Name ([string]$parameterName)
    if ([string]::IsNullOrWhiteSpace($parameterValue)) {
      throw "$displayName requires parameter '$parameterName' in the effective parameter set."
    }
  }

  if ($requires.ContainsKey('requiredParameterValues') -and $null -ne $requires.requiredParameterValues) {
    foreach ($parameterEntry in ([hashtable]$requires.requiredParameterValues).GetEnumerator()) {
      $parameterName = [string]$parameterEntry.Key
      $expectedValue = $parameterEntry.Value
      $hasValue = $ParameterValues.ContainsKey($parameterName)
      $actualValue = if ($hasValue) { $ParameterValues[$parameterName] } else { $null }

      if (-not $hasValue -or $actualValue -ne $expectedValue) {
        throw "$displayName requires parameter '$parameterName' to be '$expectedValue'."
      }
    }
  }

  $parameterSubscriptionNames = @()
  if ($requires.ContainsKey('parameterSubscriptions') -and $null -ne $requires.parameterSubscriptions) {
    $parameterSubscriptionNames = @($requires.parameterSubscriptions)
  }

  foreach ($parameterName in $parameterSubscriptionNames) {
    $parameterValue = Get-OptionalStringParameterValue -ParameterValues $ParameterValues -Name ([string]$parameterName)
    if ([string]::IsNullOrWhiteSpace($parameterValue)) {
      throw "$displayName requires parameter '$parameterName' in the effective parameter set."
    }

    $accessibleSubscriptions += Resolve-SubscriptionReference -SubscriptionReference $parameterValue
  }

  $parameterManagementGroupNames = @()
  if ($requires.ContainsKey('parameterManagementGroups') -and $null -ne $requires.parameterManagementGroups) {
    $parameterManagementGroupNames = @($requires.parameterManagementGroups)
  }

  foreach ($parameterName in $parameterManagementGroupNames) {
    $parameterValue = Get-OptionalStringParameterValue -ParameterValues $ParameterValues -Name ([string]$parameterName)
    if (-not [string]::IsNullOrWhiteSpace($parameterValue)) {
      $accessibleManagementGroups += Resolve-ManagementGroupReference -ManagementGroupReference $parameterValue
    }
  }

  $parameterResourceIdNames = @()
  if ($requires.ContainsKey('parameterResourceIds') -and $null -ne $requires.parameterResourceIds) {
    $parameterResourceIdNames = @($requires.parameterResourceIds)
  }

  foreach ($parameterName in $parameterResourceIdNames) {
    $parameterValue = Get-OptionalStringParameterValue -ParameterValues $ParameterValues -Name ([string]$parameterName)
    if (-not [string]::IsNullOrWhiteSpace($parameterValue)) {
      $validatedResources += Resolve-ResourceReference -ResourceId $parameterValue
    }
  }

  return @{
    accessibleSubscriptions = $accessibleSubscriptions
    accessibleManagementGroups = $accessibleManagementGroups
    validatedResources = $validatedResources
  }
}

function Invoke-AzCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,

    [Parameter(Mandatory = $true)]
    [string]$CommandLabel,

    [Parameter(Mandatory = $true)]
    [string]$OutputDirectory
  )

  $commandLine = Format-CommandLine -Arguments $Arguments
  $commandFile = Join-Path $OutputDirectory ("{0}.command.txt" -f $CommandLabel)
  $rawFile = Join-Path $OutputDirectory ("{0}.raw.txt" -f $CommandLabel)
  $jsonFile = Join-Path $OutputDirectory ("{0}.json" -f $CommandLabel)

  Set-Content -Path $commandFile -Value $commandLine -Encoding UTF8
  Write-InstallerLog -Message $commandLine

  $rawOutput = & az @Arguments 2>&1 | Out-String
  Set-Content -Path $rawFile -Value $rawOutput -Encoding UTF8

  if ($LASTEXITCODE -ne 0) {
    throw "Azure CLI command failed during $CommandLabel. See $rawFile for details."
  }

  if ([string]::IsNullOrWhiteSpace($rawOutput)) {
    return $null
  }

  try {
    $parsed = $rawOutput | ConvertFrom-Json -AsHashtable -Depth 100
    Write-JsonDocument -Path $jsonFile -Value $parsed
    return $parsed
  }
  catch {
    Set-Content -Path $jsonFile -Value $rawOutput -Encoding UTF8
    return $rawOutput
  }
}

function Get-WhatIfSummary {
  param(
    [object]$WhatIfResult
  )

  $summary = @{}
  if ($WhatIfResult -is [hashtable] -and $WhatIfResult.ContainsKey('changes')) {
    foreach ($change in $WhatIfResult.changes) {
      $changeType = [string]$change.changeType
      if ([string]::IsNullOrWhiteSpace($changeType)) {
        continue
      }

      if (-not $summary.ContainsKey($changeType)) {
        $summary[$changeType] = 0
      }

      $summary[$changeType]++
    }

    return $summary
  }

  if ($WhatIfResult -is [string] -and -not [string]::IsNullOrWhiteSpace($WhatIfResult)) {
    $resourceLines = [regex]::Matches($WhatIfResult, '(?m)^  (?<symbol>[+~=\-]) [^\r\n]+\[[^\r\n]+\]\s*$')
    foreach ($resourceLine in $resourceLines) {
      $changeType = switch ($resourceLine.Groups['symbol'].Value) {
        '+' { 'Create' }
        '~' { 'Modify' }
        '-' { 'Delete' }
        '=' { 'NoChange' }
        default { '' }
      }

      if ([string]::IsNullOrWhiteSpace($changeType)) {
        continue
      }

      if (-not $summary.ContainsKey($changeType)) {
        $summary[$changeType] = 0
      }

      $summary[$changeType]++
    }
  }

  return $summary
}

function Confirm-CreateApproval {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ResolvedConfig
  )

  $effectiveNonInteractive = $NonInteractive.IsPresent -or [bool]$ResolvedConfig.effectiveFlags.nonInteractive
  $effectiveAutoApprove = $AutoApprove.IsPresent -or [bool]$ResolvedConfig.effectiveFlags.autoApprove

  $budgetPreflight = $ResolvedConfig.budgetPreflight
  $budgetWillFail = $false
  if ($budgetPreflight -is [System.Collections.IDictionary]) {
    $attempted = [bool]$budgetPreflight.attempted
    $confirmed = [bool]$budgetPreflight.confirmed
    $source = [string]$budgetPreflight.source
    # Block when we actually probed the permission and it came back negative.
    # Fallback (probe could not run) stays a soft warning to avoid false positives.
    if ($attempted -and $source -eq 'automatic' -and -not $confirmed) {
      $budgetWillFail = $true
    }
  }

  if ($budgetWillFail) {
    if (-not $effectiveAutoApprove) {
      throw 'Budget preflight failed: Microsoft.Consumption/budgets/write is not available for the deployment identity at the target budget subscription scope. The deployment would fail on the budget step after most platform resources are already created. Set monthlyBudgetAmount to 0 to skip the budget step, grant Cost Management Contributor (or Contributor / Owner) on the subscription, or re-run with AutoApprove to acknowledge the risk.'
    }

    Write-InstallerLog -Message 'Proceeding with create even though the budget preflight failed because AutoApprove was supplied. The deployment will still fail on the budget step unless permissions or subscription readiness change.' -Level 'WARNING'
  }

  $authorizationPreflight = $ResolvedConfig.authorizationPreflight
  if ($authorizationPreflight -is [System.Collections.IDictionary]) {
    $authorizationAttempted = [bool]$authorizationPreflight.attempted
    $authorizationConfirmed = [bool]$authorizationPreflight.confirmed
    $authorizationSource = [string]$authorizationPreflight.source
    if ($authorizationAttempted -and $authorizationSource -eq 'automatic' -and -not $authorizationConfirmed) {
      $authorizationMessage = [string]$authorizationPreflight.message
      if ([string]::IsNullOrWhiteSpace($authorizationMessage)) {
        $authorizationMessage = 'Grant Owner or equivalent custom access for Azure Policy and Azure RBAC role assignments before running create.'
      }

      throw "Authorization preflight failed: $authorizationMessage"
    }
  }

  if ($effectiveNonInteractive) {
    if (-not $effectiveAutoApprove) {
      throw 'Create requires explicit approval. Re-run with AutoApprove or set autoApprove to true in the config for non-interactive execution.'
    }

    return
  }

  if ($effectiveAutoApprove) {
    return
  }

  Write-InstallerLog -Message 'Create approval is required before deployment continues.' -Level 'WARNING'
  $response = Read-Host 'Type CREATE to continue'
  if ($response -cne 'CREATE') {
    throw 'Create was cancelled before deployment started.'
  }
}

function New-CustomerSummary {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$ResolvedConfig,

    [object]$CreateResult,

    [hashtable]$WhatIfSummary
  )

  $outputs = $null
  if ($CreateResult -is [hashtable] -and $CreateResult.ContainsKey('properties')) {
    $properties = $CreateResult.properties
    if ($properties -is [hashtable] -and $properties.ContainsKey('outputs')) {
      $outputs = $properties.outputs
    }
  }

  $followUpActions = Get-OutputValue -Outputs $outputs -Name 'followUpActions' -DefaultValue @()
  if ($followUpActions -isnot [System.Collections.IEnumerable] -or $followUpActions -is [string]) {
    $followUpActions = @($followUpActions)
  }

  return [ordered]@{
    scenario = $ResolvedConfig.scenarioDefinition.id
    scenarioDisplayName = $ResolvedConfig.scenarioDefinition.displayName
    action = $Action
    deploymentName = $ResolvedConfig.deploymentName
    deploymentLocation = $ResolvedConfig.deploymentLocation
    deploymentScope = $ResolvedConfig.commandFamily
    subscription = $ResolvedConfig.subscriptionMetadata
    accessibleSubscriptions = $ResolvedConfig.accessibleSubscriptions
    whatIfSummary = $WhatIfSummary
    warnings = $ResolvedConfig.warnings
    highCostWarnings = $ResolvedConfig.highCostWarnings
    deploymentOutputs = [ordered]@{
      deploymentProfile = Get-OutputValue -Outputs $outputs -Name 'deploymentProfile'
      deploymentMode = Get-OutputValue -Outputs $outputs -Name 'deploymentMode'
      primarySubscriptionId = Get-OutputValue -Outputs $outputs -Name 'primarySubscriptionId'
      handoverReady = Get-OutputValue -Outputs $outputs -Name 'handoverReady' -DefaultValue $false
      alertResponseReady = Get-OutputValue -Outputs $outputs -Name 'alertResponseReady' -DefaultValue $false
      platformResourceGroupName = Get-OutputValue -Outputs $outputs -Name 'platformResourceGroupName'
      networkResourceGroupName = Get-OutputValue -Outputs $outputs -Name 'networkResourceGroupName'
      logAnalyticsWorkspaceResourceId = Get-OutputValue -Outputs $outputs -Name 'logAnalyticsWorkspaceResourceId'
      keyVaultResourceId = Get-OutputValue -Outputs $outputs -Name 'keyVaultResourceId'
      followUpActions = $followUpActions
    }
  }
}

function Show-CustomerSummary {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$Summary
  )

  Write-InstallerLog -Message 'Azure Landing Zone deployment summary' -Level 'SUCCESS'
  Write-InstallerLog -Message ("Scenario: {0}" -f $Summary.scenarioDisplayName)
  Write-InstallerLog -Message ("Action: {0}" -f $Summary.action)
  Write-InstallerLog -Message ("Deployment name: {0}" -f $Summary.deploymentName)

  if ($Summary.deploymentOutputs.deploymentProfile) {
    Write-InstallerLog -Message ("Profile: {0}" -f $Summary.deploymentOutputs.deploymentProfile)
  }

  if ($Summary.deploymentOutputs.deploymentMode) {
    Write-InstallerLog -Message ("Mode: {0}" -f $Summary.deploymentOutputs.deploymentMode)
  }

  if ($Summary.deploymentOutputs.primarySubscriptionId) {
    Write-InstallerLog -Message ("Primary subscription: {0}" -f $Summary.deploymentOutputs.primarySubscriptionId)
  }

  if ($Summary.action -eq 'what-if' -or $Summary.action -eq 'create') {
    if ($Summary.whatIfSummary.Count -gt 0) {
      $parts = foreach ($entry in $Summary.whatIfSummary.GetEnumerator()) {
        '{0}={1}' -f $entry.Key, $entry.Value
      }
      Write-InstallerLog -Message ("What-if summary: {0}" -f ($parts -join ', '))
    }
  }

  if ($Summary.action -eq 'create') {
    Write-InstallerLog -Message ("Operational ownership ready: {0}" -f $Summary.deploymentOutputs.handoverReady)
    Write-InstallerLog -Message ("Alert response ready: {0}" -f $Summary.deploymentOutputs.alertResponseReady)
  }

  foreach ($warning in $Summary.warnings) {
    Write-InstallerLog -Message $warning -Level 'WARNING'
  }

  foreach ($warning in $Summary.highCostWarnings) {
    Write-InstallerLog -Message $warning -Level 'WARNING'
  }

  foreach ($actionItem in $Summary.deploymentOutputs.followUpActions) {
    if (-not [string]::IsNullOrWhiteSpace([string]$actionItem)) {
      Write-InstallerLog -Message ("Action required: {0}" -f $actionItem) -Level 'WARNING'
    }
  }
}

Test-RequiredTooling

$resolvedConfigFile = Resolve-PathAgainstRoot -PathValue $ConfigFile -ConfigDirectory $PWD.Path
if (-not (Test-Path $resolvedConfigFile -PathType Leaf)) {
  throw "Config file does not exist: $resolvedConfigFile"
}

$configDirectory = Split-Path -Parent $resolvedConfigFile
$config = Read-JsonDocument -Path $resolvedConfigFile
$scenarioManifest = Read-JsonDocument -Path $script:ScenarioManifestPath
$scenarioDefinition = Resolve-ScenarioDefinition -RequestedScenario ([string]$config.scenario) -ScenarioManifest $scenarioManifest

if ($scenarioDefinition.ContainsKey('implemented') -and -not [bool]$scenarioDefinition.implemented) {
  throw $scenarioDefinition.reason
}

$parametersPathSetting = if ($config.ContainsKey('parametersFile') -and -not [string]::IsNullOrWhiteSpace([string]$config.parametersFile)) {
  [string]$config.parametersFile
}
else {
  [string]$scenarioDefinition.defaultParametersFile
}

$resolvedParametersFile = Resolve-PathAgainstRoot -PathValue $parametersPathSetting -ConfigDirectory $configDirectory
if (-not (Test-Path $resolvedParametersFile -PathType Leaf)) {
  throw "Parameters file does not exist: $resolvedParametersFile"
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$defaultOutputFolder = Join-Path $script:AlzRoot ("artifacts\generated\cli\{0}-{1}" -f $scenarioDefinition.id, $timestamp)
$outputFolderSetting = if (-not [string]::IsNullOrWhiteSpace($OutputFolder)) {
  $OutputFolder
}
elseif ($config.ContainsKey('outputFolder') -and -not [string]::IsNullOrWhiteSpace([string]$config.outputFolder)) {
  [string]$config.outputFolder
}
else {
  $defaultOutputFolder
}

$resolvedOutputFolder = Resolve-PathAgainstRoot -PathValue $outputFolderSetting -ConfigDirectory $configDirectory
New-Item -Path $resolvedOutputFolder -ItemType Directory -Force | Out-Null

$script:LogFile = Join-Path $resolvedOutputFolder 'installer.log'

Write-InstallerLog -Message 'Azure Landing Zone CLI installer started.'
Write-InstallerLog -Message ("Config file: {0}" -f $resolvedConfigFile)
Write-InstallerLog -Message ("Requested scenario: {0}" -f $scenarioDefinition.displayName)
Write-InstallerLog -Message ("Action: {0}" -f $Action)

$parameterDocument = Read-JsonDocument -Path $resolvedParametersFile
if (-not $parameterDocument.ContainsKey('parameters')) {
  throw 'The selected parameters file does not contain a parameters object.'
}

$parameterOverrides = @{}
if ($config.ContainsKey('parameterOverrides') -and $null -ne $config.parameterOverrides) {
  $parameterOverrides = [hashtable]$config.parameterOverrides
}

foreach ($override in $parameterOverrides.GetEnumerator()) {
  $parameterDocument.parameters[$override.Key] = @{
    value = $override.Value
  }
}

$effectiveParameterValues = Get-EffectiveParameterValues -ParameterDocument $parameterDocument
Assert-ServiceOwnerParameterValue -ParameterValues $effectiveParameterValues

$scenarioDefinition = Resolve-ScenarioMode -ScenarioDefinition $scenarioDefinition -ParameterValues $effectiveParameterValues
Write-InstallerLog -Message ("Resolved deployment path: {0}" -f $scenarioDefinition.displayName)

$resolvedEntryPoint = Resolve-PathAgainstRoot -PathValue ([string]$scenarioDefinition.entryPoint) -ConfigDirectory $configDirectory
if (-not (Test-Path $resolvedEntryPoint -PathType Leaf)) {
  throw "Template file does not exist: $resolvedEntryPoint"
}

$effectiveValidationLevel = if (-not [string]::IsNullOrWhiteSpace($ValidationLevel)) {
  $ValidationLevel
}
elseif ($config.ContainsKey('validationLevel') -and -not [string]::IsNullOrWhiteSpace([string]$config.validationLevel)) {
  [string]$config.validationLevel
}
else {
  'Provider'
}

$deploymentLocation = if ($config.ContainsKey('deploymentLocation') -and -not [string]::IsNullOrWhiteSpace([string]$config.deploymentLocation)) {
  [string]$config.deploymentLocation
}
else {
  throw 'deploymentLocation is required in the config file.'
}

$deploymentName = if ($config.ContainsKey('deploymentName') -and -not [string]::IsNullOrWhiteSpace([string]$config.deploymentName)) {
  [string]$config.deploymentName
}
else {
  "alz-{0}-{1}" -f $scenarioDefinition.id, $timestamp.ToLowerInvariant()
}

$subscriptionMetadata = $null
$accessibleSubscriptions = @()
$accessibleManagementGroups = @()
$validatedResources = @()
$commandFamily = [string]$scenarioDefinition.commandFamily

switch ($commandFamily) {
  'sub' {
    if (-not $config.ContainsKey('scope') -or $null -eq $config.scope -or -not $config.scope.ContainsKey('subscription') -or [string]::IsNullOrWhiteSpace([string]$config.scope.subscription)) {
      throw "$($scenarioDefinition.displayName) requires scope.subscription in the config file."
    }

    $subscriptionMetadata = Resolve-SubscriptionReference -SubscriptionReference ([string]$config.scope.subscription)
    $accessibleSubscriptions += $subscriptionMetadata
  }
  'tenant' {
    $tenantScenarioRequirements = Resolve-TenantScenarioRequirements -ScenarioDefinition $scenarioDefinition -ParameterValues $effectiveParameterValues
    $accessibleSubscriptions += $tenantScenarioRequirements.accessibleSubscriptions
    $accessibleManagementGroups += $tenantScenarioRequirements.accessibleManagementGroups
    $validatedResources += $tenantScenarioRequirements.validatedResources
  }
  default {
    throw "Unsupported command family '$commandFamily'."
  }
}

$budgetPreflight = Resolve-BudgetWritePreflightState -ScenarioDefinition $scenarioDefinition -ParameterDocument $parameterDocument -ParameterValues $effectiveParameterValues -SubscriptionMetadata $subscriptionMetadata
$authorizationPreflight = Resolve-AuthorizationPreflightState -ScenarioDefinition $scenarioDefinition -ParameterValues $effectiveParameterValues -SubscriptionMetadata $subscriptionMetadata -AccessibleSubscriptions $accessibleSubscriptions -AccessibleManagementGroups $accessibleManagementGroups
$effectiveParametersFile = Join-Path $resolvedOutputFolder 'effective.parameters.json'
Write-JsonDocument -Path $effectiveParametersFile -Value $parameterDocument
$effectiveParameterValues = Get-EffectiveParameterValues -ParameterDocument $parameterDocument

if (-not [string]::IsNullOrWhiteSpace([string]$budgetPreflight.message)) {
  $budgetPreflightLevel = if ($budgetPreflight.source -eq 'fallback' -or ($budgetPreflight.source -eq 'automatic' -and -not [bool]$budgetPreflight.confirmed)) {
    'WARNING'
  }
  else {
    'INFO'
  }

  Write-InstallerLog -Message ([string]$budgetPreflight.message) -Level $budgetPreflightLevel
}

if (-not [string]::IsNullOrWhiteSpace([string]$authorizationPreflight.message)) {
  $authorizationPreflightLevel = if ($authorizationPreflight.source -eq 'fallback' -or ($authorizationPreflight.source -eq 'automatic' -and -not [bool]$authorizationPreflight.confirmed)) {
    'WARNING'
  }
  else {
    'INFO'
  }

  Write-InstallerLog -Message ([string]$authorizationPreflight.message) -Level $authorizationPreflightLevel
}

$warningState = Get-NetworkingWarnings -ScenarioDefinition $scenarioDefinition -ParameterValues $effectiveParameterValues

$resolvedState = [ordered]@{
  scenarioDefinition = $scenarioDefinition
  resolvedConfigFile = $resolvedConfigFile
  resolvedEntryPoint = $resolvedEntryPoint
  resolvedParametersFile = $resolvedParametersFile
  effectiveParametersFile = $effectiveParametersFile
  resolvedOutputFolder = $resolvedOutputFolder
  deploymentLocation = $deploymentLocation
  deploymentName = $deploymentName
  validationLevel = $effectiveValidationLevel
  commandFamily = $commandFamily
  subscriptionMetadata = $subscriptionMetadata
  accessibleSubscriptions = $accessibleSubscriptions
  accessibleManagementGroups = $accessibleManagementGroups
  validatedResources = $validatedResources
  budgetPreflight = $budgetPreflight
  authorizationPreflight = $authorizationPreflight
  warnings = @($warningState.warnings)
  highCostWarnings = @($warningState.highCostWarnings)
  effectiveFlags = [ordered]@{
    nonInteractive = $config.ContainsKey('nonInteractive') -and [bool]$config.nonInteractive
    autoApprove = $config.ContainsKey('autoApprove') -and [bool]$config.autoApprove
  }
}

Write-JsonDocument -Path (Join-Path $resolvedOutputFolder 'resolved-config.json') -Value ([ordered]@{
  configFile = $resolvedConfigFile
  scenario = $scenarioDefinition.id
  scenarioMode = if ($scenarioDefinition.ContainsKey('modeId')) { [string]$scenarioDefinition.modeId } else { [string]$scenarioDefinition.id }
  displayName = $scenarioDefinition.displayName
  deploymentName = $deploymentName
  deploymentLocation = $deploymentLocation
  validationLevel = $effectiveValidationLevel
  commandFamily = $commandFamily
  templateFile = $resolvedEntryPoint
  sourceParametersFile = $resolvedParametersFile
  effectiveParametersFile = $effectiveParametersFile
  warnings = $resolvedState.warnings
  highCostWarnings = $resolvedState.highCostWarnings
  budgetPreflight = $budgetPreflight
  authorizationPreflight = $authorizationPreflight
  accessibleSubscriptions = $accessibleSubscriptions
  accessibleManagementGroups = $accessibleManagementGroups
  validatedResources = $validatedResources
})

if ($resolvedState.warnings.Count -gt 0) {
  foreach ($warning in $resolvedState.warnings) {
    Write-InstallerLog -Message $warning -Level 'WARNING'
  }
}

if ($resolvedState.highCostWarnings.Count -gt 0) {
  foreach ($warning in $resolvedState.highCostWarnings) {
    Write-InstallerLog -Message $warning -Level 'WARNING'
  }
}

$commandPrefix = @('deployment', $commandFamily)
$commonArguments = @(
  '--name', $deploymentName,
  '--location', $deploymentLocation,
  '--template-file', $resolvedEntryPoint,
  '--parameters', "@$effectiveParametersFile",
  '--validation-level', $effectiveValidationLevel,
  '--only-show-errors',
  '-o', 'json'
)

if ($commandFamily -eq 'sub') {
  $commonArguments += @('--subscription', [string]$subscriptionMetadata.id)
}

$validateArguments = $commandPrefix + @('validate') + $commonArguments
$null = Invoke-AzCommand -Arguments $validateArguments -CommandLabel 'validate' -OutputDirectory $resolvedOutputFolder

$whatIfResult = $null
$whatIfSummary = @{}
if ($Action -eq 'what-if' -or $Action -eq 'create') {
  $whatIfArguments = $commandPrefix + @('what-if') + $commonArguments + @('--result-format', 'FullResourcePayloads')
  $whatIfResult = Invoke-AzCommand -Arguments $whatIfArguments -CommandLabel 'what-if' -OutputDirectory $resolvedOutputFolder
  $whatIfSummary = Get-WhatIfSummary -WhatIfResult $whatIfResult
}

$createResult = $null
if ($Action -eq 'create') {
  Confirm-CreateApproval -ResolvedConfig $resolvedState
  $createArguments = $commandPrefix + @('create') + $commonArguments
  # --mode is only valid for resource-group scope deployments. Subscription, management
  # group, and tenant scope deployments are always incremental and reject the flag.
  if ($commandFamily -eq 'group') {
    $createArguments += @('--mode', 'Incremental')
  }
  $createResult = Invoke-AzCommand -Arguments $createArguments -CommandLabel 'create' -OutputDirectory $resolvedOutputFolder
}

$summary = New-CustomerSummary -ResolvedConfig $resolvedState -CreateResult $createResult -WhatIfSummary $whatIfSummary
Write-JsonDocument -Path (Join-Path $resolvedOutputFolder 'summary.json') -Value $summary
Show-CustomerSummary -Summary $summary

Write-InstallerLog -Message ("Artifacts written to: {0}" -f $resolvedOutputFolder) -Level 'SUCCESS'