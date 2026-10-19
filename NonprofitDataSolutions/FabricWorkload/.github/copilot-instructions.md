# Copilot Instructions — Nonprofit Data Solutions Fabric Workload

## Project Context

This is a **Microsoft Fabric Workload** (WDK v2) for nonprofit organizations. It deploys a **medallion architecture** (Bronze → Silver → Gold) for fundraising analytics via a package installer UI inside Microsoft Fabric.

- **Workload name**: `Org.NonprofitData` (dev) / registered org name (prod)
- **Single item type**: `Fundraising` — a package installer that deploys ~22 Fabric items (lakehouses, notebooks, pipelines, semantic model, Power BI report)
- **Frontend**: React 18 + TypeScript 5 + Fluent UI, built with webpack 5
- **WDK client**: `@ms-fabric/workload-client` v2

## Key Paths

| Path | Purpose |
|------|---------|
| `Workload/app/items/NonprofitDataSolutions/` | Main item implementation (ItemLanding + DeploymentWizard) |
| `Workload/app/items/PackageInstallerItem/` | Package deployment engine (strategies, registry, interceptors, post-deploy) |
| `Workload/app/clients/` | Fabric Platform API client wrappers |
| `Workload/app/assets/items/PackageInstallerItem/Fundraising/` | Package definition JSON + all item asset files |
| `config/Manifest/` | XML + JSON manifests, icons, translations |
| `scripts/` | PowerShell scripts for Setup, Build, Run, Deploy |

## TypeScript Aliases

`@src/*` → `app/*`, `@clients/*` → `app/clients/*`, `@controller/*` → `app/controller/*`, `@components/*` → `app/components/*`, `@originalInstaller/*` → `app/items/PackageInstallerItem/*`, `@nds/*` → `app/items/NonprofitDataSolutions/*`

## Before Making Changes

Read the relevant `.ai/context/` files for detailed guidance:

| File | When to read |
|------|-------------|
| `.ai/context/project-overview.md` | **Always** — full architecture, medallion layers, module system, deployment flow, design patterns |
| `.ai/context/nds_fundraising.md` | Working on post-deploy wiring, ConnectToCore handler, cross-package integration |
| `.ai/context/nds_fundraising_definitions.md` | Working on item definitions, placeholders, GUID replacement strategy |
| `.ai/context/fabric.md` | Need Fabric platform background (lakehouses, pipelines, OneLake, etc.) |
| `.ai/context/fabric_workload.md` | Need generic WDK v2 structure reference |
| `.ai/component-structure-standards.md` | Creating or modifying UI components |
| `.ai/coding-guidelines/` | Code formatting questions |
| `.ai/telemetry/` | Adding telemetry instrumentation |

## Component Standards

Every component must follow the pattern: `ComponentName/` with `index.ts`, `ComponentName.tsx`, `ComponentName.types.ts`, `ComponentName.styles.ts`, and optionally `ComponentName.model.ts`. See `.ai/component-structure-standards.md` for full rules.

## Key Conventions

- Manifest changes require updating **both** XML and JSON files in `config/Manifest/`
- Item definitions use a **two-phase replacement** flow: interceptors (install time) + post-deploy handlers (runtime). See `.ai/context/nds_fundraising_definitions.md`.
- Use `makeStyles` from `@fluentui/react-components` for styling with `satisfies Record<string, CSSProperties>` type safety
- Run dev server from `Workload/`: `npm run start:devServer`
