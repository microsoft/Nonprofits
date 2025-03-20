using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_qualificationstage",
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Pre-Update Qualification Stage",
		1,
		IsolationModeEnum.Sandbox, Image1Attributes = "msnfp_stagestatus",
		Image1Type = ImageTypeEnum.PreImage,
		Image1Name = "Image")]
	public class QualificationStageOnPreUpdate : BasePlugin
	{
		public QualificationStageOnPreUpdate() 
		{
			RegisterPluginStrategy<QualificationStageOnPreUpdateStrategy>();
		}
	}
}