using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Delete,
		"msnfp_groupmembership",
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Pre-Delete Group Membership",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_contactid,msnfp_groupid",
		Image1Type = ImageTypeEnum.PreImage,
		Image1Name = "PreImage")]
	public class GroupMembershipOnPreDelete : BasePlugin
	{
		public GroupMembershipOnPreDelete() 
		{
			RegisterPluginStrategy<GroupMembershipOnPreDeleteStrategy>();
		}
	}
}