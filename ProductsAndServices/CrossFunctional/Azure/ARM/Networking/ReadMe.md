</H1>Readme for AzureFoundation Networking</H1>
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
# Azure Foundation Workloads

This folder contains the network deployed as part of the AzureFoundation.  Using the metadata spreadsheet to get the correct parameters created.  
There is a DeploymentRead-Me tab in the metadata spreadsheet with specific details of how the network is laid down.

<h2> Setup - Connecting to Azure </h2>
<p>Any number of tools can be used to work with the Azure. Popular tools include:
<li>PowerShell</li>
<li>PowerShell ISE</li>
<li>Visual Studio Code</li>
<li>Visual Studio Community/Professional/Enterprise editions </li>
</li>

The AzureFoundation Networking is designed to accomidate four Azure Regions, deployed in pairs.  
The Parameter files are updated from the Metadata spreadsheet and they feed the Templates files.
The Parameters and Templates are deployed from Site1 and 3's powershell scripts.  
There is a Visio diagram that depicts the resources deployed in the template.  

The first step, open the spreadsheet and look at the tab for the deployment steps.  The update of the spreadsheet will customize the deployment.  Resources can be added or removed, in most cases, just by adding a row to a table, or removing a row from a table.  

If no rows are added or remove, the only documents that need to be updated are the "Parameters" documents, since the deployment will be the same deployment that is already saved.  The parameters will override the default variables associated with Contoso.org.

PowerShell is the way the templates are deployed.  

Current Sprint:  To use SD-WAN and Azure Virtual WAN design versus the traditional Local Network gateways.  

An approach that has two folders for an option to do SD-WAN as a branch?

</p>

<h2> Contoso for Good Deployment </h2>
<p>The metadata and process around developing the Azure Foundation is focused on using all of the best practices and not just stating what they are, but having a working implimentation of the best practices that is deployable.  
There is a directory called "Contoso" that will have the abiliy to deploy the Azure Foundation verison of the deployment.  There are some requirements to make sure the "Deploy to Azure" works, which requires some of the documentaiton in the templates to be removed.</p>


### Architecture

![Image](resources/VirtualWAN.png)

The flow of the Bing News solution template is as follows:

1. Logic Apps finds articles via the [Bing News Search API](https://azure.microsoft.com/en-us/services/cognitive-services/bing-news-search-api/)
2. Logic App extracts the contents of the news article
3. Azure Function calls textual analytics cognitive services to wrok out the sentiment of the article 
4. Azure Function enriches the content of the news article with machine learning
5. Power BI imports data into it from Azure SQL and renders pre-defined reports





<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2FMicrosoft%2FNonprofits%2Fmaster%2FProductsAndServices%2FCrossFunctional%2FAzure%2FARM%2FNetworking%2FVirtualWAN%2FafVWANDeployRegion1.json" target="_blank">
    <img src="http://azuredeploy.net/deploybutton.png"/>
</a>
