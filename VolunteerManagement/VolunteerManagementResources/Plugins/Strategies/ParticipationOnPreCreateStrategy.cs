using Microsoft.Xrm.Sdk.Query;
using Microsoft.Xrm.Sdk;
using Plugins.Extensions;
using Plugins.Resx;
using Plugins.Localization;

namespace Plugins.Strategies
{
	public class ParticipationOnPreCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		IPluginExecutionContext context;

		IOrganizationServiceProvider serviceProvider;
		ILocalizationHelper<Labels> localizationHelper;

		public ParticipationOnPreCreateStrategy(
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
			this.tracingService.Trace("Beginning Participation Pre-Create Plugin");
			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				Entity target = (Entity)context.InputParameters["Target"];
				var contactRef = target.GetAttributeValue<EntityReference>("msnfp_contactid");
				if (contactRef == null)
				{
					throw new InvalidPluginExecutionException(OperationStatus.Failed, this.localizationHelper.GetLocalizedMessage(l => l.Participation_Contact_RequiredException));
				}

				var service = this.serviceProvider.CreateCurrentUserOrganizationService();
				Entity contact = service.Retrieve("contact", contactRef.Id, new ColumnSet("fullname", "statecode"));
				ContactStatus contactStatus = (ContactStatus)contact.GetAttributeValue<OptionSetValue>("statecode").Value;
				string contactFullName = contact.GetAttributeValue<string>("fullname");

				if (contactStatus == ContactStatus.InActive)
				{
					throw new InvalidPluginExecutionException(OperationStatus.Failed, this.localizationHelper.GetLocalizedMessage(l => l.Contact_DeactivatedException, contact.Id));
				}

				if (target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid") != null)
				{
					Entity eo = service.Retrieve("msnfp_engagementopportunity",
						target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid").Id,
						new ColumnSet("msnfp_automaticallyapproveallapplicants", "msnfp_engagementopportunitytitle", "msnfp_engagementopportunitystatus")
						);
					if (eo.GetAttributeValue<OptionSetValue>("msnfp_engagementopportunitystatus") != null)
					{
						var engagementOpportunityStatus = (EngagementOpportunityStatus)eo.GetAttributeValue<OptionSetValue>("msnfp_engagementopportunitystatus").Value;
						if (engagementOpportunityStatus == EngagementOpportunityStatus.Closed || engagementOpportunityStatus == EngagementOpportunityStatus.Cancelled)
						{
							throw new InvalidPluginExecutionException(OperationStatus.Failed, this.localizationHelper.GetLocalizedMessage(l => l.Participation_EngagementOpportunity_CanceledException));
						}
					}

					target["msnfp_participationtitle"] = $"{contactFullName} - {eo.GetAttributeValue<string>("msnfp_engagementopportunitytitle")}";

					if (this.context.IsPortalOriginated() && target.Contains("msnfp_status"))
					{
						// Portal users can't choose the initial status; it's set below based on the engagement opportunity settings.
						this.tracingService.Trace("Ignoring participation status supplied by a portal request.");
						target.Attributes.Remove("msnfp_status");
					}

					bool approve = eo.GetAttributeValue<bool>("msnfp_automaticallyapproveallapplicants");
					OptionSetValue status = target.GetAttributeValue<OptionSetValue>("msnfp_status");
					if (status != null)
					{
						if (approve && status.Value != (int)ParticipationStatus.Cancelled && status.Value != (int)ParticipationStatus.Dismissed)
						{
							target["msnfp_status"] = new OptionSetValue((int)ParticipationStatus.Approved);
						}
					}
					else
					{
						target["msnfp_status"] = (approve) ? new OptionSetValue((int)ParticipationStatus.Approved) :
										 new OptionSetValue((int)ParticipationStatus.NeedsReview);
					}
				}
				else
				{
					throw new InvalidPluginExecutionException(OperationStatus.Failed, this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_RequiredException));
				}
			}
		}
	}
}
