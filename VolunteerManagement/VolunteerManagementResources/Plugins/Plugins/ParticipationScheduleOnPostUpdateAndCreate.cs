using Plugins.Services;
using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_participationschedule",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_engagementopportunityscheduleid,msnfp_schedulestatus",
		"Post-Update Participation Schedule",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_engagementopportunityscheduleid,msnfp_schedulestatus",
		Image1Type = ImageTypeEnum.PreImage,
		Image1Name = ParticipationScheduleOnPostUpdateAndCreateStrategy.PreImageName)]
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_participationschedule",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Post-Create Participation Schedule",
		1,
		IsolationModeEnum.Sandbox)]
	public class ParticipationScheduleOnPostUpdateAndCreate : BasePlugin
	{
		public ParticipationScheduleOnPostUpdateAndCreate() 
		{
			RegisterPluginStrategy<ParticipationScheduleOnPostUpdateAndCreateStrategy>();
			RegisterService<IParticipationScheduleService, ParticipationScheduleService>();
		}
	}
}