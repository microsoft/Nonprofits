using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;

namespace Plugins.Strategies
{
	public class ParticipationScheduleOnPostUpdateAndCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public ParticipationScheduleOnPostUpdateAndCreateStrategy(
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
			tracingService.Trace($"Beginning Participation Schedule On {context.MessageName} Plugin");
			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];
				var service = this.serviceProvider.CreateCurrentUserOrganizationService();
				if (context.MessageName == "Update")
				{
					target = service.Retrieve(target.LogicalName, target.Id, new ColumnSet("msnfp_engagementopportunityscheduleid", "msnfp_participationscheduleid", "msnfp_participationid", "msnfp_schedulestatus"));
				}

				var participation = service.Retrieve("msnfp_participation", target.GetAttributeValue<EntityReference>("msnfp_participationid").Id, new ColumnSet("statecode", "msnfp_engagementopportunityid", "msnfp_status", "msnfp_hours"));
				if (participation.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid") == null)
				{
					throw new InvalidPluginExecutionException(OperationStatus.Failed, this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_RequiredException));
				}
				else
				{
					tracingService.Trace("Engagement Opportunity found.");
					Utilities.CalculateShiftCountsByEO(service, tracingService, participation.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid"));
					Utilities.CalculateEOScheduleCurrentCount(service, tracingService, target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityscheduleid"));
					Utilities.CalculateParticipationTotalHours(service, tracingService, participation.ToEntityReference(), participation.GetAttributeValue<decimal>("msnfp_hours"));
				}
			}
		}
	}
}