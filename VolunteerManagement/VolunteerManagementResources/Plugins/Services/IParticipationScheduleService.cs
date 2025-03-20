using Microsoft.Xrm.Sdk;

namespace Plugins.Services
{
	public interface IParticipationScheduleService
	{
		void ValidateApprovalStatus(Entity participationSchedule);
	}
}