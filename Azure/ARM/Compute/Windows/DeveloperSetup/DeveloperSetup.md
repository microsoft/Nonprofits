# Azure Foundation - Developer Setup
## Requirements for deployment of Azure Foundation

1. **A Windows desktop \(tools machine\)**\. While Azure ARM deployment templates (\.json files) are generally platform-agnostic and could potentially be deployed using the Microsoft Azure Cross-platform Command Line tools from a Mac OS X or Linux, some additional components of this deployment such as PowerShell Desired State Configuration (DSC) require the Azure PowerShell module and additional PowerShell modules including xActiveDirectory that are presently only available on the Windows platform\.

   Recommended: Windows 10 x64 or Windows Server 2016

2. **Execution Policy** By default scripts cannot be run in PowerShell. To enable scripts, use the following:

    ``` Set-ExecutionPolicy -ExecutionPolicy RemoteSigned ```

    Learn more about [Execution Policy](https://technet.microsoft.com/en-us/library/ee176961.aspx)

    Note: This command must be run directly from the PowerShell command line and not via script


2. **Microsoft Azure PowerShell module**\. If the Windows desktop \(tools machine\) from which you will be directing the Azure Foundation deployments does not already have the Azure PowerShell module with AzureRm cmdlets, you can obtain and install the Azure PowerShell module using the [**Microsoft Web Platform Installer (WebPI)**](http://www.microsoft.com/web/downloads/platform.aspx)\.

    Confirm the presence of the AzureRm module with the following:  
    ``` Get-Module -ListAvailable AzureRm* ```

    If AzureRm is not installed (e.g. no modules are listed by the command) use the following to install it:
    
    1. Install the Azure Resource Manager modules from the PowerShell Gallery

        ``` Install-Module AzureRM ```

    2. Import all of the modules so that they can be used by PowerShell
    
        ``` Import-Module AzureRM ```

3. **Microsoft PowerShell DSC modules**. If the tools machine has PowerShell version 5 or newer, you can import new PowerShell modules directly from open-source repositories such as the Microsoft PowerShell Gallery or GitHub, right from the PowerShell prompt or ISE \(be sure to launch an elevated session with "Run As Administrator"\):

    ``` Install-Module xActiveDirectory ```

    Bonus tip: Windows PowerShell 5\.1 is now available as a downloadable upgrade for Windows 7, Windows 8\.1, Windows Server 2008 R2 and Windows Server 2012 and Windows Server 2012 R2 as part of the [Windows Management Framework 5\.1 package](https://blogs.msdn.microsoft.com/powershell/2017/01/19/windows-management-framework-wmf-5-1-released/)\!

## Troubleshooting Tips

- For assistance with troubleshooting installation of the Azure PowerShell module, see: [Get started with Azure PowerShell cmdlets](https://docs.microsoft.com/en-us/powershell/azureps-cmdlets-docs/)

- For assistance with importing and/or troubleshooting required PowerShell DSC modules such as *xActiveDirectory*, see: [Deploying a DC to Azure IaaS with ARM and DSC](
https://blogs.technet.microsoft.com/markrenoden/2016/11/24/revisit-deploying-a-dc-to-azure-iaas-with-arm-and-dsc/)

- If the ARM template deployment fails after a VM instance has been provisioned, and you wish to delete the Azure VM and re-deploy, you may need to clean up \(delete\) the following artifacts from the enterprise Active Directory environment before re-deployment will be successful:
  - AD Computer account for the Windows Server VM instance
  - AD Computer account for the Windows Server Failover Cluster \(WSFC\), cluster virtual name and/or SQL Alwayson Availability Group Lister
  - DNS "A" record