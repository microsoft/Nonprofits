# Azure Foundation Workloads

This folder contains workloads that can be deployed into the Azure Foundation. These workload are not directly integrated with the spreadsheet. Values from the spreadsheet could be copied into the .parameters.json file of the workload to be deployed.

## Setup - Connecting to the Government Cloud
Any number of tools can be used to work with the Azure Government Cloud. Popular tools include:

* PowerShell
* PowerShell ISE
* Visual Studio Code
* Visual Studio 2015 Community/Professional/Enterprise editions

Connecting to Azure Government cloud from Visual Studio Community/Professional/Enterprise requires that a registry key be set. Visual Studio will not be able to connect to the public cloud until this registry key is removed. The files that will set/remove the required registry key are included in the /DeveloperSetup folder.

### Connecting
To connect to the Azure Government cloud, run the following PowerShell command:

```Powershell
Add-AzureRmAccount -EnvironmentName AzureUSGovernment
```
To connect to the Azure commercial cloud run the following PowerShell command:

```Powershell
Login-AzureRmAccount
```

###Setting the Subscription
Depending on the workload to be deployed you will need to deploy to a specific subscription. This must be done before deploying. 

To list all of the subscriptions run the following:

```Powershell
Get-AzureRmSubscription
```
To set the context to a specific subscription:

```Powershell
Set-AzureRmContext -SubscriptionName SomeSubscriptionName
```
## Creating an Account for Domain Joins
Most of the workloads join the VMs to the domain. This requires that an account be provided that has permissions to do this. It is best to not use a domain administrator account for this purpose. Details on how to do there can be found (here)[https://prajwaldesai.com/allow-domain-user-to-add-computer-to-domain/]

## Deploying a Workload

1. In Active Directory, create an Organizational Unit (OU) for where the domain-joined servers in the deployment will reside.
1. Update the parameters file to supply the parameters needed for the deployment. These values for these parameters were likely collected in the excel spreadsheet.

2. In the root of the workloads folder is a PowerShell script to deploy each workload. Each of these scripts calls Deploy-AzureResourceGroup.ps1.
This script calls creates appropriate resource group and deploys the template into that group using the parameters supplied in the .parameters.json file.

## Parameters in Deployment
One concern with the current deployment method is that when the files are pushed to blob storage using the -UploadArtifacts parameter (the default in the workload PowerShell scripts) the parameters file and primary template are also pushed to blob storage. These file will likely contain passwords that should not be shared. The script needs to be modified not to deploy these files, for example to retrieve the credentials from an Azure Key Vault, and pass to the ARM deployment as a secure object.

## Redeploying a Workload
While testing it is not uncommon to deploy a workload and then delete the entire Resource Group for that workload to perform a clean deploy. There are a couple of items to be aware of when doing this.

1. DNS - When the Resource Group is deleted, DNS records for each of the VMs will likely still exist in the DNS server. This will likely cause the redeployment to fail since the VMs will be supplied with incorrect IP Addresses for other VMs as they attempt to configure their relationships (e.g. Clustering / Always On). To resolve this:
    1. Remote Desktop into a domain controller in Azure.
    2. Open the DNS application.
    3. Navigate to the domain 
    4. Navigate to the IP Forwarders
    5. Choose refresh on this folder
    6. Delete all records in this folder that related to the deployment

2. Active Directory - When the Resource Group is deleted, records for the VMs will still likely exist in Active Directory that represent the VMs. These will likely cause the redeployment to fail.

    1. Remote Desktop into a domain controller in Azure.
    2. Open the Active Directory Users and Computers application.
    3. Navigate to the OU that the workload was deployed to. 
    5. Choose refresh on this folder
    6. Delete all records in this folder that related to the deployment

## Starting and Stopping VMs
During testing you may want to stop all of the VMs in a Resource Group if they are not in use. A script for that is at ./DeveloperSetup/StartStopVMsInResourceGroup.ps1

Usage: 

```Powershell
./StartStopVMsInResourceGroup.ps1 -ResourceGroup SomeResourceGroup -power stop
```
or

```Powershell
./StartStopVMsInResourceGroup.ps1 -ResourceGroup SomeResourceGroup -power start
```
## Workload Notes

### SharePointHAFarm
This workload deploys a SQL Server Always On Farm. SQL Server is installed and configured into the Always On configuration. The images used for the SharePoint servers are Windows Server images. SharePoint itself is not installed. 



