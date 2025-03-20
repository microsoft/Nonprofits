using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System.Collections.Generic;

namespace Plugins.Strategies
{
	public class EngagementOpportunityOnPostPublicPublishStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;

		public EngagementOpportunityOnPostPublicPublishStrategy(ITracingService tracingService, IPluginExecutionContext context, IOrganizationServiceProvider serviceProvider)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.serviceProvider = serviceProvider;
		}

		public void Run()
		{
			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
			{
				var target = (Entity)context.InputParameters["Target"];

				var preImage = context.PreEntityImages["engagementopportunityimage"];
				var postImage = context.PostEntityImages["engagementopportunityimage"];

				var preStatus = preImage.GetAttributeValue<OptionSetValue>("msnfp_engagementopportunitystatus");
				var postStatus = postImage.GetAttributeValue<OptionSetValue>("msnfp_engagementopportunitystatus");
				var publicEOStatuses = new HashSet<EngagementOpportunityStatus> { EngagementOpportunityStatus.PublishToWeb, EngagementOpportunityStatus.Closed, EngagementOpportunityStatus.Cancelled };
				var service = this.serviceProvider.CreateCurrentUserOrganizationService();
				if (postStatus != null && publicEOStatuses.Any(status => (int)status == postStatus.Value))
				{
					var publicEO = Utilities.QueryByAttributeExt(service, "msnfp_publicengagementopportunity", "msnfp_engagementopportunityid", target.Id, new ColumnSet("msnfp_engagementopportunityid"));
					if (publicEO.TotalRecordCount > 0)
					{
						Utilities.CreatePublicEOFromEO(service, target.Id, publicEO.Entities.First().Id);
					}
					else
					{
						Utilities.CreatePublicEOFromEO(service, target.Id);
					}
				}
				else if (preStatus != null && publicEOStatuses.Any(status => (int)status == preStatus.Value) && postStatus != null && publicEOStatuses.Any(status => (int)status != postStatus.Value))
				{
					tracingService.Trace("Status Changed from Publish to Web");
					var publicEO = Utilities.QueryByAttributeExt(service, "msnfp_publicengagementopportunity", "msnfp_engagementopportunityid", target.Id, new ColumnSet("msnfp_engagementopportunityid"));
					if (publicEO.TotalRecordCount > 0)
					{
						publicEO.Entities.ToList().ForEach(e => service.Delete("msnfp_publicengagementopportunity", e.Id));
					}
				}

			}
		}
	}
}