using FluentAssertions;
using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using Plugins.Strategies;
using Plugins.Resx;
using Plugins.Services;
using System.Collections.Generic;
using Plugins.Localization;

namespace Plugins.Tests.QualificationTests
{
	[TestFixture]
	class QualificationPostCreateStrategyTest
	{
		private Mock<ITracingService> tracingService = new Mock<ITracingService>();
		private Mock<IPluginExecutionContext> pluginExecutionContext = new Mock<IPluginExecutionContext>();
		private Mock<IOrganizationService> organizationService = new Mock<IOrganizationService>();
		private Mock<IOrganizationServiceProvider> organizationServiceProvider = new Mock<IOrganizationServiceProvider>();
		private Mock<IQualificationService> qualificationService = new Mock<IQualificationService>();
		private Mock<ILocalizationHelper<Labels>> localizationHelper = new Mock<ILocalizationHelper<Labels>>();

		[Test]
		public void CreateOnboardingQualification()
		{

			Entity Target = new Entity("msnfp_qualification");
			Target.Attributes.Add("msnfp_typeid", new EntityReference("msnfp_qualificationtype", new Guid()));

			Entity qualificationType = new Entity("msnfp_qualificationtype", Guid.NewGuid());
			qualificationType.Attributes.Add("msnfp_type", new OptionSetValue(844060004));


			EntityCollection collection = new EntityCollection();
			collection.Entities.Add(CreateStage("Stage 1", "Description 1", 7, 1));
			collection.Entities.Add(CreateStage("Stage 2", "Description 2", 14, 2));
			collection.Entities.Add(CreateStage("Stage 3", "Description 3", 21, 3));
			collection.Entities.Add(CreateStage("Stage 4", "Description 4", 31, 4));
			collection.Entities.Add(CreateStage("Stage 5", "Description 5", 41, 5));

			EntityCollection steps = new EntityCollection();
			foreach (Entity entity in collection.Entities)
			{
				steps.Entities.AddRange(createSteps(entity.ToEntityReference(), 5).Entities);
			}

			InitMocks(Target, retrieveDefault: qualificationType, retrieveQueryByAttributeMultipleDefault: collection, retrieveFetchMultipleDefault: steps);
			var sut = new QualificationOnPostCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.localizationHelper.Object, this.organizationServiceProvider.Object, this.qualificationService.Object);

			Assert.DoesNotThrow(delegate { sut.Run(); });
		}
		private Entity CreateStage(string stageName, string stageDescription, int dueInDays, int sequenceNumber)
		{
			Entity Stage = new Entity("msnfp_onboardingprocessstage", Guid.NewGuid());
			Stage.Attributes.Add("msnfp_stagename", stageName);
			Stage.Attributes.Add("msnfp_description", stageDescription);
			Stage.Attributes.Add("msnfp_dueindays", dueInDays);
			Stage.Attributes.Add("msnfp_sequencenumber", sequenceNumber);
			return Stage;
		}
		private EntityCollection createSteps(EntityReference StageId, int numberOfSteps)
		{
			EntityCollection collection = new EntityCollection();
			Guid userId = Guid.NewGuid();
			for (int i = 0; i < numberOfSteps; i++)
			{
				Entity step = new Entity("msnfp_onboardingprocessstep", Guid.NewGuid());
				step.Attributes.Add("msnfp_title", "title " + i);
				step.Attributes.Add("msnfp_onboardingprocessstageid", StageId);
				step.Attributes.Add("msnfp_activitytype", new OptionSetValue((int)QualificationStepActivtyType.OnboardingTask));
				step.Attributes.Add("msnfp_assignto", new EntityReference("systemuser", userId));
				step.Attributes.Add("msnfp_description", "step description " + i);
				collection.Entities.Add(step);
			}
			return collection;
		}

		private void InitMocks(Entity target, Entity preImage = null, string preImageName = "", Entity retrieveDefault = null, EntityCollection retrieveQueryByAttributeMultipleDefault = null, EntityCollection retrieveFetchMultipleDefault = null)
		{			
			var inputParameters = new ParameterCollection();
			pluginExecutionContext.Setup(x => x.InputParameters).Returns(inputParameters);
			pluginExecutionContext.Setup(x => x.MessageName).Returns("Update");

			EntityImageCollection entityImage = new EntityImageCollection();
			entityImage.Add(preImageName, preImage);
			pluginExecutionContext.Setup(x => x.PreEntityImages).Returns(entityImage);

			inputParameters.Add("Target", target);

			organizationService.Setup(x => x.Retrieve(It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<ColumnSet>())).Returns(retrieveDefault);

			organizationService.Setup(x => x.RetrieveMultiple(It.Is<QueryBase>(q => q.As<QueryByAttribute>() != null))).Returns(retrieveQueryByAttributeMultipleDefault);
			organizationService.Setup(x => x.RetrieveMultiple(It.Is<QueryExpression>(q => q.EntityName.Equals("msnfp_onboardingprocessstep")))).Returns(retrieveQueryByAttributeMultipleDefault);
			organizationService.Setup(x => x.RetrieveMultiple(It.Is<QueryBase>(q => q.As<FetchExpression>() != null))).Returns(retrieveFetchMultipleDefault);

			foreach (var stage in retrieveQueryByAttributeMultipleDefault.Entities)
			{
				qualificationService.Setup(x => x.CreateQualificationStage(It.Is<Entity>(e=>e.Id == stage.Id), It.IsAny<EntityReference>())).Returns(new KeyValuePair<Guid, Entity>(stage.Id, stage));
			}

			this.organizationServiceProvider.Setup(x => x.CreateCurrentUserOrganizationService()).Returns(this.organizationService.Object);
		}
	}
}