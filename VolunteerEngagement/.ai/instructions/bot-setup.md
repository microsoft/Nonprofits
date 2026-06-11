# Bot setup instructions

Use these instructions for Copilot Studio/Power Virtual Agents bots embedded in the Volunteer Engagement Power Pages site.

## Scope

This guidance covers Copilot Studio/Power Virtual Agents embedded in Power Pages through bot consumer metadata. It does not cover custom bot channels or bespoke bot hosting unless the user explicitly expands scope.

## Goals

- Make setup simple and repeatable.
- Keep setup idempotent where scripts exist.
- Ensure the bot is associated with the correct Power Pages site.
- Ensure required web roles are assigned to the bot consumer.
- Validate that bot responses display user-friendly labels for choices/options instead of raw option keys wherever possible.

## Prerequisites to document

Before setup, confirm:

- Target Power Platform environment.
- Power Pages site exists or is ready to be provisioned/imported.
- Copilot Studio/Power Virtual Agents licensing is available.
- Maker/admin permissions are available for the environment.
- PAC CLI is installed and authenticated.
- The target site metadata has been synced with `npm run sync` from `Portal-EDM`.
- Required web roles exist in the target site.

## Current automation state

The current deployment flow runs both role patch scripts after `pac pages upload-code-site`:

```shell
npm run permissions:patch-roles
npm run permissions:patch-bot-roles
```

`permissions:patch-roles` calls `Portal-EDM/scripts/permissions/patch-table-permission-roles.ps1`, which patches table permission role arrays in `powerpagecomponent.content`.

`permissions:patch-bot-roles` calls `Portal-EDM/scripts/permissions/patch-bot-consumer-roles.ps1`, which patches bot consumer role arrays in `powerpagecomponent.content`.

## Bot role assignment script

The bot role assignment script is reusable and idempotent. It:

- Resolves the target site ID from `powerpages.config.json`, `.powerpages-site/website.yml`, or explicit parameters.
- Reads bot consumer YAML from `.powerpages-site/bot-consumers` when local bot consumer files exist.
- Queries all site bot consumers from Dataverse when local bot consumer files do not exist.
- Resolves required web role IDs for the target site.
- Patches the bot consumer `powerpagecomponent.content` JSON with the required role array.
- Does not duplicate roles when run multiple times.
- Reports patched, skipped, and failed bot consumers.
- Fails the command when required bot consumers or roles cannot be resolved.

Default command:

```shell
npm run permissions:patch-bot-roles
```

By default, it assigns `Anonymous Users`, `Authenticated Users`, and `Administrators`. This makes the bot visible during public opportunity browsing. Pass explicit role IDs or role names to the PowerShell script when a site requires different bot visibility.

Anonymous bot access must be limited to public content such as opportunity discovery, general FAQ, and site navigation. Any bot topic that applies for an opportunity, books shifts, reads profile data, reads participation data, or changes Dataverse records must require sign-in and must respect table permissions and Web API least privilege.

## Bot instructions and option labels

Investigate whether Copilot Studio custom instructions or topic configuration can force Dataverse choices/options to render display labels instead of raw option keys.

Until confirmed, document this as a validation requirement:

- Ask the bot questions that return choice/option-set values.
- Confirm the bot displays localized or user-friendly labels.
- If raw keys appear, inspect the bot topic, data source schema, and prompt instructions.
- Prefer using explicit label fields or mapping logic over exposing raw numeric/key values.

## Setup checklist

1. Confirm the target site and environment.
2. Confirm bot licensing and admin permissions.
3. The Copilot bot is auto-provisioned asynchronously after the site is deployed for the first time. The portal shows "Hold on, the agent is being set up." until provisioning completes. The bot is automatically bound to the site — no manual channel configuration is needed. Wait for provisioning to finish before proceeding.
4. Sync site metadata: `npm run sync`.
5. Run bot role assignment patching: `npm run permissions:patch-bot-roles`.
6. Restart the site: `npm run site:restart`.
7. Validate bot visibility for anonymous and authenticated users according to expected roles.
8. Validate option-set/choice display labels.

## Validation checklist

- Bot appears for intended users and roles, including anonymous users when public browsing assistance is expected.
- Bot loads on the target site after deployment.
- Bot does not expose restricted Dataverse data to anonymous users.
- Apply, profile, participation, and personal-data bot flows require sign-in.
- Bot displays readable labels for choices/options.
- Bot works after normal page refresh and cache-bypassing validation.
