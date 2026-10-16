using System;
using System.Linq;
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

		[Test]
		[TestCase(2, 2, true)]
		[TestCase(2, 3, true)]
		[TestCase(2, 1, false)]
		public void ValidateShiftCapacityThrowsOnlyWhenShiftIsFull(int maximum, int booked, bool shouldThrow)
		{
			var service = CreateShiftService(maximum, booked);
			var sut = new ParticipationScheduleService(service.Object, this.localizationHelper.Object);
			var shiftRef = new EntityReference(EngagementOpportunityScheduleDef.EntityName, Guid.NewGuid());

			if (shouldThrow)
			{
				Assert.Throws<InvalidPluginExecutionException>(() => sut.ValidateShiftCapacity(shiftRef));
			}
			else
			{
				Assert.DoesNotThrow(() => sut.ValidateShiftCapacity(shiftRef));
			}

			// The shift row is updated first so concurrent sign-ups for the same shift are serialized.
			service.Verify(s => s.Update(It.Is<Entity>(e => e.LogicalName == EngagementOpportunityScheduleDef.EntityName && e.Id == shiftRef.Id)), Times.Once);
		}

		[Test]
		[TestCase(null)]
		[TestCase(0)]
		public void ValidateShiftCapacityIgnoresShiftsWithoutMaximum(int? maximum)
		{
			var service = CreateShiftService(maximum, 10);
			var sut = new ParticipationScheduleService(service.Object, this.localizationHelper.Object);

			Assert.DoesNotThrow(() => sut.ValidateShiftCapacity(new EntityReference(EngagementOpportunityScheduleDef.EntityName, Guid.NewGuid())));
			service.Verify(s => s.RetrieveMultiple(It.IsAny<QueryBase>()), Times.Never);
		}

		[Test]
		public void ValidateShiftCapacityExcludesTheRecordBeingValidated()
		{
			var service = CreateShiftService(1, 0);
			var sut = new ParticipationScheduleService(service.Object, this.localizationHelper.Object);
			var excludedId = Guid.NewGuid();

			sut.ValidateShiftCapacity(new EntityReference(EngagementOpportunityScheduleDef.EntityName, Guid.NewGuid()), excludedId);

			service.Verify(s => s.RetrieveMultiple(It.Is<QueryExpression>(q => q.Criteria.Conditions.Any(c =>
				c.AttributeName == ParticipationScheduleDef.PrimaryKey
				&& c.Operator == ConditionOperator.NotEqual
				&& (Guid)c.Values[0] == excludedId))), Times.Once);
		}

		private static Mock<IOrganizationService> CreateShiftService(int? maximum, int booked)
		{
			var service = new Mock<IOrganizationService>();
			service
				.Setup(s => s.Retrieve(EngagementOpportunityScheduleDef.EntityName, It.IsAny<Guid>(), It.IsAny<ColumnSet>()))
				.Returns((string name, Guid id, ColumnSet columns) => new Entity(name, id)
				{
					[EngagementOpportunityScheduleDef.MaxofParticipants] = maximum,
					[EngagementOpportunityScheduleDef.Number] = booked
				});
			service
				.Setup(s => s.RetrieveMultiple(It.IsAny<QueryBase>()))
				.Returns(() => new EntityCollection(Enumerable.Range(0, booked)
					.Select(_ => new Entity(ParticipationScheduleDef.EntityName, Guid.NewGuid()))
					.ToList()));
			return service;
		}
	}
}
