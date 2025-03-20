using Plugins.Services;
using Plugins.Strategies;
using VolunteerManagement.Definitions;

namespace Plugins
{

	[CrmPluginRegistration(MessageNameEnum.Create,
		EngagementOpportunityScheduleDef.EntityName,
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_effectivefrom,msnfp_effectiveto,msnfp_minimum,msnfp_maximum,msnfp_engagementopportunity,msnfp_shiftname",
		"Pre-Create Engagement Opportuntiy Schedule",
		1, IsolationModeEnum.Sandbox)]
	[CrmPluginRegistration(MessageNameEnum.Update,
		EngagementOpportunityScheduleDef.EntityName,
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_effectivefrom,msnfp_effectiveto,msnfp_minimum,msnfp_maximum,msnfp_engagementopportunity,msnfp_shiftname",
		"Pre-Update Engagement Opportuntiy Schedule",
		1, IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_effectiveto,msnfp_engagementopportunity,msnfp_maximum,msnfp_minimum,msnfp_shiftname,msnfp_effectivefrom",
		Image1Type = ImageTypeEnum.PreImage,
		Image1Name = "schedule")]
	public class EngagementOpportunityScheduleOnPreCreateUpdate : BasePlugin
	{
		public EngagementOpportunityScheduleOnPreCreateUpdate() 
		{
			RegisterPluginStrategy<EngagementOpportunityScheduleOnPreCreateUpdateStrategy>();
			RegisterService<IEngagementOpportunityScheduleService, EngagementOpportunityScheduleService>();
		}
	}
}