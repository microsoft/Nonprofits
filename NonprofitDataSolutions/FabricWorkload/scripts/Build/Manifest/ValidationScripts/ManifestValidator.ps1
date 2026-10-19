param (
    [string]$inputDirectory,
    [string]$inputXml,
    [string]$inputXsd,
    [string]$outputDirectory
)
try
{
    if (-not($inputDirectory -and $inputXml -and $inputXsd -and $outputDirectory))
    {
        throw "Invalid input"
    }
    $schemaSet = [System.Xml.Schema.XmlSchemaSet]::new()
    $schema = [System.Xml.Schema.XmlSchema]::Read([System.IO.StreamReader](Join-Path $inputDirectory $inputXsd), $null)
    $schemaCommon = [System.Xml.Schema.XmlSchema]::Read([System.IO.StreamReader](Join-Path $inputDirectory "CommonTypesDefinitions.xsd"), $null)
    $schemaSet.Add($schema)
    $schemaSet.Add($schemaCommon)
    $settings = [System.Xml.XmlReaderSettings]::new()
    $settings.ValidationType = [System.Xml.ValidationType]::Schema
    $settings.ValidationFlags = [System.Xml.Schema.XmlSchemaValidationFlags]::ReportValidationWarnings
    $settings.DtdProcessing = [System.Xml.DtdProcessing]::Prohibit
    $settings.Schemas.Add($schemaSet)
    $handler = [System.Xml.Schema.ValidationEventHandler] {
        $args = $_ # entering new block so copy $_
        if ($args.Severity -eq [System.Xml.Schema.XmlSeverityType]::Warning -or $args.Severity -eq [System.Xml.Schema.XmlSeverityType]::Error)
        {
            $scriptPath = Join-Path $PSScriptRoot "WriteErrorsToFile.ps1"
            & $scriptPath -errors "$($args.Message)`r`n" -outputDirectory $outputDirectory
        }
    }
    $settings.add_ValidationEventHandler($handler)
    $reader = [System.Xml.XmlReader]::Create([string](Join-Path $inputDirectory $inputXml), [System.Xml.XmlReaderSettings]$settings);
    while ($reader.Read()) { }
    $workloadXml = [xml](Get-Content -Path (Join-Path $inputDirectory $inputXml))
    $workloadName = $workloadXml.WorkloadManifestConfiguration.Workload.WorkloadName
    $aadApp = $workloadXml.SelectSingleNode("//AADApp")
    if ($aadApp -and (-not ($aadApp.ResourceId -clike "*$($workloadName)")) -and (-not ($aadApp.ResourceId -clike "*$($workloadName)/*")))
    {
        $scriptPath = Join-Path $PSScriptRoot "WriteErrorsToFile.ps1"
        & $scriptPath -errors "AADApp.resourceId: $($aadApp.ResourceId), should contain the exact WorkloadName: $($workloadName)" -outputDirectory $outputDirectory
    }
}
catch
{
    Write-Host "An error occurred:"
    Write-Host $_
}