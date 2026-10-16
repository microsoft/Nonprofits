using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;
using VolunteerManagement.Definitions;

namespace Plugins.Services
{
	public class ParticipationScheduleService : IParticipationScheduleService
	{
		private readonly IOrganizationService orgService;
		ILocalizationHelper<Labels> localizationHelper;

		public ParticipationScheduleService(IOrganizationService orgService, ILocalizationHelper<Labels> localizationHelper)
		{
			this.orgService = orgService;
			this.localizationHelper = localizationHelper;
		}

		public void ValidateApprovalStatus(Entity participationSchedule)
		{
			Entity participation = orgService.Retrieve(ParticipationDef.EntityName,
				participationSchedule.GetAttributeValue<EntityReference>(ParticipationDef.PrimaryKey).Id,
				new ColumnSet(ParticipationDef.ParticipationStatus));
			if (participation.GetAttributeValue<OptionSetValue>(ParticipationDef.ParticipationStatus).Value
				!= (int)ParticipationStatus.Approved)
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed,
					this.localizationHelper.GetLocalizedMessage(l => l.Participation_NotApprovedException));
			}
		}

		public void ValidateShiftCapacity(EntityReference shiftRef, Guid? excludeParticipationScheduleId = null)
		{
			if (shiftRef == null)
			{
				return;
			}

			var shift = orgService.Retrieve(EngagementOpportunityScheduleDef.EntityName, shiftRef.Id,
				new ColumnSet(EngagementOpportunityScheduleDef.MaxofParticipants, EngagementOpportunityScheduleDef.Number));
			var maximum = shift.GetAttributeValue<int?>(EngagementOpportunityScheduleDef.MaxofParticipants);
			if (!maximum.HasValue || maximum.Value <= 0)
			{
				return;
			}

			// Writing to the shift inside the plug-in transaction takes a row lock, so concurrent sign-ups for the
			// same shift are serialized and each one counts the others. msnfp_number is not a filtering attribute
			// of any shift step, and the post-operation recount sets its final value.
			var lockUpdate = new Entity(EngagementOpportunityScheduleDef.EntityName, shiftRef.Id);
			lockUpdate[EngagementOpportunityScheduleDef.Number] = shift.GetAttributeValue<int?>(EngagementOpportunityScheduleDef.Number) ?? 0;
			orgService.Update(lockUpdate);

			var query = new QueryExpression(ParticipationScheduleDef.EntityName)
			{
				ColumnSet = new ColumnSet(false),
				Criteria =
				{
					Conditions =
					{
						new ConditionExpression(ParticipationScheduleDef.EngagementOpportunitySchedule, ConditionOperator.Equal, shiftRef.Id),
						new ConditionExpression(ParticipationScheduleDef.Status, ConditionOperator.Equal, (int)ParticipationScheduleDef.Status_OptionSet.Active),
						new ConditionExpression(ParticipationScheduleDef.ScheduleStatus, ConditionOperator.In,
							(int)ParticipationScheduleStatus.Pending, (int)ParticipationScheduleStatus.Completed)
					}
				}
			};
			if (excludeParticipationScheduleId.HasValue)
			{
				query.Criteria.AddCondition(ParticipationScheduleDef.PrimaryKey, ConditionOperator.NotEqual, excludeParticipationScheduleId.Value);
			}

			var booked = Utilities.RetrieveAll(orgService, query).Count;
			if (booked >= maximum.Value)
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed,
					this.localizationHelper.GetLocalizedMessage(l => l.ParticipationSchedule_ShiftFullException));
			}
		}
	}
}