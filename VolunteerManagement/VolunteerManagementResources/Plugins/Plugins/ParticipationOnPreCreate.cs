using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_participation",
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Pre-Create Participation",
		1,
		IsolationModeEnum.Sandbox)]
	public class ParticipationOnPreCreate : BasePlugin
	{
		public ParticipationOnPreCreate()
		{
			RegisterPluginStrategy<ParticipationOnPreCreateStrategy>();
		}
	}
}