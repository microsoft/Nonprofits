using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"msnfp_engagementopportunity",
		StageEnum.PostOperation,
		ExecutionModeEnum.Asynchronous,
		"msnfp_engagementopportunitystatus,msnfp_engagementopportunitytitle,msnfp_description,msnfp_shortdescription,msnfp_startingdate,msnfp_endingdate,msnfp_maximum,msnfp_minimum,msnfp_publicaddress,msnfp_street1,msnfp_street2,msnfp_street3,msnfp_publiccity,msnfp_city,msnfp_stateprovince,msnfp_zippostalcode,msnfp_country,msnfp_url,msnfp_virtualengagementurl,msnfp_number,msnfp_location,msnfp_locationtype,msnfp_shifts,msnfp_multipledays",
		"Post-Update Public Publish Engagement Opportunity",
		2,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_engagementopportunitystatus",
		Image1Type = ImageTypeEnum.Both,
		Image1Name = "engagementopportunityimage")]
	public class EngagementOpportunityOnPostPublicPublish : BasePlugin
	{
		public EngagementOpportunityOnPostPublicPublish() 
		{
			RegisterPluginStrategy<EngagementOpportunityOnPostPublicPublishStrategy>();
		}
	}
}
