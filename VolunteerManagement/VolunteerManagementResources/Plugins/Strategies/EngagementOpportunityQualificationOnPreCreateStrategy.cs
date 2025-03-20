using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;

namespace Plugins.Strategies
{
	public class EngagementOpportunityQualificationOnPreCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public EngagementOpportunityQualificationOnPreCreateStrategy(
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
			tracingService.Trace("Beginning Pre-Create Engagement Opportunity Participant Qualification");
			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];

				if (target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid") == null || target.GetAttributeValue<EntityReference>("msnfp_qualificationtypeid") == null)
				{
					throw new InvalidPluginExecutionException(OperationStatus.Failed, this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_Qualification_RequiredException));
				}
				else
				{
					var service = this.serviceProvider.CreateCurrentUserOrganizationService();
					var eo = service.Retrieve("msnfp_engagementopportunity", target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid").Id, new ColumnSet("msnfp_engagementopportunitytitle"));
					var qualificationType = service.Retrieve("msnfp_qualificationtype", target.GetAttributeValue<EntityReference>("msnfp_qualificationtypeid").Id, new ColumnSet("msnfp_qualificationtypetitle"));
					var requirementLabel = target.GetAttributeValue<bool>("msnfp_isrequired") ? "Required" : "Desired";
					target["msnfp_engagementopportunityparticipantquatitle"] = $"{requirementLabel}: {qualificationType.GetAttributeValue<string>("msnfp_qualificationtypetitle")} - {eo.GetAttributeValue<string>("msnfp_engagementopportunitytitle")}";
				}
			}
		}
	}
}