using Microsoft.Xrm.Sdk;

namespace Plugins.Strategies
{
	public class ContactPostUpdateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;

		public ContactPostUpdateStrategy(ITracingService tracingService, IPluginExecutionContext context, IOrganizationServiceProvider serviceProvider)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.serviceProvider = serviceProvider;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Contact Post Update Plugin");
			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
			{
				Entity preImage = context.PreEntityImages["contact"];
				Entity postImage = context.PostEntityImages["contact"];
				ContactStatus oldStatus = (ContactStatus)preImage.GetAttributeValue<OptionSetValue>("statecode").Value;
				ContactStatus newStatus = (ContactStatus)postImage.GetAttributeValue<OptionSetValue>("statecode").Value;
				if (oldStatus == ContactStatus.Active && newStatus == ContactStatus.InActive)
				{
					var service = this.serviceProvider.CreateCurrentUserOrganizationService();
					Utilities.CancelAllPendingParticipations(service, preImage.Id);
					// CancelAllPendingParticipations will update the msnfp_particpation table. Another plugin ParticipationOnPostUpdate
					// listens to the updates on this table. ParticipationOnPostUpdate will mark all pending and in review shift participations
					// to cancelled.
				}
			}

			tracingService.Trace("Ending Contact Post Update Plugin");
		}
	}
}