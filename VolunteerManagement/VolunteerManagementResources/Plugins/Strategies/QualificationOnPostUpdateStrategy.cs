using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Plugins.Strategies
{
	public class QualificationOnPostUpdateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider organizationServiceProvider;

		public QualificationOnPostUpdateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IOrganizationServiceProvider organizationServiceProvider)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.organizationServiceProvider = organizationServiceProvider;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Qualification Post update");

			if (!context.InputParameters.Contains("Target") || !(context.InputParameters["Target"] is Entity) || context.InputParameters["Target"] == null)
			{
				return;
			}

			var postEntityImage = context.PostEntityImages["Image"];

			tracingService.Trace("Trying Qualification Post update");
			var organizationService = this.organizationServiceProvider.CreateCurrentUserOrganizationService();
			var attributeValue1 = postEntityImage.GetAttributeValue<OptionSetValue>("msnfp_qualificationstatus");
			if (attributeValue1 != null && attributeValue1.Value == (int)OnboardingQualificationStatus.Abandoned)
			{
				tracingService.Trace("Status Updated to Abandoned");
				var qualificationTypeRef = postEntityImage.GetAttributeValue<EntityReference>("msnfp_typeid");
				var qualificationType = organizationService
					.Retrieve("msnfp_qualificationtype", qualificationTypeRef.Id, new ColumnSet("msnfp_type"))
					.GetAttributeValue<OptionSetValue>("msnfp_type");
				tracingService.Trace($"Qualification Type: {qualificationType?.Value}");

				if (qualificationType != null && qualificationType.Value == (int)QualificationTypeTypes.Onboarding)
				{
					tracingService.Trace($"Querying Qualification Stages for Qualification {postEntityImage.Id}");
					var qualificationStages = Utilities.QueryByAttributeExt(
						organizationService,
						"msnfp_qualificationstage",
						"msnfp_qualificationid",
						postEntityImage.Id,
						new ColumnSet("msnfp_stagestatus", "statecode", "statuscode", "msnfp_qualificationid")
					).Entities;
					tracingService.Trace($"Retrieved {qualificationStages.Count} Qualification Stages");

					foreach (var stage in qualificationStages)
					{
						var stageStatus = stage.GetAttributeValue<OptionSetValue>("msnfp_stagestatus");
						tracingService.Trace($"Qualification Stage {stage.Id} has Stage Status = {stageStatus?.Value}");
						var isAbandon = stageStatus?.Value == (int)QualificationStageStatus.Abandon;
						var isCompleted = stageStatus?.Value == (int)QualificationStageStatus.Completed;

						if (stageStatus == default || !isAbandon && !isCompleted)
						{
							tracingService.Trace($"Updating Qualification Stage ({stage.LogicalName}) {stage.Id} to Abandon stage status");
							organizationService.Update(new Entity(stage.LogicalName, stage.Id)
							{
								["msnfp_stagestatus"] = new OptionSetValue((int)QualificationStageStatus.Abandon)
							});
						}
					}
				}
			}
		}
	}
}