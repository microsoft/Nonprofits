using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Extensions;
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

		public void ValidateShiftBelongsToParticipation(EntityReference participationRef, EntityReference shiftRef)
		{
			if (participationRef == null || shiftRef == null)
			{
				return;
			}

			var participationOpportunity = orgService.Retrieve(ParticipationDef.EntityName, participationRef.Id,
				new ColumnSet(ParticipationDef.EngagementOpportunity)).GetAttributeValue<EntityReference>(ParticipationDef.EngagementOpportunity);
			var shiftOpportunity = orgService.Retrieve(EngagementOpportunityScheduleDef.EntityName, shiftRef.Id,
				new ColumnSet(EngagementOpportunityScheduleDef.EngagementOpportunity)).GetAttributeValue<EntityReference>(EngagementOpportunityScheduleDef.EngagementOpportunity);
			if (participationOpportunity != null && shiftOpportunity != null && participationOpportunity.Id != shiftOpportunity.Id)
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed,
					this.localizationHelper.GetLocalizedMessage(l => l.ParticipationSchedule_ShiftNotInEngagementOpportunityException));
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

		public void ValidateShiftIsActive(EntityReference shiftRef)
		{
			if (shiftRef == null)
			{
				return;
			}

			var shift = orgService.Retrieve(EngagementOpportunityScheduleDef.EntityName, shiftRef.Id,
				new ColumnSet(EngagementOpportunityScheduleDef.Status));
			if (shift.GetAttributeValue<OptionSetValue>(EngagementOpportunityScheduleDef.Status)?.Value != (int)EngagementOpportunityScheduleStatus.Active)
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed,
					this.localizationHelper.GetLocalizedMessage(l => l.ParticipationSchedule_ShiftNotActiveException));
			}
		}

		public void ValidatePortalScheduleStatusOnCreate(Entity participationSchedule)
		{
			var status = participationSchedule.GetAttributeValue<OptionSetValue>(ParticipationScheduleDef.ScheduleStatus)?.Value;
			if (status != null
				&& status != (int)ParticipationScheduleStatus.Pending
				&& status != (int)ParticipationScheduleStatus.Cancelled)
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed,
					this.localizationHelper.GetLocalizedMessage(l => l.ParticipationSchedule_StatusChangeNotAllowedException));
			}
		}

		public void ValidatePortalScheduleUpdate(Entity target, Entity preImage)
		{
			if (target.IsLookupChanged(preImage, ParticipationScheduleDef.Participation)
				|| target.IsLookupChanged(preImage, ParticipationScheduleDef.EngagementOpportunitySchedule))
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed,
					this.localizationHelper.GetLocalizedMessage(l => l.ParticipationSchedule_ReassignmentNotAllowedException));
			}

			if (!target.Contains(ParticipationScheduleDef.ScheduleStatus))
			{
				return;
			}

			var newStatus = target.GetAttributeValue<OptionSetValue>(ParticipationScheduleDef.ScheduleStatus)?.Value;
			var oldStatus = preImage?.GetAttributeValue<OptionSetValue>(ParticipationScheduleDef.ScheduleStatus)?.Value;

			if (newStatus == oldStatus)
			{
				return;
			}

			if (oldStatus == (int)ParticipationScheduleStatus.Pending && newStatus == (int)ParticipationScheduleStatus.Cancelled)
			{
				return;
			}

			if (oldStatus == (int)ParticipationScheduleStatus.Cancelled && newStatus == (int)ParticipationScheduleStatus.Pending)
			{
				// Booking the shift again: same rules as a new booking. Capacity is checked by the post-update step.
				ValidateApprovalStatus(preImage);
				ValidateShiftIsActive(preImage.GetAttributeValue<EntityReference>(ParticipationScheduleDef.EngagementOpportunitySchedule));
				return;
			}

			throw new InvalidPluginExecutionException(OperationStatus.Failed,
				this.localizationHelper.GetLocalizedMessage(l => l.ParticipationSchedule_StatusChangeNotAllowedException));
		}
	}
}