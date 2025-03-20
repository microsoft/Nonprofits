using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using System.Linq;
using Plugins.Services;
using Plugins.Strategies;

namespace Plugins.Tests.QualificationTests
{
	[TestFixture]
	class QualificationStageOnPostUpdateStrategyTest
	{
		public List<Entity> Updates { get; set; } = new List<Entity>();
		public List<Entity> Creates { get; set; } = new List<Entity>();
		private Mock<ITracingService> tracingService = new Mock<ITracingService>();
		private Mock<IPluginExecutionContext> pluginExecutionContext = new Mock<IPluginExecutionContext>();
		private Mock<IOrganizationService> organizationService = new Mock<IOrganizationService>();
		private Mock<IOrganizationServiceProvider> organizationServiceProvider = new Mock<IOrganizationServiceProvider>();
		private Mock<IQualificationService> qualificationService = new Mock<IQualificationService>();

		[Test]
		public void CompleteQualificationStage()
		{
			Updates.Clear();
			const QualificationStageStatus preStageStatus = QualificationStageStatus.Active;
			Entity PreImage = new Entity("msnfp_qualificationstage");
			PreImage.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)preStageStatus));
			const QualificationStageStatus postStateStatus = QualificationStageStatus.Completed;
			Entity Target = new Entity("msnfp_qualificationstage");
			Target.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)postStateStatus));

			var sut = new QualificationStageOnPostUpdateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.qualificationService.Object);
			InitMocks(Target, new KeyValuePair<string, Entity>("Image", PreImage), new KeyValuePair<string, Entity>("Image", Target));

			Assert.DoesNotThrow(delegate { sut.Run(); });
			Assert.IsTrue(this.Updates.Count == 1);
			Assert.IsTrue(this.Updates[0].GetAttributeValue<DateTime>("msnfp_completiondate").Date == DateTime.Now.Date);
		}

		[Test]
		public void ActivateQualificationStage()
		{
			Updates.Clear();
			const QualificationStageStatus preStageStatus = QualificationStageStatus.Pending;
			Entity PreImage = new Entity("msnfp_qualificationstage");
			PreImage.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)preStageStatus));
			const QualificationStageStatus postStateStatus = QualificationStageStatus.Active;
			Entity Target = new Entity("msnfp_qualificationstage");
			Target.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)postStateStatus));
			Target.Attributes.Add("msnfp_qualificationid", new EntityReference("msnfp_qualification", Guid.NewGuid()));
			Target.Attributes.Add("msnfp_plannedlengthdays", 60);
			Target.Id = Guid.NewGuid();
			Target.LogicalName = "msnfp_qualificationstage";

			EntityReference contactRef = new EntityReference("contact", System.Guid.NewGuid());

			EntityReference qualRef = new EntityReference("msnfp_qualification", System.Guid.NewGuid());
			Entity qualification = new Entity(qualRef.LogicalName, qualRef.Id);
			qualification.Attributes.Add("msnfp_contactid", contactRef);

			EntityReference stageRef = new EntityReference("msnfp_qualificationstage", System.Guid.NewGuid());
			Entity stage = new Entity("msnfp_qualificationstage", stageRef.Id);
			stage.Attributes.Add("msnfp_qualificationid", qualRef);

			List<Entity> retrieveList = new List<Entity>();
			retrieveList.Add(qualification);
			retrieveList.Add(stage);
			InitMocks(Target, new KeyValuePair<string, Entity>("Image", PreImage), new KeyValuePair<string, Entity>("Image", Target), retrieveMultipleDefault: CreateQualificationSteps(7, Target.Id), retrieveDefault: retrieveList);
			var sut = new QualificationStageOnPostUpdateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.qualificationService.Object);

			Assert.DoesNotThrow(delegate { sut.Run(); });
			Assert.IsTrue(this.Creates.Count == 7);
			Assert.IsTrue(this.Updates.Count == 2);
			Assert.IsTrue(this.Updates.Where(e => e.LogicalName == "msnfp_qualificationstage").FirstOrDefault().GetAttributeValue<DateTime>("msnfp_startdate").Date == DateTime.Now.Date);
			Assert.IsTrue(this.Updates.Where(e => e.LogicalName == "msnfp_qualificationstage").FirstOrDefault().GetAttributeValue<DateTime>("msnfp_duedate").Date == DateTime.Now.Date.AddDays(Target.GetAttributeValue<int>("msnfp_plannedlengthdays")));

			Assert.IsTrue(this.Updates.Where(e => e.LogicalName == "msnfp_qualification").FirstOrDefault().GetAttributeValue<EntityReference>("msnfp_currentstage").Id == Target.Id);
		}
		private EntityCollection CreateQualificationSteps(int numberOfSteps, Guid stageId)
		{
			EntityCollection collection = new EntityCollection();
			collection.TotalRecordCount = numberOfSteps;

			for (int i = 0; i < numberOfSteps; i++)
			{
				Entity step = new Entity("msnfp_qualificationstep", Guid.NewGuid());
				step.Attributes.Add("msnfp_activitytype", new OptionSetValue((int)QualificationStepActivtyType.OnboardingTask));
				step.Attributes.Add("msnfp_assignto", new EntityReference("systemuser", System.Guid.NewGuid()));
				step.Attributes.Add("msnfp_description", "Step Description " + i);
				step.Attributes.Add("msnfp_dueindays", i * 7);
				step.Attributes.Add("msnfp_title", "Step Title " + i);
				step.Attributes.Add("msnfp_qualificationstage", new EntityReference("msnfp_qualificationstage", stageId));
				collection.Entities.Add(step);
			}
			return collection;
		}
		private void InitMocks(Entity target, KeyValuePair<string, Entity> preImage, KeyValuePair<string, Entity> postImage, List<Entity> retrieveDefault = null, EntityCollection retrieveMultipleDefault = null)
		{
			var inputParameters = new ParameterCollection();
			pluginExecutionContext.Setup(x => x.InputParameters).Returns(inputParameters);
			pluginExecutionContext.Setup(x => x.MessageName).Returns("Update");

			EntityImageCollection entityImage = new EntityImageCollection();
			entityImage.Add(preImage.Key, preImage.Value);
			EntityImageCollection postentityImage = new EntityImageCollection();
			postentityImage.Add(postImage.Key, postImage.Value);
			pluginExecutionContext.Setup(x => x.PreEntityImages).Returns(entityImage);
			pluginExecutionContext.Setup(x => x.PostEntityImages).Returns(postentityImage);

			inputParameters.Add("Target", target);
			if (retrieveDefault != null)
			{
				organizationService.Setup(x => x.Retrieve(It.Is<string>(n => n == "msnfp_qualification"), It.IsAny<Guid>(), It.IsAny<ColumnSet>())).Returns(retrieveDefault.Where(e => e.LogicalName == "msnfp_qualification").FirstOrDefault());
				organizationService.Setup(x => x.Retrieve(It.Is<string>(n => n == "msnfp_qualificationstage"), It.IsAny<Guid>(), It.IsAny<ColumnSet>())).Returns(retrieveDefault.Where(e => e.LogicalName == "msnfp_qualificationstage").FirstOrDefault());
			}
			organizationService.Setup(x => x.RetrieveMultiple(It.IsAny<QueryBase>())).Returns(retrieveMultipleDefault);

			organizationService.Setup(x => x.Update(It.IsAny<Entity>())).Callback((Entity e) => { this.Updates.Add(e); });
			qualificationService.Setup(x => x.CreateActivityFromStep(It.IsAny<Entity>(), It.IsAny<Guid>())).Callback((Entity e, Guid g) => { this.Creates.Add(e); });

			this.organizationServiceProvider.Setup(x => x.CreateCurrentUserOrganizationService()).Returns(this.organizationService.Object);
		}
	}
}