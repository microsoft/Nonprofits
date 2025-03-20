using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_engagementopportunity",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Post-Create Engagement Opportunity",
		1,
		IsolationModeEnum.Sandbox)]
	public class EngagementOpportunityOnPostCreate : BasePlugin
	{
		public EngagementOpportunityOnPostCreate() 
		{
			RegisterPluginStrategy<EngagementOpportunityOnPostCreateStrategy>();
		}
	}
}