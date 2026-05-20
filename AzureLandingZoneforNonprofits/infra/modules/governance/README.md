# Governance Modules

This folder contains the governance and cost baseline implementation for Azure Landing Zone V2.

Current modules:

- `subscription-governance-baseline.bicep`: creates the custom Foundation governance initiative and assigns it at subscription scope
- `management-group-governance-baseline.bicep`: creates the same initiative and assigns it at management-group scope
- `foundation-budget.bicep`: creates an opt-in subscription budget when `monthlyBudgetAmount > 0` (in the target subscription billing currency) and `budgetContactEmails` is non-empty. Foundation uses it for the Foundation subscription; Expanded Platform uses it for the management subscription.

Implementation notes:

- The governance initiative keeps the built-in resource-group allowed-locations and required-tag policies, and adds a small custom resource-location policy so supported Azure global resource types do not require fake extra regions or ad hoc exemptions.
- Diagnostic onboarding status is driven by the monitoring baseline so governance outputs can report whether monitoring is active or only partially active.
- Budget creation runs whenever a budget amount and contact emails are supplied. The amount is interpreted in the subscription billing currency. The deployment fails fast on the budget step when the deployment identity lacks `Microsoft.Consumption/budgets/write`; set `monthlyBudgetAmount` to `0` to opt out of the budget step explicitly.
