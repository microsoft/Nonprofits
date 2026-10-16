using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;
using Plugins.Services;

namespace Plugins.Strategies
{
	public class ParticipationScheduleOnPostUpdateAndCreateStrategy : IPluginStrategy
	{
		public const string PreImageName = "PreImage";

		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;
		private readonly IParticipationScheduleService participationScheduleService;

		public ParticipationScheduleOnPostUpdateAndCreateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IOrganizationServiceProvider serviceProvider,
			ILocalizationHelper<Labels> localizationHelper,
			IParticipationScheduleService participationScheduleService)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.serviceProvider = serviceProvider;
			this.localizationHelper = localizationHelper;
			this.participationScheduleService = participationScheduleService;
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
					ValidateCapacityWhenRebooked(target);
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

		/// <summary>
		/// A Cancelled or No Show schedule set back to Pending takes a place on the shift again, so the shift must have room for it.
		/// </summary>
		private void ValidateCapacityWhenRebooked(Entity schedule)
		{
			if (!context.PreEntityImages.TryGetValue(PreImageName, out var preImage) || preImage == null)
			{
				return;
			}

			var previousStatus = preImage.GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value;
			var newStatus = schedule.GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value;
			var wasFreed = previousStatus == (int)ParticipationScheduleStatus.Cancelled || previousStatus == (int)ParticipationScheduleStatus.NoShow;
			if (wasFreed && newStatus == (int)ParticipationScheduleStatus.Pending)
			{
				participationScheduleService.ValidateShiftCapacity(schedule.GetAttributeValue<EntityReference>("msnfp_engagementopportunityscheduleid"), schedule.Id);
			}
		}
	}
}