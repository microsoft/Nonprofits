using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Extensions;
using Plugins.Localization;
using Plugins.Resx;
using VolunteerManagement.Definitions;

namespace Plugins.Strategies
{
	public class EngagementOpportunityOnPreUpdateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public EngagementOpportunityOnPreUpdateStrategy(
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
			tracingService.Trace($"Beginning {nameof(EngagementOpportunityOnPreUpdate)}");

			if (!context.InputParameters.TryGetValue("Target", out object targetObj) || (targetObj as Entity) == default
				|| !context.PreEntityImages.TryGetValue("Target", out Entity preImage))
			{
				tracingService.Trace($"InputParameters=[{string.Join(",", context.InputParameters.Keys)}]; PreImages=[{string.Join(",", context.PreEntityImages.Keys)}]");
				throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l => l.Plugins_Common_IncorrectlyRegisteredException, nameof(EngagementOpportunityOnPreUpdateStrategy)));
			}

			var target = targetObj as Entity;
			var shiftsEnabledChanged = target.HasValueChanged<bool>(EngagementOpportunityDef.Shifts, out bool shiftsEnabled);
			var hasStartDateChanged = target.HasValueChanged(EngagementOpportunityDef.StartingDate, out DateTime startingDate, preImage, out DateTime prevStartingDate);
			var hasEndingDateChanged = target.HasValueChanged(EngagementOpportunityDef.EndingDate, out DateTime? endingDate, preImage, out DateTime? prevEndingDate);

			tracingService.Trace($"Start Date (Current={startingDate}; Previous={prevStartingDate})");
			tracingService.Trace($"End Date (Current={endingDate}; Previous={prevEndingDate})");

			if (shiftsEnabledChanged && !shiftsEnabled)
			{
				tracingService.Trace($"Engagement Opportunity disables Shifts. Skipping validation of dates.");
				return;
			}
			var service = this.serviceProvider.CreateCurrentUserOrganizationService();
			var invalidShifts = GetInvalidShifts(service, target.Id, startingDate, endingDate.Value, tracingService);
			if (invalidShifts.Count() == 0) return;

			var invalidShiftNames = string.Join(
				", ",
				invalidShifts.Select(e => e.GetAttributeValue<string>(EngagementOpportunityScheduleDef.ShiftName))
			);
			var isOnlyOneInvalidShift = (invalidShifts.Count() == 1);
			var messageInvalid = isOnlyOneInvalidShift ? this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_InvalidShiftMessage) : this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_InvalidShiftsMessage);
			var message = $"{messageInvalid}{(isOnlyOneInvalidShift ? "" : $"({invalidShifts.Count()}) ")} {this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_InvalidShifts_SelectedDateMessage, invalidShiftNames)}";
			throw new InvalidPluginExecutionException(message);
		}

		private static IEnumerable<Entity> GetInvalidShifts(
			IOrganizationService service, Guid eoId, DateTime eoStart, DateTime eoEnd, ITracingService tracingService
		)
		{
			tracingService.Trace($"{nameof(GetInvalidShifts)}(eOid={eoId}; eoStart={eoStart}; eoEnd={eoEnd}; )");
			var queryShifts = new QueryExpression(EngagementOpportunityScheduleDef.EntityName)
			{
				NoLock = true,
				ColumnSet = new ColumnSet(
					EngagementOpportunityScheduleDef.ShiftName,
					EngagementOpportunityScheduleDef.StartDate,
					EngagementOpportunityScheduleDef.EndDate
				),
				Criteria =
				{
					Conditions =
					{
						new ConditionExpression(
							EngagementOpportunityScheduleDef.EngagementOpportunity,
							ConditionOperator.Equal,
							eoId
						),
						new ConditionExpression(
							EngagementOpportunityScheduleDef.Status,
							ConditionOperator.Equal,
							(int)EngagementOpportunityScheduleStatus.Active
						),
						new ConditionExpression(
							EngagementOpportunityScheduleDef.ShiftName,
							ConditionOperator.NotEqual,
							Utilities.DefaultShiftName
						)
					}
				}
			};
			var shifts = service.RetrieveMultiple(queryShifts);
			tracingService.Trace($"Found {shifts.Entities.Count} related active shifts which are not Default shifts");

			var invalidShifts = new List<Entity>();
			foreach (var shift in shifts.Entities)
			{
				var start = shift.GetAttribute<DateTime>(EngagementOpportunityScheduleDef.StartDate);
				var end = shift.GetAttribute<DateTime?>(EngagementOpportunityScheduleDef.EndDate);
				var shiftName = shift.GetAttribute<string>(EngagementOpportunityScheduleDef.ShiftName);
				tracingService.Trace($"[{shiftName}] Comparing EO Start ({eoStart}) and EO End ({eoEnd}) with Shift Start ({start}) and End ({end})");

				var isStartInEoRange = Utilities.IsDateTimeInRange(start, eoStart, eoEnd, tracingService);
				var isEndInEoRange = !end.HasValue || Utilities.IsDateTimeInRange(end.Value, eoStart, eoEnd, tracingService);
				if (!isStartInEoRange || !isEndInEoRange)
				{
					tracingService.Trace($"[{shiftName}] Shift is invalid (isStartInEoRange={isStartInEoRange}; isEndInEoRange={isEndInEoRange})");
					invalidShifts.Add(shift);
				}
				else
				{
					tracingService.Trace($"[{shiftName}] Shift is valid (isStartInEoRange={isStartInEoRange}; isEndInEoRange={isEndInEoRange})");
				}
			}

			tracingService.Trace($"Total impacted shifts: {invalidShifts.Count}");
			return invalidShifts;
		}
	}
}