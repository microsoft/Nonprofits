using Plugins.Services;
using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_qualification",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Post-Create Qualification",
		1,
		IsolationModeEnum.Sandbox)]
	public class QualificationOnPostCreate : BasePlugin
	{
		public QualificationOnPostCreate() 
		{
			RegisterPluginStrategy<QualificationOnPostCreateStrategy>();
			RegisterService<IQualificationService, QualificationService>();
		}
	}
}