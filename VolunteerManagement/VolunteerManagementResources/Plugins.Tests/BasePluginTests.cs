using System;
using FluentAssertions;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Moq;
using NUnit.Framework;

namespace Plugins.Tests
{
	[TestFixture]
	public class BasePluginTests
	{
		[Test]
		public void Execute_SameInstanceTwice_SecondCallUsesItsOwnContext()
		{
			var plugin = new GroupMembershipOnPreCreate();
			var targetA = NewMembership();
			var targetB = NewMembership();

			plugin.Execute(BuildServiceProvider(targetA, "Alice", "Group A"));
			plugin.Execute(BuildServiceProvider(targetB, "Bob", "Group B"));

			targetA.GetAttributeValue<string>("msnfp_groupmembershipname").Should().Be("Alice - Group A");
			targetB.GetAttributeValue<string>("msnfp_groupmembershipname").Should().Be("Bob - Group B");
		}

		private static Entity NewMembership()
		{
			var membership = new Entity("msnfp_groupmembership", Guid.NewGuid());
			membership["msnfp_contactid"] = new EntityReference("contact", Guid.NewGuid());
			membership["msnfp_groupid"] = new EntityReference("msnfp_group", Guid.NewGuid());
			return membership;
		}

		private static IServiceProvider BuildServiceProvider(Entity target, string contactName, string groupName)
		{
			var context = new Mock<IPluginExecutionContext>();
			context.SetupGet(c => c.InputParameters).Returns(new ParameterCollection { { "Target", target } });
			context.SetupGet(c => c.MessageName).Returns("Create");
			context.SetupGet(c => c.PrimaryEntityName).Returns(target.LogicalName);
			context.SetupGet(c => c.OrganizationId).Returns(Guid.NewGuid());

			var orgService = new Mock<IOrganizationService>();
			orgService.Setup(s => s.Retrieve("contact", It.IsAny<Guid>(), It.IsAny<ColumnSet>()))
				.Returns((string n, Guid id, ColumnSet c) => new Entity("contact", id) { ["fullname"] = contactName });
			orgService.Setup(s => s.Retrieve("msnfp_group", It.IsAny<Guid>(), It.IsAny<ColumnSet>()))
				.Returns((string n, Guid id, ColumnSet c) => new Entity("msnfp_group", id) { ["msnfp_groupname"] = groupName });

			return new ServiceProviderMockBuilder()
				.WithService<IPluginExecutionContext>(context)
				.WithService<IExecutionContext>(() => context.Object)
				.WithOrganizationService(orgService)
				.Build();
		}
	}
}
