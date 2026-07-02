# NDS Fundraising: Core & SFNPSP (architecture, wiring, extensibility)

This document summarizes how the NDS_Fundraising_Core and NDS_Fundraising_SFNPSP packages relate within the Fabric Workload, how they are connected post‑installation, and key points for future extensions.

## Package overview

- NDS_Fundraising_Core
  - General “core” layer for Fundraising – foundational artifacts (for example, shared pipelines, configuration, naming, helpers).
  - Can be installed independently. It doesn’t depend on a specific source system.

- NDS_Fundraising_SFNPSP
  - Extension for Salesforce NPSP (source system, NPSP‑specific notebooks/pipelines).
  - Can be installed independently. It doesn’t require Core at install time.

These two packages are independent. The logical integration happens only after NDS_Fundraising_SFNPSP is installed via a post‑deployment hook that connects to the “Core” artifacts.

## Post‑install linking (post‑deploy hook)

After NDS_Fundraising_SFNPSP finishes installing, a custom post‑deployment handler named "ConnectToCore" is executed.

- Where the trigger is defined:
  - `Workload/app/assets/items/PackageInstallerItem/NDS_Fundraising_SFNPSP/package.json`
  - The `deploymentConfig.onFinishJobs` section contains `{ "kind": "CustomHandler", "handlerName": "ConnectToCore" }`.

- Where the handler is implemented:
  - `Workload/app/items/PackageInstallerItem/postDeploy/CustomPostDeployHandlers.ts`
  - The `ConnectToCore(ctx)` function obtains the Fabric client and workspace and calls `updateBronzeIngestionPipeline`.

- What the handler does (high‑level):
  - It directly updates the `NDS_BronzeIngestion` pipeline so it connects to artifacts from NDS_Fundraising_SFNPSP (details below).

## Updating NDS_BronzeIngestion (what happens inside)

Implementation: `Workload/app/items/PackageInstallerItem/postDeploy/UpdateBronzeIngestionPipeline.ts`

Steps performed:
1) Resolve dynamic IDs from `DeploymentContext.variableMap`
   - Expected variables:
     - `{{SFNPSP_BronzeToSilverTransformation}}` – ID of the "SFNPSP_BronzeToSilverTransformation" notebook (see `SFNPSP_BRONZE_TO_SILVER_NOTEBOOK_VAR`).
     - `{{SFNPSP_BronzeIngestion}}` – ID of the "SFNPSP_BronzeIngestion" pipeline (see `SFNPSP_BRONZE_INGESTION_PIPELINE_VAR`).
     - `{{WORKSPACE_ID}}` – ID of the current workspace.
   - If any are missing, the handler fails with an error and logs the cause.

2) Find the target pipeline in the current workspace
   - Target display name is `NDS_BronzeIngestion` (see `BRONZE_INGESTION_PIPELINE_NAME`).
   - Name matching is suffix‑agnostic (helper `matchesBaseDisplayName`) so it works with installation suffixes.

3) Load and parse the pipeline definition
   - Uses `fetchPipelineDefinition` + `findPipelineContentPart` + `decodeContentPartToText` + `parsePipelineJson` from `PostDeployUtils.ts`.

4) Prepare extension activities (Activities Extension)
   - The JSON asset is bundled in code: `Workload/app/assets/items/PackageInstallerItem/NDS_Fundraising_SFNPSP/definitions/DataPipelines/NDS_BronzeIngestion_SFNPSP_ActivitiesExtension.json`.
   - Before merging, placeholders are replaced:
     - `{WORKSPACE_ID}` → current workspace ID
     - `{SALESFORCE_TRANSFORM_NOTEBOOK_ID}` → notebook ID from NDS_Fundraising_SFNPSP
     - `{SFNPSP_BronzeIngestion}` → ID of the SFNPSP_BronzeIngestion pipeline

5) Inject the notebook ID into the base pipeline and merge activities
   - In the base pipeline JSON, the `{SALESFORCE_TRANSFORM_NOTEBOOK_ID}` placeholder is replaced recursively (see `BRONZE_TO_SILVER_NOTEBOOK_PLACEHOLDER`).
   - Activities from the extension JSON are appended to `properties.activities`.

6) Persist changes to Fabric
   - `updateItemDefinitionWithModifiedJson` performs the update of the item definition with the modified JSON.

## Key files and constants

- Handler registration and entry point:
  - `Workload/app/items/PackageInstallerItem/postDeploy/CustomPostDeployHandlers.ts`
  - Handler name: `ConnectToCore`

- Pipeline updater:
  - `Workload/app/items/PackageInstallerItem/postDeploy/UpdateBronzeIngestionPipeline.ts`

- Helper utilities:
  - `Workload/app/items/PackageInstallerItem/postDeploy/PostDeployUtils.ts`
    - Parse/update pipeline JSON, Base64 (atob/btoa), deep replacement, name matching.

- Constants:
  - `Workload/app/items/PackageInstallerItem/postDeploy/PostDeployConstants.ts`
    - `BRONZE_TO_SILVER_NOTEBOOK_PLACEHOLDER`
    - `SFNPSP_BRONZE_TO_SILVER_NOTEBOOK_VAR`
    - `SFNPSP_BRONZE_INGESTION_PIPELINE_VAR`
    - `BRONZE_INGESTION_PIPELINE_NAME`

- Typed Fabric client:
  - `Workload/app/clients/FabricPlatformAPIClient.ts` (type)
  - The handler/updater use the `FabricPlatformAPIClient` type

## Handling name suffixes and string replacements

- Installations may use `suffixItemNames: true`. Therefore, name comparison uses `matchesBaseDisplayName` (ignores suffixes like " (_9czhr03)", etc.).
- For basic replacements in definitions, the `StringReplacement` interceptor is used (see item definitions in `package.json`).
- In the post‑deploy phase, placeholders are replaced again at runtime because only then do we know the final IDs (notebook, pipeline, workspace).

## Extending in the future (recommended approach)

If you want to add more connections between Core and SFNPSP (or another source):
1) Prepare a JSON with activities (an extension) and place it under `Workload/app/assets/...` (ideally near the existing assets for consistency).
2) Import the JSON directly in TypeScript (thanks to `resolveJsonModule` in tsconfig) and perform placeholder replacements similarly to the current pattern.
3) In `UpdateBronzeIngestionPipeline.ts` or a new updater, merge the activities into the target pipeline.
4) Add any new constants to `PostDeployConstants.ts`.
5) Update `CustomPostDeployHandlers.ts` (if adding a new handler or enhancing the existing one).
6) Build and test the post‑deploy behavior.

## Logging and troubleshooting

- Log prefixes: `[ConnectToCore]`, `[PostDeploy]` – make it easy to locate flow in logs.
- Common issues:
  - “Missing notebook ID …” or “Missing pipeline ID …” → ensure `variableMap` contains the expected items (the install must have created them first).
  - “… DataPipeline not found …” → verify `NDS_BronzeIngestion` exists in the workspace (the name may have a suffix, but the helper ignores it).
  - Build issues: if `env-cmd` isn’t available in PATH locally, use `npx env-cmd -f .env.dev …` or the scripts in `scripts/Run/`.

## Summary

- Core and SFNPSP are designed as separate packages.
- The linking happens only after installing SFNPSP via the `ConnectToCore` handler, which updates `NDS_BronzeIngestion` and wires in activities based on the final, runtime‑known IDs.
- The code is modular, strongly typed, and ready for safe extensions using additional activity extensions.
