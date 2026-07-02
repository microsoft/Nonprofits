# Nonprofit data solutions in Microsoft Fabric

Nonprofit data solutions in Microsoft Fabric is a preconfigured, scalable data
architecture and analytics accelerator that helps nonprofit organizations unify,
transform, and analyze their data. It streamlines data management and delivers
actionable insights so organizations can better understand constituents, optimize
fundraising, and demonstrate impact.

## Overview

The solution provides an end-to-end analytics foundation built on Microsoft Fabric:

- **Medallion lakehouse architecture** (Bronze → Silver → Gold) for data quality and storage optimization.
- **Data pipelines and Spark notebooks** for automated ingestion, standardization, and enrichment.
- **Nonprofit-specific data models** with built-in business logic.
- **Pre-built semantic model and Power BI report** tailored to nonprofit operations.

## What's included

| Folder | Description |
|--------|-------------|
| [`FabricWorkload/`](./FabricWorkload/) | A Microsoft Fabric Workload (WDK v2) that installs the full solution through a guided, in-product deployment wizard. |
| [`Installation/`](./Installation/) | PowerShell automation to create, install, clean up, and manage the solution in a Fabric workspace without the workload UI. |
| [`Migration/`](./Migration/) | A Fabric notebook that migrates installer item state from the Microsoft-released workload into this open-source workload. |
| [`Docs/`](./Docs/) | Data model documentation — Gold and Silver ERDs (PDF), data dictionaries (CSV), and a solution overview. |

## Capabilities

- **Fundraising** — Analytics and insights for fundraisers and marketers to understand
  constituents, optimize marketing spend, align fundraising strategy, and measure ROI.

Additional capabilities will be added over time to support other nonprofit operations.

## Deploy the solution

You can deploy in two ways. We recommend the Fabric Workload for a faster, guided experience.

### Option 1 — Fabric Workload (recommended)

Install and run the solution through a guided wizard directly inside Microsoft Fabric.
See [`FabricWorkload/`](./FabricWorkload/) for setup and run instructions.

### Option 2 — Installation scripts

Deploy with PowerShell automation if you prefer a scripted approach.

**Prerequisites**

- PowerShell 7+
- Python 3.10+
- [Microsoft Fabric CLI (`fab`)](https://github.com/microsoft/fabric-cli)
- Active Fabric capacity with an accessible workspace
- Sign in with `fab auth login`

**Run**

```powershell
cd Installation
./Install-IntoWorkspace.ps1 -WorkspaceName "MyWorkspace" -Prefix "NDS_"
```

See [`Installation/README.md`](./Installation/README.md) for all scripts, parameters, and
data source options (sample data, Salesforce NPSP, and Dynamics 365 / Common Data Model for Nonprofits).

## Migrate from the Microsoft-released workload

If you already run the Microsoft-released Nonprofit data solutions workload, the
[`Migration/`](./Migration/) notebook copies your existing installer item state
(deployment history and selected modules) into a new open-source workload item so you don't
have to reconfigure the installer from scratch. See
[`Migration/README.md`](./Migration/README.md) for prerequisites and step-by-step usage.

## Data models

- [Gold Data Model — ERD](./Docs/Gold%20Data%20Model%20-%20ERD.pdf)
- [Gold Data Model — dictionary](./Docs/Gold%20Data%20Model.csv)
- [Silver Data Model — ERD](./Docs/Silver%20Data%20Model%20-%20ERD.pdf)
- [Silver Data Model — dictionary](./Docs/Silver%20Data%20Model.csv)

## Learn more

- [Nonprofit data solutions overview](https://learn.microsoft.com/industry/nonprofit/nonprofit-data-solutions)
- [Deploy Nonprofit data solutions](https://learn.microsoft.com/industry/nonprofit/deploy-nonprofit-data-solutions)

## Contributing

This project welcomes contributions. See the repository
[CONTRIBUTING](../CONTRIBUTING.md) guide and [Code of Conduct](../CODE_OF_CONDUCT.md).

## Trademarks

This project may contain trademarks or logos for projects, products, or services.
Authorized use of Microsoft trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not
cause confusion or imply Microsoft sponsorship.
