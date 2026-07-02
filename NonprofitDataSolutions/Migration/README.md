# NDS Installer Item `definition.json` Migration

This folder contains a Microsoft Fabric notebook that migrates the **installer item state**
of a Nonprofit Data Solutions (NDS) installer item from the Microsoft-released workload into a
new **open-source (OSS)** workload item.

- Notebook: [`NDS-Migrate-InstallerItem-Definition.ipynb`](./NDS-Migrate-InstallerItem-Definition.ipynb)

## What is this?

An NDS installer item keeps all of its state (deployment history, selected modules,
workspace-move metadata) in a single `definition.json` part of the Fabric item definition.
When moving from the Microsoft-released workload (item type `Microsoft.NonprofitData.*`,
e.g. `Microsoft.NonprofitData.Fundraising`) to the open-source workload (a different item
type / display name), this notebook copies that JSON state into the new OSS item so you
don't have to reconfigure the installer from scratch.

## What it does

1. **Reads** the source (Microsoft) item definition via the Fabric `getDefinition` operation
   and extracts the `definition.json` part.
2. **Maps** the schema through `migrate_schema()` (identity passthrough + a `schemaVersion`
   stamp by default, so the OSS schema can diverge later).
3. **Writes** the mapped JSON into the target OSS item via `updateDefinition`, **preserving
   the target's `.platform` part** (item type / display name are left untouched).

The notebook can also **auto-discover** the source installer item by its item type
(`Microsoft.NonprofitData.*`) in the current workspace.

## What it does NOT do

- It does **not** move or recreate the actual deployed Fabric artefacts
  (lakehouses, notebooks, pipelines, semantic models). Only the installer item's JSON state
  is migrated.
- Entries in `deployedItems[]` keep their original `workspaceId` / `itemId` references.

## Prerequisites

- Run the notebook **inside a Fabric notebook** with access to both the source and target
  workspaces (it uses `sempy.fabric.FabricRestClient`, preinstalled in Fabric).
- The signed-in identity needs **read** on the source item and **write** on the target item.
- The **target OSS item must already exist** — create it first, then run the notebook.
- If the target OSS workload is running in **local dev mode** (item type `Org.*` served by the
  DevGateway), the DevGateway must be **running** so Fabric recognizes the item type;
  otherwise `getDefinition` / `updateDefinition` on the OSS item return
  `400 InvalidItemType`. Once the workload is published, this is not required.

## How to use

1. Open the notebook in the Fabric workspace and attach it to a Spark session.
2. In the **Parameters** cell, set:
   - `SRC_WORKSPACE_ID` — leave empty to use the current workspace.
   - `SRC_ITEM_ID` — leave empty to auto-discover the Microsoft installer item by
     `ITEM_TYPE_FILTER` (default `"NonprofitData"`). If more than one candidate is found,
     the IDs are printed so you can set this explicitly.
   - `DST_WORKSPACE_ID` / `DST_ITEM_ID` — the target OSS item (must already exist).
   - `DRY_RUN` — keep `True` first to preview the mapped JSON without writing; set to
     `False` to perform the actual write.
3. Run the cells in order (Parameters → Helpers → Resolve source → Read → Map → Write → Verify).
4. Review the `DRY_RUN = True` output, then re-run the Write + Verify cells with
   `DRY_RUN = False` to migrate.

## Safety

- `DRY_RUN` defaults to `True` — nothing is written until you opt in.
- The write only replaces the `definition.json` part and preserves every other part
  (including `.platform`).
- Consider backing up the target item's current `definition.json` before writing, so you can
  restore it if needed.
