using System;

namespace Plugin.Cache
{
	/// <summary>
	/// Cache configuration
	/// </summary>
	public interface IOrganizationCacheConfiguration
	{
		/// <summary>
		/// Gets Maximum age for which the item stays in the cache
		/// </summary>
		TimeSpan DefaultCacheItemMaximumAge { get; }
	}
}
