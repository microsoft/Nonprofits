using System;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using Plugins.Localization;
using Plugins.Resx;
using Plugins.Services;
using VolunteerManagement.Definitions;

namespace Plugins.Tests.EngagementOpportunityScheduleTests.Services
{
	public class EngagementOpportunityScheduleServiceTests
	{
		Mock<IOrganizationService> orgService = new Mock<IOrganizationService>();
		Mock<ITracingService> tracingService = new Mock<ITracingService>();
		Mock<ILocalizationHelper<Labels>> localizationHelper = new Mock<ILocalizationHelper<Labels>>();


		[Test]
		public void GetPrimaryNameEntityContainsAllAttrNameIsCorrect()
		{
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);
			const string expected = "ShiftName - OpportunityName";

			var entity = new Entity(EngagementOpportunityScheduleDef.EntityName)
			{
				[EngagementOpportunityScheduleDef.ShiftName] = "ShiftName",
				[EngagementOpportunityScheduleDef.EngagementOpportunity] = new EntityReference()
				{
					Name = "OpportunityName"
				}
			};

			var name = entityService.GetPrimaryName(entity);

			Assert.AreEqual(expected, name);
		}

		[Test]
		public void GetPrimaryNameEntityNoShiftPreImageProvidedNameIsCorrect()
		{
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);
			const string expected = "ShiftName - OpportunityName";

			var entity = new Entity(EngagementOpportunityScheduleDef.EntityName)
			{
				[EngagementOpportunityScheduleDef.EngagementOpportunity] = new EntityReference()
				{
					Name = "OpportunityName"
				}
			};

			var preImage = new Entity(EngagementOpportunityScheduleDef.EntityName)
			{
				[EngagementOpportunityScheduleDef.ShiftName] = "ShiftName",
			};

			var name = entityService.GetPrimaryName(entity, preImage);

			Assert.AreEqual(expected, name);
		}

		[Test]
		public void CannotCreateScheduleWhichEndOneMinuteBefore()
		{
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, 1, true, 1);
			DateTime start = DateTime.Now;
			AddScheduleWithStartAndEnd(schedule, start.AddMinutes(-1), start.AddHours(23));
			Entity engagement = CreateEngagmentOpportunity(start, start);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
				new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));
			InitMocks(engagement);
			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordCreate(schedule);
			});
		}

		[Test]
		public void CannotCreateScheduleWhichEndOneMinuteLater()
		{
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, 1, true, 1);
			DateTime start = DateTime.Now;
			AddScheduleWithStartAndEnd(schedule, start.AddHours(23), start.AddHours(23).AddMinutes(60));
			Entity engagement = CreateEngagmentOpportunity(start, start);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
				new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));
			InitMocks(engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordCreate(schedule);
			});
		}

		[Test]
		public void MinGreaterThanMaxParticipants()
		{
			DateTime endDate = DateTime.Now;
			DateTime startDate = endDate.AddHours(1);
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, 12, true, 1);
			AddScheduleWithStartAndEnd(schedule, startDate, endDate);
			Entity engagement = CreateEngagmentOpportunity(DateTime.Now, DateTime.Now);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
				new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));
			InitMocks(engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				entityService.ValidateMinMaxParticipantsOnRecordCreation(schedule);
			});
		}

		[Test]
		public void OnlyMaxValueChangedUpdateEvent()
		{
			Entity preImage = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(preImage, true, 10, false, null);
			Entity target = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(target, false, null, true, 2);
			Entity engagement = CreateEngagmentOpportunity(DateTime.Now, DateTime.Now);

			InitMocksForUpdateEvent(preImage, target, engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				entityService.ValidateMinMaxParticipantsOnRecordUpdate(target, preImage);
			});
		}

		[Test]
		public void OnlyMinValueChangedUpdateEvent()
		{
			Entity preImage = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(preImage, false, null, true, 10);
			Entity target = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(target, true, 21, false, null);
			Entity engagement = CreateEngagmentOpportunity(DateTime.Now, DateTime.Now);

			InitMocksForUpdateEvent(preImage, target, engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);
			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				entityService.ValidateMinMaxParticipantsOnRecordUpdate(target, preImage);
			});
		}

		[Test]
		public void MinNotSpecifiedMaxSpecified()
		{
			DateTime endDate = DateTime.Now;
			DateTime startDate = endDate.AddHours(1);
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, null, true, 1);
			AddScheduleWithStartAndEnd(schedule, startDate, endDate);
			Entity engagement = CreateEngagmentOpportunity(DateTime.Now, DateTime.Now);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
							new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));
			InitMocks(engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				entityService.ValidateMinMaxParticipantsOnRecordUpdate(engagement,schedule);
			});
		}

		[Test]
		public void ValidateDateRangeScheduleStartEarlier()
		{
			DateTime eoStart = DateTime.Now.Subtract(TimeSpan.FromDays(10));
			DateTime eoEnd = DateTime.Now;
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, null, true, null);
			AddScheduleWithStartAndEnd(schedule, eoStart.Subtract(TimeSpan.FromDays(1)), eoEnd);
			Entity engagement = CreateEngagmentOpportunity(eoStart, eoEnd);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
							new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));

			InitMocks(engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordUpdate(engagement, schedule);
			});
		}

		[Test]
		public void StartDateAfterEndDateByAnHour()
		{
			DateTime endDate = DateTime.Now;
			DateTime startDate = endDate.AddHours(1);
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, 1, true, 2);
			AddScheduleWithStartAndEnd(schedule, startDate, endDate);
			Entity engagement = CreateEngagmentOpportunity(DateTime.Now, DateTime.Now);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
							new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));

			InitMocks(engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordUpdate(engagement, schedule);
			});
		}

		[Test]
		public void ScheduleDateAreOutOfRangeOfEOdates()
		{
			Entity preImage = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(preImage, true, 10, true, 10);
			Entity target = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(target, true, 10, true, 10);
			Entity engagement = CreateEngagmentOpportunity(DateTime.Now, DateTime.Now.AddDays(3));
			AddScheduleWithStartAndEnd(target, DateTime.Now, DateTime.Now.AddDays(4));
		
			InitMocksForUpdateEvent(preImage, target, engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordUpdate(target, preImage);
			});
		}

		[Test]
		public void ValidateDateRangeEngagementNoEndDate()
		{
			DateTime eoStart = DateTime.Now.Subtract(TimeSpan.FromDays(10));
			DateTime? eoEnd = null;
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, null, true, null);
			AddScheduleWithStartAndEnd(schedule, eoStart, eoStart.AddDays(1));
			Entity engagement = CreateEngagmentOpportunity(eoStart, eoEnd);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
							new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));

			InitMocks(engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.DoesNotThrow(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordCreate(schedule);
			});
		}

		[Test]
		public void ValidateDateRangeScheduleEndWholeDay()
		{
			DateTime eoStart = DateTime.Now.AddDays(-10);
			DateTime eoEnd = DateTime.Now;
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, null, true, null);
			AddScheduleWithStartAndEnd(schedule, eoStart, eoStart.AddHours(1));
			Entity engagement = CreateEngagmentOpportunity(eoStart, eoEnd);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
							new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));

			InitMocks(engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.DoesNotThrow(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordCreate(schedule);
			});
		}

		[Test]
		public void ScheduleDateAreSameAsEOdates()
		{
			Entity preImage = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(preImage, true, 10, true, 10);
			Entity target = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(target, true, 10, true, 10);
			Entity engagement = CreateEngagmentOpportunity(DateTime.Now, DateTime.Now.AddDays(3));
			AddScheduleWithStartAndEnd(preImage, DateTime.Now, DateTime.Now.AddDays(3).AddMinutes(-1));

			InitMocksForUpdateEvent(preImage, target, engagement);
		
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.DoesNotThrow(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordUpdate(preImage, target);
			});
		}

		[Test]
		public void ValidateDateRangeStartAndEndNull()
		{
			DateTime eoStart = DateTime.Now.Subtract(TimeSpan.FromDays(10));
			DateTime eoEnd = DateTime.Now;
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, null, true, null);
			AddScheduleWithStartAndEnd(schedule, null, null);
			Entity engagement = CreateEngagmentOpportunity(eoStart, eoEnd);

			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
							new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));

			InitMocks(engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.DoesNotThrow(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordCreate(schedule);
			});
		}

		[Test]
		public void ValidateDateRangeStartAndEndExactMatch()
		{
			DateTime eoStart = DateTime.Now.Subtract(TimeSpan.FromDays(10));
			DateTime eoEnd = DateTime.Now;
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, null, true, null);
			AddScheduleWithStartAndEnd(schedule, eoStart, eoEnd);
			Entity engagement = CreateEngagmentOpportunity(eoStart, eoEnd);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
							new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));

			InitMocks(engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.DoesNotThrow(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordCreate(schedule);
			});
		}

		[Test]
		public void ValidStartAndEndDate()
		{
			Entity schedule = new Entity();
			AddMinMaxParticipantEntityForUpdateEvent(schedule, true, 1, true, 2);
			DateTime timeRef = DateTime.Now;
			AddScheduleWithStartAndEnd(schedule, timeRef, timeRef);
			Entity engagement = CreateEngagmentOpportunity(timeRef, timeRef);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity,
									new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagement.Id));

			InitMocks(engagement);
			var entityService = new EngagementOpportunityScheduleService(orgService.Object, tracingService.Object, localizationHelper.Object);

			Assert.DoesNotThrow(delegate
			{
				entityService.ValidateScheduleIsInDateRangeOnRecordCreate(schedule);
			});
		}

		private Entity CreateEngagmentOpportunity(DateTime? start, DateTime? end)
		{
			Entity schedule = new Entity();
			schedule.Attributes.Add(EngagementOpportunityDef.StartingDate, start);
			schedule.Attributes.Add(EngagementOpportunityDef.EndingDate, end);
			schedule.Id = Guid.NewGuid();
			return schedule;
		}

		private Entity AddScheduleWithStartAndEnd(Entity schedule, DateTime? start, DateTime? end)
		{
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.StartDate, start);
			schedule.Attributes.Add(EngagementOpportunityScheduleDef.EndDate, end);
			return schedule;
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

		private void InitMocks(Entity engagementOpportunity) 
		{
			this.orgService
					.Setup(x => x.Retrieve(It.IsAny<String>(), It.IsAny<Guid>(), It.IsAny<ColumnSet>()))
					.Returns(engagementOpportunity);
		}

		private void InitMocksForUpdateEvent(
			Entity preImage, Entity target, Entity engagementOpportunity)
		{
			var entityRef = new EntityReference(EngagementOpportunityScheduleDef.EngagementOpportunity, engagementOpportunity.Id);
			target.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity, entityRef);
			preImage.Attributes.Add(EngagementOpportunityScheduleDef.EngagementOpportunity, entityRef);

			this.orgService
					.Setup(x => x.Retrieve(It.IsAny<String>(), It.IsAny<Guid>(), It.IsAny<ColumnSet>()))
					.Returns(engagementOpportunity);
		}
	}
}