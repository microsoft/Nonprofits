using Microsoft.Xrm.Sdk;
using Plugins.Extensions;
using Plugins.Services;
using VolunteerManagement.Definitions;

namespace Plugins.Strategies
{
	public class ParticipationScheduleOnPreCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IParticipationScheduleService participationScheduleService;

		public ParticipationScheduleOnPreCreateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IParticipationScheduleService participationScheduleService)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.participationScheduleService = participationScheduleService;
		}

		public void Run()
		{
			tracingService.Trace($"Beginning Participation Schedule On {context.MessageName} Plugin");

			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
			{
				var target = (Entity)context.InputParameters["Target"];
				var isPortal = context.IsPortalOriginated();
				if (isPortal)
				{
					participationScheduleService.ValidatePortalScheduleStatusOnCreate(target);
				}

				participationScheduleService.ValidateApprovalStatus(target);
				participationScheduleService.ValidateShiftBelongsToParticipation(
					target.GetAttributeValue<EntityReference>(ParticipationScheduleDef.Participation),
					target.GetAttributeValue<EntityReference>(ParticipationScheduleDef.EngagementOpportunitySchedule));

				if (isPortal)
				{
					participationScheduleService.ValidateShiftIsActive(target.GetAttributeValue<EntityReference>(ParticipationScheduleDef.EngagementOpportunitySchedule));
				}

				var scheduleStatus = target.GetAttributeValue<OptionSetValue>(ParticipationScheduleDef.ScheduleStatus)?.Value
					?? (int)ParticipationScheduleStatus.Pending;
				if (scheduleStatus == (int)ParticipationScheduleStatus.Pending || scheduleStatus == (int)ParticipationScheduleStatus.Completed)
				{
					participationScheduleService.ValidateShiftCapacity(target.GetAttributeValue<EntityReference>(ParticipationScheduleDef.EngagementOpportunitySchedule));
				}
			}
		}
	}
}