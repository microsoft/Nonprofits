using Plugins.Services;
using Plugins.Strategies;
using VolunteerManagement.Definitions;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		ParticipationScheduleDef.EntityName,
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_schedulestatus,msnfp_participationid,msnfp_engagementopportunityscheduleid",
		"Pre-Update Participation Schedule",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_schedulestatus,msnfp_participationid,msnfp_engagementopportunityscheduleid",
		Image1Type = ImageTypeEnum.PreImage,
		Image1Name = ParticipationScheduleOnPreUpdateStrategy.PreImageName)]
	public class ParticipationScheduleOnPreUpdate : BasePlugin
	{
		public ParticipationScheduleOnPreUpdate()
		{
			RegisterPluginStrategy<ParticipationScheduleOnPreUpdateStrategy>();
			RegisterService<IParticipationScheduleService, ParticipationScheduleService>();
		}
	}
}
