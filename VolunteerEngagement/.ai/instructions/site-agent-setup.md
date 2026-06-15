# Power Pages site agent setup

Use these instructions for the Power Pages site agent (a Copilot Studio agent) embedded in the Volunteer Engagement Portal-EDM site.

## Scope

This guidance covers the Enhanced Data Model Power Pages site agent configured through the `powerpages-site-agent:*` helper scripts in `Portal-EDM`. It does not cover custom bot channels or bespoke agent hosting unless the user explicitly expands scope.

## Goals

- Make site agent setup simple, repeatable, and idempotent.
- Ensure required web roles are assigned to the site agent Bot Consumer component.
- Ground the agent in Volunteer Engagement / Volunteer Management Dataverse knowledge sources with least privilege.
- Keep anonymous agents limited to public data.

## Prerequisites

- Target Power Platform environment with the Portal-EDM site deployed.
- Enhanced Data Model site.
- PAC CLI installed and authenticated to the target environment.
- Azure CLI or Az PowerShell signed in to the target tenant for the Dataverse helper scripts.
- Copilot Studio licensing available.
- Required web roles exist in the target site.

## Provisioning

The site agent is auto-provisioned asynchronously after the site is deployed for the first time. The portal shows "Hold on, the agent is being set up." until provisioning completes. The agent is automatically bound to the site; no manual channel configuration is needed. Wait for provisioning to finish before running the helper scripts.

## 1. Assign site agent web roles

```shell
npm run powerpages-site-agent:patch-roles
```

Calls `Portal-EDM/scripts/permissions/patch-site-agent-roles.ps1`, which patches the site agent Bot Consumer web role array (`adx_botconsumer_adx_webrole`) in `powerpagecomponent.content`. Dataverse relationship rows alone are not enough for the runtime widget to render the roles.

- Default roles `Anonymous Users` and `Authenticated Users` apply only when neither `-RoleNames` nor `-RoleIds` is supplied.
- Pass `-RoleNames` or `-RoleIds` to choose roles explicitly. When using exact role IDs, the script does not add implicit role names.
- Add `-EnsureSiteAgentEnabled` if the site agent enablement setting is missing.
- The script ends with a Dataverse readback summary of Bot Consumer roles and the site-agent enablement setting.

Anonymous agent access must be limited to public content such as opportunity discovery, general FAQ, and site navigation. Any flow that applies for an opportunity, books shifts, reads profile or participation data, or changes Dataverse records must require sign-in and respect table permissions and Web API least privilege.

## 2. Add VE/VM knowledge sources

```shell
npm run powerpages-site-agent:customize-ve-vm
```

Calls `Portal-EDM/scripts/site-agent/customize-ve-vm-site-agent.ps1`. Targets Enhanced Data Model sites only. It creates or updates a site-specific `dvtablesearch` record, adds the Portal-EDM tables used by the volunteer experience, and links that source to the EDM `powerpagesite` row and the site agent default GPT component.

- The default `Public` profile includes only public browsing data: public engagement opportunities, schedules, required opportunity qualifications, preference types, and qualification types.
- For an authenticated-only portal agent, use `-Profile VolunteerPortal` for signed-in volunteer data such as contact profile, participation, availability, preferences, and qualifications.
- The script blocks non-public knowledge sources while the Bot Consumer is assigned to `Anonymous Users`. Remove the anonymous role before using `-Profile VolunteerPortal`.
- For internal or staff-only deployments that should also use the existing Volunteer Management model-app search source, add `-IncludeVolunteerManagementModelAppSearch` after confirming web roles and table permissions.
- The script ends with a readback summary of Bot Consumer roles, GPT-linked table searches, active knowledge-source entities, and any non-public entities present.

## 3. Apply advanced Copilot Studio configuration

```shell
npm run powerpages-site-agent:configure-advanced
```

Calls `Portal-EDM/scripts/site-agent/configure-site-agent-advanced.ps1` and reads `scripts/site-agent/site-agent-advanced.config.json`. It writes the configured text to the default GPT component's root `instructions` field, which is the metadata shown by the Copilot Studio Overview page, and can create or update Copilot Studio Knowledge Source components such as the default public portal-page search source.

- The `instructions` and `knowledge` arrays are prompt guidance, not Dataverse `dvtablesearch` sources. Use step 2 for table-backed knowledge sources.
- Use `-ConfigPath` to apply a different configuration file.
- Add `-RemoveInstructions` to clear the Overview `instructions` field while leaving other metadata and Knowledge Source components in place.

## Setup checklist

1. Confirm the target site and environment.
2. Confirm Copilot Studio licensing and admin permissions.
3. Wait for the site agent to finish auto-provisioning after the first deployment.
4. Sync site metadata: `npm run sync`.
5. Ensure the `HTTP/Content-Security-Policy` site setting allows the site agent runtime in `connect-src`. The package script patches the target environment dynamically; do not commit tenant-specific environment API hosts to source metadata.
6. Assign site agent web roles: `npm run powerpages-site-agent:patch-roles`.
7. Add VE/VM knowledge sources: `npm run powerpages-site-agent:customize-ve-vm`.
8. Apply advanced configuration: `npm run powerpages-site-agent:configure-advanced`.
9. Restart the site if needed: `npm run site:restart`.
10. Validate agent visibility for anonymous and authenticated users according to expected roles.
11. Validate option-set/choice display labels.

## Validation checklist

- Agent appears for intended users and roles, including anonymous users when public browsing assistance is expected.
- Agent loads on the target site after deployment.
- Browser console has no CSP violations for the environment API `/powervirtualagents/.../directline/token` request or Direct Line connections.
- Agent does not expose restricted Dataverse data to anonymous users.
- Apply, profile, participation, and personal-data flows require sign-in.
- Agent answers from configured knowledge sources and declines when information is missing.
- Agent displays readable labels for choices/options instead of raw option keys.
- Agent works after a normal page refresh and after cache-bypassing validation.
