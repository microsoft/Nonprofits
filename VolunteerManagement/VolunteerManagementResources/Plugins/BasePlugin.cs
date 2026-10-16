using System;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Xrm.Sdk;
using Plugins.Extensions;
using Plugins.Resx;
using Plugins.Strategies;

namespace Plugins
{
    public abstract class BasePlugin : IPlugin
    {
        private readonly IServiceCollection _services;

        public IServiceCollection Services => this._services;

        protected BasePlugin()
        {
            _services = new ServiceCollection();
            ConfigureServices(_services);
        }

        /// <summary>
        /// Configures the default services required by the plugin.
        /// </summary>
        /// <param name="services">The service collection to configure.</param>
        protected virtual void ConfigureServices(IServiceCollection services)
        {
            // Registering default dependencies
            services.AddScoped<IOrganizationServiceProvider, OrganizationServiceProvider>();

            services.RegisterResxLocalization<Labels>(Labels.LabelWebResourcePrefix);

            services.AddScoped<IExceptionHandlingStrategy, ExceptionHandlingStrategy>();
        }

        /// <summary>
        /// Executes the plugin logic.
        /// </summary>
        /// <param name="serviceProvider">The service provider for the current execution context.</param>
        public void Execute(IServiceProvider serviceProvider)
        {
            // Dataverse caches plug-in instances and reuses them across executions (possibly concurrently),
            // so the container holding the execution context must be built per call, never stored on the instance.
            using (var executionServiceProvider = BuildExecutionServiceProvider(serviceProvider))
            using (var scope = executionServiceProvider.CreateScope())
            {
                try
                {
                    var strategy = scope.ServiceProvider.GetRequiredService<IPluginStrategy>();
                    strategy.Run();
                }
                catch (Exception ex)
                {
                    var tracingService = serviceProvider.GetService<ITracingService>();
                    var exceptionHandlingStrategy = scope.ServiceProvider.GetRequiredService<IExceptionHandlingStrategy>();
                    exceptionHandlingStrategy.HandleGenericException(ex, GetType().FullName);
                    tracingService?.Trace($"Exception: {ex.Message}");
                    throw;
                }
            }
        }

        private ServiceProvider BuildExecutionServiceProvider(IServiceProvider serviceProvider)
        {
            var services = new ServiceCollection();

            services.AddSingleton(serviceProvider.GetRequiredService<ITracingService>());
            services.AddSingleton(serviceProvider.GetRequiredService<IPluginExecutionContext>());
            services.AddSingleton(serviceProvider.GetRequiredService<IExecutionContext>());

            var factory = serviceProvider.GetService<IOrganizationServiceFactory>();
            if (factory == null)
            {
                var tracingService = serviceProvider.GetService<ITracingService>();
                tracingService?.Trace("ERROR: IOrganizationServiceFactory is NULL.");
                throw new InvalidOperationException("IOrganizationServiceFactory could not be resolved.");
            }

            services.AddSingleton(factory);
            services.AddScoped<IOrganizationService>(sp =>
            {
                var factoryFromDI = sp.GetRequiredService<IOrganizationServiceFactory>();
                return factoryFromDI.CreateOrganizationService(null);
            });

            foreach (var service in _services)
            {
                services.Add(service);
            }

            return services.BuildServiceProvider();
        }

        /// <summary>
        /// Registers a plugin strategy dynamically before execution.
        /// </summary>
        protected void RegisterPluginStrategy<T>() where T : class, IPluginStrategy
        {
            Services.AddScoped<IPluginStrategy, T>();
        }

        /// <summary>
        /// Registers an additional service dynamically before execution.
        /// </summary>
        public void RegisterService<TInterface, TImplementation>()
            where TInterface : class
            where TImplementation : class, TInterface
        {
            Services.AddScoped<TInterface, TImplementation>();
        }
    }
}
