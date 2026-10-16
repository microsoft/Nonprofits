<#
.SYNOPSIS
    Migrates an environment from the AppSource Volunteer Management managed solution to the
    open-source Volunteer Management (OS) build that ships under a separate identity.

.DESCRIPTION
    Both solutions are published by Microsoft; this script distinguishes them by origin:
    the AppSource managed solution (installed from the marketplace) versus the open-source
    build (compiled from the public GitHub repository).

    The open-source build installs side-by-side with its own identity
    (unique name 'volunteermanagementos', plugin assembly 'PluginsOS'). It brings its
    own copies of the four PCF controls. The AppSource managed solution cannot simply be
    deleted, because the forms and views it contributed reference its PCF controls in the
    *active* (merged) layer. That Form -> Control "Published" dependency blocks deletion.

    This script removes that blocker by rewriting the active form/view layers so they no
    longer reference the AppSource PCF controls (the default control is substituted), then
    publishes. After that the AppSource managed solution can be deleted. Finally the OS
    solution can be (re)imported / upgraded so its own forms and controls take over.

    Stages (each is opt-in via a switch; nothing destructive runs unless requested):
      -StripReferences          Rewrite forms + saved queries to drop AppSource PCF refs, then PublishAllXml.
      -DeleteAppSourceSolution  Delete the AppSource managed solution by unique name.
      -RestoreControls          Remove the active (unmanaged) layers created by -StripReferences, then PublishAllXml.
      -Verify                   Report assembly / PCF ownership / SDK step registration.

    Run order for a full migration:
      1. Import the OS managed solution (volunteermanagementos) side-by-side (pac solution import).
      2. .\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl <url> -StripReferences
      3. .\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl <url> -DeleteAppSourceSolution
      4. Re-import / upgrade the OS solution (pac solution import --force-overwrite).
      5. .\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl <url> -RestoreControls
      6. .\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl <url> -Verify

    The PATCH in step 2 creates an active (unmanaged) layer on each rewritten form/view. A managed
    import does not replace that layer, so it keeps hiding the OS PCF controls until step 5
    removes it.

.PARAMETER EnvironmentUrl
    The Dataverse environment URL, e.g. https://contoso.crm.dynamics.com

.PARAMETER StripReferences
    Rewrite the active form/view layers to remove the AppSource PCF control references and publish.

.PARAMETER DeleteAppSourceSolution
    Delete the AppSource managed solution identified by -AppSourceSolutionUniqueName. The stage
    refuses to delete unless the open-source solution 'volunteermanagementos' is installed, the
    target solution is managed, and its plug-in assemblies are not signed with the open-source
    key (so it is the AppSource build). Use -Force to override these checks.

.PARAMETER RestoreControls
    Remove the active (unmanaged) layer of every form/view listed in -StateFile so the OS solution
    layer, which references the OS-owned PCF controls, takes effect again. Run it after the OS
    solution has been re-imported. Any other unmanaged customization on those forms/views is
    removed as well.

.PARAMETER StateFile
    JSON file where -StripReferences records the forms/views it rewrote and from which
    -RestoreControls reads them. Default: vm-migration-stripped.json in the current directory.

.PARAMETER Verify
    Print a verification report (plugin assemblies, PCF control ownership, SDK step counts).

.PARAMETER AppSourceSolutionUniqueName
    Unique name of the AppSource managed solution to delete. Default: VolunteerManagement.

.PARAMETER ControlNames
    The PCF control schema names whose references should be stripped from forms/views.
    Defaults to the four controls shipped by Volunteer Management.

.PARAMETER AccessToken
    A pre-acquired Dataverse bearer token. If omitted, the script acquires one with the
    Azure CLI (see -AzCommand).

.PARAMETER AzCommand
    The Azure CLI executable used to acquire a token when -AccessToken is not supplied.
    Default: 'az'. You may point this at an isolated CLI wrapper for non-default sign-ins.

.PARAMETER Force
    Delete the solution in -DeleteAppSourceSolution even when its safety checks fail. The
    open-source solution itself is never deleted. Only use this with a verified backup.

.PARAMETER WhatIf
    Supported on the destructive stages (PATCH / publish / delete) via SupportsShouldProcess.

.EXAMPLE
    .\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -StripReferences

.EXAMPLE
    .\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -DeleteAppSourceSolution

.NOTES
    Take a backup of the environment before running the destructive stages. The strip stage
    edits active form/view layers in place; deleting the AppSource solution is irreversible
    without that backup.
#>
[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory = $true)]
    [string]$EnvironmentUrl,

    [switch]$StripReferences,
    [switch]$DeleteAppSourceSolution,
    [switch]$RestoreControls,
    [switch]$Verify,

    [string]$AppSourceSolutionUniqueName = 'VolunteerManagement',
    [string]$StateFile = (Join-Path (Get-Location) 'vm-migration-stripped.json'),

    [string[]]$ControlNames = @(
        'msnfp_microsoftdynamics365nonprofitaccelerator.EngagementOpportunitySummary',
        'msnfp_microsoftdynamics365nonprofitaccelerator.OnboardingStages',
        'msnfp_microsoftdynamics365nonprofitaccelerator.SendMessages',
        'msnfp_VolunteerManagement.GetStarted'
    ),

    [string]$AccessToken,
    [string]$AzCommand = 'az',

    [switch]$Force
)

$ErrorActionPreference = 'Stop'
$EnvironmentUrl = $EnvironmentUrl.TrimEnd('/')
$base = "$EnvironmentUrl/api/data/v9.2"
$OsSolutionUniqueName = 'volunteermanagementos'
$OsPluginPublicKeyToken = '703f25cc8a15a472'

if (-not ($StripReferences -or $DeleteAppSourceSolution -or $RestoreControls -or $Verify)) {
    Write-Host 'Nothing to do. Specify at least one stage: -StripReferences, -DeleteAppSourceSolution, -RestoreControls, or -Verify.' -ForegroundColor Yellow
    Write-Host 'Run "Get-Help .\Migrate-VolunteerManagementToOpenSource.ps1 -Full" for details.'
    return
}

function Get-DataverseToken {
    param([string]$Resource, [string]$Token, [string]$Cli)
    if ($Token) { return $Token }
    $t = & $Cli account get-access-token --resource $Resource --query accessToken --output tsv 2>$null
    if (-not $t) {
        throw "Could not acquire an access token for $Resource via '$Cli'. Sign in (az login) or pass -AccessToken."
    }
    return $t.Trim()
}

$token = Get-DataverseToken -Resource $EnvironmentUrl -Token $AccessToken -Cli $AzCommand
$headers = @{
    Authorization     = "Bearer $token"
    Accept            = 'application/json'
    'Content-Type'    = 'application/json'
    'OData-MaxVersion' = '4.0'
    'OData-Version'   = '4.0'
}

# Retrieve every page of a Dataverse Web API query. The Web API caps each response at a
# page (default 5000 rows) and returns @odata.nextLink for the rest, so a single call can
# miss forms/views that still reference the AppSource PCF controls.
function Get-AllPages {
    param([string]$Url)
    $all = @()
    $next = $Url
    while ($next) {
        $page = Invoke-RestMethod -Uri $next -Headers $headers
        if ($page.value) { $all += $page.value }
        $next = $page.'@odata.nextLink'
    }
    return $all
}

# Replace any <customControl name="<target>" .../> with a clone of the form/view's default
# control definition, preserving formFactor. This removes the Form/View -> PCF dependency.
function Repair-ControlXml {
    param([string]$XmlText, [string[]]$TargetNames)
    $doc = New-Object System.Xml.XmlDocument
    $doc.PreserveWhitespace = $true
    $doc.LoadXml($XmlText)
    $changed = 0
    foreach ($cd in $doc.SelectNodes('//controlDescription')) {
        $pcf = @($cd.SelectNodes('customControl') | Where-Object { $TargetNames -contains $_.GetAttribute('name') })
        if ($pcf.Count -eq 0) { continue }
        $def = @($cd.SelectNodes('customControl') | Where-Object { $_.GetAttribute('id') -and -not $_.GetAttribute('name') })[0]
        if (-not $def) { continue }
        foreach ($p in $pcf) {
            $formFactor = $p.GetAttribute('formFactor')
            $clone = $def.CloneNode($true)
            if ($formFactor) { $clone.SetAttribute('formFactor', $formFactor) }
            $cd.ReplaceChild($clone, $p) | Out-Null
            $changed++
        }
    }
    return [pscustomobject]@{ Xml = $doc.OuterXml; Changed = $changed }
}

function Invoke-StripReferences {
    Write-Host '=== Stripping AppSource PCF references from system forms ===' -ForegroundColor Cyan
    # Every PATCH below creates an active (unmanaged) layer; record it so -RestoreControls can remove it.
    $stripped = [System.Collections.Generic.List[object]]::new()
    $forms = Get-AllPages -Url "$base/systemforms?`$select=formid,name,objecttypecode,formxml"
    $patchedForms = 0
    foreach ($f in $forms) {
        if (-not $f.formxml) { continue }
        if (-not ($ControlNames | Where-Object { $f.formxml.Contains($_) })) { continue }
        $res = Repair-ControlXml -XmlText $f.formxml -TargetNames $ControlNames
        if ($res.Changed -gt 0 -and $PSCmdlet.ShouldProcess("form '$($f.name)' ($($f.objecttypecode))", "replace $($res.Changed) PCF control reference(s)")) {
            $body = @{ formxml = $res.Xml } | ConvertTo-Json -Compress
            Invoke-RestMethod -Uri "$base/systemforms($($f.formid))" -Method Patch -Headers $headers -Body $body | Out-Null
            Write-Host ("  FORM {0} ({1}): replaced {2}" -f $f.name, $f.objecttypecode, $res.Changed)
            $stripped.Add([pscustomobject]@{ Type = 'SystemForm'; Id = $f.formid; Name = "$($f.name) ($($f.objecttypecode))" })
            $patchedForms++
        }
    }
    Write-Host "Patched forms: $patchedForms"

    Write-Host '=== Stripping AppSource PCF references from saved queries (views) ===' -ForegroundColor Cyan
    $views = Get-AllPages -Url "$base/savedqueries?`$select=savedqueryid,name,returnedtypecode,layoutxml"
    $patchedViews = 0
    foreach ($v in $views) {
        if (-not $v.layoutxml) { continue }
        if (-not ($ControlNames | Where-Object { $v.layoutxml.Contains($_) })) { continue }
        $res = Repair-ControlXml -XmlText $v.layoutxml -TargetNames $ControlNames
        if ($res.Changed -gt 0 -and $PSCmdlet.ShouldProcess("saved query '$($v.name)' ($($v.returnedtypecode))", "replace $($res.Changed) PCF control reference(s)")) {
            $body = @{ layoutxml = $res.Xml } | ConvertTo-Json -Compress
            Invoke-RestMethod -Uri "$base/savedqueries($($v.savedqueryid))" -Method Patch -Headers $headers -Body $body | Out-Null
            Write-Host ("  VIEW {0} ({1}): replaced {2}" -f $v.name, $v.returnedtypecode, $res.Changed)
            $stripped.Add([pscustomobject]@{ Type = 'SavedQuery'; Id = $v.savedqueryid; Name = "$($v.name) ($($v.returnedtypecode))" })
            $patchedViews++
        }
    }
    Write-Host "Patched saved queries: $patchedViews"

    if ($stripped.Count -gt 0) {
        # Merge with an earlier run so a re-run of this stage does not lose components.
        $previous = if (Test-Path $StateFile) { @(Get-Content $StateFile -Raw | ConvertFrom-Json) } else { @() }
        ConvertTo-Json -InputObject @($previous + $stripped | Sort-Object Id -Unique) | Set-Content -Path $StateFile -Encoding utf8
        Write-Host "Recorded $($stripped.Count) rewritten component(s) in $StateFile (used by -RestoreControls)."
    }

    if (($patchedForms + $patchedViews) -gt 0) {
        if ($PSCmdlet.ShouldProcess($EnvironmentUrl, 'PublishAllXml')) {
            Write-Host '=== PublishAllXml ===' -ForegroundColor Cyan
            Invoke-RestMethod -Uri "$base/PublishAllXml" -Method Post -Headers $headers -Body '{}' | Out-Null
            Write-Host 'Publish complete.'
        }
    }
    else {
        Write-Host 'No forms or views referenced the target controls; nothing to publish.'
    }
}

function Get-SolutionPluginAssemblies {
    param([Guid]$SolutionId)
    # componenttype 91 = PluginAssembly
    $components = Get-AllPages -Url "$base/solutioncomponents?`$select=objectid&`$filter=_solutionid_value eq $SolutionId and componenttype eq 91"
    foreach ($c in $components) {
        Invoke-RestMethod -Uri "$base/pluginassemblies($($c.objectid))?`$select=name,publickeytoken" -Headers $headers
    }
}

# Returns the reasons why the solution must not be deleted; an empty list means it is safe.
function Get-DeleteBlockers {
    param($Solution)
    $blockers = @()

    $os = (Invoke-RestMethod -Uri "$base/solutions?`$select=solutionid&`$filter=uniquename eq '$OsSolutionUniqueName'" -Headers $headers).value
    if (-not $os) {
        $blockers += "The open-source solution '$OsSolutionUniqueName' is not installed. Deleting '$AppSourceSolutionUniqueName' now would delete the Volunteer Management tables and their data. Import the OS solution first (step 1)."
    }

    if (-not $Solution.ismanaged) {
        $blockers += "Solution '$AppSourceSolutionUniqueName' is unmanaged. Only the managed AppSource solution can be deleted by this script."
    }

    $assemblies = @(Get-SolutionPluginAssemblies -SolutionId $Solution.solutionid)
    $osAssemblies = @($assemblies | Where-Object { $_.publickeytoken -eq $OsPluginPublicKeyToken })
    if ($osAssemblies.Count -gt 0) {
        $blockers += "Solution '$AppSourceSolutionUniqueName' contains plug-in assembly '$($osAssemblies[0].name)' signed with the open-source key ($OsPluginPublicKeyToken). It is an open-source build (for example one installed before the solution was renamed to '$OsSolutionUniqueName'), not the AppSource solution."
    }
    elseif ($assemblies.Count -eq 0) {
        $blockers += "Solution '$AppSourceSolutionUniqueName' contains no plug-in assembly, so it cannot be confirmed to be the AppSource Volunteer Management solution."
    }

    return $blockers
}

function Invoke-DeleteAppSourceSolution {
    Write-Host "=== Deleting AppSource managed solution '$AppSourceSolutionUniqueName' ===" -ForegroundColor Cyan
    if ($AppSourceSolutionUniqueName -ieq $OsSolutionUniqueName) {
        throw "Refusing to delete '$OsSolutionUniqueName': it is the open-source solution this migration installs."
    }

    $sol = (Invoke-RestMethod -Uri "$base/solutions?`$select=solutionid,friendlyname,version,ismanaged&`$filter=uniquename eq '$AppSourceSolutionUniqueName'" -Headers $headers).value
    if (-not $sol) {
        Write-Host "  Solution '$AppSourceSolutionUniqueName' not found (already removed?)." -ForegroundColor Yellow
        return
    }
    $s = $sol[0]
    Write-Host ("  Found: {0} v{1} (managed={2})" -f $s.friendlyname, $s.version, $s.ismanaged)

    $blockers = @(Get-DeleteBlockers -Solution $s)
    if ($blockers.Count -gt 0) {
        foreach ($b in $blockers) { Write-Host "  BLOCKED: $b" -ForegroundColor Red }
        if (-not $Force) {
            throw "Refusing to delete '$AppSourceSolutionUniqueName' ($($blockers.Count) safety check(s) failed). Fix the cause, or rerun with -Force if you are certain and have a backup."
        }
        Write-Host '  -Force specified: continuing despite the failed safety checks.' -ForegroundColor Yellow
    }
    else {
        Write-Host "  Safety checks passed: '$OsSolutionUniqueName' is installed and the target is the managed AppSource build."
    }

    if ($PSCmdlet.ShouldProcess("solution '$AppSourceSolutionUniqueName' ($($s.friendlyname) v$($s.version), managed=$($s.ismanaged))", 'DELETE')) {
        Invoke-RestMethod -Uri "$base/solutions($($s.solutionid))" -Method Delete -Headers $headers | Out-Null
        Write-Host '  Deleted.'
    }
}

function Invoke-RestoreControls {
    Write-Host '=== Removing the active layers created by -StripReferences ===' -ForegroundColor Cyan
    if (-not (Test-Path $StateFile)) {
        throw "State file '$StateFile' not found. -StripReferences writes it; pass -StateFile if it is elsewhere."
    }
    $restored = 0
    foreach ($c in @(Get-Content $StateFile -Raw | ConvertFrom-Json)) {
        $set, $field = if ($c.Type -eq 'SystemForm') { 'systemforms', 'formxml' } else { 'savedqueries', 'layoutxml' }
        $xml = (Invoke-RestMethod -Uri "$base/$set($($c.Id))?`$select=$field" -Headers $headers).$field
        if ($ControlNames | Where-Object { $xml.Contains($_) }) {
            Write-Host "  $($c.Type) $($c.Name): already references the PCF controls; skipped."
            continue
        }
        if ($PSCmdlet.ShouldProcess("$($c.Type) '$($c.Name)'", 'RemoveActiveCustomizations')) {
            Invoke-RestMethod -Uri "$base/RemoveActiveCustomizations(SolutionComponentName='$($c.Type)',ComponentId=$($c.Id))" -Headers $headers | Out-Null
            Write-Host "  $($c.Type) $($c.Name): active layer removed"
            $restored++
        }
    }
    if ($restored -gt 0 -and $PSCmdlet.ShouldProcess($EnvironmentUrl, 'PublishAllXml')) {
        Write-Host '=== PublishAllXml ===' -ForegroundColor Cyan
        Invoke-RestMethod -Uri "$base/PublishAllXml" -Method Post -Headers $headers -Body '{}' | Out-Null
        Write-Host 'Publish complete.'
    }
}

function Invoke-VerifyReport {
    Write-Host '=== Plugin assemblies (Plugins*) ===' -ForegroundColor Cyan
    (Invoke-RestMethod -Uri "$base/pluginassemblies?`$select=name,publickeytoken&`$filter=startswith(name,'Plugins')" -Headers $headers).value |
        Format-Table name, publickeytoken -AutoSize | Out-Host

    Write-Host '=== PCF controls and owning solutions ===' -ForegroundColor Cyan
    foreach ($n in $ControlNames) {
        $cc = (Invoke-RestMethod -Uri "$base/customcontrols?`$select=customcontrolid,name&`$filter=name eq '$n'" -Headers $headers).value
        if ($cc) {
            $sc = (Invoke-RestMethod -Uri "$base/solutioncomponents?`$select=solutioncomponentid&`$filter=objectid eq $($cc[0].customcontrolid) and componenttype eq 66&`$expand=solutionid(`$select=uniquename)" -Headers $headers).value
            Write-Host ("  {0,-34} owners=[{1}]" -f $n.Split('.')[-1], (($sc | ForEach-Object { $_.solutionid.uniquename }) -join ', '))
        }
        else {
            Write-Host ("  {0,-34} MISSING" -f $n.Split('.')[-1]) -ForegroundColor Yellow
        }
    }

    Write-Host '=== SDK steps registered on PluginsOS ===' -ForegroundColor Cyan
    $asm = (Invoke-RestMethod -Uri "$base/pluginassemblies?`$select=pluginassemblyid,name&`$filter=name eq 'PluginsOS'" -Headers $headers).value
    if ($asm) {
        $types = (Invoke-RestMethod -Uri "$base/plugintypes?`$select=plugintypeid&`$filter=_pluginassemblyid_value eq $($asm[0].pluginassemblyid)" -Headers $headers).value
        $stepCount = 0
        foreach ($t in $types) {
            $steps = (Invoke-RestMethod -Uri "$base/sdkmessageprocessingsteps?`$select=sdkmessageprocessingstepid&`$filter=_plugintypeid_value eq $($t.plugintypeid)" -Headers $headers).value
            $stepCount += $steps.Count
        }
        Write-Host ("  PluginsOS: {0} plugin type(s), {1} SDK step(s) registered" -f $types.Count, $stepCount)
    }
    else {
        Write-Host '  PluginsOS assembly not found.' -ForegroundColor Yellow
    }
}

if ($StripReferences) { Invoke-StripReferences }
if ($DeleteAppSourceSolution) { Invoke-DeleteAppSourceSolution }
if ($RestoreControls) { Invoke-RestoreControls }
if ($Verify) { Invoke-VerifyReport }

Write-Host 'Done.' -ForegroundColor Green
