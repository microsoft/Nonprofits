<#

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

.SYNOPSIS
    Uploads files to blob storage account

.DESCRIPTION
    Uploads files to blob storage account from specified root folder. Subfolders in root folder are going to be used by script to prefix blob.
    root

.PARAMETER ResourceGroupName
    Name of the resoruce group where storage account is depoloyed e.g. "mstsidhrgweudev"

.PARAMETER StorageAccountName
    Storage Account Name where files should be deployed e.g. "mstsidhsaweudev"

.PARAMETER StorageAccountContainerName
    Name of the container where to upload data e.g. "datasources"

.PARAMETER $SearchDirectory
    root Directory where files will be serach from. Requires files to be organised in source folders that will prefix solutions e.g. "C:\Source\SolutionRoot\SampleSourceFiles"

.PARAMETER $Filter
    Filter that can be applied on the files to chose files based on the wildcards characters e.g. *.csv

.OUTPUTS
   No objects are outputed

.EXAMPLE
    ./Upload-StorageAccountBlobFiles [string] -ResourceGroupName "mstsidhrgweudev" -StorageAccountName "mstsidhsaweudev" -StorageAccountContainerName "datasources" -SearchDirectory "C:\Source\SolutionRoot\SampleSourceFiles" -Filter "*.csv"

.NOTES
    -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
    -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once.
    -Check parameter details for instructions
  
#>       

param(
    #[Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroupName = "mstsidhrgweudev",

    #[Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $StorageAccountName = "mstsidhsaweudev",

    #[Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $StorageAccountContainerName = "datasources",

    #[Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $SearchDirectory = "C:\src\MSTSIDH\SampleSourceFiles",

    #[Parameter(Mandatory=$false)]
    [ValidateNotNullOrEmpty()]
    [string] $Filter = "*.csv"
)

### Clear Screen
# Uncomment below line to clear screen
#cls;

### Login
# Uncomment below line to login
# Login-AzureRmAccount -SubscriptionId '{subscriptionId}'

try
{
    Write-Host "### Script Started - Upload-StorageAccountBlobFiles";

    $storageAccount = Get-AzStorageAccount `
        -ResourceGroupName $ResourceGroupName `
        -Name $StorageAccountName;

    # Get single level of folders in the search directory
    $folders = Get-ChildItem $SearchDirectory -Directory -Depth 1;
    foreach($folder in $folders)
    {
        # Obtain files in Folder 
        $files = Get-ChildItem -Path $folder.FullName -Filter $Filter
        foreach($file in $files)
        {
            Write-Host "# Uploading to blob: $($file.FullName)";

            # Upload files container -uses lowercase folder name prefix for blob file to group resources by source
            Set-AzStorageBlobContent -File $file.FullName `
              -Container $StorageAccountContainerName `
              -Blob "$($folder.Name.ToLower())/$($file.Name)" `
              -Context $storageAccount.Context `
              -ServerTimeoutPerRequest 7200 `
              -ClientTimeoutPerRequest 7200;

            Write-Host "# Uploaded." -ForegroundColor Green;
            Write-Host "#--------------------------";
        }
    }
    Write-Host "### Script Uploaded Succesfully." -ForegroundColor Green;
}
catch
{
    Write-Host "### Script Failed." -ForegroundColor Red;
    throw;
}
