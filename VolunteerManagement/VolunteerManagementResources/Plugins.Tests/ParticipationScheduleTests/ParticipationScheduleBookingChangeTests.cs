using System;
using System.Collections.Generic;
using FluentAssertions;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using Plugins.Localization;
using Plugins.Resx;
using Plugins.Services;
using Plugins.Strategies;
using VolunteerManagement.Definitions;

namespace Plugins.Tests.ParticipationScheduleTests
{
	[TestFixture]
	public class ParticipationScheduleBookingChangeTests
	{
		private const int Pending = (int)ParticipationScheduleStatus.Pending;
		private const int Completed = (int)ParticipationScheduleStatus.Completed;
		private const int Cancelled = (int)ParticipationScheduleStatus.Cancelled;

		private readonly EntityReference opportunity = new EntityReference("msnfp_engagementopportunity", Guid.NewGuid());
		private readonly EntityReference participation = new EntityReference("msnfp_participation", Guid.NewGuid());
		private readonly EntityReference shiftA = new EntityReference("msnfp_engagementopportunityschedule", Guid.NewGuid());
		private readonly EntityReference shiftB = new EntityReference("msnfp_engagementopportunityschedule", Guid.NewGuid());

		private Mock<IParticipationScheduleService> scheduleService;
		private List<Guid> recountedShifts;

		[SetUp]
		public void SetUp()
		{
			scheduleService = new Mock<IParticipationScheduleService>();
			recountedShifts = new List<Guid>();
		}

		[Test]
		public void MovingAPendingBookingToAnotherShiftChecksThatShiftAndRecountsTheOldOne()
		{
			var scheduleId = Run(Pending, shiftA, Pending, shiftB);

			scheduleService.Verify(s => s.ValidateShiftBelongsToParticipation(It.Is<EntityReference>(r => r.Id == participation.Id), It.Is<EntityReference>(r => r.Id == shiftB.Id)), Times.Once);
			scheduleService.Verify(s => s.ValidateShiftCapacity(It.Is<EntityReference>(r => r.Id == shiftB.Id), scheduleId), Times.Once);
			recountedShifts.Should().Contain(new[] { shiftA.Id, shiftB.Id });
		}

		[Test]
		public void CancelledToCompletedChecksCapacity()
		{
			var scheduleId = Run(Cancelled, shiftA, Completed, shiftA);

			scheduleService.Verify(s => s.ValidateShiftCapacity(It.Is<EntityReference>(r => r.Id == shiftA.Id), scheduleId), Times.Once);
			scheduleService.Verify(s => s.ValidateShiftBelongsToParticipation(It.IsAny<EntityReference>(), It.IsAny<EntityReference>()), Times.Never);
		}

		[Test]
		public void CancelledToPendingChecksCapacity()
		{
			var scheduleId = Run(Cancelled, shiftA, Pending, shiftA);

			scheduleService.Verify(s => s.ValidateShiftCapacity(It.Is<EntityReference>(r => r.Id == shiftA.Id), scheduleId), Times.Once);
		}

		[Test]
		public void PendingToCompletedOnTheSameShiftDoesNotTakeANewPlace()
		{
			Run(Pending, shiftA, Completed, shiftA);

			scheduleService.Verify(s => s.ValidateShiftCapacity(It.IsAny<EntityReference>(), It.IsAny<Guid?>()), Times.Never);
		}

		[Test]
		public void MovingACancelledBookingChecksTheOpportunityButNotCapacity()
		{
			Run(Cancelled, shiftA, Cancelled, shiftB);

			scheduleService.Verify(s => s.ValidateShiftBelongsToParticipation(It.IsAny<EntityReference>(), It.Is<EntityReference>(r => r.Id == shiftB.Id)), Times.Once);
			scheduleService.Verify(s => s.ValidateShiftCapacity(It.IsAny<EntityReference>(), It.IsAny<Guid?>()), Times.Never);
		}

		[Test]
		public void ShiftOfAnotherOpportunityIsRejected()
		{
			var service = new Mock<IOrganizationService>();
			service.Setup(s => s.Retrieve(ParticipationDef.EntityName, participation.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity(ParticipationDef.EntityName, participation.Id) { [ParticipationDef.EngagementOpportunity] = opportunity });
			service.Setup(s => s.Retrieve(EngagementOpportunityScheduleDef.EntityName, shiftB.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity(EngagementOpportunityScheduleDef.EntityName, shiftB.Id) { [EngagementOpportunityScheduleDef.EngagementOpportunity] = new EntityReference("msnfp_engagementopportunity", Guid.NewGuid()) });
			service.Setup(s => s.Retrieve(EngagementOpportunityScheduleDef.EntityName, shiftA.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity(EngagementOpportunityScheduleDef.EntityName, shiftA.Id) { [EngagementOpportunityScheduleDef.EngagementOpportunity] = opportunity });
			var sut = new ParticipationScheduleService(service.Object, new Mock<ILocalizationHelper<Labels>>().Object);

			Assert.Throws<InvalidPluginExecutionException>(() => sut.ValidateShiftBelongsToParticipation(participation, shiftB));
			Assert.DoesNotThrow(() => sut.ValidateShiftBelongsToParticipation(participation, shiftA));
		}

		private Guid Run(int previousStatus, EntityReference previousShift, int newStatus, EntityReference newShift)
		{
			var schedule = new Entity(ParticipationScheduleDef.EntityName, Guid.NewGuid())
			{
				["msnfp_participationid"] = participation,
				["msnfp_engagementopportunityscheduleid"] = newShift,
				["msnfp_schedulestatus"] = new OptionSetValue(newStatus)
			};
			var preImage = new Entity(ParticipationScheduleDef.EntityName, schedule.Id)
			{
				["msnfp_engagementopportunityscheduleid"] = previousShift,
				["msnfp_schedulestatus"] = new OptionSetValue(previousStatus)
			};

			var context = new Mock<IPluginExecutionContext>();
			context.SetupGet(c => c.MessageName).Returns("Update");
			context.SetupGet(c => c.InputParameters).Returns(new ParameterCollection { { "Target", new Entity(schedule.LogicalName, schedule.Id) } });
			context.SetupGet(c => c.PreEntityImages).Returns(new EntityImageCollection { { ParticipationScheduleOnPostUpdateAndCreateStrategy.PreImageName, preImage } });

			var service = new Mock<IOrganizationService>();
			service.Setup(s => s.Retrieve(It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<ColumnSet>()))
				.Returns((string name, Guid id, ColumnSet columns) =>
				{
					switch (name)
					{
						case ParticipationScheduleDef.EntityName: return schedule;
						case ParticipationDef.EntityName: return new Entity(name, id) { ["msnfp_engagementopportunityid"] = opportunity, ["msnfp_hours"] = 0m };
						case EngagementOpportunityScheduleDef.EntityName: recountedShifts.Add(id); return new Entity(name, id) { ["msnfp_number"] = 0 };
						default: return new Entity(name, id);
					}
				});
			service.Setup(s => s.RetrieveMultiple(It.IsAny<QueryBase>())).Returns(new EntityCollection());
			var provider = new Mock<IOrganizationServiceProvider>();
			provider.Setup(p => p.CreateCurrentUserOrganizationService()).Returns(service.Object);

			new ParticipationScheduleOnPostUpdateAndCreateStrategy(new Mock<ITracingService>().Object, context.Object, provider.Object,
				new Mock<ILocalizationHelper<Labels>>().Object, scheduleService.Object).Run();

			return schedule.Id;
		}
	}
}
