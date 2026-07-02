param(
    [Parameter(Mandatory = $false)]
    [string]$WorkspaceItemsPath = './WorkspaceItems/'
)

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Read-JsonFile ($path) {
    Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json
}

function Write-ToFileSystem ($path, $content) {
    $json = $content | ConvertTo-Json -Depth 20
    [System.IO.File]::WriteAllText($path, $json, $utf8NoBom)
}

function Update-NotebookLakehouseMetadata ($notebook, $lakehousePlaceholder) {
    # Replace default_lakehouse_name in notebook metadata dependencies
    if ($notebook.metadata -and $notebook.metadata.dependencies -and $notebook.metadata.dependencies.lakehouse) {
        $notebook.metadata.dependencies.lakehouse.default_lakehouse_name = $lakehousePlaceholder
        # Also clear the default_lakehouse to use placeholders
        $notebook.metadata.dependencies.lakehouse.default_lakehouse = $null
        # Remove the workspace_id property if it exists
        if (Get-Member -InputObject $notebook.metadata.dependencies.lakehouse -Name "default_lakehouse_workspace_id" -MemberType Properties) {
            $notebook.metadata.dependencies.lakehouse.PSObject.Properties.Remove("default_lakehouse_workspace_id")
        }
        $notebook.metadata.dependencies.lakehouse.known_lakehouses = @()
    }
}

function Setup-ConfigNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_Config.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    ($notebook.cells | Where-Object cell_type -eq 'code' | Select-Object -First 1).source = @(
        "silver_lakehouse_name = `"`"`n",
        "gold_lakehouse_name = `"`"" 
    )

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-SFNPSP_ConfigNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_SalesforceNPSP_Config.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    $codeCell = $notebook.cells | Where-Object { $_.cell_type -eq 'code' -and ($_.source -match "bronze_lakehouse_name =") } | Select-Object -First 1
    $codeCell.source = $codeCell.source -replace "bronze_lakehouse_name = "".*""", "bronze_lakehouse_name = ""{SFNPSP_BRONZE_LAKEHOUSE_NAME}"""

    Update-NotebookLakehouseMetadata $notebook "{SFNPSP_BRONZE_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-SFNPSP_BronzeMergeStagingDataNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_SalesforceNPSP_BR_Merge.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    Update-NotebookLakehouseMetadata $notebook "{SFNPSP_BRONZE_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-SFNPSP_BronzeToSilverTransformationNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_SalesforceNPSP_Transform.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    Update-NotebookLakehouseMetadata $notebook "{SFNPSP_BRONZE_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-D365_ConfigNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_D365_Config.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    $codeCell = $notebook.cells | Where-Object { $_.cell_type -eq 'code' -and ($_.source -match "bronze_lakehouse_name =") } | Select-Object -First 1
    if ($codeCell) {
        $codeCell.source = $codeCell.source -replace "bronze_lakehouse_name = "".*""", "bronze_lakehouse_name = ""{D365_BRONZE_LAKEHOUSE_NAME}"""
    }

    Update-NotebookLakehouseMetadata $notebook "{D365_BRONZE_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-D365_BronzeToSilverTransformationNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_D365_Transform.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    Update-NotebookLakehouseMetadata $notebook "{D365_BRONZE_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-SilverCreateDefaultConfigurationNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_SL_DefaultConfig.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    Update-NotebookLakehouseMetadata $notebook "{SILVER_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-SilverCreateSchemaNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_SL_CreateSchema.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    Update-NotebookLakehouseMetadata $notebook "{SILVER_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-SilverImportSampleDataNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_SL_SampleData.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    Update-NotebookLakehouseMetadata $notebook "{SILVER_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-GoldCreateSchemaNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_GD_CreateSchema.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    Update-NotebookLakehouseMetadata $notebook "{GOLD_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-GoldCreateSegmentsNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_GD_CreateSegments.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    Update-NotebookLakehouseMetadata $notebook "{GOLD_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-SilverToGoldEnrichmentNotebook () {
    $notebookPath = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks/Fundraising_SL_GD_Enrichment.Notebook/notebook-content.ipynb')
    $notebook = Read-JsonFile $notebookPath

    Update-NotebookLakehouseMetadata $notebook "{GOLD_LAKEHOUSE_NAME}"

    Write-ToFileSystem $notebookPath -Content $notebook
}

function Setup-NotebookMetadata {
    $path = Resolve-Path (Join-Path $WorkspaceItemsPath 'Notebooks')

    Get-ChildItem -Path $path -Recurse -Filter 'notebook-content.ipynb' | ForEach-Object {
        # Clean notebook (keep [tags, microsoft, editable] cell metadata)
        nb-clean clean --preserve-cell-metadata tags microsoft editable -- $_.FullName

        $notebook = Read-JsonFile $_.FullName
        $notebook.metadata | Add-Member -NotePropertyName language_info -NotePropertyValue @{ name = 'python' } -Force

        # Reset %run cells with placeholder
        foreach ($codeCell in $notebook.cells | Where-Object cell_type -eq 'code') {
            if ($codeCell.source -match '^\s*%run\s+') {
                $parts = $codeCell.source -split '\s+'
                # Extract notebook name patterns: Fundraising_*, *, SFNPSP_*, D365_*
                if ($parts[1] -match '.*_(Fundraising_[^/\s]+|\w+|SFNPSP_\w+|D365_\w+)(?:/.*)?$') {
                    $notebookName = $matches[1]
                    # Replace the path with placeholder, preserving any subpath
                    if ($parts[1] -match '^(.*/)?(.*)$') {
                        $prefix = if ($matches[1]) { $matches[1] } else { "" }
                        $parts[1] = "$prefix<$notebookName>"
                        $codeCell.source = @( $parts -join ' ' )
                    }
                }
            }
        }

        Write-ToFileSystem $_.FullName -Content $notebook
    }

    Setup-ConfigNotebook
    Setup-SFNPSP_ConfigNotebook
    Setup-SFNPSP_BronzeMergeStagingDataNotebook
    Setup-SFNPSP_BronzeToSilverTransformationNotebook
    Setup-D365_ConfigNotebook
    Setup-D365_BronzeToSilverTransformationNotebook
    Setup-SilverCreateSchemaNotebook
    Setup-SilverCreateDefaultConfigurationNotebook
    Setup-SilverImportSampleDataNotebook
    Setup-GoldCreateSchemaNotebook
    Setup-GoldCreateSegmentsNotebook
    Setup-SilverToGoldEnrichmentNotebook
}

function Remove-PipelineMetadata {
    $path = Resolve-Path (Join-Path $WorkspaceItemsPath 'DataPipelines')

    Get-ChildItem -Path $path -Recurse -Filter 'pipeline-content.json' | ForEach-Object {
        $jsonPath = $_.FullName
        $pipeline = Read-JsonFile $jsonPath

        foreach ($act in $pipeline.properties.activities) {
            if ($act.type -eq 'TridentNotebook') {
                $act.typeProperties.notebookId = $null
                $act.typeProperties.workspaceId = $null
            }

            if ($act.type -eq 'ExecutePipeline' -and $act.typeProperties.pipeline) {
                $act.typeProperties.pipeline.referenceName = $null
            }

            foreach ($dir in 'source', 'sink') {
                if ($act.typeProperties.$dir -and $act.typeProperties.$dir.datasetSettings) {
                    $ds = $act.typeProperties.$dir.datasetSettings
                    if ($ds.linkedService) {
                        $ds.linkedService.name = $null
                        $ds.linkedService.properties.typeProperties.workspaceId = $null
                        $ds.linkedService.properties.typeProperties.artifactId = $null
                    }
                }
            }

            if ($act.typeProperties.datasetSettings) {
                $ds = $act.typeProperties.datasetSettings
                if ($ds.linkedService) {
                    $ds.linkedService.name = $null
                    $ds.linkedService.properties.typeProperties.workspaceId = $null
                    $ds.linkedService.properties.typeProperties.artifactId = $null
                }
            }
        }

        Write-ToFileSystem $jsonPath $pipeline
    }
}

function Setup-WorkspaceItems() {
    Setup-NotebookMetadata
    Remove-PipelineMetadata
}



if (-not (Get-Command nb-clean -ErrorAction SilentlyContinue)) {
    Write-Host "Installing nb-clean..."
    pip install nb-clean
}

Setup-WorkspaceItems