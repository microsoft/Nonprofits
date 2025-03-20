using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_engagementopportunity",
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"PreCreate Engagement Opportunity",
		1,
		IsolationModeEnum.Sandbox)]
	public class EngagementOpportunityOnPreCreate : BasePlugin
	{
		public EngagementOpportunityOnPreCreate() 
		{
			RegisterPluginStrategy<EngagementOpportunityOnPreCreateStrategy>();
		}
	}
}