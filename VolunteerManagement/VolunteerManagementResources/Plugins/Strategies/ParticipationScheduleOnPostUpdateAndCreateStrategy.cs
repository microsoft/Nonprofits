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
				EntityReference previousShift = null;
				if (context.MessageName == "Update")
				{
					target = service.Retrieve(target.LogicalName, target.Id, new ColumnSet("msnfp_engagementopportunityscheduleid", "msnfp_participationscheduleid", "msnfp_participationid", "msnfp_schedulestatus"));
					previousShift = ValidateBookingChange(target);
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
					if (previousShift != null)
					{
						Utilities.CalculateEOScheduleCurrentCount(service, tracingService, previousShift);
					}
					Utilities.CalculateParticipationTotalHours(service, tracingService, participation.ToEntityReference(), participation.GetAttributeValue<decimal>("msnfp_hours"));
				}
			}
		}

		/// <summary>
		/// A booking takes a new place on a shift when it moves to another shift while active, or when it becomes
		/// Pending or Completed from Cancelled or No Show. That shift must belong to the participation's
		/// opportunity and have room. Returns the previous shift when the booking moved, so its count can be updated.
		/// </summary>
		private EntityReference ValidateBookingChange(Entity schedule)
		{
			if (!context.PreEntityImages.TryGetValue(PreImageName, out var preImage) || preImage == null)
			{
				return null;
			}

			var newShift = schedule.GetAttributeValue<EntityReference>("msnfp_engagementopportunityscheduleid");
			if (newShift == null)
			{
				return null;
			}

			var previousShift = preImage.GetAttributeValue<EntityReference>("msnfp_engagementopportunityscheduleid");
			var shiftChanged = preImage.Contains("msnfp_engagementopportunityscheduleid") && previousShift?.Id != newShift.Id;
			var previousStatus = preImage.GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value;
			var newStatus = schedule.GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value;

			if (shiftChanged)
			{
				participationScheduleService.ValidateShiftBelongsToParticipation(schedule.GetAttributeValue<EntityReference>("msnfp_participationid"), newShift);
			}

			if (TakesPlace(newStatus) && (shiftChanged || !TakesPlace(previousStatus)))
			{
				participationScheduleService.ValidateShiftCapacity(newShift, schedule.Id);
			}

			return shiftChanged ? previousShift : null;
		}

		private static bool TakesPlace(int? scheduleStatus) =>
			scheduleStatus == (int)ParticipationScheduleStatus.Pending || scheduleStatus == (int)ParticipationScheduleStatus.Completed;
	}
}