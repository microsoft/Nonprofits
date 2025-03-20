using System;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Services;

namespace Plugins.Strategies
{
	public class QualificationStageOnPostUpdateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly IQualificationService qualificationService;

		public QualificationStageOnPostUpdateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IOrganizationServiceProvider serviceProvider,
			IQualificationService qualificationService)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.serviceProvider = serviceProvider;
			this.qualificationService = qualificationService;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Qualification Post Update");

			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];
				var service = this.serviceProvider.CreateCurrentUserOrganizationService();
				var preImage = context.PreEntityImages["Image"];
				var postImage = context.PostEntityImages["Image"];
				var preStatus = (QualificationStageStatus)preImage.GetAttributeValue<OptionSetValue>("msnfp_stagestatus").Value;
				var postStatus = (QualificationStageStatus)postImage.GetAttributeValue<OptionSetValue>("msnfp_stagestatus").Value;

				if (preStatus != QualificationStageStatus.Active && postStatus == QualificationStageStatus.Active)
				{
					var QualficationSteps = Utilities.QueryByAttributeExt(service, "msnfp_qualificationstep", "msnfp_qualificationstage", target.Id, new ColumnSet("msnfp_activitytype", "msnfp_qualificationstage", "msnfp_assignto", "msnfp_description", "msnfp_dueindays", "msnfp_title"));
					if (QualficationSteps.TotalRecordCount > 0)
					{
						QualficationSteps.Entities.ToList().ForEach(s => qualificationService.CreateActivityFromStep(s, context.UserId));
					}
					var updateStage = new Entity("msnfp_qualificationstage", target.Id);
					updateStage["msnfp_duedate"] = DateTime.Now.AddDays(postImage.GetAttributeValue<int>("msnfp_plannedlengthdays"));
					updateStage["msnfp_startdate"] = DateTime.Now;
					service.Update(updateStage);

					var updateQualification = new Entity("msnfp_qualification", postImage.GetAttributeValue<EntityReference>("msnfp_qualificationid").Id);
					updateQualification["msnfp_currentstage"] = target.ToEntityReference();
					service.Update(updateQualification);
				}
				if (preStatus == QualificationStageStatus.Active && postStatus == QualificationStageStatus.Completed)
				{
					var updateStage = new Entity("msnfp_qualificationstage", target.Id);
					updateStage["msnfp_completiondate"] = DateTime.Now;
					service.Update(updateStage);
				}
				if (preStatus == QualificationStageStatus.Active && postStatus == QualificationStageStatus.Abandon)
				{
					var updateStage = new Entity("msnfp_qualificationstage", target.Id);
					updateStage["msnfp_completiondate"] = DateTime.Now;
					service.Update(updateStage);

					tracingService.Trace("Querying related activities");
					var activities = qualificationService.GetOpenStageActivities(target.ToEntityReference());
					tracingService.Trace($"Retrieved related activities ({activities.Entities.Count})");

					foreach (var activityPointer in activities.Entities)
					{
						var activityTypeCode = activityPointer.GetAttributeValue<string>("activitytypecode");
						var activityId = activityPointer.GetAttributeValue<Guid>("activityid");
						tracingService.Trace($"Canceling activity ({activityTypeCode})[{activityId}]");

						service.Update(new Entity(activityTypeCode, activityId)
						{
							["statecode"] = new OptionSetValue(2),  // Canceled
							["statuscode"] = new OptionSetValue(3)  // Canceled
						});

						tracingService.Trace($"Activity ({activityTypeCode})[{activityId}] canceled");
					}
				}
			}
		}
	}
}