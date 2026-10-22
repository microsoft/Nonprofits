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

		/// <summary>
		/// Throws when the shift is inactive.
		/// </summary>
		void ValidateShiftIsActive(EntityReference shiftRef);

		/// <summary>
		/// Throws when a participation schedule created from the portal has a status other than Pending or Cancelled.
		/// </summary>
		void ValidatePortalScheduleStatusOnCreate(Entity participationSchedule);

		/// <summary>
		/// Allows portal updates only from Pending to Cancelled, and from Cancelled to Pending while the participation
		/// is approved and the shift is active. The participation and the shift can't be changed.
		/// </summary>
		void ValidatePortalScheduleUpdate(Entity target, Entity preImage);
	}
}