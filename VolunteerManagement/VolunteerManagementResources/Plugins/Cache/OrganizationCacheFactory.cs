using System;
using System.Collections.Specialized;
using System.Runtime.Caching;

namespace Plugins.Cache
{
	/// <summary>
	/// OrganizationCacheFactory class
	/// </summary>
	internal static class OrganizationCacheFactory
	{
		private static MemoryCacheConfig defaultCacheConfig = new MemoryCacheConfig
		{
			UseMemoryCacheManager = true,
			PollingInterval = TimeSpan.FromSeconds(15),
			PhysicalMemoryLimitPercentage = 90
		};

		static OrganizationCacheFactory()
		{
			DefaultOrganizationCache = CreateMemoryCache("VMCache", defaultCacheConfig);
		}

		/// <summary>
		/// Gets the default instance
		/// </summary>
		public static MemoryCache DefaultOrganizationCache { get; }

		private static MemoryCache CreateMemoryCache(string name, MemoryCacheConfig config)
		{
			if (config == null)
			{
				return new MemoryCache(name);
			}

			var nv = new NameValueCollection();
			if (config.UseMemoryCacheManager != null)
			{
				nv.Add("useMemoryCacheManager", config.UseMemoryCacheManager.Value.ToString());
			}

			if (config.PollingInterval != null)
			{
				nv.Add("pollingInterval", config.PollingInterval.Value.ToString());
			}

			if (config.CacheMemoryLimitMegabytes != null)
			{
				nv.Add("cacheMemoryLimitMegabytes", config.CacheMemoryLimitMegabytes.Value.ToString());
			}

			if (config.PhysicalMemoryLimitPercentage != null)
			{
				nv.Add("physicalMemoryLimitPercentage", config.PhysicalMemoryLimitPercentage.Value.ToString());
			}

			if (nv.Count == 0)
			{
				return new MemoryCache(name);
			}

			return new MemoryCache(name, nv);
		}

		private sealed class MemoryCacheConfig
		{
			public bool? UseMemoryCacheManager { get; set; }

			public TimeSpan? PollingInterval { get; set; }

			public int? CacheMemoryLimitMegabytes { get; set; }

			public int? PhysicalMemoryLimitPercentage { get; set; }
		}
	}
}
