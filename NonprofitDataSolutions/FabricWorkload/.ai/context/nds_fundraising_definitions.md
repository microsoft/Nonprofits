# NDS Fundraising – Definitions (Fabric items) Placeholder & GUID Strategy

This document defines how we manage placeholders and GUID/ID replacement in Fabric item definitions (JSON files under `definitions/` folders). It establishes naming conventions, the two‑phase replacement flow, and guidance so AI can automatically retrofit placeholders into freshly exported JSONs in the future.

## Goals

- Keep JSON definitions portable across environments and installations.
- Avoid hard‑coding environment‑specific IDs (workspace, item IDs, connection names).
- Allow new PackageInstallerItems (e.g., `NDS_Fundraising_D365`) to reuse the same conventions.
- Enable automated retrofitting of placeholders after fresh exports or updates to Fabric items.

## Scope

- Applies to JSON definitions for Fabric items (DataPipelines, Notebooks, Lakehouses, etc.) under:
  - `Workload/app/assets/items/**/definitions/**`
- Applies both at package install time (interceptor replacements) and in post‑deployment steps (runtime replacements) when actual IDs are known.

## Two‑Phase Replacement Flow

1) Package install (build‑time/static replacement via interceptors)
   - Defined in each package's `package.json` under `items[].definition.interceptor` (type `StringReplacement`).
   - Replaces portable placeholders with known values or item IDs exported by the package install (e.g., `{{SFNPSP_Bronze}}`, `{{WORKSPACE_ID}}`).
   - Example: In `NDS_Fundraising_SFNPSP/package.json`, the `SFNPSP_BronzeIngestion` pipeline definition replaces `{WORKSPACE_ID}`, `{BRONZE_LAKEHOUSE_ID}`, etc.

2) Post‑deployment (runtime replacement)
   - Implemented in the post‑deploy handler(s) after the package finishes installing.
   - Uses `DeploymentContext.variableMap` to retrieve final IDs for items (e.g., notebook IDs, pipeline IDs) and performs additional replacements.
   - Example: `ConnectToCore` calls `updateBronzeIngestionPipeline` which replaces `{SALESFORCE_TRANSFORM_NOTEBOOK_ID}` and merges activities from a bundled JSON extension.

This split keeps JSON stable in source control, while still allowing dynamic wiring when all artifacts exist in Fabric.

## Naming Conventions (Placeholders & Variables)

Use clear, uppercase placeholders inside JSON definitions. Prefer braces `{...}` for static placeholders and double‑braces `{{...}}` for variable keys resolved by the installer/runtime.

- Static placeholders in JSON (to be replaced by interceptors or runtime code):
  - `{WORKSPACE_ID}` – The current workspace ID.
  - `{BRONZE_LAKEHOUSE_NAME}` – Logical name used in notebooks or pipelines.
  - `{BRONZE_LAKEHOUSE_ID}` – The Lakehouse item ID.
  - `{SALESFORCE_TRANSFORM_NOTEBOOK_ID}` – Notebook ID placeholder used by post‑deploy step.
  - `{SFNPSP_BronzeIngestion}` – Pipeline item ID placeholder used by post‑deploy step.

- Variable keys (installer/runtime variables, present in `DeploymentContext.variableMap`):
  - `{{WORKSPACE_ID}}` – Provided by deployment.
  - `{{SFNPSP_Bronze}}`, `{{SFNPSP_BronzeIngestion}}`, `{{SFNPSP_BronzeToSilverTransformation}}` – Created during package install; used by interceptors and post‑deploy logic.

- Display name matching:
  - Use base display names without suffixes in code (e.g., `NDS_BronzeIngestion`).
  - When searching in Fabric, use a suffix‑agnostic match (helper `matchesBaseDisplayName`) because installations may enable `suffixItemNames: true`.

## Where Replacements Happen

- Interceptors (static): In each `items[].definition.interceptor.config.replacements` section of a package's `package.json`.
- Post‑deploy (runtime): In code under `Workload/app/items/PackageInstallerItem/postDeploy/`.
  - Constants are defined in `PostDeployConstants.ts`.
  - Helpers for parsing and updating JSON: `PostDeployUtils.ts` (base64 decode, deep replacement, update item definition, etc.).
  - Example updater: `UpdateBronzeIngestionPipeline.ts`.

## Authoring New Definitions (for New Sources like D365)

When adding new PackageInstallerItems (e.g., `NDS_Fundraising_D365`), follow this pattern:

1) Use placeholders in JSON definitions
   - Replace environment‑specific values with placeholders listed above (and add new ones if needed).
   - Keep naming consistent across items (lakehouse, notebooks, pipelines).

2) Add interceptors for first‑phase replacement
   - In the new package's `package.json`, add `definition.interceptor` with a `StringReplacement` map for standard placeholders.
   - Map `{WORKSPACE_ID}` → `{{WORKSPACE_ID}}`, item‑specific placeholders → corresponding `{{ITEM_ID_*}}` exported by the package.

3) Plan post‑deploy replacements (second phase)
   - If some IDs are only known after installation (e.g., notebook IDs referenced by a pipeline), add a post‑deploy handler.
   - Bundle any activity extensions as JSON assets and import them directly in TypeScript (enabled by `resolveJsonModule`).
   - Perform deep replacements (workspace ID, notebook IDs, pipeline IDs) and merge into the base JSON.

4) Centralize constants
   - Add new placeholders to `PostDeployConstants.ts` with clear comments.
   - Reuse existing ones where possible to minimize drift.

5) Keep display names stable
   - Choose base display names that won’t change often.
   - Use suffix‑agnostic matching when locating items in Fabric at runtime.

## Retrofitting Placeholders After Fresh Exports

When items are updated in Fabric and freshly exported (overwriting JSONs in the repo), AI should:

1) Identify environment‑specific values to replace
   - Workspace IDs, item IDs (Lakehouse, Notebooks, Pipelines), connection names, dataset IDs.
   - Notebook references inside pipeline activities (e.g., notebook activity properties).

2) Insert the standard placeholders
   - Replace hardcoded workspace IDs with `{WORKSPACE_ID}`.
   - Replace item IDs with the appropriate placeholders (e.g., `{BRONZE_LAKEHOUSE_ID}`, `{SFNPSP_BronzeIngestion}`, `{SALESFORCE_TRANSFORM_NOTEBOOK_ID}`).
   - Keep logical names (`{BRONZE_LAKEHOUSE_NAME}`) when they’re used as a label.

3) Ensure interceptors cover the static replacements
   - Update the package `package.json` to include all required `StringReplacement` entries.

4) Wire runtime‑only IDs in post‑deploy
   - If a reference cannot be resolved at install time, add/extend the post‑deploy code to set it at runtime.
   - Example: replacing `{SALESFORCE_TRANSFORM_NOTEBOOK_ID}` and merging activities in `UpdateBronzeIngestionPipeline.ts`.

5) Validate
   - Build the workload bundle and, if possible, run a small deployment to confirm placeholders resolve as expected.

## Example Patterns

- Notebook reference inside a pipeline activity:
  - Exported JSON usually contains a concrete GUID. Replace it with `{SALESFORCE_TRANSFORM_NOTEBOOK_ID}` (or a new, well‑named placeholder) and supply the actual value via post‑deploy.

- Pipeline‑to‑pipeline linking:
  - When linking to a pipeline created by the same package, use a placeholder like `{SFNPSP_BronzeIngestion}` and let post‑deploy resolve the final ID from `variableMap`.

- Lakehouse references in notebooks:
  - Replace lakehouse name and ID with `{BRONZE_LAKEHOUSE_NAME}` and `{BRONZE_LAKEHOUSE_ID}`; map them via interceptors to `SFNPSP_Bronze` and `{{SFNPSP_Bronze}}` (or the D365 equivalent).

## Why This Matters

- Keeps definitions reusable across environments.
- Supports parallel source packages (e.g., SFNPSP, D365) without copy‑pasted, hardcoded IDs.
- Enables safe iterative updates: after re‑export, placeholders can be reapplied consistently by AI.

## Item Name Decorations: `suffixItemNames`, `prefixItemNames`, and `prefixedOrSuffixedReplacements`

Some packages decorate item names during install (suffixing and/or prefixing) to avoid collisions or to group related installs. This affects how replacements work.

- `suffixItemNames: true`
   - The installer appends a suffix to item display names at install time (e.g., "NDS_Silver" → "NDS_Silver (2)"), so multiple installs can coexist.
   - Production installs typically do not use suffixing; dev/test often do.

- `prefixItemNames: "<prefix>"`
   - Optionally prepends a prefix to item display names (e.g., `"DEV_"` resulting in "DEV_NDS_Silver").
   - Special value `"PackageInstallerItemName"` copies the current Package Installer item instance name (as entered by the user in Fabric) and appends an underscore.
   - Useful when installing into an existing workspace where collisions are likely or when a friendly namespace is desired.

- `prefixedOrSuffixedReplacements: [...]`
   - A whitelist of placeholder KEYS whose replacement VALUES should receive the same decorations (prefix and/or suffix) applied to item display names.
   - This ensures JSON references by name still match the decorated items created in that install.

### How it influences replacements

1) Interceptor (Phase 1) behavior
   - When `suffixItemNames` is true, any replacement entry whose key appears in `prefixedOrSuffixedReplacements` will receive the install suffix. For example:
       - `{SILVER_LAKEHOUSE_NAME}`: "NDS_Silver" → "NDS_Silver (2)".
       - `<NDS_Config>`: "NDS_Config" → "NDS_Config (2)".
   - When `prefixItemNames` is defined, those same keys receive the prefix unless already present.
   - Replacement entries NOT listed in `prefixedOrSuffixedReplacements` are left as-is (no decorations).

2) Post‑deploy (Phase 2) behavior
    - Post‑deploy code typically uses IDs rather than names for reliability. If you must locate items by name, use suffix‑agnostic matching (see `matchesBaseDisplayName`) so code works whether or not suffixing is enabled.
    - When writing back references into JSON at runtime, prefer IDs over names. If a name MUST be written, obtain the correct suffixed name (e.g., from the created item metadata) instead of assuming the base name.

### Examples from this repo

- NDS_Fundraising_Core (`Workload/.../NDS_Fundraising_Core/package.json`)
   - `suffixItemNames: true`
   - `prefixedOrSuffixedReplacements`: `{"{SILVER_LAKEHOUSE_NAME}", "{GOLD_LAKEHOUSE_NAME}", "<NDS_Config>", "<NDS_SilverCreateSchema>", "<NDS_SilverCreateDefaultConfiguration>"}`
   - Effect: Interceptor replacements for these keys are suffixed during dev/test installs, keeping name‑based references consistent.

- NDS_Fundraising_SFNPSP (`Workload/.../NDS_Fundraising_SFNPSP/package.json`)
   - `suffixItemNames: true`
   - `prefixedOrSuffixedReplacements` includes, for example, `"{BRONZE_LAKEHOUSE_NAME}", "<NDS_Config>"`.

### Authoring guidance

- Prefer IDs over names for cross‑item references where possible:
   - Use variables like `{{ITEM_ID_*}}` in interceptors and runtime code.
   - Reserve name placeholders (subject to suffixing) for UI labels or places where the platform requires names.

- If you use names in definitions:
   - Add the corresponding placeholder KEY to `prefixedOrSuffixedReplacements` in `package.json` so decorated installs remain consistent.
   - Keep a base (unsuffixed) constant for code matching and rely on `matchesBaseDisplayName` when locating items.

- Retrofit checklist for AI when suffixing/prefixing is enabled:
   - [ ] Convert hardcoded names to placeholders covered by `prefixedOrSuffixedReplacements` (e.g., `{SILVER_LAKEHOUSE_NAME}`, `<NDS_Config>`).
   - [ ] Convert hardcoded IDs to `{{ITEM_ID_*}}` variables or well‑named placeholders resolved at runtime.
   - [ ] Ensure `suffixItemNames` is set appropriately for dev/test packages.
   - [ ] Verify interceptors include mappings for the new placeholders and that the ones requiring decorations are listed in `prefixedOrSuffixedReplacements`.

## Checklists

- For any new/updated JSON definition:
  - [ ] Replace environment‑specific IDs with placeholders.
  - [ ] Ensure `package.json` interceptors include mappings for all placeholders.
  - [ ] Add/extend post‑deploy handler if runtime IDs are required.
  - [ ] Update `PostDeployConstants.ts` for new placeholders.
  - [ ] Keep base display names stable; use suffix‑agnostic matching in code.

## Related Files

- `Workload/app/assets/items/**/package.json` – Interceptor configuration (phase 1).
- `Workload/app/items/PackageInstallerItem/postDeploy/PostDeployConstants.ts` – Placeholder constants.
- `Workload/app/items/PackageInstallerItem/postDeploy/PostDeployUtils.ts` – JSON parsing and update helpers.
- `Workload/app/items/PackageInstallerItem/postDeploy/CustomPostDeployHandlers.ts` – Post‑deploy handler registry and entry points.
- `Workload/app/items/PackageInstallerItem/postDeploy/UpdateBronzeIngestionPipeline.ts` – Example runtime replacements and activity merge.

## Reference: Placeholder Catalog (Core + SFNPSP)

The following placeholders appear across the Core and SFNPSP packages. Angle‑bracket placeholders typically represent display names (subject to suffixing when configured). Curly‑brace placeholders represent values to be replaced by interceptors or runtime code.

Workspace & environment
- `{WORKSPACE_ID}` → replaced to `{{WORKSPACE_ID}}` at install; also used at runtime.
- `{WORKSPACE_NAME}` → replaced to `{{WORKSPACE_NAME}}` in report definitions.

Lakehouses
- `{BRONZE_LAKEHOUSE_NAME}`, `{BRONZE_LAKEHOUSE_ID}` (SFNPSP)
- `{SILVER_LAKEHOUSE_NAME}`, `{SILVER_LAKEHOUSE_ID}` (Core)
- `{GOLD_LAKEHOUSE_NAME}`, `{GOLD_LAKEHOUSE_ID}` (Core)

Angle-bracket name placeholders (subject to `prefixedOrSuffixedReplacements`)
- `<NDS_Config>`
- `<NDS_SilverCreateSchema>`
- `<NDS_SilverCreateDefaultConfiguration>`

Notebook ID placeholders (used inside pipelines or cross‑references)
- `{SILVER_CREATE_SCHEMA_NOTEBOOK_ID}` (Core)
- `{SILVER_IMPORT_SAMPLE_DATA_NOTEBOOK_ID}` (Core)
- `{SILVER_CREATE_DEFAULT_CONFIGURATION_NOTEBOOK_ID}` (Core)
- `{GOLD_CREATE_SCHEMA_NOTEBOOK_ID}` (Core)
- `{SILVER_TO_GOLD_ENRICHMENT_NOTEBOOK_ID}` (Core)
- `{GOLD_CREATE_SEGMENTS_NOTEBOOK_ID}` (Core)
- `{SALESFORCE_TRANSFORM_NOTEBOOK_ID}` (Core placeholder preserved for post‑deploy)
- `{SALESFORCE_BR_MERGE_NOTEBOOK_ID}` (SFNPSP)
- `{SALESFORCE_CONFIG_NOTEBOOK_ID}` (SFNPSP)

Pipeline ID placeholders
- `{SILVER_TO_GOLD_ENRICHMENT_PIPELINE_ID}` (Core)
- `{BRONZE_INGESTION_PIPELINE_ID}` (Core + Orchestration linking to Bronze ingestion pipeline)
- `{SFNPSP_BronzeIngestion}` (runtime placeholder in activities extension; resolved by post‑deploy)

Reports / Semantic model
- `{SEMANTICMODEL_ID}` → replaced to `{{ITEM_ID_NDS_Fundraising_Intelligence}}` (Core)

Connections and other values
- `{SALESFORCE_CONNECTION_ID}` (SFNPSP)

## Reference: Variable Keys Catalog (Resolved at Install/Runtime)

Core item variables
- `{{NDS_Silver}}`, `{{NDS_Gold}}`
- `{{NDS_SilverCreateSchema}}`, `{{NDS_SilverCreateDefaultConfiguration}}`
- `{{NDS_SilverImportSampleDataNotebook}}`, `{{NDS_SilverToGoldEnrichmentNotebook}}`
- `{{NDS_GoldCreateSchema}}`, `{{NDS_GoldCreateSegments}}`
- `{{NDS_BronzeIngestion}}`
- `{{ITEM_ID_NDS_Fundraising_Intelligence}}`

SFNPSP item variables
- `{{SFNPSP_Bronze}}`
- `{{SFNPSP_BronzeIngestion}}`
- `{{SFNPSP_BronzeMergeStagingData}}`
- `{{SFNPSP_Config}}`

Environment variables
- `{{WORKSPACE_ID}}`, `{{WORKSPACE_NAME}}`
