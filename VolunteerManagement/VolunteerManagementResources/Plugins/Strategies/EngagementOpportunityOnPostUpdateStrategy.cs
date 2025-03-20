using Microsoft.Xrm.Sdk;
using Plugins.Extensions;
using Plugins.Localization;
using Plugins.Resx;
using Plugins.Services;
using VolunteerManagement.Definitions;

namespace Plugins.Strategies
{
	public class EngagementOpportunityOnPostUpdateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly ILocalizationHelper<Labels> localizationHelper;
		private readonly IEngagementOpportunityScheduleService scheduleService;

		public EngagementOpportunityOnPostUpdateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			ILocalizationHelper<Labels> localizationHelper,
			IEngagementOpportunityScheduleService scheduleService)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.localizationHelper = localizationHelper;
			this.scheduleService = scheduleService;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Engagement Opportunity On Update Plugin");
			if (!context.InputParameters.TryGetValue("Target", out var targetObj) || targetObj as Entity == default
				|| !context.PreEntityImages.TryGetValue("Target", out var preImage)
				|| !context.PostEntityImages.TryGetValue("Target", out var postImage))
			{
				tracingService.Trace($"InputParameters=[{string.Join(",", context.InputParameters.Keys)}]; PreImages=[{string.Join(",", context.PreEntityImages.Keys)}]; PostImages=[{string.Join(", ", context.PostEntityImages.Keys)}]");

				throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l => l.Plugins_Common_IncorrectlyRegisteredException, nameof(EngagementOpportunityOnPostUpdateStrategy)));
			}

			var target = targetObj as Entity;

			var shiftsEnabledChanged = target.HasValueChanged<bool>(EngagementOpportunityDef.Shifts, out var shiftsEnabled, preImage, out var hadShiftsEnabled);
			tracingService.Trace($"HasShiftsChanged={shiftsEnabledChanged}; HasShifts={shiftsEnabled}; HadShifts={hadShiftsEnabled};");

			if (shiftsEnabled)
			{
				// "No Shifts" -> "Shifts"
				if (shiftsEnabledChanged)
				{
					this.scheduleService.DeactivateDefaultShifts(target.ToEntityReference(), skipRecalculation: false);
				}
			}
			else
			{
				var relatedShifts = this.scheduleService.RetrieveRelatedShifts(target.ToEntityReference());
				var defaultShift = this.scheduleService.CreateOrUpdateDefaultShift(relatedShifts, postImage);
				this.scheduleService.DeactivateShifts(
					relatedShifts,
					skipRecalculation: true,
					excludeShifts: defaultShift.ToEntityReference()
				);
				this.scheduleService.RecalculateMinMaxForEngOpportunity(postImage);
			}
		}
	}
}