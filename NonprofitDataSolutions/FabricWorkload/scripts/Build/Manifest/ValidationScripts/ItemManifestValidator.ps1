param (
    [string]$inputDirectory,
    [string]$inputXsd,
    [string]$workloadManifest,
    [string]$outputDirectory
)
try
{
    if (-not($inputDirectory -and $inputXsd -and $outputDirectory))
    {
        throw "Invalid input"
    }
    $workloadXmlPath = Join-Path $inputDirectory $workloadManifest
    $workloadXml = [xml](Get-Content -Path $workloadXmlPath)
    $workloadName = $workloadXml.WorkloadManifestConfiguration.Workload.WorkloadName
    $itemXmls = Get-ChildItem -Path $inputDirectory -Filter "*.xml"
    foreach ($itemXml in $itemXmls)
    {
        if ($itemXml.Name -ne $workloadManifest)
        {            
            if($itemXml.Name -ne "WorkloadManifest.xml")
            {
            
                Write-Host "Validating item manifest: $($itemXml.Name)"
                $manifestValidatorPath = Join-Path $PSScriptRoot "ManifestValidator.ps1"
                & $manifestValidatorPath -inputDirectory $inputDirectory -inputXml $itemXml.Name -inputXsd $inputXsd -outputDirectory $outputDirectory
                # Naming Validations
                $itemXmlPath = $itemXml.FullName
                $xdoc = [xml](Get-Content -Path $itemXmlPath)
                $itemWorkloadName = $xdoc.ItemManifestConfiguration.Item.Workload.WorkloadName
                if ($itemWorkloadName -ne $workloadName)
                {
                    $scriptPath = Join-Path $PSScriptRoot "WriteErrorsToFile.ps1"
                    & $scriptPath -errors "Non matching WorkloadName between WorkloadManifest.xml and $($itemXml.Name)" -outputDirectory $outputDirectory
                }
                $itemName = $xdoc.ItemManifestConfiguration.Item.TypeName
                if (-not ($itemName -clike "$($itemWorkloadName).*"))
                {
                    $scriptPath = Join-Path $PSScriptRoot "WriteErrorsToFile.ps1"
                    & $scriptPath -errors "Item name's prefix should be WorkloadName for item $($itemName)" -outputDirectory $outputDirectory
                }
                $jobNames = $xdoc.SelectNodes("//ItemJobType")
                foreach ($jobName in $jobNames)
                {
                    if (-not ($jobName.Name -clike "$($itemName).*"))
                    {
                        $scriptPath = Join-Path $PSScriptRoot "WriteErrorsToFile.ps1"
                        & $scriptPath -errors "Job type name's prefix should be ItemName for jobType $($jobName.Name)" -outputDirectory $outputDirectory
                    }
                }
            }
        }
    }
}
catch
{
    Write-Host "An error occurred:"
    Write-Host $_
}