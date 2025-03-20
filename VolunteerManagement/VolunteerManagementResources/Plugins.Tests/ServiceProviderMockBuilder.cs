using System;
using System.Collections.Generic;
using System.Reflection;
using Microsoft.Xrm.Sdk;
using Moq;

namespace Plugins.Tests
{
	/// <summary>
	/// <see cref="IServiceProvider"/> mock builder
	/// </summary>
	public class ServiceProviderMockBuilder : IFluentBuilder<IServiceProvider>
	{
		private readonly Dictionary<Type, Func<object>> serviceMockFactories = new Dictionary<Type, Func<object>>();

		/// <summary>
		/// Builds the service provider.
		/// </summary>
		/// <returns>Service provider.</returns>
		public IServiceProvider Build()
		{
			var serviceProvider = new Mock<IServiceProvider>();
			this.SetupServiceProvider(serviceProvider);

			return serviceProvider.Object;
		}

		/// <summary>
		/// Adds service to the service provider.
		/// </summary>
		/// <typeparam name="T">Type of the service.</typeparam>
		/// <param name="factory">Service factory.</param>
		/// <returns>The service provider mock builder.</returns>
		public ServiceProviderMockBuilder WithService<T>(Func<object> factory)
		{
			this.serviceMockFactories[typeof(T)] = factory;
			return this;
		}

		/// <summary>
		/// Adds service to the service provider.
		/// </summary>
		/// <typeparam name="T">Type of the service.</typeparam>
		/// <param name="mock">Service mock.</param>
		/// <returns>The service provider mock builder.</returns>
		public ServiceProviderMockBuilder WithService<T>(Mock<T> mock)
			where T : class
		{
			return this.WithService<T>(() => mock.Object);
		}

		/// <summary>
		/// Adds organization service mock.
		/// </summary>
		/// <param name="mock">Organization service mock.</param>
		/// <returns>The service provider mock builder.</returns>
		public ServiceProviderMockBuilder WithOrganizationService(Mock<IOrganizationService> mock)
		{
			var organizationServiceFactory = new Mock<IOrganizationServiceFactory>();
			organizationServiceFactory.Setup(x => x.CreateOrganizationService(It.IsAny<Guid?>()))
				.Returns(mock.Object);

			return this.WithService(organizationServiceFactory);
		}

		private void SetupServiceProvider(Mock<IServiceProvider> serviceProvider)
		{
			serviceProvider.Setup(x => x.GetService(It.IsAny<Type>()))
				.Returns((Type type) =>
				{
					Func<object> factory;
					if (this.serviceMockFactories.TryGetValue(type, out factory))
					{
						return factory();
					}

					var mockType = typeof(Mock<>).MakeGenericType(type);
					var mockTypeDefaultValuePropertyInfo = mockType.GetProperty(nameof(Mock<object>.DefaultValue));
					var mockTypeObjectPropertyInfo = mockType.GetProperty(
						nameof(Mock<object>.Object),
						BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);

					var instance = Activator.CreateInstance(mockType);
					mockTypeDefaultValuePropertyInfo.SetValue(instance, DefaultValue.Mock);

					return mockTypeObjectPropertyInfo.GetValue(instance);
				});
		}
	}
}
