using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_participationschedule",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_schedulestatus",
		"Post-Update Participation Schedule",
		1,
		IsolationModeEnum.Sandbox)]
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
		}
	}
}