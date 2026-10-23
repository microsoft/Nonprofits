using System;
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
	public class ParticipationSchedulePortalStatusTests
	{
		private readonly EntityReference participation = new EntityReference(ParticipationDef.EntityName, Guid.NewGuid());
		private readonly EntityReference shift = new EntityReference(EngagementOpportunityScheduleDef.EntityName, Guid.NewGuid());

		private Mock<IOrganizationService> orgService;
		private ParticipationScheduleService service;

		[SetUp]
		public void SetUp()
		{
			orgService = new Mock<IOrganizationService>();
			service = new ParticipationScheduleService(orgService.Object, new Mock<ILocalizationHelper<Labels>>().Object);
			SetupParticipation(ParticipationStatus.Approved);
			SetupShift(EngagementOpportunityScheduleStatus.Active);
		}

		[Test]
		[TestCase(ParticipationScheduleStatus.Pending, ParticipationScheduleStatus.Cancelled)]
		[TestCase(ParticipationScheduleStatus.Cancelled, ParticipationScheduleStatus.Pending)]
		[TestCase(ParticipationScheduleStatus.Pending, ParticipationScheduleStatus.Pending)]
		[TestCase(ParticipationScheduleStatus.Completed, ParticipationScheduleStatus.Completed)]
		public void PortalStatusChange_Allowed_DoesNotThrow(ParticipationScheduleStatus previousStatus, ParticipationScheduleStatus requestedStatus)
		{
			Assert.DoesNotThrow(() => service.ValidatePortalScheduleUpdate(Target(requestedStatus), PreImage(previousStatus)));
		}

		[Test]
		[TestCase(ParticipationScheduleStatus.Pending, ParticipationScheduleStatus.Completed)]
		[TestCase(ParticipationScheduleStatus.Pending, ParticipationScheduleStatus.NoShow)]
		[TestCase(ParticipationScheduleStatus.Cancelled, ParticipationScheduleStatus.Completed)]
		[TestCase(ParticipationScheduleStatus.NoShow, ParticipationScheduleStatus.Completed)]
		[TestCase(ParticipationScheduleStatus.NoShow, ParticipationScheduleStatus.Pending)]
		[TestCase(ParticipationScheduleStatus.NoShow, ParticipationScheduleStatus.Cancelled)]
		[TestCase(ParticipationScheduleStatus.Completed, ParticipationScheduleStatus.Pending)]
		[TestCase(ParticipationScheduleStatus.Completed, ParticipationScheduleStatus.Cancelled)]
		public void PortalStatusChange_NotAllowed_Throws(ParticipationScheduleStatus previousStatus, ParticipationScheduleStatus requestedStatus)
		{
			Assert.Throws<InvalidPluginExecutionException>(() => service.ValidatePortalScheduleUpdate(Target(requestedStatus), PreImage(previousStatus)));
		}

		[Test]
		[TestCase(ParticipationStatus.NeedsReview)]
		[TestCase(ParticipationStatus.InReview)]
		[TestCase(ParticipationStatus.Dismissed)]
		[TestCase(ParticipationStatus.Cancelled)]
		public void PortalBookingAgain_ParticipationNotApproved_Throws(ParticipationStatus participationStatus)
		{
			SetupParticipation(participationStatus);

			Assert.Throws<InvalidPluginExecutionException>(() => service.ValidatePortalScheduleUpdate(
				Target(ParticipationScheduleStatus.Pending), PreImage(ParticipationScheduleStatus.Cancelled)));
		}

		[Test]
		public void PortalBookingAgain_InactiveShift_Throws()
		{
			SetupShift(EngagementOpportunityScheduleStatus.InActive);

			Assert.Throws<InvalidPluginExecutionException>(() => service.ValidatePortalScheduleUpdate(
				Target(ParticipationScheduleStatus.Pending), PreImage(ParticipationScheduleStatus.Cancelled)));
		}

		[Test]
		public void PortalStatusChange_WithoutPreImage_Throws()
		{
			Assert.Throws<InvalidPluginExecutionException>(() => service.ValidatePortalScheduleUpdate(Target(ParticipationScheduleStatus.Completed), null));
		}

		[Test]
		public void PortalUpdate_ChangingTheParticipation_Throws()
		{
			var target = Target(null);
			target[ParticipationScheduleDef.Participation] = new EntityReference(ParticipationDef.EntityName, Guid.NewGuid());

			Assert.Throws<InvalidPluginExecutionException>(() => service.ValidatePortalScheduleUpdate(target, PreImage(ParticipationScheduleStatus.Pending)));
		}

		[Test]
		public void PortalUpdate_ChangingTheShift_Throws()
		{
			var target = Target(null);
			target[ParticipationScheduleDef.EngagementOpportunitySchedule] = new EntityReference(EngagementOpportunityScheduleDef.EntityName, Guid.NewGuid());

			Assert.Throws<InvalidPluginExecutionException>(() => service.ValidatePortalScheduleUpdate(target, PreImage(ParticipationScheduleStatus.Pending)));
		}

		[Test]
		public void PortalUpdate_SameParticipation_DoesNotThrow()
		{
			var target = Target(null);
			target[ParticipationScheduleDef.Participation] = new EntityReference(participation.LogicalName, participation.Id);

			Assert.DoesNotThrow(() => service.ValidatePortalScheduleUpdate(target, PreImage(ParticipationScheduleStatus.Pending)));
		}

		[Test]
		[TestCase(ParticipationScheduleStatus.Pending)]
		[TestCase(ParticipationScheduleStatus.Cancelled)]
		[TestCase(null)]
		public void PortalCreate_AllowedStatus_DoesNotThrow(ParticipationScheduleStatus? status)
		{
			Assert.DoesNotThrow(() => service.ValidatePortalScheduleStatusOnCreate(Target(status)));
		}

		[Test]
		[TestCase(ParticipationScheduleStatus.Completed)]
		[TestCase(ParticipationScheduleStatus.NoShow)]
		public void PortalCreate_NotAllowedStatus_Throws(ParticipationScheduleStatus status)
		{
			Assert.Throws<InvalidPluginExecutionException>(() => service.ValidatePortalScheduleStatusOnCreate(Target(status)));
		}

		[Test]
		public void ShiftIsActive_InactiveShift_Throws()
		{
			SetupShift(EngagementOpportunityScheduleStatus.InActive);

			Assert.Throws<InvalidPluginExecutionException>(() => service.ValidateShiftIsActive(shift));
		}

		[Test]
		public void ShiftIsActive_ActiveShift_DoesNotThrow()
		{
			Assert.DoesNotThrow(() => service.ValidateShiftIsActive(shift));
		}

		[Test]
		public void PreUpdateStrategy_PortalRequest_ValidatesTheChange()
		{
			var scheduleService = new Mock<IParticipationScheduleService>();
			RunPreUpdate(scheduleService, isPortal: true, depth: 1);

			scheduleService.Verify(s => s.ValidatePortalScheduleUpdate(It.IsAny<Entity>(), It.IsAny<Entity>()), Times.Once);
		}

		[Test]
		[TestCase(false, 1, TestName = "PreUpdateStrategy_StaffRequest_SkipsValidation")]
		[TestCase(true, 2, TestName = "PreUpdateStrategy_UpdateByAnotherPluginOrWorkflow_SkipsValidation")]
		public void PreUpdateStrategy_SkipsValidation(bool isPortal, int depth)
		{
			var scheduleService = new Mock<IParticipationScheduleService>();
			RunPreUpdate(scheduleService, isPortal, depth);

			scheduleService.Verify(s => s.ValidatePortalScheduleUpdate(It.IsAny<Entity>(), It.IsAny<Entity>()), Times.Never);
		}

		[Test]
		[TestCase(true)]
		[TestCase(false)]
		public void PreCreateStrategy_ChecksStatusAndActiveShiftOnlyForPortalRequests(bool isPortal)
		{
			var scheduleService = new Mock<IParticipationScheduleService>();
			var context = Context(isPortal, 1, Target(ParticipationScheduleStatus.Pending), null);

			new ParticipationScheduleOnPreCreateStrategy(new Mock<ITracingService>().Object, context.Object, scheduleService.Object).Run();

			var expected = isPortal ? Times.Once() : Times.Never();
			scheduleService.Verify(s => s.ValidatePortalScheduleStatusOnCreate(It.IsAny<Entity>()), expected);
			scheduleService.Verify(s => s.ValidateShiftIsActive(It.Is<EntityReference>(r => r.Id == shift.Id)), expected);
			scheduleService.Verify(s => s.ValidateApprovalStatus(It.IsAny<Entity>()), Times.Once);
			scheduleService.Verify(s => s.ValidateShiftBelongsToParticipation(It.IsAny<EntityReference>(), It.IsAny<EntityReference>()), Times.Once);
		}

		private void RunPreUpdate(Mock<IParticipationScheduleService> scheduleService, bool isPortal, int depth)
		{
			var context = Context(isPortal, depth, Target(ParticipationScheduleStatus.Completed), PreImage(ParticipationScheduleStatus.Pending));
			new ParticipationScheduleOnPreUpdateStrategy(new Mock<ITracingService>().Object, context.Object, scheduleService.Object).Run();
		}

		private static Mock<IPluginExecutionContext2> Context(bool isPortal, int depth, Entity target, Entity preImage)
		{
			var context = new Mock<IPluginExecutionContext2>();
			context.Setup(c => c.IsPortalsClientCall).Returns(isPortal);
			context.Setup(c => c.Depth).Returns(depth);
			context.Setup(c => c.InputParameters).Returns(new ParameterCollection { { "Target", target } });
			var images = new EntityImageCollection();
			if (preImage != null)
			{
				images[ParticipationScheduleOnPreUpdateStrategy.PreImageName] = preImage;
			}
			context.Setup(c => c.PreEntityImages).Returns(images);
			return context;
		}

		private Entity Target(ParticipationScheduleStatus? status)
		{
			var target = new Entity(ParticipationScheduleDef.EntityName, Guid.NewGuid())
			{
				[ParticipationScheduleDef.Participation] = new EntityReference(participation.LogicalName, participation.Id),
				[ParticipationScheduleDef.EngagementOpportunitySchedule] = new EntityReference(shift.LogicalName, shift.Id)
			};
			if (status.HasValue)
			{
				target[ParticipationScheduleDef.ScheduleStatus] = new OptionSetValue((int)status.Value);
			}
			else
			{
				target.Attributes.Remove(ParticipationScheduleDef.Participation);
				target.Attributes.Remove(ParticipationScheduleDef.EngagementOpportunitySchedule);
			}
			return target;
		}

		private Entity PreImage(ParticipationScheduleStatus status) => new Entity(ParticipationScheduleDef.EntityName, Guid.NewGuid())
		{
			[ParticipationScheduleDef.Participation] = new EntityReference(participation.LogicalName, participation.Id),
			[ParticipationScheduleDef.EngagementOpportunitySchedule] = new EntityReference(shift.LogicalName, shift.Id),
			[ParticipationScheduleDef.ScheduleStatus] = new OptionSetValue((int)status)
		};

		private void SetupParticipation(ParticipationStatus status)
		{
			orgService.Setup(s => s.Retrieve(ParticipationDef.EntityName, participation.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity(ParticipationDef.EntityName, participation.Id) { [ParticipationDef.ParticipationStatus] = new OptionSetValue((int)status) });
		}

		private void SetupShift(EngagementOpportunityScheduleStatus status)
		{
			orgService.Setup(s => s.Retrieve(EngagementOpportunityScheduleDef.EntityName, shift.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity(EngagementOpportunityScheduleDef.EntityName, shift.Id) { [EngagementOpportunityScheduleDef.Status] = new OptionSetValue((int)status) });
		}
	}
}
