</H1>Readme for AzureFoundation Networking</H1>
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
# Azure Foundation Workloads

This folder contains the network deployed as part of the AzureFoundation.  Using the metadata spreadsheet to get the correct parameters created.  
There is a DeploymentRead-Me tab in the metadata spreadsheet with specific details of how the network is laid down.

## Setup - Connecting to the Government Cloud
Any number of tools can be used to work with the Azure. Popular tools include:
* PowerShell
* PowerShell ISE
* Visual Studio Code
* Visual Studio 2017 Community/Professional/Enterprise editions
The AzureFoundation Networking is designed to accomidate four Azure Regions, deployed in pairs.  
The Parameter files are updated from the Metadata spreadsheet and they feed the Templates files.
The Parameters and Templates are deployed from Site1 and 3's powershell scripts.  
There is a Visio diagram that depicts the resources deployed in the template.  

The first step, open the spreadsheet and look at the tab for the deployment steps.  The update of the spreadsheet will customize the deployment.  Resources can be added or removed, in most cases, just by adding a row to a table, or removing a row from a table.  

If no rows are added or remove, the only documents that need to be updated are the "Parameters" documents, since the deployment will be the same deployment that is already saved.  The parameters will override the default variables associated with Contoso.org.

PowerShell is the way the templates are deployed.  

Current Sprint:  To use SD-WAN and Azure Virtual WAN design versus the traditional Local Network gateways.  

An approach that has two folders for an option to do SD-WAN as a branch?




