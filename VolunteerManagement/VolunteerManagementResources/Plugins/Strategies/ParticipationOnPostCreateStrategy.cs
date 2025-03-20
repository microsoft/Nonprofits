using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;

namespace Plugins.Strategies
{
	public class ParticipationOnPostCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public ParticipationOnPostCreateStrategy(
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
			tracingService.Trace("Beginning Participation Post-Create Plugin");

			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];
				var service = this.serviceProvider.CreateCurrentUserOrganizationService();
				var participation = service.Retrieve("msnfp_participation", target.Id, new ColumnSet("msnfp_engagementopportunityid", "msnfp_contactid"));

				if (target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid") != null)
				{
					var eo = service.Retrieve("msnfp_engagementopportunity", target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid").Id, new ColumnSet("msnfp_automaticallyapproveallapplicants", "msnfp_shifts"));

					if (eo.GetAttributeValue<bool?>("msnfp_shifts") == false && (eo.GetAttributeValue<bool?>("msnfp_automaticallyapproveallapplicants") == true || target.GetAttributeValue<OptionSetValue>("msnfp_status")?.Value == (int)ParticipationStatus.Approved))
					{
						Utilities.CreateParticipationSchedule(service, participation, this.localizationHelper);
					}
					Utilities.CalculateParticpationsCountsByEO(service, eo.ToEntityReference());
					Utilities.EngagementOpportunityMessage(service, tracingService, participation.GetAttributeValue<EntityReference>("msnfp_contactid"), eo.ToEntityReference(), EngagementOpportunitySettingMessageEventType.SignUpCompleted);
				}
				else
				{
					tracingService.Trace("No Engagement Opportunity Specified");
				}
			}
		}
	}
}