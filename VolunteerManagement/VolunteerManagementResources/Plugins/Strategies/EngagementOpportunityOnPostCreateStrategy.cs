using Microsoft.Xrm.Sdk;

namespace Plugins.Strategies
{
	public class EngagementOpportunityOnPostCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;

		public EngagementOpportunityOnPostCreateStrategy(ITracingService tracingService, IPluginExecutionContext context, IOrganizationServiceProvider serviceProvider)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.serviceProvider = serviceProvider;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Engagement Opportunity On Create Plugin");
			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				Entity target = (Entity)context.InputParameters["Target"];

				bool shifts = target.GetAttributeValue<bool>("msnfp_shifts");
				if (!shifts)
				{
					var service = this.serviceProvider.CreateCurrentUserOrganizationService();
					Utilities.CreateDefaultEngOppSchedule(service, target.ToEntityReference(), target);
					tracingService.Trace("Created Default Engagement Opportunity Schedule");
				}
			}
		}
	}
}