using Plugins.Strategies;
using VolunteerManagement.Definitions;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		EngagementOpportunityDef.EntityName,
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"msnfp_multipledays,msnfp_startingdate,msnfp_endingdate",
		"Pre-Update Engagement Opportunity",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_endingdate,msnfp_multipledays,msnfp_startingdate",
		Image1Type = ImageTypeEnum.PreImage,
		Image1Name = "Target")]
	public class EngagementOpportunityOnPreUpdate : BasePlugin
	{
		public EngagementOpportunityOnPreUpdate() 
		{
			RegisterPluginStrategy<EngagementOpportunityOnPreUpdateStrategy>();
		}
	}
}