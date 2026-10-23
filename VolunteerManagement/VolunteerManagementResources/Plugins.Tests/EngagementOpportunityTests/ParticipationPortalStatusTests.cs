using System;
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
	public class ParticipationPortalStatusTests
	{
		private readonly EntityReference contact = new EntityReference("contact", Guid.NewGuid());
		private readonly EntityReference opportunity = new EntityReference("msnfp_engagementopportunity", Guid.NewGuid());

		[Test]
		[TestCase(ParticipationStatus.NeedsReview, ParticipationStatus.Cancelled)]
		[TestCase(ParticipationStatus.InReview, ParticipationStatus.Cancelled)]
		[TestCase(ParticipationStatus.Approved, ParticipationStatus.Cancelled)]
		[TestCase(ParticipationStatus.Cancelled, ParticipationStatus.NeedsReview)]
		[TestCase(ParticipationStatus.NeedsReview, ParticipationStatus.NeedsReview)]
		[TestCase(ParticipationStatus.Approved, ParticipationStatus.Approved)]
		public void PortalUpdate_AllowedStatusChange_DoesNotThrow(ParticipationStatus previousStatus, ParticipationStatus requestedStatus)
		{
			var context = UpdateContext(isPortal: true, depth: 1, previousStatus, requestedStatus);

			Assert.DoesNotThrow(() => RunPreUpdate(context));
		}

		[Test]
		[TestCase(ParticipationStatus.NeedsReview, ParticipationStatus.Approved)]
		[TestCase(ParticipationStatus.InReview, ParticipationStatus.Approved)]
		[TestCase(ParticipationStatus.Cancelled, ParticipationStatus.Approved)]
		[TestCase(ParticipationStatus.Dismissed, ParticipationStatus.Approved)]
		[TestCase(ParticipationStatus.Dismissed, ParticipationStatus.Cancelled)]
		[TestCase(ParticipationStatus.Dismissed, ParticipationStatus.NeedsReview)]
		[TestCase(ParticipationStatus.NeedsReview, ParticipationStatus.InReview)]
		[TestCase(ParticipationStatus.Approved, ParticipationStatus.NeedsReview)]
		[TestCase(ParticipationStatus.Approved, ParticipationStatus.Dismissed)]
		[TestCase(ParticipationStatus.Cancelled, ParticipationStatus.Dismissed)]
		public void PortalUpdate_NotAllowedStatusChange_Throws(ParticipationStatus previousStatus, ParticipationStatus requestedStatus)
		{
			var context = UpdateContext(isPortal: true, depth: 1, previousStatus, requestedStatus);

			Assert.Throws<InvalidPluginExecutionException>(() => RunPreUpdate(context));
		}

		[Test]
		public void PortalUpdate_ClearingTheStatus_Throws()
		{
			var context = UpdateContext(isPortal: true, depth: 1, ParticipationStatus.NeedsReview, null);

			Assert.Throws<InvalidPluginExecutionException>(() => RunPreUpdate(context));
		}

		[Test]
		public void PortalUpdate_WithoutPreImage_Throws()
		{
			var context = UpdateContext(isPortal: true, depth: 1, ParticipationStatus.NeedsReview, ParticipationStatus.Approved);
			context.Setup(c => c.PreEntityImages).Returns(new EntityImageCollection());

			Assert.Throws<InvalidPluginExecutionException>(() => RunPreUpdate(context));
		}

		[Test]
		public void PortalUpdate_IdentifiedByPortalsContactId_Throws()
		{
			var context = UpdateContext(isPortal: false, depth: 1, ParticipationStatus.NeedsReview, ParticipationStatus.Approved);
			context.Setup(c => c.PortalsContactId).Returns(Guid.NewGuid());

			Assert.Throws<InvalidPluginExecutionException>(() => RunPreUpdate(context));
		}

		[Test]
		public void PortalUpdate_IdentifiedByParentContext_Throws()
		{
			var parentContext = new Mock<IPluginExecutionContext2>();
			parentContext.Setup(c => c.IsPortalsClientCall).Returns(true);
			var context = UpdateContext(isPortal: false, depth: 1, ParticipationStatus.NeedsReview, ParticipationStatus.Approved);
			context.Setup(c => c.ParentContext).Returns(parentContext.Object);

			Assert.Throws<InvalidPluginExecutionException>(() => RunPreUpdate(context));
		}

		[Test]
		public void StaffUpdate_AnyStatusChange_DoesNotThrow()
		{
			var context = UpdateContext(isPortal: false, depth: 1, ParticipationStatus.NeedsReview, ParticipationStatus.Approved);

			Assert.DoesNotThrow(() => RunPreUpdate(context));
		}

		[Test]
		public void UpdateByAnotherPluginOrWorkflow_DoesNotThrow()
		{
			var context = UpdateContext(isPortal: true, depth: 2, ParticipationStatus.InReview, ParticipationStatus.Dismissed);

			Assert.DoesNotThrow(() => RunPreUpdate(context));
		}

		[Test]
		public void PortalUpdate_WithoutStatus_DoesNotThrow()
		{
			var context = UpdateContext(isPortal: true, depth: 1, ParticipationStatus.NeedsReview, ParticipationStatus.Approved);
			((Entity)context.Object.InputParameters["Target"]).Attributes.Remove("msnfp_status");

			Assert.DoesNotThrow(() => RunPreUpdate(context));
		}

		[Test]
		[TestCase("msnfp_engagementopportunityid", "msnfp_engagementopportunity")]
		[TestCase("msnfp_contactid", "contact")]
		public void PortalUpdate_ChangingTheVolunteerOrOpportunity_Throws(string attribute, string entityName)
		{
			var context = UpdateContext(isPortal: true, depth: 1, ParticipationStatus.Approved, ParticipationStatus.Approved);
			((Entity)context.Object.InputParameters["Target"])[attribute] = new EntityReference(entityName, Guid.NewGuid());

			Assert.Throws<InvalidPluginExecutionException>(() => RunPreUpdate(context));
		}

		[Test]
		public void PortalUpdate_SameOpportunity_DoesNotThrow()
		{
			var context = UpdateContext(isPortal: true, depth: 1, ParticipationStatus.Approved, ParticipationStatus.Cancelled);
			((Entity)context.Object.InputParameters["Target"])["msnfp_engagementopportunityid"] = new EntityReference(opportunity.LogicalName, opportunity.Id);

			Assert.DoesNotThrow(() => RunPreUpdate(context));
		}

		[Test]
		public void StaffUpdate_ChangingTheOpportunity_DoesNotThrow()
		{
			var context = UpdateContext(isPortal: false, depth: 1, ParticipationStatus.Approved, ParticipationStatus.Approved);
			((Entity)context.Object.InputParameters["Target"])["msnfp_engagementopportunityid"] = new EntityReference("msnfp_engagementopportunity", Guid.NewGuid());

			Assert.DoesNotThrow(() => RunPreUpdate(context));
		}

		[Test]
		[TestCase(ParticipationStatus.Approved)]
		[TestCase(ParticipationStatus.InReview)]
		[TestCase(ParticipationStatus.Dismissed)]
		public void PortalCreate_StatusIsSetFromTheOpportunity(ParticipationStatus requestedStatus)
		{
			var target = RunPreCreate(isPortal: true, requestedStatus, autoApprove: false);

			target.GetAttributeValue<OptionSetValue>("msnfp_status").Value.Should().Be((int)ParticipationStatus.NeedsReview);
		}

		[Test]
		public void PortalCreate_OpportunityThatApprovesAutomatically_IsApproved()
		{
			var target = RunPreCreate(isPortal: true, ParticipationStatus.NeedsReview, autoApprove: true);

			target.GetAttributeValue<OptionSetValue>("msnfp_status").Value.Should().Be((int)ParticipationStatus.Approved);
		}

		[Test]
		public void StaffCreate_KeepsTheRequestedStatus()
		{
			var target = RunPreCreate(isPortal: false, ParticipationStatus.Approved, autoApprove: false);

			target.GetAttributeValue<OptionSetValue>("msnfp_status").Value.Should().Be((int)ParticipationStatus.Approved);
		}

		private Mock<IPluginExecutionContext2> UpdateContext(bool isPortal, int depth, ParticipationStatus? previousStatus, ParticipationStatus? requestedStatus)
		{
			var participationId = Guid.NewGuid();
			var target = new Entity("msnfp_participation", participationId)
			{
				["msnfp_status"] = requestedStatus.HasValue ? new OptionSetValue((int)requestedStatus.Value) : null
			};
			var preImage = new Entity("msnfp_participation", participationId)
			{
				["msnfp_contactid"] = contact,
				["msnfp_engagementopportunityid"] = opportunity
			};
			if (previousStatus.HasValue)
			{
				preImage["msnfp_status"] = new OptionSetValue((int)previousStatus.Value);
			}

			var context = new Mock<IPluginExecutionContext2>();
			context.Setup(c => c.IsPortalsClientCall).Returns(isPortal);
			context.Setup(c => c.Depth).Returns(depth);
			context.Setup(c => c.InputParameters).Returns(new ParameterCollection { { "Target", target } });
			context.Setup(c => c.PreEntityImages).Returns(new EntityImageCollection { { ParticipationOnPreUpdateStrategy.PreImageName, preImage } });
			context.Setup(c => c.SharedVariables).Returns(new ParameterCollection());
			return context;
		}

		private void RunPreUpdate(Mock<IPluginExecutionContext2> context)
		{
			var service = new Mock<IOrganizationService>();
			service.Setup(s => s.Retrieve("contact", contact.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity("contact", contact.Id) { ["statecode"] = new OptionSetValue((int)ContactStatus.Active) });
			service.Setup(s => s.Retrieve("msnfp_engagementopportunity", opportunity.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity("msnfp_engagementopportunity", opportunity.Id)
				{
					["msnfp_engagementopportunitystatus"] = new OptionSetValue((int)EngagementOpportunityStatus.PublishToWeb),
					["msnfp_number"] = 1,
					["msnfp_maximum"] = 10
				});

			new ParticipationOnPreUpdateStrategy(new Mock<ITracingService>().Object, context.Object, Provider(service).Object, new Mock<ILocalizationHelper<Labels>>().Object).Run();
		}

		private Entity RunPreCreate(bool isPortal, ParticipationStatus requestedStatus, bool autoApprove)
		{
			var target = new Entity("msnfp_participation", Guid.NewGuid())
			{
				["msnfp_contactid"] = contact,
				["msnfp_engagementopportunityid"] = opportunity,
				["msnfp_status"] = new OptionSetValue((int)requestedStatus)
			};
			var context = new Mock<IPluginExecutionContext2>();
			context.Setup(c => c.IsPortalsClientCall).Returns(isPortal);
			context.Setup(c => c.Depth).Returns(1);
			context.Setup(c => c.InputParameters).Returns(new ParameterCollection { { "Target", target } });

			var service = new Mock<IOrganizationService>();
			service.Setup(s => s.Retrieve("contact", contact.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity("contact", contact.Id) { ["fullname"] = "Volunteer", ["statecode"] = new OptionSetValue((int)ContactStatus.Active) });
			service.Setup(s => s.Retrieve("msnfp_engagementopportunity", opportunity.Id, It.IsAny<ColumnSet>()))
				.Returns(new Entity("msnfp_engagementopportunity", opportunity.Id)
				{
					["msnfp_engagementopportunitytitle"] = "Opportunity",
					["msnfp_engagementopportunitystatus"] = new OptionSetValue((int)EngagementOpportunityStatus.PublishToWeb),
					["msnfp_automaticallyapproveallapplicants"] = autoApprove
				});

			new ParticipationOnPreCreateStrategy(new Mock<ITracingService>().Object, context.Object, Provider(service).Object, new Mock<ILocalizationHelper<Labels>>().Object).Run();
			return target;
		}

		private static Mock<IOrganizationServiceProvider> Provider(Mock<IOrganizationService> service)
		{
			var provider = new Mock<IOrganizationServiceProvider>();
			provider.Setup(p => p.CreateCurrentUserOrganizationService()).Returns(service.Object);
			return provider;
		}
	}
}
