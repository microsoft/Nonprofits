using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Extensions;
using Plugins.Localization;
using Plugins.Resx;
using VolunteerManagement.Definitions;

namespace Plugins.Services
{
	public class EngagementOpportunityScheduleService : IEngagementOpportunityScheduleService
	{
		private readonly IOrganizationService orgService;
		private readonly ITracingService tracingService;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public EngagementOpportunityScheduleService(IOrganizationService orgService, ITracingService tracingService, ILocalizationHelper<Labels> localizationHelper)
		{
			this.orgService = orgService;
			this.tracingService = tracingService;
			this.localizationHelper = localizationHelper;
		}

		public string GetPrimaryName(Entity entity, Entity preImage = null)
		{
			try
			{
				var oppRef = entity.GetAttribute<EntityReference>(preImage, EngagementOpportunityScheduleDef.EngagementOpportunity);
				var oppName = string.Empty;

				if (oppRef != null)
				{
					if (!string.IsNullOrEmpty(oppRef?.Name))
					{
						oppName = oppRef.Name;
					}
					else
					{
						var opportunity = orgService.Retrieve(oppRef.LogicalName, oppRef.Id, new ColumnSet(EngagementOpportunityDef.PrimaryName));
						oppName = opportunity.GetAttribute<string>(EngagementOpportunityDef.PrimaryName);
					}
				}

				var shiftName = entity.GetAttribute<string>(preImage, EngagementOpportunityScheduleDef.ShiftName);
				return $"{shiftName} - {oppName}";
			}
			catch (System.Exception)
			{
				return "No name";
			}
		}

		public decimal GetDefaultScheduleHours()
		{
			return 0.0M;
		}

		public void ValidateStartAndEndDate(Entity target)
		{
			DateTime? effectiveFrom = target.GetAttributeValue<DateTime?>(EngagementOpportunityScheduleDef.StartDate);
			DateTime? effectiveTo = target.GetAttributeValue<DateTime?>(EngagementOpportunityScheduleDef.EndDate);

			if (effectiveFrom == null && effectiveTo != null)
			{
				throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l=>l.EngagementOpportunity_Schedule_StartDateNotSpecifiedException));
			}

			if ((effectiveTo != null) &&
				(effectiveFrom > effectiveTo))
			{
				throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_Schedule_InvalidStartDateException));
			}
		}

		public void ValidateMinMaxParticipantsOnRecordCreation(Entity target)
		{
			int? minParticipants = target.GetAttributeValue<int?>(EngagementOpportunityScheduleDef.MinofParticipants);
			int? maxParticipants = target.GetAttributeValue<int?>(EngagementOpportunityScheduleDef.MaxofParticipants);
			ValidateOrUpdateMinMaxParticipants(target, minParticipants, maxParticipants);
		}

		public void ValidateMinMaxParticipantsOnRecordUpdate(Entity target, Entity schedulePreImage)
		{
			// When we get an update request, it may happen that user has just changed one of the
			// two fields (Minimum or Maximum). The field which is not changed will appear as null
			// in this request. We will have to compare it with pre image to figure out the change
			// relationship of this trigger.
			int? minParticipants = target.Contains(EngagementOpportunityScheduleDef.MinofParticipants) ?
				target.GetAttributeValue<int?>(EngagementOpportunityScheduleDef.MinofParticipants) :
				schedulePreImage.GetAttributeValue<int?>(EngagementOpportunityScheduleDef.MinofParticipants);
			int? maxParticipants = target.Contains(EngagementOpportunityScheduleDef.MaxofParticipants) ?
				target.GetAttributeValue<int?>(EngagementOpportunityScheduleDef.MaxofParticipants) :
				schedulePreImage.GetAttributeValue<int?>(EngagementOpportunityScheduleDef.MaxofParticipants);
			ValidateOrUpdateMinMaxParticipants(target, minParticipants, maxParticipants);
		}

		public void ValidateScheduleIsInDateRangeOnRecordUpdate(Entity scheduleTarget, Entity schedulePreImage)
		{
			DateTime? effectiveFrom = scheduleTarget.GetAttributeValue<DateTime?>(EngagementOpportunityScheduleDef.StartDate) ?? schedulePreImage.GetAttributeValue<DateTime?>(EngagementOpportunityScheduleDef.StartDate);
			DateTime? effectiveTo = scheduleTarget.GetAttributeValue<DateTime?>(EngagementOpportunityScheduleDef.EndDate) ?? schedulePreImage.GetAttributeValue<DateTime?>(EngagementOpportunityScheduleDef.EndDate);
			Guid engagementId = schedulePreImage.GetAttributeValue<EntityReference>(EngagementOpportunityScheduleDef.EngagementOpportunity).Id;
			ValidateScheduleIsInDateRange(effectiveFrom, effectiveTo, engagementId);
		}

		public void ValidateScheduleIsInDateRangeOnRecordCreate(Entity target)
		{
			DateTime? effectiveFrom = target.GetAttributeValue<DateTime?>(EngagementOpportunityScheduleDef.StartDate);
			DateTime? effectiveTo = target.GetAttributeValue<DateTime?>(EngagementOpportunityScheduleDef.EndDate);

			Guid engagementId = target.GetAttributeValue<EntityReference>(EngagementOpportunityScheduleDef.EngagementOpportunity).Id;
			ValidateScheduleIsInDateRange(effectiveFrom, effectiveTo, engagementId);
		}

		private void ValidateScheduleIsInDateRange(DateTime? startDate, DateTime? endDate, Guid engagementOpportunityId)
		{
			if (startDate == default || engagementOpportunityId == default)
			{
				tracingService?.Trace($"Cannot validate schedule because of invalid StartDate ({startDate}) or EO ({engagementOpportunityId})");
				return;
			}

			var eo = orgService.Retrieve(
				EngagementOpportunityDef.EntityName,
				engagementOpportunityId,
				new ColumnSet(
					EngagementOpportunityDef.StartingDate,
					EngagementOpportunityDef.EndingDate
				)
			);

			var eoStartDate = eo.GetAttributeValue<DateTime?>(EngagementOpportunityDef.StartingDate);
			var eoEndDate = eo.GetAttributeValue<DateTime?>(EngagementOpportunityDef.EndingDate);
			if (!eoStartDate.HasValue)
			{
				tracingService?.Trace($"Cannot validate schedule because the related EO ({engagementOpportunityId}) doesn't have StartDate ({eoStartDate})");
				return;
			}

			var isStartDateInRange = Utilities.IsDateTimeInRange(startDate.Value, eoStartDate.Value, eoEndDate, tracingService);
			var isEndDateInRange = (!endDate.HasValue || Utilities.IsDateTimeInRange(endDate.Value, eoStartDate.Value, eoEndDate, tracingService));
			if (!isStartDateInRange || !isEndDateInRange)
			{
				throw new InvalidPluginExecutionException(
					this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_Schedule_OutOfRangeException)
				);
			}
		}

		private void ValidateOrUpdateMinMaxParticipants(Entity target, int? minParticipants, int? maxParticipants)
		{
			if (minParticipants == null && maxParticipants == null)
			{
				minParticipants = maxParticipants = 0;
			}
			else if (minParticipants != null && maxParticipants == null)
			{
				maxParticipants = minParticipants;
			}
			else if (minParticipants == null && maxParticipants != null)
			{
				throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunitySchedule_Participants_NotSpecifiedException));
			}

			if (minParticipants > maxParticipants)
			{
				throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunitySchedule_Participants_MinimumException));
			}

			target[EngagementOpportunityScheduleDef.MinofParticipants] = minParticipants;
			target[EngagementOpportunityScheduleDef.MaxofParticipants] = maxParticipants;
		}

		public void RecalculateMinMaxForEngOpportunity(EntityReference engagementOpportunity)
		{
			tracingService.Trace($"Starting {nameof(RecalculateMinMaxForEngOpportunity)}(EntityReference)");
			engagementOpportunity.AssertEntityParameter(EngagementOpportunityDef.EntityName, nameof(engagementOpportunity));

			tracingService.Trace($"Retrieving Engagement Opportunity ({engagementOpportunity.Id})");
			Entity eo = orgService.Retrieve(
				engagementOpportunity.LogicalName,
				engagementOpportunity.Id,
				new ColumnSet(
					EngagementOpportunityDef.Minimum,
					EngagementOpportunityDef.Maximum,
					EngagementOpportunityDef.Shifts
				)
			);
			tracingService.Trace($"Retrieved Engagement Opportunity ({engagementOpportunity.Id}): [{string.Join(", ", eo.Attributes.Select(a => $"{a.Key}={a.Value}"))}]");

			RecalculateMinMaxForEngOpportunity(eo);

			tracingService.Trace($"Ending {nameof(RecalculateMinMaxForEngOpportunity)}(EntityReference)");
		}

		public void RecalculateMinMaxForEngOpportunity(Entity engagementOpportunity)
		{
			tracingService.Trace($"Starting {nameof(RecalculateMinMaxForEngOpportunity)} (Entity)");
			engagementOpportunity.AssertEntityParameter(EngagementOpportunityDef.EntityName, nameof(engagementOpportunity));
			engagementOpportunity.AssertEntityAttributes(new[] { EngagementOpportunityDef.Shifts }, nameof(engagementOpportunity));

			var hasShifts = engagementOpportunity.GetAttributeValue<bool>(EngagementOpportunityDef.Shifts);
			if (!hasShifts)
			{
				tracingService.Trace("Engagement Opportunity doesn't use Shifts");
				tracingService.Trace($"Ending {nameof(RecalculateMinMaxForEngOpportunity)}(Entity)");
				return;
			}

			var query = new FetchExpression($@"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' aggregate='true' >
                    <entity name='{EngagementOpportunityScheduleDef.EntityName}' >
                        <attribute name='{EngagementOpportunityScheduleDef.MinofParticipants}' aggregate='sum' alias='{EngagementOpportunityScheduleDef.MinofParticipants}' />
                        <attribute name='{EngagementOpportunityScheduleDef.MaxofParticipants}' aggregate='sum' alias='{EngagementOpportunityScheduleDef.MaxofParticipants}' />
                        <filter>
                            <condition attribute='msnfp_engagementopportunity' operator='eq' value='{engagementOpportunity.Id}' />
                            <condition attribute='statecode' operator='eq' value='{(int)EngagementOpportunityScheduleStatus.Active}' />
                        </filter>
                    </entity>
                </fetch>");

			tracingService.Trace($"Aggregating Related Shifts for EngagementOpportunityId={engagementOpportunity?.Id}. FetchXml: {query.Query}");
			var shiftSummary = orgService.RetrieveMultiple(query).Entities.FirstOrDefault();
			tracingService.Trace($"Retrieved Aggregated values");

			shiftSummary.NormalizeAliasedValues(tracingService);

			var totalMin = shiftSummary.GetAttributeValue<int>(EngagementOpportunityScheduleDef.MinofParticipants);
			var totalMax = shiftSummary.GetAttributeValue<int>(EngagementOpportunityScheduleDef.MaxofParticipants);

			var eoMinimum = engagementOpportunity.GetAttributeValue<int?>(EngagementOpportunityDef.Minimum);
			var eoMaximum = engagementOpportunity.GetAttributeValue<int?>(EngagementOpportunityDef.Maximum);

			if (eoMinimum != totalMin || eoMaximum != totalMax)
			{
				tracingService.Trace($"Updating Engagement Opportunity ({engagementOpportunity.Id}) Min={totalMin}, Max={totalMax}");
				var updateRequest = new UpdateRequest()
				{
					Target = new Entity(engagementOpportunity.LogicalName, engagementOpportunity.Id)
					{
						Attributes = {
							{ EngagementOpportunityDef.Minimum, totalMin },
							{ EngagementOpportunityDef.Maximum, totalMax }
						}
					}
				};
				//updateRequest.Parameters.Add("BypassCustomPluginExecution", true);

				orgService.Execute(updateRequest);
				tracingService.Trace($"Update of Engagement Opportunity ({engagementOpportunity.Id}) is done");
			}
			else
			{
				tracingService.Trace("No change to min and max.");
			}

			tracingService.Trace($"Ending {nameof(RecalculateMinMaxForEngOpportunity)}(Entity)");
		}

		public void CancelChildParticipationSchedules(EntityReference schedule)
		{
			tracingService.Trace($"Starting {nameof(CancelChildParticipationSchedules)}");
			schedule.AssertEntityParameter(EngagementOpportunityScheduleDef.EntityName, nameof(schedule));

			var query = new QueryExpression(ParticipationScheduleDef.EntityName)
			{
				NoLock = true,
				ColumnSet = new ColumnSet(ParticipationScheduleDef.ScheduleStatus),
				Criteria = {
					Conditions = {
						new ConditionExpression(ParticipationScheduleDef.EngagementOpportunitySchedule, ConditionOperator.Equal, schedule.Id),
						new ConditionExpression(ParticipationScheduleDef.ScheduleStatus, ConditionOperator.NotEqual, (int)ParticipationScheduleStatus.Cancelled),
					}
				}
			};
			var participationSchedules = orgService.RetrieveMultiple(query).Entities;
			tracingService.Trace($"Retrieved {participationSchedules.Count} Participation Schedules");

			foreach (Entity participationschedule in participationSchedules)
			{
				var participationScheduleStatus = participationschedule.GetAttributeValue<OptionSetValue>(ParticipationScheduleDef.ScheduleStatus);
				tracingService.Trace($"Canceling participation schedule ({participationschedule.Id}) with schedule status {participationScheduleStatus?.Value}");

				orgService.Update(new Entity(participationschedule.LogicalName, participationschedule.Id)
				{
					Attributes = {
						{ ParticipationScheduleDef.ScheduleStatus, new OptionSetValue((int)ParticipationScheduleStatus.Cancelled) }
					}
				});

				tracingService.Trace($"Participation schedule ({participationschedule.Id}) is canceled now");
			}

			tracingService.Trace($"Ending {nameof(CancelChildParticipationSchedules)}");
		}

		public IEnumerable<Entity> RetrieveRelatedShifts(EntityReference parentEngagementOpportunity)
		{
			tracingService.Trace($"Starting {nameof(RetrieveRelatedShifts)}");
			parentEngagementOpportunity.AssertEntityParameter(EngagementOpportunityDef.EntityName, nameof(parentEngagementOpportunity));

			var query = new FetchExpression($@"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false' aggregate='true' >
                    <entity name='{EngagementOpportunityScheduleDef.EntityName}' >
                        <attribute name='{EngagementOpportunityScheduleDef.PrimaryKey}' groupby='true' alias='{EngagementOpportunityScheduleDef.PrimaryKey}' />                        
                        <attribute name='{EngagementOpportunityScheduleDef.PrimaryName}' groupby='true' alias='{EngagementOpportunityScheduleDef.PrimaryName}' />
                        <attribute name='{EngagementOpportunityScheduleDef.ShiftName}' groupby='true' alias='{EngagementOpportunityScheduleDef.ShiftName}' />
                        <attribute name='{EngagementOpportunityScheduleDef.Status}' groupby='true' alias='{EngagementOpportunityScheduleDef.Status}' />
                        <attribute name='{EngagementOpportunityScheduleDef.StatusReason}' groupby='true' alias='{EngagementOpportunityScheduleDef.StatusReason}' />
                        <attribute name='{EngagementOpportunityScheduleDef.StartDate}' aggregate='max' alias='{EngagementOpportunityScheduleDef.StartDate}' />
                        <attribute name='{EngagementOpportunityScheduleDef.MinofParticipants}' groupby='true' alias='{EngagementOpportunityScheduleDef.MinofParticipants}' />
                        <attribute name='{EngagementOpportunityScheduleDef.MaxofParticipants}' groupby='true' alias='{EngagementOpportunityScheduleDef.MaxofParticipants}' />
                        <attribute name='{EngagementOpportunityScheduleDef.CreatedOn}' aggregate='max' alias='{EngagementOpportunityScheduleDef.CreatedOn}' />
                        <filter>
                          <condition attribute='msnfp_engagementopportunity' operator='eq' value='{parentEngagementOpportunity.Id}' />
                        </filter>
                        <link-entity name='{ParticipationScheduleDef.EntityName}' 
                            from='{EngagementOpportunityScheduleDef.PrimaryKey}' 
                            to='{ParticipationScheduleDef.EngagementOpportunitySchedule}' 
                            link-type='outer' 
                            alias='p' 
                        >
                            <attribute name='{ParticipationScheduleDef.PrimaryKey}' alias='participationSchedulesCount' aggregate='countcolumn' />
                        </link-entity>
                    </entity>
                </fetch>");

			tracingService.Trace($"Retrieving Related Shifts for EngagementOpportunityId={parentEngagementOpportunity?.Id}. FetchXml: {query.Query}");
			var relatedShifts = orgService.RetrieveMultiple(query).Entities;
			tracingService.Trace($"Retrieved Related Shifts: {relatedShifts.Count}");

			tracingService.Trace($"Normalizing records (AliasedValues) due to FetchXml aggregation");
			foreach (var record in relatedShifts)
			{
				record.NormalizeAliasedValues(tracingService);
			}
			tracingService.Trace($"Normalization of records (AliasedValues) is done");

			tracingService.Trace($"Ending {nameof(RetrieveRelatedShifts)}");
			return relatedShifts;
		}

		public Entity CreateOrUpdateDefaultShift(IEnumerable<Entity> relatedShifts, Entity engagementOpportunity)
		{
			tracingService.Trace($"Starting {nameof(CreateOrUpdateDefaultShift)}");

			if (relatedShifts == default) throw new ArgumentNullException(nameof(relatedShifts));
			engagementOpportunity.AssertEntityParameter(EngagementOpportunityDef.EntityName, nameof(engagementOpportunity));
			engagementOpportunity.AssertEntityAttributes(
				new[] {
					EngagementOpportunityDef.StartingDate,
					EngagementOpportunityDef.EndingDate
				},
				nameof(engagementOpportunity)
			);

			var existingDefaultShift = (from rs in relatedShifts
										where rs.GetAttributeValue<string>(EngagementOpportunityScheduleDef.ShiftName) == Utilities.DefaultShiftName
											&& (rs.GetAttributeValue<int?>("participationSchedulesCount") ?? 0) == 0
										orderby rs.GetAttributeValue<DateTime>(EngagementOpportunityScheduleDef.CreatedOn) descending
										select rs).FirstOrDefault();

			tracingService.Trace($"Existing default shift: {existingDefaultShift}");
			if (existingDefaultShift != default)
			{
				var updatedDefaultShift = new Entity(existingDefaultShift.LogicalName, existingDefaultShift.Id);

				var isActive = (existingDefaultShift.GetAttributeValue<OptionSetValue>(EngagementOpportunityScheduleDef.Status).Value == (int)EngagementOpportunityScheduleStatus.Active);
				if (!isActive)
				{
					updatedDefaultShift[EngagementOpportunityScheduleDef.Status] = new OptionSetValue((int)EngagementOpportunityScheduleStatus.Active);
					updatedDefaultShift[EngagementOpportunityScheduleDef.StatusReason] = new OptionSetValue((int)EngagementOpportunityScheduleStatusReason.Active);
				}

				var minimumChanged = engagementOpportunity.HasValueChanged<int?>(EngagementOpportunityDef.Minimum, out int? minimum, existingDefaultShift);
				tracingService.Trace($"HasMinimumChanged={minimumChanged}; Minimum={minimum};");
				if (minimumChanged)
				{
					updatedDefaultShift[EngagementOpportunityScheduleDef.MinofParticipants] = minimum;
				}

				var maximumChanged = engagementOpportunity.HasValueChanged<int?>(EngagementOpportunityDef.Maximum, out int? maximum, existingDefaultShift);
				tracingService.Trace($"HasMaximumChanged={maximumChanged}; Maximum={maximum};");
				if (maximumChanged)
				{
					updatedDefaultShift[EngagementOpportunityScheduleDef.MaxofParticipants] = maximum;
				}

				var startingDateChanged = engagementOpportunity.HasValueChanged<DateTime?>(EngagementOpportunityDef.StartingDate, out DateTime? startingDate, existingDefaultShift);
				tracingService.Trace($"HasStartingDateChanged={startingDateChanged}; StartingDate={startingDate};");
				if (startingDateChanged)
				{
					updatedDefaultShift[EngagementOpportunityScheduleDef.StartDate] = startingDate;
				}

				var endingDateChanged = engagementOpportunity.HasValueChanged<DateTime?>(EngagementOpportunityDef.EndingDate, out DateTime? endingDate, existingDefaultShift);
				tracingService.Trace($"HasEndingDateChanged={endingDateChanged}; EndingDate={endingDate};");
				if (endingDateChanged)
				{
					updatedDefaultShift[EngagementOpportunityScheduleDef.EndDate] = endingDate;
				}

				if (updatedDefaultShift.Attributes.Count > 0)
				{
					tracingService.Trace($"Updating default shift ({updatedDefaultShift.Id})");
					orgService.Update(updatedDefaultShift);
					tracingService.Trace($"Default shift ({updatedDefaultShift.Id}) updated");
				}

				return existingDefaultShift;
			}

			tracingService.Trace($"Creating new default shift");
			var newDefaultShift = Utilities.CreateDefaultEngOppSchedule(orgService, engagementOpportunity.ToEntityReference(), engagementOpportunity);
			tracingService.Trace($"New default shift created ({newDefaultShift.Id})");

			tracingService.Trace($"Ending {nameof(CreateOrUpdateDefaultShift)}");
			return newDefaultShift;
		}

		public void DeactivateShifts(IEnumerable<Entity> relatedShifts, bool skipRecalculation = true, params EntityReference[] excludeShifts)
		{
			tracingService.Trace($"Starting {nameof(DeactivateShifts)}");

			if (relatedShifts == default) throw new ArgumentNullException(nameof(relatedShifts));
			if (relatedShifts.Count() == 0)
			{
				tracingService.Trace($"Ending {nameof(DeactivateShifts)}");
				return;
			}

			var excludeShiftIds = excludeShifts?.Select(s => s.Id).ToArray() ?? new Guid[0];
			tracingService.Trace($"Following shifts will NOT be deactivated: [{string.Join(",", excludeShifts?.Select(s => s.ToString()))}]");

			foreach (var shift in relatedShifts)
			{
				if (shift.LogicalName != EngagementOpportunityScheduleDef.EntityName)
				{
					throw new ArgumentException(this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_Shifts_IncorrectTypeException, shift.Id, shift.LogicalName));
				}

				var isActive = shift.GetAttributeValue<OptionSetValue>(EngagementOpportunityScheduleDef.Status)?.Value == (int)EngagementOpportunityScheduleStatus.Active;
				if (excludeShiftIds.Contains(shift.Id) || !isActive) { continue; }

				tracingService.Trace($"Deactivating Engagement Opportunity Schedule ({shift.Id})");
				var updateRequest = new UpdateRequest()
				{
					Target = new Entity(shift.LogicalName, shift.Id)
					{
						Attributes =
						{
							{ EngagementOpportunityScheduleDef.Status, new OptionSetValue((int)EngagementOpportunityScheduleStatus.InActive) },
							{ EngagementOpportunityScheduleDef.StatusReason, new OptionSetValue((int)EngagementOpportunityScheduleStatusReason.InActive) }
						}
					}
				};
				if (skipRecalculation)
				{
					updateRequest["tag"] = Utilities.TagSkipEosSchedule;
				}

				orgService.Execute(updateRequest);
				tracingService.Trace($"Engagement Opportunity Schedule ({shift.Id}) deactivated");
			}

			tracingService.Trace($"Ending {nameof(DeactivateShifts)}");
		}

		public void DeactivateDefaultShifts(EntityReference parentEngagementOpportunity, bool skipRecalculation = false)
		{
			tracingService.Trace($"Starting {nameof(DeactivateDefaultShifts)}");
			parentEngagementOpportunity.AssertEntityParameter(EngagementOpportunityDef.EntityName, nameof(parentEngagementOpportunity));

			var query = new QueryExpression(EngagementOpportunityScheduleDef.EntityName)
			{
				NoLock = true,
				ColumnSet = new ColumnSet(false),
				Criteria =
				{
					Conditions =
					{
						new ConditionExpression(EngagementOpportunityScheduleDef.EngagementOpportunity, ConditionOperator.Equal, parentEngagementOpportunity.Id),
						new ConditionExpression(EngagementOpportunityScheduleDef.Status, ConditionOperator.Equal, (int)EngagementOpportunityScheduleStatus.Active),
						new ConditionExpression(EngagementOpportunityScheduleDef.ShiftName, ConditionOperator.Equal, Utilities.DefaultShiftName),
					}
				}
			};

			tracingService.Trace($"Retrieving Active Default Shifts for EngagementOpportunityId={parentEngagementOpportunity?.Id}");
			var defaultShifts = orgService.RetrieveMultiple(query).Entities;
			tracingService.Trace($"Retrieved Active Default Shifts: {defaultShifts.Count}");

			foreach (var shift in defaultShifts)
			{
				tracingService.Trace($"Deactivating default shift {shift.Id}");

				var updateRequest = new UpdateRequest()
				{
					Target = new Entity(shift.LogicalName, shift.Id)
					{
						Attributes =
						{
							{ EngagementOpportunityScheduleDef.Status, new OptionSetValue((int)EngagementOpportunityScheduleStatus.InActive) },
							{ EngagementOpportunityScheduleDef.StatusReason, new OptionSetValue((int)EngagementOpportunityScheduleStatusReason.InActive) },
						}
					},
				};
				if (skipRecalculation)
				{
					updateRequest["tag"] = Utilities.TagSkipEosSchedule;
				}

				orgService.Execute(updateRequest);
				tracingService.Trace($"Default shift {shift.Id} is inactive now");
			}

			tracingService.Trace($"Ending {nameof(DeactivateDefaultShifts)}");
		}
	}
}