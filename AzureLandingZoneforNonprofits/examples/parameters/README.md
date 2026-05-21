# Scenario Parameter Files

This folder contains the canonical safe parameter files for the supported direct deployment scenarios.

Budget deployment is opt-in. It runs whenever `monthlyBudgetAmount > 0` and `budgetContactEmails` is non-empty; the default `0` value skips the step. The `monthlyBudgetAmount` value is interpreted in the target budget subscription's billing currency, depending on billing setup. Foundation creates this budget in the Foundation subscription. Expanded Platform creates this budget in the management subscription. The deployment will fail fast on the budget step if the deployment identity does not have `Microsoft.Consumption/budgets/write` at the target budget subscription scope; keep `monthlyBudgetAmount` at `0` to skip the step. Newly created subscriptions may need up to 48 hours before Cost Management budget creation is available.
