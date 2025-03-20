using System;
using FluentAssertions;
using Microsoft.Xrm.Sdk;
using Moq;
using NUnit.Framework;
using Plugins.Services;
using Plugins.Strategies;
using Plugins.Tests.Helpers;
using VolunteerManagement.Definitions;

namespace Plugins.Tests.EngagementOpportunityScheduleTests
{
	[TestFixture]
	class EngagementOpportunitySchedulePreCreateStrategyTests
	{
		private Mock<ITracingService> tracingService = new Mock<ITracingService>();
		private Mock<IPluginExecutionContext> pluginContext = new Mock<IPluginExecutionContext>();
		private Mock<IEngagementOpportunityScheduleService> scheduleService = new Mock<IEngagementOpportunityScheduleService>();

		[Test]
		public void PrimaryNameIsSet()
		{
			Entity preImage = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(preImage, true, 10, false, null);
			Entity target = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(target, true, 1, true, 2);
			Entity engagement = CreateEngagmentOpportunity(DateTime.Now, DateTime.Now);
			this.scheduleService.Setup(x => x.GetPrimaryName(target, preImage)).Returns("Shift - Opportunity");
			InitMocksForUpdateEvent(preImage, target, engagement);
			EngagementOpportunityScheduleOnPreCreateUpdateStrategy sut = new EngagementOpportunityScheduleOnPreCreateUpdateStrategy(this.tracingService.Object, this.pluginContext.Object, this.scheduleService.Object);

			preImage[EngagementOpportunityScheduleDef.ShiftName] = "Shift";
			target[EngagementOpportunityScheduleDef.EngagementOpportunity] = new EntityReference()
			{
				Name = "Opportunity"
			};

			sut.Run();

			var actual = target.GetAttributeValue<string>(EngagementOpportunityScheduleDef.PrimaryName);

			Assert.AreEqual("Shift - Opportunity", actual);
		}

		[Test]
		public void NullStartAndEndDate()
		{
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, 1, true, 1);
			AddScheduleWithStartAndEnd(schedule, null, null);
			Entity engagement = CreateEngagmentOpportunity(DateTime.Now, DateTime.Now);

			InitMocks(schedule, engagement);
			EngagementOpportunityScheduleOnPreCreateUpdateStrategy sut = new EngagementOpportunityScheduleOnPreCreateUpdateStrategy(this.tracingService.Object, pluginContext.Object, scheduleService.Object);


			Assert.DoesNotThrow(delegate
			{
				sut.Run();
			});
		}

		[Test]
		public void CanCreateScheduleAtDifferentTimes()
		{
			DateTime start = DateTime.Now;
			DateTime end = DateTime.Now.AddHours(4);

			Entity engagement = CreateEngagmentOpportunity(start, end);

			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, 1, true, 1);
			AddScheduleWithStartAndEnd(schedule, start.AddHours(2), start.AddHours(2));

			InitMocks(schedule, engagement);
			EngagementOpportunityScheduleOnPreCreateUpdateStrategy sut = new EngagementOpportunityScheduleOnPreCreateUpdateStrategy(this.tracingService.Object, pluginContext.Object, scheduleService.Object);


			Assert.DoesNotThrow(delegate
			{
				sut.Run();
			});
		}

		[Test]
		[Description("For a single day Engagement opportunity, " +
			"schedules can be updated in different time within that day.")]
		public void CanUpdateScheduleAtDifferentTimes()
		{
			DateTime start = new DateTime(2022, 01, 01, 08, 00, 00);
			DateTime? end = new DateTime(2022, 01, 01, 17, 00, 00);
			Entity engagement = CreateEngagmentOpportunity(start, end);

			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, 1, true, 2);
			AddScheduleWithStartAndEnd(schedule, new DateTime(2022, 01, 01, 11, 00, 00), new DateTime(2022, 01, 01, 11, 30, 00));

			Entity preImage = CreateEngagmentOpportunity(new DateTime(2022, 01, 01, 10, 00, 00), new DateTime(2022, 01, 01, 15, 00, 00));
			AddMinMaxParticipantEntityForUpdateEvent(preImage, true, 10, false, null);

			InitMocksForUpdateEvent(preImage, schedule, engagement);
			EngagementOpportunityScheduleOnPreCreateUpdateStrategy sut = new EngagementOpportunityScheduleOnPreCreateUpdateStrategy(this.tracingService.Object, pluginContext.Object, scheduleService.Object);

			Assert.DoesNotThrow(delegate
			{
				sut.Run();
			});
		}

		[Test]
		public void MinAndMaxParticipantsNotSpecified()
		{
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, null, true, null);
			DateTime timeRef = DateTime.Now;
			AddScheduleWithStartAndEnd(schedule, timeRef, timeRef);
			Entity engagement = CreateEngagmentOpportunity(timeRef, timeRef);

			InitMocks(schedule, engagement);
			EngagementOpportunityScheduleOnPreCreateUpdateStrategy sut = new EngagementOpportunityScheduleOnPreCreateUpdateStrategy(this.tracingService.Object, pluginContext.Object, scheduleService.Object);

			Assert.DoesNotThrow(delegate
			{
				sut.Run();
			});

			Entity target = ConversionHelpers.GetInputEntity(pluginContext.Object, "Target");
			target.Should().NotBeNull();

			target.GetAttributeValue<int>(EngagementOpportunityScheduleDef.MinofParticipants)
				.Should().Equals(0);
			target.GetAttributeValue<int>(EngagementOpportunityScheduleDef.MaxofParticipants)
				.Should().Equals(0);
		}

		[Test]
		public void MinSpecifiedMaxNotSpecified()
		{
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, 1, true, null);
			DateTime timeRef = DateTime.Now;
			AddScheduleWithStartAndEnd(schedule, timeRef, timeRef);
			Entity engagement = CreateEngagmentOpportunity(timeRef, timeRef);

			InitMocks(schedule, engagement);
			var sut = new EngagementOpportunityScheduleOnPreCreateUpdateStrategy(this.tracingService.Object, this.pluginContext.Object, this.scheduleService.Object);

			Assert.DoesNotThrow(delegate
			{
				sut.Run();
			});

			Entity target = ConversionHelpers.GetInputEntity(pluginContext.Object, "Target");
			target.Should().NotBeNull();

			target.GetAttributeValue<int>(EngagementOpportunityScheduleDef.MinofParticipants).Should().Equals(1);
			target.GetAttributeValue<int>(EngagementOpportunityScheduleDef.MaxofParticipants).Should().Equals(1);
		}

		[Test]
		public void HoursSetToZeroByDefault()
		{
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, null, true, null);
			DateTime timeRef = DateTime.Now;
			AddScheduleWithStartAndEnd(schedule, timeRef, timeRef);
			Entity engagement = CreateEngagmentOpportunity(timeRef, timeRef);

			InitMocks(schedule, engagement);
			var sut = new EngagementOpportunityScheduleOnPreCreateUpdateStrategy(this.tracingService.Object, this.pluginContext.Object, this.scheduleService.Object);

			sut.Run();

			Entity target = ConversionHelpers.GetInputEntity(pluginContext.Object, "Target");
			target.Should().NotBeNull();

			target.GetAttributeValue<decimal?>(EngagementOpportunityScheduleDef.Hours)
				.Should().Be(0.0M);
		}

		[Test]
		public void HoursNotUpdatedInUpdateEvent()
		{
			Entity preImage = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(preImage, true, 10, true, 10);
			Entity target = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(target, true, 10, true, 10);
			Entity engagement = CreateEngagmentOpportunity(DateTime.Now, DateTime.Now.AddDays(3));
			AddScheduleWithStartAndEnd(preImage, DateTime.Now, DateTime.Now);

			InitMocksForUpdateEvent(preImage, target, engagement);
			var sut = new EngagementOpportunityScheduleOnPreCreateUpdateStrategy(this.tracingService.Object, this.pluginContext.Object, this.scheduleService.Object);

			sut.Run();

			decimal? hours = target.GetAttributeValue<decimal?>(EngagementOpportunityScheduleDef.Hours);
			hours.Should().NotHaveValue();
		}

		private Entity AddMinMaxParticipantEntityForUpdateEvent(Entity schedule, bool includeMin, int? minParticipants,
			bool includeMax, int? maxParticipants)
		{
			if (includeMin)
				schedule.Attributes.Add(EngagementOpportunityScheduleDef.MinofParticipants, minParticipants);
			if (includeMax)
				schedule.Attributes.Add(EngagementOpportunityScheduleDef.MaxofParticipants, maxParticipants);
			return schedule;
		}

		private Entity AddScheduleWithStartAndEnd(Entity schedule, DateTime? start, DateTime? end)
		{
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.StartDate, start);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EndDate, end);
			return schedule;
		}

		private Entity CreateEngagmentOpportunity(DateTime? start, DateTime? end)
		{
			Entity schedule = new Entity();
			schedule.Attributes.Add(EngagementOpportunityDef.StartingDate, start);
			schedule.Attributes.Add(EngagementOpportunityDef.EndingDate, end);
			return schedule;
		}

		private void InitMocksForUpdateEvent(
			Entity preImage, Entity target, Entity engagementOpportunity)
		{
			var inputParameters = new ParameterCollection();
			pluginContext
				.Setup(x => x.InputParameters)
				.Returns(inputParameters);
			pluginContext
				.Setup(x => x.MessageName)
				.Returns("Update");

			EntityImageCollection entityImage = new EntityImageCollection();
			entityImage.Add("schedule", preImage);
			pluginContext
				.Setup(x => x.PreEntityImages)
				.Returns(entityImage);

			var entityRef = new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, Guid.NewGuid());
			target.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity, entityRef);
			preImage.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity, entityRef);
			inputParameters.Add("Target", target);
		}

		private void InitMocks(Entity schedule, Entity engagementOpportunity)
		{
			var inputParameters = new ParameterCollection();
			pluginContext
				.Setup(x => x.InputParameters)
				.Returns(inputParameters);
			pluginContext
				.Setup(x => x.MessageName)
				.Returns("Create");

			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
				new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, Guid.NewGuid()));
			inputParameters.Add("Target", schedule);
		}
	}
}