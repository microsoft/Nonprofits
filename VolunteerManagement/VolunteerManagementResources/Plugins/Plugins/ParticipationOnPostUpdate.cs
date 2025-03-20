using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_participation",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_status,msnfp_hours",
		"Post-Update Participation",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_status,msnfp_hours,msnfp_contactid",
		Image1Type = ImageTypeEnum.Both,
		Image1Name = "Image")]
	public class ParticipationOnPostUpdate : BasePlugin
	{
		
		public ParticipationOnPostUpdate() 
		{
			RegisterPluginStrategy<ParticipationOnPostUpdateStrategy>();
		}
	}
}