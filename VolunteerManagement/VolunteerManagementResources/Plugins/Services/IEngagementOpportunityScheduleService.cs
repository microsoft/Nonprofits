using System.Collections.Generic;
using Microsoft.Xrm.Sdk;

namespace Plugins.Services
{
	public interface IEngagementOpportunityScheduleService
	{
		void DeactivateShifts(IEnumerable<Entity> relatedShifts, bool skipRecalculation = true, params EntityReference[] excludeShifts);

		void DeactivateDefaultShifts(EntityReference parentEngagementOpportunity, bool skipRecalculation = false);

		Entity CreateOrUpdateDefaultShift(IEnumerable<Entity> relatedShifts, Entity engagementOpportunity);

		IEnumerable<Entity> RetrieveRelatedShifts(EntityReference parentEngagementOpportunity);

		void RecalculateMinMaxForEngOpportunity(Entity engagementOpportunity);

		void RecalculateMinMaxForEngOpportunity(EntityReference engagementOpportunity);

		void CancelChildParticipationSchedules(EntityReference schedule);

		void ValidateScheduleIsInDateRangeOnRecordCreate(Entity target);

		void ValidateMinMaxParticipantsOnRecordUpdate(Entity target, Entity schedulePreImage);

		void ValidateMinMaxParticipantsOnRecordCreation(Entity target);

		void ValidateStartAndEndDate(Entity target);

		string GetPrimaryName(Entity entity, Entity preImage = null);

		void ValidateScheduleIsInDateRangeOnRecordUpdate(Entity scheduleTarget, Entity schedulePreImage);

		decimal GetDefaultScheduleHours();
	}
}