using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_engagementopportunityparticipantqual",
		StageEnum.PreOperation, ExecutionModeEnum.Synchronous,
		"",
		"Pre-Create Engagement Opportunity Participant Qualification",
		1,
		IsolationModeEnum.Sandbox)]
	public class EngagementOpportunityQualificationOnPreCreate : BasePlugin
	{
		public EngagementOpportunityQualificationOnPreCreate() 
		{
			RegisterPluginStrategy<EngagementOpportunityQualificationOnPreCreateStrategy>();
		}
	}
}