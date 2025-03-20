using System;
using System.Collections.Generic;
using FluentAssertions;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using Plugins.Tests.Mock;

namespace Plugins.Tests
{
	class UtilitiesTests
	{
		private readonly Mock<ITracingService> tracingService = new Mock<ITracingService>();

		[Test]
		public void CalculateParticpationsCountsByEOException()
		{
			var organizationService = new Mock<IOrganizationService>();
			var id = Guid.Parse("0c74cf38-f666-4215-bdd5-f9287b8a50df");
			EntityReference entityReference = CreateEntityReference("SomeEntity", id);
			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				Utilities
				.CalculateParticpationsCountsByEO(organizationService.Object, entityReference);
			});
		}

		[Test]
		public void CalculateParticpationsCountsByEOZeroParticipations()
		{
			var id = Guid.Parse("0c74cf38-f666-4215-bdd5-f9287b8a50df");
			var entityReference = CreateEntityReference("msnfp_engagementopportunity", id);
			var organizationService = CreateOrganizationServiceWithStatus(new List<ParticipationStatus>());
			Utilities.CalculateParticpationsCountsByEO(organizationService, entityReference);

			EntityCollection updatesCollection = organizationService.GetUpdateCollection();
			updatesCollection.Entities.Count.Should().Be(1);

			Entity update = updatesCollection.Entities[0];
			ValidateUpdateEntity(update, 0, 0, 0, 0);
		}

		[Test]
		public void CalculateParticpationsCountsByEOMultipleParticipations()
		{
			var id = Guid.Parse("0c74cf38-f666-4215-bdd5-f9287b8a50df");
			var entityReference = CreateEntityReference("msnfp_engagementopportunity", id);
			var allStatus = new List<ParticipationStatus>(new ParticipationStatus[] {
				ParticipationStatus.Approved, ParticipationStatus.Cancelled, ParticipationStatus.Dismissed
				, ParticipationStatus.Cancelled, ParticipationStatus.InReview, ParticipationStatus.NeedsReview
			});
			var organizationService = CreateOrganizationServiceWithStatus(allStatus);
			Utilities.CalculateParticpationsCountsByEO(organizationService, entityReference);

			EntityCollection updatesCollection = organizationService.GetUpdateCollection();
			updatesCollection.Entities.Count.Should().Be(1);

			Entity update = updatesCollection.Entities[0];
			ValidateUpdateEntity(update, 6, 1, 2, 2);
		}

		[Test]
		public void CalculateEOScheduleCurrentCountException()
		{
			var organizationService = new Mock<IOrganizationService>();
			var id = Guid.Parse("0c74cf38-f666-4215-bdd5-f9287b8a50df");
			EntityReference entityReference = CreateEntityReference("SomeEntity", id);
			Assert.Throws<InvalidPluginExecutionException>(delegate
			{
				Utilities
				.CalculateEOScheduleCurrentCount(organizationService.Object, this.tracingService.Object, entityReference);
			});
		}

		[Test]
		public void CalculateEOSScheduleCurrentCountResultUpdate()
		{
			var id = Guid.Parse("0c74cf38-f666-4215-bdd5-f9287b8a50df");
			var entityReference = CreateEntityReference("msnfp_engagementopportunityschedule", id);
			var schedule = new List<Schedule>(new Schedule[]
			{
				new Schedule(id, 3, "Active")
			});
			var organizationService = CreateOrganizationServiceWithSchedule("msnfp_engagementopportunityschedule", schedule);
			var shifts = new List<Shift>(new Shift[]
			{
				new Shift(id, "Active", ParticipationScheduleStatus.Completed)
			});
			AddShiftsToOrganizationService(organizationService, shifts);
			Utilities.CalculateEOScheduleCurrentCount(organizationService, tracingService.Object, entityReference);
			EntityCollection updateCollection = organizationService.GetUpdateCollection();
			updateCollection.Entities.Count.Should().Be(1);

			Entity update = updateCollection.Entities[0];
			update.LogicalName.Should().Be("msnfp_engagementopportunityschedule");
			update["msnfp_number"].Should().Be(1);
		}

		[Test]
		public void CalculateEOSScheduleCurrentCountResultNoUpdate()
		{
			var id = Guid.Parse("0c74cf38-f666-4215-bdd5-f9287b8a50df");
			var entityReference = CreateEntityReference("msnfp_engagementopportunityschedule", id);
			var schedule = new List<Schedule>(new Schedule[]
			{
				new Schedule(id, 2, "Active")
			});
			var organizationService = CreateOrganizationServiceWithSchedule("msnfp_engagementopportunityschedule", schedule);
			var shifts = new List<Shift>(new Shift[]
			{
				new Shift(id, "Active", ParticipationScheduleStatus.Completed),
				new Shift(id, "Active", ParticipationScheduleStatus.Pending)
			});
			AddShiftsToOrganizationService(organizationService, shifts);
			Utilities.CalculateEOScheduleCurrentCount(organizationService, tracingService.Object, entityReference);
			EntityCollection updateCollection = organizationService.GetUpdateCollection();
			updateCollection.Entities.Count.Should().Be(0);
		}

		[Test]
		public void CalculateEOSScheduleCurrentCountRetrieveQuery()
		{
			var id = Guid.Parse("0c74cf38-f666-4215-bdd5-f9287b8a50df");
			var entityReference = CreateEntityReference("msnfp_engagementopportunityschedule", id);
			var schedule = new List<Schedule>(new Schedule[]
			{
				new Schedule(id, 2, "Active")
			});
			var organizationService = CreateOrganizationServiceWithSchedule("msnfp_engagementopportunityschedule", schedule);
			var shifts = new List<Shift>();
			AddShiftsToOrganizationService(organizationService, shifts);
			Utilities.CalculateEOScheduleCurrentCount(organizationService, tracingService.Object, entityReference);

			var invokedQueries = organizationService.GetAllInvokedRetriveQueries();
			invokedQueries.Count.Should().Be(1);

			QueryExpression query = (QueryExpression)invokedQueries[0];
			FilterExpression expression = query.Criteria;
			expression.FilterOperator.Should().Be(LogicalOperator.And);
			expression.Conditions.Count.Should().Be(3);
			expression.Conditions[0].AttributeName.Should().Be("msnfp_engagementopportunityscheduleid");
			expression.Conditions[0].Operator.Should().Be(ConditionOperator.Equal);
			expression.Conditions[0].Values.Count.Should().Be(1);
			expression.Conditions[0].Values[0].Should().Be(id);

			expression.Conditions[1].AttributeName.Should().Be("statecode");
			expression.Conditions[1].Operator.Should().Be(ConditionOperator.Equal);
			expression.Conditions[1].Values.Count.Should().Be(1);
			expression.Conditions[1].Values[0].Should().Be("Active");

			expression.Conditions[2].AttributeName.Should().Be("msnfp_schedulestatus");
			expression.Conditions[2].Operator.Should().Be(ConditionOperator.In);
			expression.Conditions[2].Values.Count.Should().Be(2);
			expression.Conditions[2].Values[0].Should().Be((int)ParticipationScheduleStatus.Pending);
			expression.Conditions[2].Values[1].Should().Be((int)ParticipationScheduleStatus.Completed);
		}

		[Test]
		public void CancelPendingParticipationValidateQuery()
		{
			var id = Guid.Parse("0c74cf38-f666-4215-bdd5-f9287b8a50df");
			var participations = new List<Participation>(new Participation[]
			{
				new Participation(ParticipationStatus.InReview),
			});
			var organizationService = CreateOrganizationServiceWithParticipations(participations);
			Utilities.CancelAllPendingParticipations(organizationService, id);
			var invokedQueries = organizationService.GetAllInvokedRetriveQueries();
			invokedQueries.Count.Should().Be(1);
			FilterExpression expression = (invokedQueries[0] as QueryExpression).Criteria;
			expression.Conditions.Count.Should().Be(2);
			expression.FilterOperator.Should().Be(LogicalOperator.And);
			expression.Conditions[0].AttributeName.Should().Be("msnfp_contactid");
			expression.Conditions[0].Operator.Should().Be(ConditionOperator.Equal);
			expression.Conditions[0].Values.Count.Should().Be(1);
			expression.Conditions[0].Values[0].Should().Be(id);

			expression.Conditions[1].AttributeName.Should().Be("msnfp_status");
			expression.Conditions[1].Operator.Should().Be(ConditionOperator.In);
			expression.Conditions[1].Values.Count.Should().Be(2);
			expression.Conditions[1].Values[0].Should().Be((int)ParticipationStatus.InReview);
			expression.Conditions[1].Values[1].Should().Be((int)ParticipationStatus.NeedsReview);
		}

		[Test]
		public void CancelPendingParticipationValidateUpdates()
		{
			var id = Guid.Parse("0c74cf38-f666-4215-bdd5-f9287b8a50df");
			var participations = new List<Participation>(new Participation[]
			{
				new Participation(ParticipationStatus.InReview),
			});
			var organizationService = CreateOrganizationServiceWithParticipations(participations);
			Utilities.CancelAllPendingParticipations(organizationService, id);

			EntityCollection updateCollection = organizationService.GetUpdateCollection();
			updateCollection.Entities.Count.Should().Be(1);
			updateCollection.Entities[0].LogicalName.Should().Be("msnfp_participation");
			updateCollection.Entities[0]["msnfp_status"].Should().Be(new OptionSetValue((int)ParticipationStatus.Cancelled));
		}
		[Test]
		public void CopyActivityPartiesTestEmailAddress()
		{
			Guid[] guids = new Guid[] { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
			var organizationService = CreateOrganizationServiceWithContacts("contact", false, guids);

			List<Entity> activityParties = new List<Entity>();
			foreach (Guid guid in guids)
			{
				Entity entity = new Entity("activityparty");
				entity["partyid"] = new EntityReference("contact", guid);
				entity["donotemail"] = false;
				activityParties.Add(entity);
			}
			Entity[] entities = Utilities.CopyActivityParties(organizationService, activityParties);
			entities.Length.Should().Be(guids.Length - 1);

		}
		[Test]
		public void CopyActivityPartiesTestDoNotEmail()
		{
			Guid[] guids = new Guid[] { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
			var organizationService = CreateOrganizationServiceWithContacts("contact", true, guids);

			List<Entity> activityParties = new List<Entity>();
			foreach (Guid guid in guids)
			{
				Entity entity = new Entity("activityparty");
				entity["partyid"] = new EntityReference("contact", guid);
				entity["donotemail"] = true;
				activityParties.Add(entity);
			}
			Entity[] entities = Utilities.CopyActivityParties(organizationService, activityParties);
			entities.Length.Should().Be(0);

		}
		private OrganizationServiceMock CreateOrganizationServiceWithContacts(string logicalName, bool donotemail, params Guid[] ids)
		{
			var organizationService = new OrganizationServiceMock();
			for (int i = 0; i < (ids.Length - 1); i++)
			{
				Entity entity = new Entity(logicalName);
				entity.LogicalName = logicalName;
				entity.Id = ids[i];
				entity["emailaddress1"] = i < (ids.Length - 1) ? "test@gmail.com" : null;
				entity["emailaddress2"] = null;
				entity["emailaddress3"] = null;
				entity["donotemail"] = donotemail;
				organizationService.AddEntity(entity);
			}

			return organizationService;
		}

		private void ValidateUpdateEntity(Entity update, int appliedCount, int approvedCount, int needsReviewCount, int cancelledCount)
		{
			update["msnfp_appliedparticipants"].Should().Be(appliedCount);
			update["msnfp_number"].Should().Be(approvedCount);
			update["msnfp_needsreviewedparticipants"].Should().Be(needsReviewCount);
			update["msnfp_cancelledparticipants"].Should().Be(cancelledCount);
		}

		private struct Schedule
		{
			public Schedule(Guid scheduleId, int msfnpNumber, string stateCode)
			{
				this.scheduleId = scheduleId;
				this.msfnpNumber = msfnpNumber;
				this.stateCode = stateCode;
			}
			public Guid scheduleId { get; }
			public int msfnpNumber { get; }

			public string stateCode { get; }
		}

		private struct Shift
		{
			public Shift(Guid msnfpEngagementopportunityscheduleid, string stateCode
				, ParticipationScheduleStatus status)
			{
				this.msnfpEngagementopportunityscheduleid = msnfpEngagementopportunityscheduleid;
				this.stateCode = stateCode;
				this.status = status;
			}
			public Guid msnfpEngagementopportunityscheduleid { get; set; }
			public string stateCode { get; set; }

			public ParticipationScheduleStatus status { get; set; }
		}

		private EntityReference CreateEntityReference(string logicalName, Guid id)
		{
			return new EntityReference(logicalName, id);
		}

		private OrganizationServiceMock CreateOrganizationServiceWithStatus(List<ParticipationStatus> participationStatus)
		{
			var organizationService = new OrganizationServiceMock();
			foreach (ParticipationStatus status in participationStatus)
			{
				Entity entity = new Entity("msnfp_participation");
				entity["msnfp_status"] = new OptionSetValue((int)status);
				organizationService.AddEntity(entity);
			}

			return organizationService;
		}

		private OrganizationServiceMock CreateOrganizationServiceWithSchedule(string logicalName, List<Schedule> schedules)
		{
			var organizationService = new OrganizationServiceMock();
			foreach (Schedule schedule in schedules)
			{
				Entity entity = new Entity("msnfp_participation");
				entity.LogicalName = logicalName;
				entity.Id = schedule.scheduleId;
				entity["msnfp_number"] = schedule.msfnpNumber;
				entity["statecode"] = schedule.stateCode;
				organizationService.AddEntity(entity);
			}

			return organizationService;
		}

		private void AddShiftsToOrganizationService(OrganizationServiceMock organizationService, List<Shift> shifts)
		{
			foreach (Shift shift in shifts)
			{
				Entity entity = new Entity("msnfp_participationschedule");
				Guid id = Guid.NewGuid();
				entity.Id = id;
				entity["msnfp_engagementopportunityscheduleid"] = shift.msnfpEngagementopportunityscheduleid;
				entity["statecode"] = shift.stateCode;
				entity["msnfp_schedulestatus"] = new OptionSetValue((int)shift.status);
				organizationService.AddEntity(entity);
			}
		}

		private struct Participation
		{
			public Participation(ParticipationStatus status)
			{
				this.status = status;
			}
			public readonly ParticipationStatus status;
		}

		private OrganizationServiceMock CreateOrganizationServiceWithParticipations(List<Participation> participations)
		{
			var organizationService = new OrganizationServiceMock();

			foreach (Participation participation in participations)
			{
				Entity entity = new Entity("msnfp_participation");
				Guid id = Guid.NewGuid();
				entity.Id = id;
				entity["msnfp_status"] = new OptionSetValue((int)participation.status);
				organizationService.AddEntity(entity);
			}

			return organizationService;
		}

		#region IsDateTimeInRange
		[Test]
		public void IsDateTimeInRange_DifferentYear()
		{
			DateTime dateToCompare = new DateTime(2022, 01, 01);
			DateTime startDate = new DateTime(2021, 12, 31);
			DateTime? endDate = new DateTime(2022, 01, 02);

			Assert.IsTrue(Utilities.IsDateTimeInRange(dateToCompare, startDate, endDate));
		}

		[Test]
		public void IsDateTimeInRange_SameDay()
		{
			DateTime dateToCompare = new DateTime(2022, 01, 01, 08, 30, 00);
			DateTime startDate = new DateTime(2022, 01, 01, 08, 29, 00);
			DateTime? endDate = new DateTime(2022, 01, 01, 08, 31, 00);

			Assert.IsTrue(Utilities.IsDateTimeInRange(dateToCompare, startDate, endDate));
		}

		[Test]
		public void IsDateTimeInRange_SameTime()
		{
			DateTime dateToCompare = new DateTime(2022, 01, 01, 08, 30, 00);
			DateTime startDate = new DateTime(2022, 01, 01, 08, 30, 00);
			DateTime? endDate = new DateTime(2022, 01, 01, 08, 30, 00);

			Assert.IsTrue(Utilities.IsDateTimeInRange(dateToCompare, startDate, endDate));

		}

		[Test]
		public void IsDateTimeInRange_GreaterStartDate()
		{
			DateTime dateToCompare = new DateTime(2022, 01, 03);
			DateTime startDate = new DateTime(2022, 01, 02);
			DateTime? endDate = new DateTime(2022, 01, 01);

			Assert.IsFalse(Utilities.IsDateTimeInRange(dateToCompare, startDate, endDate));

		}

		[Test]
		public void IsDateTimeInRange_EndDateNull()
		{
			DateTime dateToCompare = new DateTime(2022, 01, 02);
			DateTime startDate = new DateTime(2022, 01, 01);
			DateTime? endDate = default;

			Assert.IsTrue(Utilities.IsDateTimeInRange(dateToCompare, startDate, endDate));

			dateToCompare = new DateTime(2022, 01, 02);
			startDate = new DateTime(2022, 01, 03);
			endDate = default;
			Assert.IsFalse(Utilities.IsDateTimeInRange(dateToCompare, startDate, endDate));

		}
		#endregion IsDateTimeInRange

	}
}