using System;
using System.Runtime.Caching;
using Microsoft.Xrm.Sdk;
using Plugin.Cache;

namespace Plugins.Cache
{
	/// <summary>
	/// Generic, thread-safe dictionary cache for the current organization
	/// </summary>
	/// <typeparam name="TValue">Generic value</typeparam>
	public class OrganizationCache<TValue> : IOrganizationCache<TValue>
	{
		private readonly IOrganizationCacheConfiguration cacheConfiguration;
		private readonly ITracingService tracingService;
		private readonly Guid organizationId;
		private readonly string cacheName;
		private readonly ObjectCache organizationCache;

		/// <summary>
		/// Initializes a new instance of the <see cref="OrganizationCache{TValue}" /> class
		/// </summary>
		/// <param name="cacheConfiguration">Configuration of the cache</param>
		/// <param name="tracingService">Tracing service</param>
		/// <param name="organizationId">Organization id</param>
		/// <param name="cacheName">Name of the cache</param>
		public OrganizationCache(IOrganizationCacheConfiguration cacheConfiguration, ITracingService tracingService, Guid organizationId, string cacheName)
			: this(cacheConfiguration, tracingService, organizationId, cacheName, OrganizationCacheFactory.DefaultOrganizationCache)
		{
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="OrganizationCache{TValue}" /> class
		/// </summary>
		/// <param name="cacheConfiguration">Configuration of the cache</param>
		/// <param name="tracingService">Tracing service</param>
		/// <param name="organizationId">Organization id</param>
		/// <param name="cacheName">Name of the cache</param>
		/// <param name="organizationCache">Organization cache</param>
		internal OrganizationCache(IOrganizationCacheConfiguration cacheConfiguration, ITracingService tracingService, Guid organizationId, string cacheName, ObjectCache organizationCache)
		{
			this.cacheConfiguration = cacheConfiguration;
			this.tracingService = tracingService;
			this.organizationId = organizationId;
			this.cacheName = cacheName;
			this.organizationCache = organizationCache;
		}

		/// <summary>
		/// Gets or sets the value associated with the specified key.
		/// </summary>
		/// <param name="key">The key of the value to get or set.</param>
		/// <returns>The value of the key/value pair at the specified index.</returns>
		public TValue this[string key]
		{
			get
			{
				TValue val;
				if (this.TryGetValue(key, out val))
				{
					return val;
				}
				else
				{
					return default(TValue);
				}
			}

			set
			{
				TValue val;
				if (this.TryGetValue(key, out val))
				{
					val = value;
				}
				else
				{
					this.TryAdd(key, value);
				}
			}
		}

		/// <summary>
		/// Attempts to add the specified key and value to the cache.
		/// </summary>
		/// <param name="key">The key of the element to add.</param>
		/// <param name="value">The value of the element to add.</param>
		/// <param name="cacheItemAge">The time after which the cache item expires. Defaults to 5 minutes if unspecified.</param>
		/// <returns>True if the key/value pair was added to the cache successfully; false if the key already exists.</returns>
		public bool TryAdd(string key, TValue value, TimeSpan? cacheItemAge = null)
		{
			if (cacheItemAge.HasValue)
			{
				// Limit the cache item age to DefaultMaximumCacheItemAge hours
				cacheItemAge = cacheItemAge < this.cacheConfiguration.DefaultCacheItemMaximumAge ? cacheItemAge : this.cacheConfiguration.DefaultCacheItemMaximumAge;
			}
			else
			{
				cacheItemAge = this.cacheConfiguration.DefaultCacheItemMaximumAge;
			}

			try
			{
				this.organizationCache.Set(
					this.GetKey(key),
					value,
					new CacheItemPolicy()
					{
						AbsoluteExpiration = DateTimeOffset.UtcNow.Add(cacheItemAge.Value)
					});
				return true;
			}
			catch (Exception ex)
			{
				this.tracingService.Trace("Error adding key {0} to cache: {1}", key, ex.Message);
				return false;
			}
		}

		/// <summary>
		/// Attempts to get the value associated with the specified key from the cache.
		/// </summary>
		/// <param name="key">The key of the element to get.</param>
		/// <param name="value">When this method returns, contains the object from the cache that has the specified key, or the default value if the operation failed.</param>
		/// <returns>True if the key was found in the cache successfully; false otherwise.</returns>
		public bool TryGetValue(string key, out TValue value)
		{
			value = default(TValue);

			try
			{
				var cacheItem = this.organizationCache.GetCacheItem(this.GetKey(key));
				if (cacheItem != null)
				{
					// Check if the value is valid
					if (cacheItem.Value != null && cacheItem.Value is TValue)
					{
						value = (TValue)cacheItem.Value;
						return true;
					}
				}
			}
			catch (Exception ex)
			{
				this.tracingService.Trace("Error getting key {0} from cache: {1}", key, ex.Message);
			}

			return false;
		}

		/// <summary>
		/// Attempts to remove and return the value that has the specified key from the cache.
		/// </summary>
		/// <param name="key">The key of the element to remove.</param>
		/// <param name="value">When this method returns, contains the object from the cache that has the specified key, or the default value if the operation failed.</param>
		/// <returns>True if the object was removed successfully; otherwise, false.</returns>
		public bool TryRemove(string key, out TValue value)
		{
			try
			{
				var objectResult = this.organizationCache.Remove(this.GetKey(key));
				if (objectResult != null && objectResult is TValue)
				{
					value = (TValue)objectResult;
					return true;
				}
			}
			catch (Exception ex)
			{
				this.tracingService.Trace("Error removing key {0} from cache: {1}", key, ex.Message);
			}

			value = default(TValue);
			return false;
		}

		/// <summary>
		/// Determines whether the cache contains the specified key.
		/// </summary>
		/// <param name="key">The key of the element to find.</param>
		/// <returns>True if the key was found in the cache successfully; false otherwise.</returns>
		public bool ContainsKey(string key) => this.organizationCache.Contains(this.GetKey(key));

		private string GetKey(string key)
		{
			return string.Format("{0}_{1}_{2}", this.cacheName, this.organizationId, key);
		}
	}
}
