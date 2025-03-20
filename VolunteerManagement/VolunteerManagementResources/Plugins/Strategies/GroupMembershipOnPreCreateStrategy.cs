using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Plugins.Strategies
{
	public class GroupMembershipOnPreCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;

		public GroupMembershipOnPreCreateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IOrganizationServiceProvider serviceProvider)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.serviceProvider = serviceProvider;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Group Membership Pre-Create Plugin");

			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];
				var service = this.serviceProvider.CreateCurrentUserOrganizationService();
				var contact = service.Retrieve("contact", target.GetAttributeValue<EntityReference>("msnfp_contactid").Id, new ColumnSet("fullname"));
				var group = service.Retrieve("msnfp_group", target.GetAttributeValue<EntityReference>("msnfp_groupid").Id, new ColumnSet("msnfp_groupname"));
				var name = $"{contact.GetAttributeValue<string>("fullname")} - {group.GetAttributeValue<string>("msnfp_groupname")}";
				if (target.GetAttributeValue<string>("msnfp_groupmembershipname") == null) target["msnfp_groupmembershipname"] = name;
			}
		}
	}
}