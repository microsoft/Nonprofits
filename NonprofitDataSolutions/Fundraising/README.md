# Fundraising

The Fundraising capability provides data analytics and insights specifically designed for fundraisers and marketers in nonprofit organizations. This capability helps organizations better understand their constituents, optimize marketing spend, align fundraising strategies, and demonstrate return-on-investment (ROI).

## What's Included

- **Data pipelines and notebooks** that ingest, standardize, and prepare fundraising data for analytics
- **Medallion lakehouse architecture** (bronze, silver, gold layers) for data quality management
- **Nonprofit data model** with business logic tailored for fundraising operations
- **Fundraising reports** providing holistic views of constituent engagement and giving patterns

## Data Models

Review the data models to understand how fundraising data is structured and related:

Learn More:
- Read about Nonprofit data solutions on [MS Learn](https://learn.microsoft.com/en-us/industry/nonprofit/nonprofit-data-solutions)
- Review the [Gold Data Model - ERD](./Documents/gold-data-model-erd.pdf)
- Review the [Gold Data Model](./Documents/gold-data-model.csv)
- Review the [Silver Data Model - ERD](./Documents/silver-data-model-erd.pdf)
- Review the [Silver Data Model](./Documents/silver-data-model.csv)

## How to Deploy

There are two ways to deploy the Fundraising solution. We recommend deploying via Workload as it is faster, clearer, and easier to manage.

### Method 1: Deploy via Workload (Preferred)

For step-by-step guidance on deploying through the Fabric workload interface, see [Deploy Nonprofit data solutions](https://learn.microsoft.com/en-us/industry/nonprofit/deploy-nonprofit-data-solutions).

### Method 2: Deploy via Installation Script (Alternative)

Use this method to quickly deploy the solution using PowerShell automation if you prefer a scripted approach.

**Prerequisites**

Before deployment, ensure you have:
- PowerShell 7+
- Python 3.10+
- [Microsoft Fabric CLI (fab)](https://learn.microsoft.com/fabric/cicd/deployment-pipelines/cli)
- Active Fabric capacity with an accessible workspace
- Authenticate into your environment by running in the terminal `fab auth login` and then `quit` to exit the interactive mode 

**Data Options**

- **Sample Data** (Default): Deploy with included sample data for quick setup. The installation script imports sample data automatically.
- **Salesforce NPSP Data**: Connect your Salesforce Nonprofit Success Pack data before running the installation script. Create a Salesforce connection in your workspace following the [data source management guidelines](https://learn.microsoft.com/fabric/data-factory/connector-salesforce-copy-activity). The script will detect and use this connection automatically.
- **Dynamics 365 Sales Enterprise with Common Data Model for Nonprofits Data**: Link your Dataverse environment to your Fabric workspace. For comprehensive guidance to set up the link, see [Link to Microsoft](https://review.learn.microsoft.com/power-apps/maker/data-platform/fabric-link-to-data-platform) Fabric. The script will detect and use this connection automatically. Ensure Link Dataverse to Microsoft Fabric is configured and the lakehouse is synchronized. All required tables must have the Change tracking feature enabled in Dynamics 365. Make sure that you're using Common Data Model for Nonprofits version 3.1.3.4 or later.

**Run Installation**

Execute the installation script with your workspace name and a unique prefix:

```powershell
.\Install-IntoWorkspace.ps1 -WorkspaceName YOURWORKSPACE -Prefix YOURPREFIX_
```

The script deploys all solution assets—lakehouses, notebooks, pipelines, triggers, reports, and semantic models—into your Fabric workspace.

