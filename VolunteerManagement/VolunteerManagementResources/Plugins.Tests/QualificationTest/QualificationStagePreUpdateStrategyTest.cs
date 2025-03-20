using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using System.Collections.Generic;
using Plugins.Strategies;
using Plugins.Resx;
using Plugins.Services;
using Plugins.Localization;

namespace Plugins.Tests.QualificationTests
{
	[TestFixture]
	class QualificationStagePreUpdateStrategyTest
	{
		private Mock<ITracingService> tracingService = new Mock<ITracingService>();
		private Mock<IPluginExecutionContext> pluginExecutionContext = new Mock<IPluginExecutionContext>();
		private Mock<IOrganizationService> organizationService = new Mock<IOrganizationService>();
		private Mock<IQualificationService> qualificationService = new Mock<IQualificationService>();
		private Mock<ILocalizationHelper<Labels>> localizationHelper = new Mock<ILocalizationHelper<Labels>>();
		private Mock<IOrganizationServiceProvider> organizationServiceProvider = new Mock<IOrganizationServiceProvider>();

		[Test]
		public void RevertQualificationStage()
		{
			const QualificationStageStatus preStageStatus = QualificationStageStatus.Active;
			Entity PreImage = new Entity("msnfp_qualificationstage");
			PreImage.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)preStageStatus));
			const QualificationStageStatus postStateStatus = QualificationStageStatus.Pending;
			Entity Target = new Entity("msnfp_qualificationstage");
			Target.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)postStateStatus));

			var sut = new QualificationStageOnPreUpdateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocks(Target, new KeyValuePair<string, Entity>("Image", PreImage));

			Assert.Throws<InvalidPluginExecutionException>(delegate { sut.Run(); });
		}
		[Test]
		public void ProgressingStage()
		{
			const QualificationStageStatus preStageStatus = QualificationStageStatus.Pending;
			Entity PreImage = new Entity("msnfp_qualificationstage");
			PreImage.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)preStageStatus));
			PreImage.Attributes.Add("msnfp_qualificationid", new EntityReference("msnfp_qualification", new Guid()));

			const QualificationStageStatus postStateStatus = QualificationStageStatus.Active;
			Entity Target = new Entity("msnfp_qualificationstage");
			Target.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)postStateStatus));

			EntityCollection collection = new EntityCollection();
			collection.Entities.Add(Target);

			var sut = new QualificationStageOnPreUpdateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocks(Target, new KeyValuePair<string, Entity>("Image", PreImage), retrieveMultipleDefault: collection);


			Assert.DoesNotThrow(delegate { sut.Run(); });
		}
		[Test]
		public void ProgressingStageWithActiveStageAlreadyPresent()
		{
			const QualificationStageStatus preStageStatus = QualificationStageStatus.Pending;
			Entity PreImage = new Entity("msnfp_qualificationstage");
			PreImage.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)preStageStatus));
			PreImage.Attributes.Add("msnfp_qualificationid", new EntityReference("msnfp_qualification", new Guid()));

			const QualificationStageStatus postStateStatus = QualificationStageStatus.Active;
			Entity Target = new Entity("msnfp_qualificationstage");
			Target.Attributes.Add("msnfp_stagestatus", new OptionSetValue((int)postStateStatus));

			EntityCollection collection = new EntityCollection();
			collection.Entities.Add(Target);
			collection.Entities.Add(Target);
			collection.Entities.Add(Target);

			var sut = new QualificationStageOnPreUpdateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocks(Target, new KeyValuePair<string, Entity>("Image", PreImage), retrieveMultipleDefault: collection);

			Assert.Throws<InvalidPluginExecutionException>(delegate { sut.Run(); });
		}
		private void InitMocks(Entity target, KeyValuePair<string, Entity> preImage, Entity retrieveDefault = null, EntityCollection retrieveMultipleDefault = null)
		{			
			var inputParameters = new ParameterCollection();
			pluginExecutionContext.Setup(x => x.InputParameters).Returns(inputParameters);
			pluginExecutionContext.Setup(x => x.MessageName).Returns("Update");

			EntityImageCollection entityImage = new EntityImageCollection();
			entityImage.Add(preImage.Key, preImage.Value);
			pluginExecutionContext.Setup(x => x.PreEntityImages).Returns(entityImage);

			inputParameters.Add("Target", target);

			organizationService.Setup(x => x.Retrieve(It.IsAny<String>(), It.IsAny<Guid>(), It.IsAny<ColumnSet>())).Returns(retrieveDefault);
			organizationService.Setup(x => x.RetrieveMultiple(It.IsAny<QueryBase>())).Returns(retrieveMultipleDefault);

			this.organizationServiceProvider.Setup(x => x.CreateCurrentUserOrganizationService()).Returns(this.organizationService.Object);
		}
	}
}