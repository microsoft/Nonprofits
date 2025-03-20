using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_groupmembership", StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Pre-Create Group Membership",
		1,
		IsolationModeEnum.Sandbox)]
	public class GroupMembershipOnPreCreate : BasePlugin
	{
		public GroupMembershipOnPreCreate() 
		{
			RegisterPluginStrategy<GroupMembershipOnPreCreateStrategy>();
		}
	}
}