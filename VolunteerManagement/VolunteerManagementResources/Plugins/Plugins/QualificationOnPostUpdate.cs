using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_qualification",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_qualificationstatus",
		"Post-Update Qualification",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_qualificationid,msnfp_qualificationstatus,msnfp_typeid",
		Image1Name = "Image",
		Image1Type = ImageTypeEnum.PostImage)]
	public class QualificationOnPostUpdate : BasePlugin
	{
		public QualificationOnPostUpdate() 
		{
			RegisterPluginStrategy<QualificationOnPostUpdateStrategy>();
		}
	}
}