using Microsoft.Xrm.Sdk;
using Plugins.Extensions;
using Plugins.Localization;
using Plugins.Resx;
using Plugins.Services;
using VolunteerManagement.Definitions;

namespace Plugins.Strategies
{
	public class EngagementOpportunityScheduleOnPostUpdateAndCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;
		private readonly IEngagementOpportunityScheduleService entityService;

		public EngagementOpportunityScheduleOnPostUpdateAndCreateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IOrganizationServiceProvider serviceProvider,
			ILocalizationHelper<Labels> localizationHelper,
			IEngagementOpportunityScheduleService entityService)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.serviceProvider = serviceProvider;
			this.localizationHelper = localizationHelper;
			this.entityService = entityService;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Engagement Opportunity Preference On Update Plugin");
			
			if (!context.InputParameters.TryGetValue("Target", out var targetObj) || targetObj as Entity == default)
			{
				tracingService.Trace($"InputParameters=[{string.Join(",", context.InputParameters.Keys)}]; PreImages=[{string.Join(",", context.PreEntityImages.Keys)}]; PostImages=[{string.Join(", ", context.PostEntityImages.Keys)}]");
				throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l => l.Plugins_Common_IncorrectlyRegisteredException, nameof(EngagementOpportunityScheduleOnPostUpdateAndCreateStrategy)));
			}

			var target = targetObj as Entity;
			var preImage = context.PreEntityImages.Count == 0 ? default : context.PreEntityImages["Target"];
			var postImage = context.PostEntityImages.Count == 0 ? target : context.PreEntityImages["Target"];

			if (context.MessageName == "Create")
			{
				var updateEntity = new Entity(target.LogicalName, target.Id);
				updateEntity[EngagementOpportunityScheduleDef.Number] = target.GetAttributeValue<int?>(EngagementOpportunityScheduleDef.Number) ?? 0;

				tracingService.Trace($"Updating Engagement Opportunity Schedule ({target.Id})[{EngagementOpportunityScheduleDef.Number}]={updateEntity[EngagementOpportunityScheduleDef.Number]}");
				var service = this.serviceProvider.CreateCurrentUserOrganizationService();
				service.Update(updateEntity);
				tracingService.Trace($"Updated Engagement Opportunity Schedule ({target.Id})[{EngagementOpportunityScheduleDef.Number}]");
			}

			#region Cancel Participant Schedules if InActive
			var stateCodeChanged = target.HasValueChanged<OptionSetValue>(EngagementOpportunityScheduleDef.Status, out var stateCode, preImage, out var prevStateCode);
			tracingService.Trace($"StateCodeChanged={stateCodeChanged}; StateCode={stateCode}; PreviousStateCode={prevStateCode?.Value};");

			if (stateCodeChanged && stateCode?.Value == (int)EngagementOpportunityScheduleStatus.InActive)
			{
				entityService.CancelChildParticipationSchedules(target.ToEntityReference());
			}
			#endregion Cancel Participant Schedules if InActive

			#region Recalculate Min and Max on Engagement Opportunity
			var skipRecalculation = false;
			if (context.SharedVariables.TryGetValue("tag", out var requestTag) && Utilities.TagSkipEosSchedule.Equals(requestTag))
			{
				skipRecalculation = true;
				tracingService.Trace($"Skipping recalculation due to Tag ({Utilities.TagSkipEosSchedule}) in request");
			}

			if (!skipRecalculation)
			{
				var engagementOpportunity = postImage.GetAttributeValue<EntityReference>(EngagementOpportunityScheduleDef.EngagementOpportunity);

				var minOfParticipantsChanged = target.HasValueChanged<int?>(EngagementOpportunityScheduleDef.MinofParticipants, out var minOfParticipants, preImage, out var prevMinOfParticipants);
				tracingService.Trace($"HasMinOfParticipantsChanged={minOfParticipantsChanged}; MinOfParticipants={minOfParticipants}; PreviousMinOfParticipants={prevMinOfParticipants};");

				var maxOfParticipantsChanged = target.HasValueChanged<int?>(EngagementOpportunityScheduleDef.MaxofParticipants, out var maxOfParticipants, preImage, out var prevMaxOfParticipants);
				tracingService.Trace($"HasMaxOfParticipantsChanged={maxOfParticipantsChanged}; MaxOfParticipants={maxOfParticipants}; PreviousMaxOfParticipants={prevMaxOfParticipants};");

				if (engagementOpportunity != default && (minOfParticipantsChanged || maxOfParticipantsChanged || stateCodeChanged))
				{
					entityService.RecalculateMinMaxForEngOpportunity(engagementOpportunity);
				}
			}
			#endregion Recalculate Min and Max on Engagement Opportunity

		}

	}
}