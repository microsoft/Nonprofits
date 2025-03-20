using Plugins.Services;
using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_qualificationstage",
		StageEnum.PostOperation,
		ExecutionModeEnum.Asynchronous,
		"",
		"Post-Update Qualification Stage",
		1,
		IsolationModeEnum.Sandbox, Image1Attributes = "msnfp_stagestatus,msnfp_qualificationid,msnfp_plannedlengthdays",
		Image1Type = ImageTypeEnum.Both,
		Image1Name = "Image")]
	public class QualificationStageOnPostUpdate : BasePlugin
	{
		public QualificationStageOnPostUpdate() 
		{
			RegisterPluginStrategy<QualificationStageOnPostUpdateStrategy>();
			RegisterService<IQualificationService, QualificationService>();
		}
	}
}