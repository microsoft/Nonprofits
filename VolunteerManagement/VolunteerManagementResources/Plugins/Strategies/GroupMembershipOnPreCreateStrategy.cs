using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;

namespace Plugins.Strategies
{
	public class GroupMembershipOnPreCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public GroupMembershipOnPreCreateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IOrganizationServiceProvider serviceProvider,
			ILocalizationHelper<Labels> localizationHelper)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.serviceProvider = serviceProvider;
			this.localizationHelper = localizationHelper;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Group Membership Pre-Create Plugin");

			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];
				var contactRef = target.GetAttributeValue<EntityReference>("msnfp_contactid");
				var groupRef = target.GetAttributeValue<EntityReference>("msnfp_groupid");
				if (contactRef == null || groupRef == null)
				{
					throw new InvalidPluginExecutionException(OperationStatus.Failed, this.localizationHelper.GetLocalizedMessage(l => l.GroupMembership_ContactAndGroup_RequiredException));
				}

				var service = this.serviceProvider.CreateCurrentUserOrganizationService();
				var contact = service.Retrieve("contact", contactRef.Id, new ColumnSet("fullname"));
				var group = service.Retrieve("msnfp_group", groupRef.Id, new ColumnSet("msnfp_groupname"));
				var name = $"{contact.GetAttributeValue<string>("fullname")} - {group.GetAttributeValue<string>("msnfp_groupname")}";
				if (target.GetAttributeValue<string>("msnfp_groupmembershipname") == null) target["msnfp_groupmembershipname"] = name;
			}
		}
	}
}