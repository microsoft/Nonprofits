using Microsoft.Xrm.Sdk;
using Moq;
using NUnit.Framework;
using Plugins.Services;
using Plugins.Tests.Mock;
using Plugins;
using System;

namespace Plugins.Tests.QualificationTests.Services
{
	[TestFixture]
	public class QualificationServiceTests
	{
		[Test]
		public void CreateQualificationStage()
		{
			OrganizationServiceMock organizationServiceMock = new OrganizationServiceMock();
			var entityService = new QualificationService(organizationServiceMock);

			EntityReference parentRef = new EntityReference("msnfp_qualification", System.Guid.NewGuid());

			Entity onboardingProcessStage = new Entity("msnfp_onboardingprocessstage", System.Guid.NewGuid());
			onboardingProcessStage.Attributes.Add("msnfp_stagename", "Stage 1");
			onboardingProcessStage.Attributes.Add("msnfp_description", "Stage Description");
			onboardingProcessStage.Attributes.Add("msnfp_sequencenumber", 100);

			entityService.CreateQualificationStage(onboardingProcessStage, parentRef);

			Assert.IsTrue(organizationServiceMock.createCollection.Entities.Count == 1);
			Assert.IsTrue(organizationServiceMock.createCollection.Entities[0].GetAttributeValue<string>("msnfp_stagename") == onboardingProcessStage.GetAttributeValue<string>("msnfp_stagename"));
			Assert.IsTrue(organizationServiceMock.createCollection.Entities[0].GetAttributeValue<string>("msnfp_description") == onboardingProcessStage.GetAttributeValue<string>("msnfp_description"));
			Assert.IsTrue(organizationServiceMock.createCollection.Entities[0].GetAttributeValue<int>("msnfp_sequencenumber") == onboardingProcessStage.GetAttributeValue<int>("msnfp_sequencenumber"));
			Assert.IsTrue(organizationServiceMock.createCollection.Entities[0].GetAttributeValue<OptionSetValue>("msnfp_stagestatus").Value == new OptionSetValue((int)QualificationStageStatus.Pending).Value);
			Assert.IsTrue(organizationServiceMock.createCollection.Entities[0].GetAttributeValue<EntityReference>("msnfp_qualificationid").Id == parentRef.Id);
		}

		[Test]
		public void CreateQualificationStep()
		{
			OrganizationServiceMock serviceProvider = new OrganizationServiceMock();
			var entityService = new QualificationService(serviceProvider);

			EntityReference parentRef = new EntityReference("msnfp_qualificationstage", System.Guid.NewGuid());

			Entity onboardingProcesseStep = new Entity("msnfp_onboardingprocessstep", System.Guid.NewGuid());
			onboardingProcesseStep.Attributes.Add("msnfp_activitytype", new OptionSetValue((int)QualificationStepActivtyType.OnboardingTask));
			onboardingProcesseStep.Attributes.Add("msnfp_assignto", new EntityReference("systemuser", System.Guid.NewGuid()));
			onboardingProcesseStep.Attributes.Add("msnfp_description", "Step Description");
			onboardingProcesseStep.Attributes.Add("msnfp_duedate", 10);
			onboardingProcesseStep.Attributes.Add("msnfp_title", "Step Title");

			entityService.CreateQualificationStep(onboardingProcesseStep, parentRef);

			Assert.IsTrue(serviceProvider.createCollection.Entities.Count == 1);
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<OptionSetValue>("msnfp_activitytype") == onboardingProcesseStep.GetAttributeValue<OptionSetValue>("msnfp_activitytype"));
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<EntityReference>("msnfp_assignto") == onboardingProcesseStep.GetAttributeValue<EntityReference>("msnfp_assignto"));
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<string>("msnfp_description") == onboardingProcesseStep.GetAttributeValue<string>("msnfp_description"));
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<int>("msnfp_dueindays") == onboardingProcesseStep.GetAttributeValue<int>("msnfp_duedate"));
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<string>("msnfp_title") == onboardingProcesseStep.GetAttributeValue<string>("msnfp_title"));
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<EntityReference>("msnfp_qualificationstage").Id == parentRef.Id);
		}
		[Test]
		public void CheckForActiveStagesTestWithActiveStage()
		{
			OrganizationServiceMock serviceProvider = new OrganizationServiceMock();
			var entityService = new QualificationService(serviceProvider);

			EntityReference parentRef = new EntityReference("msnfp_qualification", System.Guid.NewGuid());

			Entity qualificationStage = new Entity("msnfp_qualificationstage", System.Guid.NewGuid());
			qualificationStage.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)QualificationStageStatus.Active));
			qualificationStage.Attributes.Add("msnfp_qualificationid", parentRef);
			qualificationStage.Attributes.Add("statecode", "Active");

			serviceProvider.AddEntity(qualificationStage);

			Assert.IsTrue(entityService.CheckForActiveStages(parentRef));
		}
		[Test]
		public void CheckForActiveStagesTestWithNoStage()
		{
			OrganizationServiceMock serviceProvider = new OrganizationServiceMock();
			var entityService = new QualificationService(serviceProvider);

			EntityReference parentRef = new EntityReference("msnfp_qualification", System.Guid.NewGuid());

			Assert.IsTrue(entityService.CheckForActiveStages(parentRef));
		}
		[Test]
		public void CreateActivityFromStepTest()
		{
			OrganizationServiceMock serviceProvider = new OrganizationServiceMock();
			var entityService = new QualificationService(serviceProvider);

			EntityReference contactRef = new EntityReference("contact", System.Guid.NewGuid());

			EntityReference qualRef = new EntityReference("msnfp_qualification", System.Guid.NewGuid());
			Entity qualification = new Entity(qualRef.LogicalName, qualRef.Id);
			qualification.Attributes.Add("msnfp_contactid", contactRef);

			EntityReference stageRef = new EntityReference("msnfp_qualificationstage", System.Guid.NewGuid());
			Entity stage = new Entity("msnfp_qualificationstage", stageRef.Id);
			stage.Attributes.Add("msnfp_qualificationid", qualRef);

			EntityReference userId = new EntityReference("systemuser", System.Guid.NewGuid());

			Entity qualificationStep = new Entity("msnfp_qualificationstep", System.Guid.NewGuid());
			qualificationStep.Attributes.Add("msnfp_activitytype", new OptionSetValue((int)QualificationStepActivtyType.OnboardingTask));
			qualificationStep.Attributes.Add("msnfp_qualificationstage", stageRef);
			qualificationStep.Attributes.Add("statecode", "Active");
			qualificationStep.Attributes.Add("msnfp_description", "Step Description");
			qualificationStep.Attributes.Add("msnfp_dueindays", 10);
			qualificationStep.Attributes.Add("msnfp_title", "Step Title");

			serviceProvider.AddEntity(qualification);
			serviceProvider.AddEntity(stage);

			entityService.CreateActivityFromStep(qualificationStep, userId.Id);

			Assert.IsTrue(serviceProvider.createCollection.Entities.Count == 1);
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<string>("subject") == qualificationStep.GetAttributeValue<string>("msnfp_title"));
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<string>("description") == qualificationStep.GetAttributeValue<string>("msnfp_description"));
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<DateTime>("scheduledend").Date == DateTime.Now.AddDays(qualificationStep.GetAttributeValue<int>("msnfp_dueindays")).Date);
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<EntityReference>("regardingobjectid").Id == stageRef.Id);
			Assert.IsTrue(serviceProvider.createCollection.Entities[0].GetAttributeValue<EntityReference>("ownerid").Id == userId.Id);
		}
	}
}