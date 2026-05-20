targetScope = 'subscription'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Monthly budget amount for the Foundation subscription, in the subscription billing currency. Set to 0 to skip budget creation.')
param monthlyBudgetAmount int = 0

@description('Budget notification email addresses.')
param budgetContactEmails array = []

@description('Budget start date in YYYY-MM-01 format.')
param budgetStartDate string = utcNow('yyyy-MM-01')

@description('Suffix used in the subscription budget name.')
@maxLength(43)
param budgetNameSuffix string = 'foundation'

@description('Customer-readable label for the subscription where the budget is created.')
param budgetScopeLabel string = 'Foundation subscription'

var budgetName = '${deploymentPrefix}-${budgetNameSuffix}-budget'
var shouldCreateBudget = monthlyBudgetAmount > 0 && !empty(budgetContactEmails)
var budgetSkippedReason = shouldCreateBudget ? '' : monthlyBudgetAmount <= 0 ? 'monthly-budget-amount-not-supplied' : 'budget-contact-emails-not-supplied'
var budgetFollowUpAction = shouldCreateBudget ? '' : budgetSkippedReason == 'monthly-budget-amount-not-supplied' ? 'Provide a positive monthlyBudgetAmount in the subscription billing currency to enable the ${budgetScopeLabel} budget baseline.' : 'Provide at least one budgetContactEmails value to enable the ${budgetScopeLabel} budget baseline.'
var budgetPermissionGuidance = shouldCreateBudget ? 'If this deployment fails on the ${budgetScopeLabel} budget resource, the deployment identity is missing Microsoft.Consumption/budgets/write at the ${budgetScopeLabel} scope. Grant Cost Management Contributor (or Contributor / Owner) at that scope and rerun, or set monthlyBudgetAmount to 0 to skip the budget step. Newly created subscriptions may need up to 48 hours before Cost Management budget creation is available.' : ''

resource foundationBudget 'Microsoft.Consumption/budgets@2024-08-01' = if (shouldCreateBudget) {
  name: budgetName
  properties: {
    amount: monthlyBudgetAmount
    category: 'Cost'
    timeGrain: 'Monthly'
    timePeriod: {
      startDate: budgetStartDate
    }
    notifications: {
      Actual80Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        thresholdType: 'Actual'
        contactEmails: budgetContactEmails
        locale: 'en-us'
      }
      Actual100Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 100
        thresholdType: 'Actual'
        contactEmails: budgetContactEmails
        locale: 'en-us'
      }
    }
  }
}

output budgetStatus string = shouldCreateBudget ? 'created' : 'skipped'
output budgetResourceId string = shouldCreateBudget ? foundationBudget.id : ''
output budgetName string = shouldCreateBudget ? foundationBudget.name : budgetName
output budgetSkippedReason string = budgetSkippedReason
output budgetFollowUpAction string = budgetFollowUpAction
output budgetPermissionGuidance string = budgetPermissionGuidance
