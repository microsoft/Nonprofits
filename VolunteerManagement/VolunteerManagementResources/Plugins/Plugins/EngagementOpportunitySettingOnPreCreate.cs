using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_engagementopportunitysetting",
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Pre-Create Engagement Opportunity Setting",
		1,
		IsolationModeEnum.Sandbox)]
	public class EngagementOpportunitySettingOnPreCreate : BasePlugin
	{
		public EngagementOpportunitySettingOnPreCreate() 
		{
			RegisterPluginStrategy<EngagementOpportunitySettingOnPreCreateStrategy>();
		}
	}
}