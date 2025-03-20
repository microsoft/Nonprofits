using Plugins.Services;
using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_engagementopportunityschedule",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_minimum,msnfp_maximum,statecode",
		"Post-Update Engagement Opportuntiy Schedule",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_engagementopportunity,msnfp_maximum,msnfp_minimum,statecode",
		Image1Type = ImageTypeEnum.Both,
		Image1Name = "Target")]
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_engagementopportunityschedule",
		StageEnum.PostOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Post-Create Engagement Opportuntiy Schedule",
		1,
		IsolationModeEnum.Sandbox)]
	public class EngagementOpportunityScheduleOnPostUpdateAndCreate : BasePlugin
	{
		public EngagementOpportunityScheduleOnPostUpdateAndCreate() 
		{
			RegisterPluginStrategy<EngagementOpportunityScheduleOnPostUpdateAndCreateStrategy>();
			RegisterService<IEngagementOpportunityScheduleService, EngagementOpportunityScheduleService>();
		}
	}
}