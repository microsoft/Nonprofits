using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;
using Plugins.Services;

namespace Plugins.Strategies
{
	public class QualificationOnPostCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly ILocalizationHelper<Labels> localizationHelper;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly IQualificationService qualificationService;

		public QualificationOnPostCreateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			ILocalizationHelper<Labels> localizationHelper,
			IOrganizationServiceProvider serviceProvider,
			IQualificationService qualificationService)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.localizationHelper = localizationHelper;
			this.serviceProvider = serviceProvider;
			this.qualificationService = qualificationService;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Qualification On Post Create Plugin");
			if (!context.InputParameters.TryGetValue("Target", out var targetObj) || targetObj as Entity == default)
			{
				tracingService.Trace($"InputParameters=[{string.Join(",", context.InputParameters.Keys)}];");
				throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l => l.Plugins_Common_IncorrectlyRegisteredException, nameof(QualificationOnPostCreate)));
			}

			var target = targetObj as Entity;
			var service = this.serviceProvider.CreateCurrentUserOrganizationService();
			var qualificationTypeRef = target.GetAttributeValue<EntityReference>("msnfp_typeid");
			if (qualificationTypeRef == default)
			{
				tracingService.Trace(
					$"Qualification Type for {target?.Id} ({target?.LogicalName}) is NULL. Exiting {nameof(QualificationOnPostCreate)} plugin."
				);
				return;
			}

			var qualificationType = service.Retrieve("msnfp_qualificationtype", qualificationTypeRef.Id, new ColumnSet("msnfp_type"));
			var type = qualificationType.GetAttributeValue<OptionSetValue>("msnfp_type");
			if (type?.Value != (int)QualificationTypeTypes.Onboarding)
			{
				tracingService.Trace($"Qualification Type {type?.Value} isn't Onboarding type. Exiting {nameof(QualificationOnPostCreate)} plugin.");
				return;
			}

			var stages = RetrieveOnboardingStages(service, qualificationType.ToEntityReference());
			tracingService.Trace($"There is {stages.Count()} onboarding stages for Qualification Type {qualificationTypeRef.Id}");
			if (stages.Count() == 0)
			{
				tracingService.Trace($"Exiting {nameof(QualificationOnPostCreate)} plugin.");
				return;
			}

			var qualificationStages = CreateQualificationStages(stages, target.ToEntityReference());
			CreateQualificationSteps(service, qualificationStages);

			var firstStage = qualificationStages[stages.First().Id];

			tracingService.Trace($"Activating first stage with Id {firstStage.Id}");
			var updateStage = new Entity(firstStage.LogicalName, firstStage.Id);
			updateStage["msnfp_stagestatus"] = new OptionSetValue((int)QualificationStageStatus.Active);
			service.Update(updateStage);
			tracingService.Trace($"First stage ({firstStage.Id}) activated");

			tracingService.Trace($"Updating current stage of the current Qualification ({target.Id}) to StageId {firstStage.Id}");
			var updateQualification = new Entity(target.LogicalName, target.Id);
			updateQualification["msnfp_currentstage"] = firstStage.ToEntityReference();
			service.Update(updateQualification);
			tracingService.Trace($"Current stage of the current Qualification ({target.Id}) updated to StageId {firstStage.Id}");
		}

		private IEnumerable<Entity> RetrieveOnboardingStages(IOrganizationService service, EntityReference qualificationType)
		{
			tracingService.Trace($"Retrieving Onboarding Stages for Qualification Type {qualificationType?.Id} [{qualificationType?.LogicalName}]");
			if (qualificationType == default || qualificationType.Id == default)
			{
				throw new ArgumentNullException(nameof(qualificationType));
			}

			var stages = Utilities.QueryByAttributeExt(
				service,
				"msnfp_onboardingprocessstage",
				"msnfp_qualificationtypeid",
				qualificationType.Id,
				new ColumnSet("msnfp_stagename", "msnfp_description", "msnfp_dueindays", "msnfp_sequencenumber"),
				"msnfp_sequencenumber"
			).Entities;

			tracingService.Trace($"Retrieved {stages.Count} Onboarding Stages");

			return stages;
		}

		private IDictionary<Guid, Entity> CreateQualificationStages(IEnumerable<Entity> stages, EntityReference qualificationRef)
		{
			var qualificationStages = new Dictionary<Guid, Entity>();

			foreach (var stage in stages)
			{
				tracingService.Trace($"Creating Qualification Stage for Stage {stage.Id}");
				var qualificationStage = this.qualificationService.CreateQualificationStage(stage, qualificationRef);
				tracingService.Trace($"Created Qualification Stage with Id {qualificationStage.Value.Id}");

				qualificationStages.Add(qualificationStage.Key, qualificationStage.Value);
			}

			return qualificationStages;
		}

		private IEnumerable<Entity> RetrieveSteps(IOrganizationService service, IEnumerable<Guid> stageIds)
		{
			tracingService.Trace($"Retrieving Onboarding Process Steps for all stages ({string.Join(",", stageIds)})");

			var query = new QueryExpression("msnfp_onboardingprocessstep")
			{
				NoLock = true,
				ColumnSet = new ColumnSet(
					"msnfp_onboardingprocessstepid",
					"msnfp_title",
					"createdon",
					"msnfp_onboardingprocessstageid",
					"msnfp_activitytype",
					"msnfp_assignto",
					"msnfp_description",
					"msnfp_onboardingprocessstageid"
				),
				Orders =
				{
					new OrderExpression("msnfp_title", OrderType.Ascending)
				},
				Criteria =
				{
					Conditions =
					{
						new ConditionExpression("statecode", ConditionOperator.Equal, 0),
						new ConditionExpression("msnfp_onboardingprocessstageid", ConditionOperator.In, stageIds.ToArray())
					}
				}
			};

			var steps = service.RetrieveMultiple(query).Entities;
			tracingService.Trace($"Retrieved {steps.Count} Onboarding Process Steps");

			return steps;
		}

		private void CreateQualificationSteps(IOrganizationService service, IDictionary<Guid, Entity> qualificationStages)
		{
			var steps = RetrieveSteps(service, qualificationStages.Keys);

			foreach (var step in steps)
			{
				tracingService.Trace($"Processing step {step.Id}");

				var stepStageId = step.GetAttributeValue<EntityReference>("msnfp_onboardingprocessstageid")?.Id;
				if (stepStageId.HasValue)
				{
					var stageRef = qualificationStages[stepStageId.Value]?.ToEntityReference();

					tracingService.Trace($"Creating Qualification Step for StepId {step.Id} and StageId {stageRef?.Id}");
					var result = qualificationService.CreateQualificationStep(step, stageRef);
					tracingService.Trace($"Created Qualification Step with Id {result.Value.Id}");
				}
			}
		}

	}
}