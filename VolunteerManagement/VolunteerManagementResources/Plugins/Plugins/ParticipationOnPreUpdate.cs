using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_participation",
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_status",
		"Pre-Update Participation",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_status,msnfp_contactid,msnfp_engagementopportunityid",
		Image1Type = ImageTypeEnum.PreImage,
		Image1Name = ParticipationOnPreUpdateStrategy.PreImageName)]
	public class ParticipationOnPreUpdate : BasePlugin
	{
		public ParticipationOnPreUpdate()
		{
			RegisterPluginStrategy<ParticipationOnPreUpdateStrategy>();
		}
	}
}
