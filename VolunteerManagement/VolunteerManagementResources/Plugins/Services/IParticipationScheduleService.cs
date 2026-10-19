using System;
using Microsoft.Xrm.Sdk;

namespace Plugins.Services
{
	public interface IParticipationScheduleService
	{
		void ValidateApprovalStatus(Entity participationSchedule);

		/// <summary>
		/// Throws when the shift belongs to a different engagement opportunity than the participation.
		/// </summary>
		void ValidateShiftBelongsToParticipation(EntityReference participationRef, EntityReference shiftRef);

		/// <summary>
		/// Throws when the shift has no free place for another active (Pending or Completed) participation schedule.
		/// </summary>
		/// <param name="shiftRef">The engagement opportunity schedule (shift).</param>
		/// <param name="excludeParticipationScheduleId">A participation schedule that must not be counted (the record being validated).</param>
		void ValidateShiftCapacity(EntityReference shiftRef, Guid? excludeParticipationScheduleId = null);
	}
}