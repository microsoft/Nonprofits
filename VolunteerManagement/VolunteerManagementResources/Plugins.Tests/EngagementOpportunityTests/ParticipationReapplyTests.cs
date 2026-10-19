using System;
using System.Linq;
using FluentAssertions;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;
using Plugins.Localization;
using Plugins.Resx;
using Plugins.Strategies;

namespace Plugins.Tests.EngagementOpportunityTests
{
	[TestFixture]
	public class ParticipationReapplyTests
	{
		private const int NeedsReview = (int)ParticipationStatus.NeedsReview;
		private const int Approved = (int)ParticipationStatus.Approved;
		private const int Cancelled = (int)ParticipationStatus.Cancelled;

		private readonly EntityReference contact = new EntityReference("contact", Guid.NewGuid());
		private readonly EntityReference opportunity = new EntityReference("msnfp_engagementopportunity", Guid.NewGuid());

		[Test]
		public void ReapplyOnAnOpenOpportunityIsAcceptedAndMarked()
		{
			var (target, context, _) = RunPreUpdate(Cancelled, NeedsReview);

			target.GetAttributeValue<OptionSetValue>("msnfp_status").Value.Should().Be(NeedsReview);
			context.SharedVariables[ParticipationOnPreUpdateStrategy.ReappliedSharedVariable].Should().Be(true);
		}

		[Test]
		public void ReapplyIsApprovedAutomaticallyWhenTheOpportunityAutoApproves()
		{
			var (target, _, _) = RunPreUpdate(Cancelled, NeedsReview, autoApprove: true);

			target.GetAttributeValue<OptionSetValue>("msnfp_status").Value.Should().Be(Approved);
		}

		[Test]
		[TestCase(EngagementOpportunityStatus.Closed)]
		[TestCase(EngagementOpportunityStatus.Cancelled)]
		public void ReapplyIsRejectedOnClosedOrCancelledOpportunities(EngagementOpportunityStatus status)
		{
			Assert.Throws<InvalidPluginExecutionException>(() => RunPreUpdate(Cancelled, NeedsReview, opportunityStatus: status));
		}

		[Test]
		public void ReapplyIsRejectedWhenTheOpportunityIsFull()
		{
			Assert.Throws<InvalidPluginExecutionException>(() => RunPreUpdate(Cancelled, NeedsReview, approvedVolunteers: 5, maximum: 5));
		}

		[Test]
		public void ReapplyIsRejectedForADeactivatedContact()
		{
			Assert.Throws<InvalidPluginExecutionException>(() => RunPreUpdate(Cancelled, NeedsReview, contactActive: false));
		}

		[Test]
		public void OtherStatusChangesAreNotTreatedAsReapply()
		{
			var (target, context, service) = RunPreUpdate(NeedsReview, Approved);

			target.GetAttributeValue<OptionSetValue>("msnfp_status").Value.Should().Be(Approved);
			context.SharedVariables.Contains(ParticipationOnPreUpdateStrategy.ReappliedSharedVariable).Should().BeFalse();
			service.Verify(s => s.Retrieve(It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<ColumnSet>()), Times.Never);
		}

		[Test]
		[TestCase(true, TestName = "PostUpdateSendsSignUpCompletedAfterReapply")]
		[TestCase(false, TestName = "PostUpdateSendsNoSignUpCompletedWithoutReapply")]
		public void PostUpdateTreatsReapplyLikeANewApplication(bool reapplied)
		{
			var participationId = Guid.NewGuid();
			var context = new Mock<IPluginExecutionContext>();
			var sharedVariables = new ParameterCollection();
			if (reapplied) sharedVariables[ParticipationOnPreUpdateStrategy.ReappliedSharedVariable] = true;
			context.SetupGet(c => c.InputParameters).Returns(new ParameterCollection { { "Target", new Entity("msnfp_participation", participationId) } });
			context.SetupGet(c => c.SharedVariables).Returns(sharedVariables);
			context.SetupGet(c => c.PreEntityImages).Returns(new EntityImageCollection { { "Image", new Entity("msnfp_participation", participationId) { ["msnfp_status"] = new OptionSetValue(Cancelled), ["msnfp_contactid"] = contact } } });
			context.SetupGet(c => c.PostEntityImages).Returns(new EntityImageCollection { { "Image", new Entity("msnfp_participation", participationId) { ["msnfp_status"] = new OptionSetValue(NeedsReview), ["msnfp_contactid"] = contact } } });

			var service = new Mock<IOrganizationService>();
			service.Setup(s => s.Retrieve("msnfp_participation", participationId, It.IsAny<ColumnSet>()))
				.Returns(new Entity("msnfp_participation", participationId) { ["msnfp_engagementopportunityid"] = opportunity, ["msnfp_contactid"] = contact });
			service.Setup(s => s.Retrieve("msnfp_engagementopportunity", opportunity.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity("msnfp_engagementopportunity", opportunity.Id) { ["msnfp_shifts"] = true });
			service.Setup(s => s.RetrieveMultiple(It.IsAny<QueryBase>())).Returns(new EntityCollection());

			new ParticipationOnPostUpdateStrategy(new Mock<ITracingService>().Object, context.Object, Provider(service).Object, new Mock<ILocalizationHelper<Labels>>().Object).Run();

			service.Verify(s => s.RetrieveMultiple(It.Is<QueryExpression>(q => q.EntityName == "msnfp_engagementopportunitysetting"
				&& q.Criteria.Conditions.Any(c => c.AttributeName == "msnfp_messagewhensenttype" && (int)c.Values[0] == (int)EngagementOpportunitySettingMessageEventType.SignUpCompleted))),
				reapplied ? Times.Once() : Times.Never());
		}

		private (Entity target, IPluginExecutionContext context, Mock<IOrganizationService> service) RunPreUpdate(
			int previousStatus, int requestedStatus, bool autoApprove = false,
			EngagementOpportunityStatus opportunityStatus = EngagementOpportunityStatus.PublishToWeb,
			int? approvedVolunteers = 1, int? maximum = 10, bool contactActive = true)
		{
			var participationId = Guid.NewGuid();
			var target = new Entity("msnfp_participation", participationId) { ["msnfp_status"] = new OptionSetValue(requestedStatus) };
			var preImage = new Entity("msnfp_participation", participationId)
			{
				["msnfp_status"] = new OptionSetValue(previousStatus),
				["msnfp_contactid"] = contact,
				["msnfp_engagementopportunityid"] = opportunity
			};
			var sharedVariables = new ParameterCollection();
			var context = new Mock<IPluginExecutionContext>();
			context.SetupGet(c => c.InputParameters).Returns(new ParameterCollection { { "Target", target } });
			context.SetupGet(c => c.PreEntityImages).Returns(new EntityImageCollection { { ParticipationOnPreUpdateStrategy.PreImageName, preImage } });
			context.SetupGet(c => c.SharedVariables).Returns(sharedVariables);

			var service = new Mock<IOrganizationService>();
			service.Setup(s => s.Retrieve("contact", contact.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity("contact", contact.Id) { ["statecode"] = new OptionSetValue(contactActive ? (int)ContactStatus.Active : (int)ContactStatus.InActive) });
			service.Setup(s => s.Retrieve("msnfp_engagementopportunity", opportunity.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity("msnfp_engagementopportunity", opportunity.Id)
				{
					["msnfp_engagementopportunitystatus"] = new OptionSetValue((int)opportunityStatus),
					["msnfp_automaticallyapproveallapplicants"] = autoApprove,
					["msnfp_number"] = approvedVolunteers,
					["msnfp_maximum"] = maximum
				});

			new ParticipationOnPreUpdateStrategy(new Mock<ITracingService>().Object, context.Object, Provider(service).Object, new Mock<ILocalizationHelper<Labels>>().Object).Run();
			return (target, context.Object, service);
		}

		private static Mock<IOrganizationServiceProvider> Provider(Mock<IOrganizationService> service)
		{
			var provider = new Mock<IOrganizationServiceProvider>();
			provider.Setup(p => p.CreateCurrentUserOrganizationService()).Returns(service.Object);
			return provider;
		}
	}
}
