using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Plugins.Strategies
{
	public class GroupMembershipOnPreDeleteStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;

		public GroupMembershipOnPreDeleteStrategy(
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
			tracingService.Trace("Beginning Group Membership Pre-Delete Plugin");

			if (context.PreEntityImages != null && context.PreEntityImages.Contains("PreImage"))
			{
				var preImage = context.PreEntityImages["PreImage"];
				var groupMemberContactId = preImage.GetAttributeValue<EntityReference>("msnfp_contactid");
				var groupMemberGroupId = preImage.GetAttributeValue<EntityReference>("msnfp_groupid");
				if (groupMemberContactId.Id != null && groupMemberGroupId.Id != null)
				{
					var fetch = new FetchExpression(@"<fetch>
                            <entity name='msnfp_participation'>
                               <filter>
                                  <condition attribute='msnfp_contactid' operator='eq'  value='{" + groupMemberContactId.Id + @"}' />
                                  <condition attribute='msnfp_volunteergroupid' operator='eq' value='{" + groupMemberGroupId.Id + @"}' />
                               </filter>
                            </entity>
                            </fetch>
                            ");
					var service = this.serviceProvider.CreateCurrentUserOrganizationService();
					var participants = service.RetrieveMultiple(fetch);
					foreach (var entity in participants.Entities)
					{
						var updateEntity = new Entity(entity.LogicalName, entity.Id);
						updateEntity["msnfp_volunteergroupid"] = null;
						service.Update(updateEntity);
					}
				}
			}
		}
	}
}