using System;
using Plugin.Cache;

namespace Plugins.Cache
{
	/// <inheritdoc />
	public class OrganizationCacheConfiguration : IOrganizationCacheConfiguration
	{
		private TimeSpan defaultCacheItemMaximumAge;

		/// <summary>
		/// Initializes a new instance of the <see cref="OrganizationCacheConfiguration" /> class
		/// </summary>
		public OrganizationCacheConfiguration()
		{
			this.defaultCacheItemMaximumAge = TimeSpan.FromMinutes(5);
		}

		/// <summary>
		/// Initializes a new instance of the <see cref="OrganizationCacheConfiguration" /> class
		/// </summary>
		/// <param name="defaultCacheItemMaximumAge">Maximum age for which the item stays in the cache</param>
		public OrganizationCacheConfiguration(TimeSpan defaultCacheItemMaximumAge)
		{
			this.defaultCacheItemMaximumAge = defaultCacheItemMaximumAge;
		}

		/// <inheritdoc />
		public TimeSpan DefaultCacheItemMaximumAge
		{
			get => this.defaultCacheItemMaximumAge;
		}
	}
}
