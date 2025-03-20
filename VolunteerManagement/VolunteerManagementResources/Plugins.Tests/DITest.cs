using System;
using System.Linq;
using System.Reflection;
using NUnit.Framework;

namespace Plugins.Tests
{
	[TestFixture]
	public class DITest
	{
		[Test]
		public void TestDI()
		{
			var assembly = typeof(EngagementOpportunityOnPostCreate).Assembly;
			var validTypes = assembly.GetTypes().Where(t => !t.IsAbstract && typeof(BasePlugin).IsAssignableFrom(t)).ToList();
			foreach (var validType in validTypes)
			{
				var pluginTest = typeof(VMBasePluginTests<>);
				var genericPluginTest = pluginTest.MakeGenericType(validType);
				var test = Activator.CreateInstance(genericPluginTest);

				try
				{
					genericPluginTest.InvokeMember(
						"Execute_WithMocks_AllDIDependenciesResolved",
						BindingFlags.Public | BindingFlags.Instance | BindingFlags.InvokeMethod,
						Type.DefaultBinder,
						test,
						null);
				}
				catch (Exception e)
				{
					Assert.Fail("Unable to resolve DI for {0} - {1}.", validType, e);
				}
			}
		}
	}
}
