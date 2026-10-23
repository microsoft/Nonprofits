using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Extensions;
using Plugins.Localization;
using Plugins.Resx;

namespace Plugins.Strategies
{
	/// <summary>
	/// Portal requests can only withdraw a participation or apply again after withdrawing, and can't move it to another
	/// volunteer or engagement opportunity.
	/// A cancelled participation set back to Needs Review is a new application by the same volunteer
	/// (the alternate key allows only one participation per contact and engagement opportunity).
	/// Applies the same rules as a new application: ParticipationOnPreCreate and the MaxParticipantsCheck workflow.
	/// ParticipationOnPostUpdate then does what ParticipationOnPostCreate does.
	/// </summary>
	public class ParticipationOnPreUpdateStrategy : IPluginStrategy
	{
		public const string PreImageName = "PreImage";
		public const string ReappliedSharedVariable = "msnfp_ParticipationReappliedAfterCancel";

		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public ParticipationOnPreUpdateStrategy(
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
			if (!context.InputParameters.TryGetValue("Target", out var targetObject) || !(targetObject is Entity target))
			{
				return;
			}

			context.PreEntityImages.TryGetValue(PreImageName, out var preImage);

			// Only requests sent directly from the portal are restricted; staff users and updates made by other plugins or workflows are not.
			if (context.IsTopLevelRequest() && context.IsPortalOriginated())
			{
				ValidatePortalUpdate(target, preImage);
			}

			if (preImage == null)
			{
				return;
			}

			var previousStatus = preImage.GetAttributeValue<OptionSetValue>("msnfp_status")?.Value;
			var requestedStatus = target.GetAttributeValue<OptionSetValue>("msnfp_status")?.Value;
			if (previousStatus != (int)ParticipationStatus.Cancelled || requestedStatus != (int)ParticipationStatus.NeedsReview)
			{
				return;
			}

			tracingService.Trace("Cancelled participation set back to Needs Review: applying the rules for a new application");
			var service = serviceProvider.CreateCurrentUserOrganizationService();

			var contactRef = target.GetAttributeValue<EntityReference>("msnfp_contactid") ?? preImage.GetAttributeValue<EntityReference>("msnfp_contactid");
			if (contactRef != null)
			{
				var contact = service.Retrieve("contact", contactRef.Id, new ColumnSet("statecode"));
				if (contact.GetAttributeValue<OptionSetValue>("statecode")?.Value == (int)ContactStatus.InActive)
				{
					throw new InvalidPluginExecutionException(OperationStatus.Failed, localizationHelper.GetLocalizedMessage(l => l.Contact_DeactivatedException, contact.Id));
				}
			}

			var opportunityRef = target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid") ?? preImage.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid");
			if (opportunityRef == null)
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed, localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_RequiredException));
			}

			var opportunity = service.Retrieve("msnfp_engagementopportunity", opportunityRef.Id,
				new ColumnSet("msnfp_engagementopportunitystatus", "msnfp_automaticallyapproveallapplicants", "msnfp_number", "msnfp_maximum"));

			var opportunityStatus = opportunity.GetAttributeValue<OptionSetValue>("msnfp_engagementopportunitystatus")?.Value;
			if (opportunityStatus == (int)EngagementOpportunityStatus.Closed || opportunityStatus == (int)EngagementOpportunityStatus.Cancelled)
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed, localizationHelper.GetLocalizedMessage(l => l.Participation_EngagementOpportunity_CanceledException));
			}

			var approvedVolunteers = opportunity.GetAttributeValue<int?>("msnfp_number");
			var maximum = opportunity.GetAttributeValue<int?>("msnfp_maximum");
			if (approvedVolunteers.HasValue && maximum.HasValue && approvedVolunteers.Value >= maximum.Value)
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed, localizationHelper.GetLocalizedMessage(l => l.Participation_NoMoreVolunteersNeededException));
			}

			if (opportunity.GetAttributeValue<bool>("msnfp_automaticallyapproveallapplicants"))
			{
				target["msnfp_status"] = new OptionSetValue((int)ParticipationStatus.Approved);
			}

			context.SharedVariables[ReappliedSharedVariable] = true;
		}

		private void ValidatePortalUpdate(Entity target, Entity preImage)
		{
			if (target.IsLookupChanged(preImage, "msnfp_contactid") || target.IsLookupChanged(preImage, "msnfp_engagementopportunityid"))
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed, localizationHelper.GetLocalizedMessage(l => l.Participation_ReassignmentNotAllowedException));
			}

			if (!target.Contains("msnfp_status"))
			{
				return;
			}

			var requestedStatus = target.GetAttributeValue<OptionSetValue>("msnfp_status")?.Value;
			var previousStatus = preImage?.GetAttributeValue<OptionSetValue>("msnfp_status")?.Value;
			if (!IsPortalStatusChangeAllowed(previousStatus, requestedStatus))
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed, localizationHelper.GetLocalizedMessage(l => l.Participation_StatusChangeNotAllowedException));
			}
		}

		/// <summary>
		/// From the portal a volunteer can only withdraw, or apply again after withdrawing (which needs staff review again).
		/// </summary>
		private static bool IsPortalStatusChangeAllowed(int? previousStatus, int? requestedStatus)
		{
			if (requestedStatus == previousStatus)
			{
				return true;
			}

			if (requestedStatus == (int)ParticipationStatus.Cancelled)
			{
				return previousStatus == (int)ParticipationStatus.NeedsReview
					|| previousStatus == (int)ParticipationStatus.InReview
					|| previousStatus == (int)ParticipationStatus.Approved;
			}

			return requestedStatus == (int)ParticipationStatus.NeedsReview && previousStatus == (int)ParticipationStatus.Cancelled;
		}
	}
}
