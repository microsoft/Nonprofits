using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_engagementopportunitypreference",
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Pre-Create Engagement Opportunity Preference",
		1,
		IsolationModeEnum.Sandbox)]
	public class EngagementOpportunityPreferenceOnPreCreate : BasePlugin
	{

		public EngagementOpportunityPreferenceOnPreCreate() 
		{
			RegisterPluginStrategy<EngagementOpportunityPreferenceOnPreCreateStrategy>();
		}
	}
}