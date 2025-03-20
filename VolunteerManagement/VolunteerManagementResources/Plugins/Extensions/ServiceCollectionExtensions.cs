using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Xrm.Sdk;
using Plugin.Cache;
using Plugins.Cache;
using Plugins.Localization;

namespace Plugins.Extensions
{
	public static class ServiceCollectionExtensions
	{
		public static void RegisterResxLocalization<T>(this IServiceCollection services, string webResourceSourcePath, IOrganizationCacheConfiguration cacheConfiguration = null)
			where T : class, new()
		{
			// Register the localization helper
			services.AddScoped<ILocalizationHelper<T>, LocalizationHelper<T>>();

			// Store webResourceSourcePath using IOptions pattern
			services.Configure<WebResourceOptions>(options =>
			{
				options.WebResourceSourcePath = webResourceSourcePath;
			});

			// Register IOrganizationCache<int>
			services.AddScoped<IOrganizationCache<int>>(sp =>
			{
				var pluginExecutionContext = sp.GetRequiredService<IPluginExecutionContext>();
				var tracingService = sp.GetRequiredService<ITracingService>();
				return new OrganizationCache<int>(
					cacheConfiguration ?? new OrganizationCacheConfiguration(),
					tracingService,
					pluginExecutionContext.OrganizationId,
					"LocaleIdPerUserCacheName");
			});

			// Register IOrganizationCache<T>
			services.AddScoped<IOrganizationCache<T>>(sp =>
			{
				var pluginExecutionContext = sp.GetRequiredService<IPluginExecutionContext>();
				var tracingService = sp.GetRequiredService<ITracingService>();
				return new OrganizationCache<T>(
					cacheConfiguration ?? new OrganizationCacheConfiguration(),
					tracingService,
					pluginExecutionContext.OrganizationId,
					"ResourcesPerLocaleCacheName");
			});

			// Register ILabelResourceLoader<T>
			services.AddScoped<Localization.ILabelResourceLoader<T>>(sp =>
			{
				var tracingService = sp.GetRequiredService<ITracingService>();
				var executionContext = sp.GetRequiredService<IExecutionContext>();
				var serviceProvider = sp.GetRequiredService<IOrganizationServiceProvider>();
				var resourceCache = sp.GetRequiredService<IOrganizationCache<T>>();
				var options = sp.GetRequiredService<IOptions<WebResourceOptions>>();

				return new Localization.ResxResourceLoader<T>(
					tracingService,
					executionContext,
					serviceProvider,
					resourceCache,
					options.Value.WebResourceSourcePath);
			});

			// Register IUserUiLanguageCodeRetriever
			services.AddScoped<IUserUiLanguageCodeRetriever>(sp =>
			{
				var orgService = sp.GetRequiredService<IOrganizationService>();
				var tracingService = sp.GetRequiredService<ITracingService>();
				var executionContext = sp.GetRequiredService<IExecutionContext>();
				var localeCache = sp.GetRequiredService<IOrganizationCache<int>>();

				return new UserUiLanguageCodeRetriever(orgService, tracingService, executionContext, localeCache);
			});
		}
	}
}
