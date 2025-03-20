using Plugins.Services;
using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_engagementopportunity",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_maximum,msnfp_minimum,msnfp_shifts,msnfp_startingdate,msnfp_endingdate",
		"Post-Update Engagement Opportunity",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_endingdate,msnfp_engagementopportunitytitle,msnfp_maximum,msnfp_minimum,msnfp_shifts,msnfp_startingdate",
		Image1Type = ImageTypeEnum.Both,
		Image1Name = "Target")]
	public class EngagementOpportunityOnPostUpdate : BasePlugin
	{
		public EngagementOpportunityOnPostUpdate() 
		{
			RegisterPluginStrategy<EngagementOpportunityOnPostUpdateStrategy>();
			RegisterService<IEngagementOpportunityScheduleService, EngagementOpportunityScheduleService>();
		}
	}
}