using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;

namespace Plugins.Strategies
{
	public class EngagementOpportunityPreferenceOnPreCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public EngagementOpportunityPreferenceOnPreCreateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IOrganizationServiceProvider serviceProvider,
			ILocalizationHelper<Labels> localizationHelper)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.serviceProvider = serviceProvider;
			this.localizationHelper = localizationHelper;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Pre-Create Engagement Opportunity Preference");

			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];

				if (target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid") == null || target.GetAttributeValue<EntityReference>("msnfp_preferencetypeid") == null)
				{
					throw new InvalidPluginExecutionException(OperationStatus.Failed, this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_Preference_RequiredException));
				}
				else
				{
					var service = this.serviceProvider.CreateCurrentUserOrganizationService();
					var eo = service.Retrieve("msnfp_engagementopportunity", target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid").Id, new ColumnSet("msnfp_engagementopportunitytitle"));
					var preferenceType = service.Retrieve("msnfp_preferencetype", target.GetAttributeValue<EntityReference>("msnfp_preferencetypeid").Id, new ColumnSet("msnfp_preferencetypetitle"));
					target["msnfp_engagementopportunitypreferencestitle"] = $"{preferenceType.GetAttributeValue<string>("msnfp_preferencetypetitle")} - {eo.GetAttributeValue<string>("msnfp_engagementopportunitytitle")}";
				}
			}
		}
	}
}