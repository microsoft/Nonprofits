using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_participation",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Post-Create Participation",
		1,
		IsolationModeEnum.Sandbox)]
	public class ParticipationOnPostCreate : BasePlugin
	{
		public ParticipationOnPostCreate()
		{
			RegisterPluginStrategy<ParticipationOnPostCreateStrategy>();
		}
	}
}