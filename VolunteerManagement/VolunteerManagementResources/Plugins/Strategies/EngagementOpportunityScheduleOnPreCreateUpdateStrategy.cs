using Microsoft.Xrm.Sdk;
using Plugins.Services;
using VolunteerManagement.Definitions;

namespace Plugins.Strategies
{	
	public class EngagementOpportunityScheduleOnPreCreateUpdateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IEngagementOpportunityScheduleService entityService;

		public EngagementOpportunityScheduleOnPreCreateUpdateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IEngagementOpportunityScheduleService entityService)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.entityService = entityService;
		}

		public void Run()
		{
			tracingService.Trace($"Beginning {nameof(EngagementOpportunityScheduleOnPreCreateUpdate)} Plugin");

			if (context != null && context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity target)
			{
				// EngagementOpportunityScheduleOnPostUpdateAndCreate plugin can cause an infinite loop.
				// Early return to avoid infinite loop.
				if (context.Depth > 1)
				{
					tracingService.Trace($"Exiting {nameof(EngagementOpportunityScheduleOnPreCreateUpdate)} Plugin because of execution depth({context.Depth})");
					return;
				}

				// ValidateOrUpdateMinMaxParticipants will update the msnfp_engagementopportunityschedule entity
				// with the correct values of Min and Max participants value. As a result this should be the last
				// call in the plugin to avoid any data rollback issue if an exception is thrown by the plugin.
				if (context.MessageName == "Create")
				{
					entityService.ValidateScheduleIsInDateRangeOnRecordCreate(target);
					entityService.ValidateMinMaxParticipantsOnRecordCreation(target);
					entityService.ValidateStartAndEndDate(target);

					target[EngagementOpportunityScheduleDef.PrimaryName] = entityService.GetPrimaryName(target);
					target[EngagementOpportunityScheduleDef.Hours] = entityService.GetDefaultScheduleHours();
				}
				else if (context.MessageName == "Update")
				{
					var schedulePreImage = context.PreEntityImages["schedule"];
					entityService.ValidateScheduleIsInDateRangeOnRecordUpdate(target, schedulePreImage);
					entityService.ValidateMinMaxParticipantsOnRecordUpdate(target, schedulePreImage);

					if (target.Contains(EngagementOpportunityScheduleDef.ShiftName) || target.Contains(EngagementOpportunityScheduleDef.EngagementOpportunity))
					{
						target[EngagementOpportunityScheduleDef.PrimaryName] = entityService.GetPrimaryName(target, schedulePreImage);
					}
				}
			}

			tracingService.Trace($"Exiting {nameof(EngagementOpportunityScheduleOnPreCreateUpdate)} Plugin");
		}
	}
}