using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.PluginTelemetry;
using Moq;

namespace Plugins.Tests
{
	public class VMBasePluginTests<TPlugin> where TPlugin : BasePlugin, new()
	{
		/// <summary>
		/// Gets or sets service provider mock builder.
		/// </summary>
		protected ServiceProviderMockBuilder ServiceProviderMockBuilder { get; set; }

		/// <summary>
		/// Tests whether all dependencies are resolved.
		/// </summary>
		[TestMethod]
		public void Execute_WithMocks_AllDIDependenciesResolved()
		{
			var triggerAttributes = typeof(TPlugin).GetCustomAttributes(typeof(SdkMessageProcessingStepBaseAttribute), false);
			if (triggerAttributes.Any())
			{
				foreach (var attributeObject in triggerAttributes)
				{
					var attribute = (SdkMessageProcessingStepBaseAttribute)attributeObject;
					this.ExecutePlugin(builder =>
					{
						var pluginExecutionContextMock = new Mock<IPluginExecutionContext>();
						pluginExecutionContextMock.SetupGet(c => c.PrimaryEntityName).Returns(attribute.PrimaryEntity);
						builder.WithService<IPluginExecutionContext>(pluginExecutionContextMock);
					});
				}
			}
			else
			{
				this.ExecutePlugin();
			}
		}

		/// <summary>
		/// Creates the system under test.
		/// </summary>
		/// <param name="setupServiceProviderMockBuilder">Service provider mock builder.</param>
		/// <returns>Instance of the plugin.</returns>
		protected TPlugin CreateSut(Action<ServiceProviderMockBuilder> setupServiceProviderMockBuilder = null)
		{
			this.ServiceProviderMockBuilder = new ServiceProviderMockBuilder();
			var loggerMock = new Mock<ILogger>();
			loggerMock
				.Setup(l => l.Execute(It.IsAny<string>(), It.IsAny<Action>(), It.IsAny<IEnumerable<KeyValuePair<string, string>>>()))
				.Callback<string, Action, IEnumerable<KeyValuePair<string, string>>>(
				(name, action, properties) =>
				{
					action();
				});
			this.ServiceProviderMockBuilder.WithService<ILogger>(loggerMock);
			setupServiceProviderMockBuilder?.Invoke(this.ServiceProviderMockBuilder);

			return new TPlugin();
		}

		private void ExecutePlugin(Action<ServiceProviderMockBuilder> serviceProviderMockBuilderSetupAction = null)
		{
			var sut = this.CreateSut(serviceProviderMockBuilderSetupAction);

			try
			{
				sut.Execute(this.ServiceProviderMockBuilder.Build());
			}
			catch (InvalidPluginExecutionException ex) when (ex.Message.ToLower().Contains("error during resolving service from container"))
			{
				// TODO #1187179 update to exception validation instead of exception message validation
				var realMessage = ex.InnerException?.InnerException?.Message ?? ex.InnerException?.Message ?? ex.Message;
				if (realMessage.ToLower().Contains("type func`2 "))
				{
					Assert.Fail("Failed to resolve container dependency, you are likely missing registration of 'this.Container.Register<Func<Exception, bool>>((e) => true, \"filterFunction\");': " + realMessage);
				}
				else
				{
					Assert.Fail("Failed to resolve container dependency: " + realMessage);
				}
			}
			catch (Exception)
			{
				// any other exception is acceptable, we are only after incorrectly resolved dependencies
			}
		}
	}

	public abstract class SdkMessageProcessingStepBaseAttribute : Attribute
	{		
		public string PrimaryEntity { get; set; }
	}
}
