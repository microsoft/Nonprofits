using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using Plugins.Localization;
using Plugins.Resx;
using Plugins.Services;
using Plugins.Strategies;

namespace Plugins.Tests
{
	[TestFixture]
	public class RegressionTests
	{
		private readonly Mock<ITracingService> tracingService = new Mock<ITracingService>();

		[Test]
		public void RetrieveAllFollowsPagingCookies()
		{
			var service = new Mock<IOrganizationService>();
			var pages = new Queue<EntityCollection>(new[]
			{
				new EntityCollection(new List<Entity> { new Entity("contact", Guid.NewGuid()) }) { MoreRecords = true, PagingCookie = "cookie-1" },
				new EntityCollection(new List<Entity> { new Entity("contact", Guid.NewGuid()) }) { MoreRecords = true, PagingCookie = "cookie-2" },
				new EntityCollection(new List<Entity> { new Entity("contact", Guid.NewGuid()) }) { MoreRecords = false }
			});
			var requestedPages = new List<(int page, string cookie)>();
			service.Setup(s => s.RetrieveMultiple(It.IsAny<QueryBase>()))
				.Callback<QueryBase>(q => requestedPages.Add((((QueryExpression)q).PageInfo.PageNumber, ((QueryExpression)q).PageInfo.PagingCookie)))
				.Returns(() => pages.Dequeue());

			var records = Utilities.RetrieveAll(service.Object, new QueryExpression("contact"));

			records.Should().HaveCount(3);
			requestedPages.Should().Equal((1, null), (2, "cookie-1"), (3, "cookie-2"));
		}

		[Test]
		public void QueryByAttributeExtRequestsEachPageOnce()
		{
			var service = new Mock<IOrganizationService>();
			var pages = new Queue<EntityCollection>(new[]
			{
				new EntityCollection(new List<Entity> { new Entity("msnfp_participationschedule", Guid.NewGuid()) }) { MoreRecords = true, PagingCookie = "cookie-1" },
				new EntityCollection(new List<Entity> { new Entity("msnfp_participationschedule", Guid.NewGuid()) }) { MoreRecords = false }
			});
			var requestedPages = new List<(int page, string cookie)>();
			service.Setup(s => s.RetrieveMultiple(It.IsAny<QueryBase>()))
				.Callback<QueryBase>(q => requestedPages.Add((((QueryByAttribute)q).PageInfo.PageNumber, ((QueryByAttribute)q).PageInfo.PagingCookie)))
				.Returns(() => pages.Dequeue());

			var result = Utilities.QueryByAttributeExt(service.Object, "msnfp_participationschedule", "msnfp_participationid", Guid.NewGuid(), new ColumnSet("msnfp_schedulestatus"));

			requestedPages.Should().Equal((1, null), (2, "cookie-1"));
			result.Entities.Should().HaveCount(2);
			result.TotalRecordCount.Should().Be(2);
		}

		[Test]
		public void RetrieveAllPagesFetchXml()
		{
			var service = new Mock<IOrganizationService>();
			var fetches = new List<string>();
			service.Setup(s => s.RetrieveMultiple(It.IsAny<QueryBase>()))
				.Callback<QueryBase>(q => fetches.Add(((FetchExpression)q).Query))
				.Returns(() => new EntityCollection(new List<Entity> { new Entity("contact", Guid.NewGuid()) })
				{
					MoreRecords = fetches.Count == 1,
					PagingCookie = "<cookie page=\"1\" />"
				});

			var records = Utilities.RetrieveAll(service.Object, "<fetch><entity name='contact' /></fetch>");

			records.Should().HaveCount(2);
			fetches[0].Should().Contain("page=\"1\"");
			fetches[1].Should().Contain("page=\"2\"").And.Contain("paging-cookie=");
		}

		[Test]
		public void CalculateShiftCountsByEOResetsCountersWhenNothingIsLeft()
		{
			var eoRef = new EntityReference("msnfp_engagementopportunity", Guid.NewGuid());
			var service = new Mock<IOrganizationService>();
			service.Setup(s => s.RetrieveMultiple(It.IsAny<QueryBase>())).Returns(new EntityCollection());
			service.Setup(s => s.Retrieve(eoRef.LogicalName, eoRef.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity(eoRef.LogicalName, eoRef.Id)
				{
					["msnfp_filledshifts"] = 3,
					["msnfp_cancelledshifts"] = 1,
					["msnfp_noshow"] = 2,
					["msnfp_completed"] = 1
				});
			Entity update = null;
			service.Setup(s => s.Update(It.IsAny<Entity>())).Callback<Entity>(e => update = e);

			Utilities.CalculateShiftCountsByEO(service.Object, tracingService.Object, eoRef);

			service.Verify(s => s.RetrieveMultiple(It.IsAny<QueryBase>()), Times.Once);
			update.Should().NotBeNull();
			update["msnfp_filledshifts"].Should().Be(0);
			update["msnfp_cancelledshifts"].Should().Be(0);
			update["msnfp_noshow"].Should().Be(0);
			update["msnfp_completed"].Should().Be(0);
		}

		[Test]
		public void CopyActivityPartiesSkipsUnresolvedParties()
		{
			var service = new Mock<IOrganizationService>();
			var parties = new[] { new Entity("activityparty"), new Entity("activityparty") { ["partyid"] = new EntityReference("systemuser", Guid.NewGuid()) } };

			var copied = Utilities.CopyActivityParties(service.Object, parties);

			copied.Should().HaveCount(1);
		}

		[Test]
		public void SettingNameUsesOptionLabelWhenTargetHasNoFormattedValues()
		{
			var eoRef = new EntityReference("msnfp_engagementopportunity", Guid.NewGuid());
			var target = new Entity("msnfp_engagementopportunitysetting")
			{
				["msnfp_engagementopportunityid"] = eoRef,
				["msnfp_settingtype"] = new OptionSetValue((int)EngagementOpportunitySettingSettingType.Message),
				["msnfp_messagewhensenttype"] = new OptionSetValue((int)EngagementOpportunitySettingMessageEventType.SignUpApproved)
			};
			var service = new Mock<IOrganizationService>();
			service.Setup(s => s.Retrieve(eoRef.LogicalName, eoRef.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity(eoRef.LogicalName, eoRef.Id) { ["msnfp_engagementopportunitytitle"] = "Beach Cleanup" });
			var metadata = new PicklistAttributeMetadata
			{
				OptionSet = new OptionSetMetadata(new OptionMetadataCollection
				{
					new OptionMetadata(new Label { UserLocalizedLabel = new LocalizedLabel("Sign-Up Approved", 1033) }, (int)EngagementOpportunitySettingMessageEventType.SignUpApproved)
				})
			};
			service.Setup(s => s.Execute(It.IsAny<RetrieveAttributeRequest>()))
				.Returns(new RetrieveAttributeResponse { Results = { ["AttributeMetadata"] = metadata } });

			var sut = new EngagementOpportunitySettingOnPreCreateStrategy(tracingService.Object, CreateContext("Create", target).Object, new Mock<ILocalizationHelper<Labels>>().Object, CreateServiceProvider(service).Object);
			sut.Run();

			target["msnfp_name"].Should().Be("Beach Cleanup - Setting - Sign-Up Approved");
		}

		[Test]
		public void SettingNameFallsBackWhenOptionLabelCannotBeRead()
		{
			var eoRef = new EntityReference("msnfp_engagementopportunity", Guid.NewGuid());
			var target = new Entity("msnfp_engagementopportunitysetting")
			{
				["msnfp_engagementopportunityid"] = eoRef,
				["msnfp_settingtype"] = new OptionSetValue((int)EngagementOpportunitySettingSettingType.Message),
				["msnfp_messagewhensenttype"] = new OptionSetValue((int)EngagementOpportunitySettingMessageEventType.EngagementCompleted)
			};
			var service = new Mock<IOrganizationService>();
			service.Setup(s => s.Retrieve(eoRef.LogicalName, eoRef.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity(eoRef.LogicalName, eoRef.Id) { ["msnfp_engagementopportunitytitle"] = "Food Drive" });
			service.Setup(s => s.Execute(It.IsAny<OrganizationRequest>())).Throws(new InvalidOperationException("no metadata"));

			var sut = new EngagementOpportunitySettingOnPreCreateStrategy(tracingService.Object, CreateContext("Create", target).Object, new Mock<ILocalizationHelper<Labels>>().Object, CreateServiceProvider(service).Object);
			sut.Run();

			target["msnfp_name"].Should().Be("Food Drive - Setting - EngagementCompleted");
		}

		[Test]
		public void PublicRecordIsRemovedWhenStatusIsCleared()
		{
			var target = new Entity("msnfp_engagementopportunity", Guid.NewGuid());
			var context = CreateContext("Update", target);
			context.SetupGet(c => c.PreEntityImages).Returns(new EntityImageCollection
			{
				{ "engagementopportunityimage", new Entity(target.LogicalName, target.Id) { ["msnfp_engagementopportunitystatus"] = new OptionSetValue((int)EngagementOpportunityStatus.PublishToWeb) } }
			});
			context.SetupGet(c => c.PostEntityImages).Returns(new EntityImageCollection
			{
				{ "engagementopportunityimage", new Entity(target.LogicalName, target.Id) }
			});
			var publicId = Guid.NewGuid();
			var service = new Mock<IOrganizationService>();
			service.Setup(s => s.RetrieveMultiple(It.IsAny<QueryBase>()))
				.Returns(new EntityCollection(new List<Entity> { new Entity("msnfp_publicengagementopportunity", publicId) }) { TotalRecordCount = 1 });

			var sut = new EngagementOpportunityOnPostPublicPublishStrategy(tracingService.Object, context.Object, CreateServiceProvider(service).Object);
			sut.Run();

			service.Verify(s => s.Delete("msnfp_publicengagementopportunity", publicId), Times.Once);
		}

		[Test]
		public void ShiftPostUpdateReadsEngagementOpportunityFromPostImage()
		{
			var eoRef = new EntityReference("msnfp_engagementopportunity", Guid.NewGuid());
			var target = new Entity("msnfp_engagementopportunityschedule", Guid.NewGuid()) { ["msnfp_maximum"] = 5 };
			var context = CreateContext("Update", target);
			context.SetupGet(c => c.PostEntityImages).Returns(new EntityImageCollection
			{
				{ "Target", new Entity(target.LogicalName, target.Id) { ["msnfp_engagementopportunity"] = eoRef, ["msnfp_maximum"] = 5 } }
			});
			context.SetupGet(c => c.SharedVariables).Returns(new ParameterCollection());
			var scheduleService = new Mock<IEngagementOpportunityScheduleService>();

			var sut = new EngagementOpportunityScheduleOnPostUpdateAndCreateStrategy(tracingService.Object, context.Object, CreateServiceProvider(new Mock<IOrganizationService>()).Object, new Mock<ILocalizationHelper<Labels>>().Object, scheduleService.Object);
			sut.Run();

			scheduleService.Verify(s => s.RecalculateMinMaxForEngOpportunity(It.Is<EntityReference>(r => r.Id == eoRef.Id)), Times.Once);
		}

		[Test]
		public void GroupMembershipPreDeleteIgnoresMissingLookups()
		{
			var context = new Mock<IPluginExecutionContext>();
			context.SetupGet(c => c.PreEntityImages).Returns(new EntityImageCollection
			{
				{ "PreImage", new Entity("msnfp_groupmembership", Guid.NewGuid()) { ["msnfp_groupid"] = new EntityReference("msnfp_group", Guid.NewGuid()) } }
			});
			var service = new Mock<IOrganizationService>();

			var sut = new GroupMembershipOnPreDeleteStrategy(tracingService.Object, context.Object, CreateServiceProvider(service).Object);

			Assert.DoesNotThrow(() => sut.Run());
			service.Verify(s => s.RetrieveMultiple(It.IsAny<QueryBase>()), Times.Never);
		}

		private static Mock<IPluginExecutionContext> CreateContext(string messageName, Entity target)
		{
			var context = new Mock<IPluginExecutionContext>();
			context.SetupGet(c => c.MessageName).Returns(messageName);
			context.SetupGet(c => c.InputParameters).Returns(new ParameterCollection { { "Target", target } });
			context.SetupGet(c => c.PreEntityImages).Returns(new EntityImageCollection());
			context.SetupGet(c => c.PostEntityImages).Returns(new EntityImageCollection());
			return context;
		}

		private static Mock<IOrganizationServiceProvider> CreateServiceProvider(Mock<IOrganizationService> service)
		{
			var provider = new Mock<IOrganizationServiceProvider>();
			provider.Setup(p => p.CreateCurrentUserOrganizationService()).Returns(service.Object);
			provider.Setup(p => p.CreateSystemUserOrganizationService()).Returns(service.Object);
			return provider;
		}
	}
}
