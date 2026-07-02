# Nonprofit Data Solutions — Fabric Workload (Project Overview)

> **Read this first.** This document gives the big-picture context for the entire repository.
> For detailed topics see the sibling files in `.ai/context/` and the standards in `.ai/`.

## What This Is

A **Microsoft Fabric Workload** (WDK v2) built for nonprofit organizations.
It ships a **package installer** UI inside Microsoft Fabric that deploys a complete
**medallion architecture** (Bronze → Silver → Gold) for fundraising analytics — lakehouses,
Spark notebooks, data pipelines, a semantic model and a Power BI report — in a single guided wizard.

| Attribute | Value |
|-----------|-------|
| Workload name (dev) | `Org.NonprofitData` |
| Workload name (prod) | Registered org name (set during setup) |
| Item type | `Fundraising` (`Org.NonprofitData.Fundraising`) |
| Frontend tech | React 18, TypeScript 5, Fluent UI, webpack 5 |
| WDK client | `@ms-fabric/workload-client` v2 |
| Node version | ≥ 22.17.1 |

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Microsoft Fabric Platform                                      │
│  ┌──────────────────────────┐   ┌─────────────────────────────┐│
│  │  Workload Hub / Workspace│   │  OneLake / Fabric APIs      ││
│  │  (discovers & hosts UI)  │   │  (items, lakehouses, jobs)  ││
│  └────────────┬─────────────┘   └─────────────┬───────────────┘│
└───────────────┼───────────────────────────────┼────────────────┘
                │  iframes                      │  REST
┌───────────────▼───────────────────────────────▼────────────────┐
│  This Repo — Fabric Workload Frontend                          │
│                                                                 │
│  Workload/app/                                                  │
│  ├── items/NonprofitDataSolutions/                              │
│  │   ├── ItemLanding/          (Overview · Deployments · Post-  │
│  │   │                          DeploymentSetup tabs)           │
│  │   └── DeploymentWizard/     (6-step guided deployment)       │
│  ├── items/PackageInstallerItem/                                │
│  │   ├── deployment/           (UX deployment strategy engine)  │
│  │   ├── package/              (PackageRegistry, interceptors)  │
│  │   └── postDeploy/           (custom handlers, pipeline merge)│
│  └── clients/                  (Fabric API client wrappers)     │
│                                                                 │
│  config/Manifest/              (XML + JSON manifests, icons,    │
│                                 translations)                   │
│  scripts/                      (Setup, Build, Run, Deploy PS1)  │
│  Workload/app/assets/          (package JSON + item definitions │
│                                 + sample data CSVs)             │
└─────────────────────────────────────────────────────────────────┘
```

## Repository Layout (key paths)

| Path | Purpose |
|------|---------|
| `Workload/app/App.tsx` | Two routes: `ItemLanding` and `DeploymentWizard` |
| `Workload/app/items/NonprofitDataSolutions/` | **Main item implementation** — UI for the Fundraising item |
| `Workload/app/items/PackageInstallerItem/` | **Package deployment engine** — strategies, registry, interceptors, post-deploy |
| `Workload/app/clients/` | Fabric Platform API clients (OneLake, Items, Jobs, Lakehouses, Connections, Folders, Workspaces) |
| `Workload/app/controller/` | ItemCRUD, Navigation, Notification, Dialog, Page, Settings controllers |
| `Workload/app/assets/items/PackageInstallerItem/Fundraising/` | **Package definition JSON + all item asset files** |
| `config/Manifest/` | `WorkloadManifest.xml`, `FundraisingSolutions.xml/.json`, `Product.json`, XSD schemas, icons, translations |
| `scripts/Setup/` | `Setup.ps1` (main), `SetupWorkload.ps1`, `CreateDevAADApp.ps1`, etc. |
| `scripts/Build/` | `BuildRelease.ps1`, `BuildManifestPackage.ps1` |
| `scripts/Run/` | `StartDevServer.ps1`, `StartDevGateway.ps1` |
| `.ai/` | AI context files, coding guidelines, commands |

## TypeScript Path Aliases

| Alias | Resolves to |
|-------|-------------|
| `@src/*` | `./app/*` |
| `@context/*` | `./app/context/*` |
| `@components/*` | `./app/components/*` |
| `@services/*` | `./app/services/*` |
| `@controller/*` | `./app/controller/*` |
| `@clients/*` | `./app/clients/*` |
| `@originalInstaller/*` | `./app/items/PackageInstallerItem/*` |
| `@nds/*` | `./app/items/NonprofitDataSolutions/*` |

## The Fundraising Package — Medallion Architecture

The single package (ID: `Fundraising`) deployed by the wizard contains **~22 Fabric items**
spread across the classic medallion layers:

### Bronze Layer — Ingestion

- **Lakehouse**: `Fundraising_SalesforceNPSP_BR` (Salesforce raw data)
- **Notebook**: `Fundraising_SalesforceNPSP_BR_Merge`
- **DataPipeline**: `Fundraising_SalesforceNPSP_BR_Load`, `Fundraising_BR_Ingestion`

### Silver Layer — Transformation / Cleansing

- **Lakehouse**: `Fundraising_SL` (+ 37 sample CSV data files when Sample Data module selected)
- **Notebooks**: `Fundraising_SL_CreateSchema`, `Fundraising_SL_DefaultConfig`,
  `Fundraising_SL_SampleData`, `Fundraising_D365_Transform`,
  `Fundraising_SalesforceNPSP_Transform`

### Gold Layer — Analytics / Serving

- **Lakehouse**: `Fundraising_GD`
- **Notebooks**: `Fundraising_GD_CreateSchema`, `Fundraising_GD_CreateSegments`,
  `Fundraising_SL_GD_Enrichment` (Silver→Gold)
- **DataPipeline**: `Fundraising_SL_GD_Enrichment`
- **SemanticModel**: `Fundraising_Intelligence_Semantic` (~30 TMDL table files)
- **Report**: `Fundraising_Intelligence` (Power BI)

### Cross-cutting

- **Notebook**: `Fundraising_Config` (shared configuration)
- **Notebooks**: `Fundraising_D365_Config`, `Fundraising_SalesforceNPSP_Config`
- **DataPipeline**: `Fundraising_Orchestration` (top-level orchestrator)

### Asset Files Structure

All deployable artifacts live under `Workload/app/assets/items/PackageInstallerItem/Fundraising/`:

```
Fundraising/
├── package.json                          # Package definition (items, modules, interceptors, deployment config)
├── definitions/
│   ├── Notebooks/                        # 12 Spark notebooks (.ipynb)
│   │   ├── Fundraising_Config.Notebook/
│   │   ├── Fundraising_D365_Config.Notebook/
│   │   ├── Fundraising_D365_Transform.Notebook/
│   │   ├── Fundraising_GD_CreateSchema.Notebook/
│   │   ├── Fundraising_GD_CreateSegments.Notebook/
│   │   ├── Fundraising_SalesforceNPSP_BR_Merge.Notebook/
│   │   ├── Fundraising_SalesforceNPSP_Config.Notebook/
│   │   ├── Fundraising_SalesforceNPSP_Transform.Notebook/
│   │   ├── Fundraising_SL_CreateSchema.Notebook/
│   │   ├── Fundraising_SL_DefaultConfig.Notebook/
│   │   ├── Fundraising_SL_GD_Enrichment.Notebook/
│   │   └── Fundraising_SL_SampleData.Notebook/
│   ├── DataPipelines/                    # 4 Fabric data pipelines (JSON)
│   │   ├── Fundraising_BR_Ingestion.DataPipeline/
│   │   ├── Fundraising_Orchestration.DataPipeline/
│   │   ├── Fundraising_SalesforceNPSP_BR_Load.DataPipeline/
│   │   └── Fundraising_SL_GD_Enrichment.DataPipeline/
│   ├── SemanticModels/                   # 1 semantic model (TMDL format)
│   │   └── Fundraising_Intelligence_Semantic.SemanticModel/
│   │       ├── .platform
│   │       ├── definition.pbism
│   │       └── definition/
│   │           ├── database.tmdl
│   │           ├── model.tmdl
│   │           ├── expressions.tmdl
│   │           ├── relationships.tmdl
│   │           └── tables/              # ~40 table .tmdl files
│   │               ├── DimConstituent.tmdl, DimCampaign.tmdl, DimDate.tmdl, ...
│   │               ├── FactDonation.tmdl, FactOpportunity.tmdl, FactSoftCredit.tmdl, ...
│   │               └── dm_Constituent.tmdl, dm_CampaignAttribution.tmdl, ...
│   └── Reports/                          # 1 Power BI report
│       └── Fundraising_Intelligence.Report/
│           ├── .platform
│           ├── definition.pbir
│           ├── report.json
│           └── StaticResources/          # Themes, images
└── data/
    └── nds-silver-sampledata/            # 37 CSV files loaded into Silver lakehouse
        ├── Account.csv, Address.csv, Campaign.csv, CampaignChannel.csv, ...
        ├── Constituent.csv, Contact.csv, Country.csv, ...
        ├── Opportunity.csv, OpportunityStage.csv, OpportunityType.csv, ...
        ├── Transaction.csv, TransactionSource.csv, ...
        └── WealthScreening.csv, WealthScreeningCapacityRange.csv, ...
```

Each notebook folder contains a `notebook-content.ipynb`, each pipeline folder a `pipeline-content.json`.
These files contain **placeholders** (e.g., `{WORKSPACE_ID}`, `{SILVER_LAKEHOUSE_NAME}`, `{{Fundraising_GD_Lakehouse}}`) that are substituted by the StringReplacement interceptor during deployment.

### Module System

Items are grouped into **selectable modules** (see `MODULE_ARTIFACT_MAPPING`):

| Module | Always? | Description |
|--------|---------|-------------|
| `Fundraising_Core` | Yes | Silver + Gold lakehouses, all schema/enrichment notebooks, pipelines, semantic model, report |
| `Fundraising_SampleData` | No | Sample data notebook + 37 CSVs loaded into Silver lakehouse |
| `Fundraising_Dynamics365` | No | D365 config + transform notebooks. Requires lakehouse selection in wizard. |
| `Fundraising_SalesforceNPSP` | No | Salesforce bronze lakehouse, merge/load/transform notebooks. Requires connection selection in wizard. |

## Deployment Wizard Flow

| Step | StepId | Component | Notes |
|------|--------|-----------|-------|
| Overview | `step-0` | `Overview` | Shows what will be deployed |
| Configuration | `step-1` | `Configuration` | Name, workspace, module checkboxes |
| Additional Config | `step-2` | `AdditionalConfiguration` | **Conditional** — only if D365 or Salesforce selected |
| Review | `step-3` | `Review` | Summary of items |
| Deploy | `step-4` | `Review` (reused) | Real-time progress |
| Finish | `step-5` | `Finish` | Success/failure, created items table |

Validation uses **Yup schemas** (deployment name regex, conditional lakehouse/connection).

## Package Definition & Deployment Engine

- **Package JSON**: `Workload/app/assets/items/PackageInstallerItem/Fundraising/package.json`
- **PackageRegistry**: loads packages from assets via `loadFromAssets()`, single package currently
- **UXDeploymentStrategy**: creates workspace/folder → creates items via Fabric APIs
- **Interceptors**: `StringReplacement` — substitutes placeholders (`{{WORKSPACE_ID}}`, `{{PREFIX}}`,
  cross-item refs like `{{Fundraising_GD_Lakehouse}}`) in item content at deploy time
- **Post-deploy**: `onFinishJobs` can run Spark/Fabric jobs or custom handlers
- **Workspace move detection**: tracks cross-workspace moves for PostDeploymentSetup

For the full placeholder/variable strategy see `.ai/context/nds_fundraising_definitions.md`.
For SFNPSP post-deploy wiring see `.ai/context/nds_fundraising.md`.

## Item Landing Page (after deployment)

The Fundraising item shows three tabs:

| Tab | PageId | Purpose |
|-----|--------|---------|
| Overview | `overview` | High-level status of the item |
| Deployments | `deployments` | List of deployments with statuses |
| Post-Deployment Setup | `post-deployment-setup` | Actions after workspace moves (e.g., DEV → TEST via Fabric Deployment Pipelines) |

## Environment Variables (`Workload/.env.*`)

| Variable | Purpose |
|----------|---------|
| `WORKLOAD_NAME` | e.g. `Org.NonprofitData` |
| `DEFAULT_ITEM_NAME` | Default name for item creation |
| `DEV_WORKSPACE_ID` | Workspace ID for dev |
| `TELEMETRY_DISABLED` / `APPLICATIONINSIGHTS_CONNECTION_STRING` | Optional Application Insights telemetry |
| `WORKSPACE_MOVE_SIMULATION_WORKSPACE_IDS` | For testing workspace moves |

## npm Scripts (run from `Workload/`)

| Script | Purpose |
|--------|---------|
| `npm start` / `npm run start:devServer` | Dev server with HMR |
| `npm run build:dev\|ppe\|prod` | Production builds per environment |
| `npm run validate:assets` | Pre-build asset validation |
| `npm run analyze` | Webpack bundle analyzer |

## PowerShell Scripts (run from repo root)

| Script | Purpose |
|--------|---------|
| `scripts/Setup/Setup.ps1` | Main setup orchestrator |
| `scripts/Run/StartDevServer.ps1` + `StartDevGateway.ps1` | Dev mode |
| `scripts/Build/BuildRelease.ps1` | Full release build |
| `scripts/Build/BuildManifestPackage.ps1` | NuGet manifest package |
| `scripts/Setup/Remove-PackageItems.ps1` | Cleanup deployed items |

## Design Patterns

- **Config-driven item types**: `WorkloadItemConfig` pattern (see `fundraising.config.ts`) — adding a new item type is mostly declarative
- **Module-based package composition**: `MODULE_ARTIFACT_MAPPING` controls which artifacts deploy per selected module
- **Strategy pattern**: `DeploymentStrategyFactory` → currently only `UXDeploymentStrategy`
- **3-layer context in wizard**: `DeploymentContext` (state), `WizardContext` (navigation/validation), `WorkspaceDataContext` (Fabric data)
- **Interceptors**: template variable substitution in item content at deploy time
- **Post-deploy handlers**: custom pipeline merge / cross-package wiring after install

## Future Item Types

The architecture is designed for expansion:

```typescript
enum WorkloadType {
  Fundraising = 'fundraising',
  // Programs = 'programs',
  // Grants = 'grants',
}
```

To add a new item type: create a config in `ItemLanding/configs/`, add a manifest pair (XML + JSON) in `config/Manifest/`, add a route in `App.tsx`, and create the package JSON with its asset definitions.

## Other AI Context Files

| File | Topic |
|------|-------|
| `.ai/context/nds_fundraising.md` | SFNPSP post-deploy wiring, ConnectToCore handler |
| `.ai/context/nds_fundraising_definitions.md` | Placeholder & GUID strategy, two-phase replacement |
| `.ai/context/fabric.md` | Microsoft Fabric platform overview |
| `.ai/context/fabric_workload.md` | Generic WDK v2 project structure (template) |
| `.ai/context/react.md` | React/TypeScript conventions |
| `.ai/context/typescript.md` | TypeScript conventions |
| `.ai/component-structure-standards.md` | Component file naming/structure rules |
| `.ai/coding-guidelines/` | Code formatting standards |
| `.ai/telemetry/` | Telemetry instrumentation guidance |
| `.ai/commands/` | AI automation commands (run, deploy, publish, etc.) |
