using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;

namespace Plugins.Strategies
{
	public class ParticipationOnPostUpdateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public ParticipationOnPostUpdateStrategy(
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
			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];
				var service = this.serviceProvider.CreateCurrentUserOrganizationService();
				var participation = service.Retrieve("msnfp_participation", target.Id, new ColumnSet("msnfp_engagementopportunityid", "msnfp_contactid"));

				var preImage = context.PreEntityImages["Image"];
				var postImage = context.PostEntityImages["Image"];

				var eoRef = participation.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid");
				if (eoRef != null)
				{
					var eo = service.Retrieve("msnfp_engagementopportunity", eoRef.Id, new ColumnSet("msnfp_automaticallyapproveallapplicants", "msnfp_shifts"));

					var oldStatus = preImage.GetAttributeValue<OptionSetValue>("msnfp_status");
					var newStatus = postImage.GetAttributeValue<OptionSetValue>("msnfp_status");
					if (newStatus.Value == (int)ParticipationStatus.Approved && (oldStatus.Value == (int)ParticipationStatus.NeedsReview || oldStatus.Value == (int)ParticipationStatus.InReview))
					{
						Utilities.EngagementOpportunityMessage(service, tracingService, participation.GetAttributeValue<EntityReference>("msnfp_contactid"), participation.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid"), EngagementOpportunitySettingMessageEventType.SignUpApproved);
						if (eo.GetAttributeValue<bool?>("msnfp_shifts") == false)
						{
							Utilities.CreateParticipationSchedule(service, participation, this.localizationHelper);
						}
					}
					if ((newStatus.Value == (int)ParticipationStatus.Cancelled || newStatus.Value == (int)ParticipationStatus.Dismissed) && oldStatus.Value != (int)ParticipationStatus.Cancelled && oldStatus.Value != (int)ParticipationStatus.Dismissed)
					{
						var shifts = Utilities.QueryByAttributeExt(service, "msnfp_participationschedule", "msnfp_participationid", target.Id, new ColumnSet("statecode", "msnfp_participationid", "msnfp_schedulestatus"));
						foreach (var shift in shifts.Entities)
						{
							var status = shift.GetAttributeValue<OptionSetValue>("msnfp_schedulestatus");
							if (status.Value != (int)ParticipationScheduleStatus.Cancelled && status.Value != (int)ParticipationScheduleStatus.Completed)
							{
								var shiftUpdate = new Entity("msnfp_participationschedule", shift.Id);
								shiftUpdate["msnfp_schedulestatus"] = new OptionSetValue((int)ParticipationScheduleStatus.Cancelled);
								service.Update(shiftUpdate);
							}
						}
					}
					Utilities.CalculateParticpationsCountsByEO(service, eo.ToEntityReference());

					var oldHours = preImage.GetAttributeValue<decimal?>("msnfp_hours");
					var newHours = postImage.GetAttributeValue<decimal?>("msnfp_hours");
					if (oldHours != newHours)
					{
						Utilities.CalculateContactTotalHours(service, tracingService, postImage.GetAttributeValue<EntityReference>("msnfp_contactid"));
						if ((oldHours == null || oldHours < 1) && newHours > 0)
						{
							Utilities.EngagementOpportunityMessage(service, tracingService, participation.GetAttributeValue<EntityReference>("msnfp_contactid"), participation.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid"), EngagementOpportunitySettingMessageEventType.EngagementCompleted);
						}
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