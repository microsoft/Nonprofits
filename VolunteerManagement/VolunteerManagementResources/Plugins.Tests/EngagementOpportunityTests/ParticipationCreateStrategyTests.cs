using FluentAssertions;
using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using Plugins.Tests.Helpers;
using Plugins.Resx;
using Plugins.Strategies;
using Plugins.Localization;

namespace Plugins.Tests.EngagementOpportunityTests
{
	class ParticipationCreateStrategyTests
	{
		private Mock<ITracingService> tracingService = new Mock<ITracingService>();
		private Mock<IPluginExecutionContext> pluginExecutionContext = new Mock<IPluginExecutionContext>();
		private Mock<IOrganizationServiceProvider> organizationServiceProvider = new Mock<IOrganizationServiceProvider>();
		private Mock<IOrganizationService> organizationService = new Mock<IOrganizationService>();
		private Mock<ILocalizationHelper<Labels>> localizationHelper = new Mock<ILocalizationHelper<Labels>>();

		[Test]
		public void EngagmentPreApprovedParticipationNeedsReview()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 1";
			const bool isEngagementPreapproved = true;
			const ParticipationStatus participationStatus = ParticipationStatus.NeedsReview;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);

			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();			

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, ParticipationStatus.Approved);
		}

		[Test]
		public void EngagmentPreApprovedParticipationInReview()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 2";
			const bool isEngagementPreapproved = true;
			const ParticipationStatus participationStatus = ParticipationStatus.InReview;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();			

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, ParticipationStatus.Approved);
		}

		[Test]
		public void EngagmentPreApprovedParticipationApproved()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 3";
			const bool isEngagementPreapproved = true;
			const ParticipationStatus participationStatus = ParticipationStatus.Approved;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, ParticipationStatus.Approved);
		}

		[Test]
		public void EngagmentPreApprovedParticipationCancelled()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 4";
			const bool isEngagementPreapproved = true;
			const ParticipationStatus participationStatus = ParticipationStatus.Cancelled;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, ParticipationStatus.Cancelled);
		}

		[Test]
		public void EngagmentPreApprovedParticipationDismissed()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 5";
			const bool isEngagementPreapproved = true;
			const ParticipationStatus participationStatus = ParticipationStatus.Dismissed;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();
			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, ParticipationStatus.Dismissed);
		}

		[Test]
		public void EngagmentNotPreApprovedParticipationNeedsReview()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 6";
			const bool isEngagementPreapproved = false;
			const ParticipationStatus participationStatus = ParticipationStatus.NeedsReview;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, participationStatus);
		}

		[Test]
		public void EngagmentNotPreApprovedParticipationInReview()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 7";
			const bool isEngagementPreapproved = false;
			const ParticipationStatus participationStatus = ParticipationStatus.InReview;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, participationStatus);
		}

		[Test]
		public void EngagmentNotPreApprovedParticipationApproved()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 8";
			const bool isEngagementPreapproved = false;
			const ParticipationStatus participationStatus = ParticipationStatus.Approved;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, participationStatus);
		}

		[Test]
		public void EngagmentNotPreApprovedParticipationCancelled()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 9";
			const bool isEngagementPreapproved = false;
			const ParticipationStatus participationStatus = ParticipationStatus.Cancelled;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, participationStatus);
		}

		[Test]
		public void EngagmentNotPreApprovedParticipationDismissed()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 10";
			const bool isEngagementPreapproved = false;
			const ParticipationStatus participationStatus = ParticipationStatus.Dismissed;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, participationStatus);
		}

		[Test]
		public void EngagementNoPreApprovedNullStatus()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 10";
			const bool isEngagementPreapproved = false;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   null, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, ParticipationStatus.NeedsReview);
		}

		[Test]
		public void EngagementPreApprovedNullStatus()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 10";
			const bool isEngagementPreapproved = true;
			const string entityName = "Target";

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
			   null, isEngagementPreapproved, engagementOppTitle, null);
			sut.Run();

			var targetEntity = ConversionHelpers.GetInputEntity(this.pluginExecutionContext.Object, entityName);
			targetEntity.Should().NotBeNull();

			ValidateParticipationStatusAndTitle(targetEntity, volunteerFullName, engagementOppTitle, ParticipationStatus.Approved);
		}

		[Test]
		public void CreateParticipationWithoutEngagementId()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 10";
			const bool isEngagementPreapproved = false;
			const ParticipationStatus participationStatus = ParticipationStatus.Dismissed;

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithoutOppurtunityId(volunteerFullName, ContactStatus.Active,
			   participationStatus, isEngagementPreapproved, engagementOppTitle, EngagementOpportunityStatus.Draft);

			Assert.Throws<InvalidPluginExecutionException>(delegate { sut.Run(); });
		}

		[Test]
		public void CreateParticipationWithoutInActiveUser()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 10";
			const bool isEngagementPreapproved = true;
			this.localizationHelper.Setup(x => x.GetLocalizedMessage(It.IsAny<Func<Labels, LocalizationInfoModel>>())).Returns("Contact: {0} is a deactivated user.");
			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.InActive,
			   null, isEngagementPreapproved, engagementOppTitle, null);

			Assert.Throws<InvalidPluginExecutionException>(delegate { sut.Run(); });
		}

		[Test]
		public void CreateParticipationOnClosedEngagement()
		{
			const string volunteerFullName = "Mr. James bond";
			const string engagementOppTitle = "Opportunity 10";
			const bool isEngagementPreapproved = true;

			var sut = new ParticipationOnPreCreateStrategy(this.tracingService.Object, this.pluginExecutionContext.Object, this.organizationServiceProvider.Object, this.localizationHelper.Object);
			InitMocksWithDefaultOppurtunityId(volunteerFullName, ContactStatus.Active,
				null, isEngagementPreapproved, engagementOppTitle, EngagementOpportunityStatus.Closed);

			Assert.Throws<InvalidPluginExecutionException>(delegate { sut.Run(); });
		}

		void ValidateParticipationStatusAndTitle(Entity targetEntity, string volunteerFullName
								 , string engagementOppTitle, ParticipationStatus expectedParticipationStatus)
		{
			OptionSetValue actualParticipationStatus = targetEntity.GetAttributeValue<OptionSetValue>("msnfp_status");
			((ParticipationStatus)actualParticipationStatus.Value).Should().Be(expectedParticipationStatus);

			string participationTitle = targetEntity.GetAttributeValue<string>("msnfp_participationtitle");
			participationTitle.Should().Be(GetExpectedParticipationTitle(volunteerFullName, engagementOppTitle));
		}

		private string GetExpectedParticipationTitle(string volunteerFullName, string engagementOppTitle)
		{
			return $"{volunteerFullName} - {engagementOppTitle}";
		}

		private void InitMocks(string volunteerFullName, ContactStatus contactStatus, ParticipationStatus? participationStatus, bool isEngagementPreapproved
													   , string engagementOppurtunityTitle, Guid? opportunityId, EngagementOpportunityStatus? engagementOpportunityStatus)
		{
			var inputParameters = new ParameterCollection();
			pluginExecutionContext
				.Setup(x => x.InputParameters)
				.Returns(inputParameters);

			var targetTransactionRecord = new Entity();
			if (opportunityId.HasValue)
			{
				targetTransactionRecord.Attributes.Add("msnfp_engagementopportunityid", new EntityReference("msnfp_engagementopportunityid", opportunityId.Value));
			}
			else
			{
				targetTransactionRecord.Attributes.Add("msnfp_engagementopportunityid", null);
			}

			var contactId = Guid.Parse("0c74cf38-f666-4215-bdd5-f9287b8a50df");
			targetTransactionRecord.Attributes.Add("msnfp_contactid", new EntityReference("msnfp_contactid", contactId));

			if (participationStatus != null)
			{
				targetTransactionRecord.Attributes.Add("msnfp_status", new OptionSetValue((int)participationStatus));
			}
			else
			{
				targetTransactionRecord.Attributes.Add("msnfp_status", null);
			}

			inputParameters.Add("Target", targetTransactionRecord);

			var engagementOpportunity = new Entity();
			engagementOpportunity.Attributes.Add("msnfp_automaticallyapproveallapplicants", isEngagementPreapproved);
			engagementOpportunity.Attributes.Add("msnfp_engagementopportunitytitle", engagementOppurtunityTitle);

			organizationService
				.Setup(x => x.Retrieve("msnfp_engagementopportunity", It.IsAny<Guid>(), It.IsAny<ColumnSet>()))
				.Returns(engagementOpportunity);

			engagementOpportunity.Attributes.Add("fullname", volunteerFullName);
			engagementOpportunity.Attributes.Add("statecode", new OptionSetValue((int)contactStatus));
			if (engagementOpportunityStatus != null)
			{
				engagementOpportunity.Attributes.Add("msnfp_engagementopportunitystatus", new OptionSetValue((int)engagementOpportunityStatus));
			}
			organizationService
				.Setup(x => x.Retrieve("contact", It.IsAny<Guid>(), It.IsAny<ColumnSet>()))
				.Returns(engagementOpportunity);
			this.organizationServiceProvider.Setup(x => x.CreateCurrentUserOrganizationService()).Returns(this.organizationService.Object);
		}

		private void InitMocksWithoutOppurtunityId(string volunteerFullName, ContactStatus contactStatus, ParticipationStatus? participationStatus, bool isEngagementPreapproved
													   , string engagementOppurtunityTitle, EngagementOpportunityStatus? engagementOpportunityStatus)
		{
			InitMocks(volunteerFullName, contactStatus, participationStatus, isEngagementPreapproved, engagementOppurtunityTitle, null, engagementOpportunityStatus);
		}

		private void InitMocksWithDefaultOppurtunityId(string volunteerFullName, ContactStatus contactStatus, ParticipationStatus? participationStatus, bool isEngagementPreapproved
													   , string engagementOppurtunityTitle, EngagementOpportunityStatus? engagementOpportunityStatus)
		{
			Guid engagementOpportunityId = Guid.Parse("947fb8b6-bbee-4377-8907-f6e2c2602239");
			InitMocks(volunteerFullName, contactStatus, participationStatus, isEngagementPreapproved, engagementOppurtunityTitle, engagementOpportunityId, engagementOpportunityStatus);
		}
	}
}