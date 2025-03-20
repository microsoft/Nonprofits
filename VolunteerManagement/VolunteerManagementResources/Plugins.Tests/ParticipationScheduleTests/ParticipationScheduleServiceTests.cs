using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using Plugins.Localization;
using Plugins.Resx;
using Plugins.Services;
using VolunteerManagement.Definitions;

namespace Plugins.Tests.ParticipationScheduleTests
{
	[TestFixture]
	public class ParticipationScheduleServiceTests
	{
		private Mock<IOrganizationService> organizationService = new Mock<IOrganizationService>();
		private Mock<ILocalizationHelper<Labels>> localizationHelper = new Mock<ILocalizationHelper<Labels>>();

		[Test]
		[TestCase(ParticipationStatus.Dismissed)]
		[TestCase(ParticipationStatus.InReview)]
		[TestCase(ParticipationStatus.NeedsReview)]
		public void CreateParticipationScheduleParticipationValidation(ParticipationStatus participationStatus)
		{
			var sut = new ParticipationScheduleService(this.organizationService.Object, this.localizationHelper.Object);
			
			var participation = new Entity();
			participation.Attributes.Add(ParticipationDef.ParticipationStatus,
				new OptionSetValue((int)participationStatus));
			participation.Attributes.Add(ParticipationDef.PrimaryKey,
				new EntityReference(ParticipationDef.EntityName, Guid.NewGuid()));
			InitMocks(participation);

			Assert.Throws<InvalidPluginExecutionException>(delegate { sut.ValidateApprovalStatus(participation); });
		}

		[Test]
		public void CreateParticipationScheduleWithApprovedParticipation()
		{
			const ParticipationStatus participationStatus = ParticipationStatus.Approved;

			var sut = new ParticipationScheduleService(this.organizationService.Object, this.localizationHelper.Object);

			var participation = new Entity();
			participation.Attributes.Add(ParticipationDef.ParticipationStatus,
				new OptionSetValue((int)participationStatus));
			participation.Attributes.Add(ParticipationDef.PrimaryKey,
				new EntityReference(ParticipationDef.EntityName, Guid.NewGuid()));
			InitMocks(participation);

			Assert.DoesNotThrow(delegate { sut.ValidateApprovalStatus(participation); });
		}

		private void InitMocks(Entity participation)
		{		
			organizationService
				.Setup(x => x.Retrieve(ParticipationDef.EntityName,
				It.IsAny<Guid>(), It.IsAny<ColumnSet>()))
				.Returns(participation);
		}
	}
}
