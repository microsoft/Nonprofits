using System;

namespace Plugins.Cache
{
	/// <summary>
	/// Cache to store items per organization
	/// </summary>
	/// <typeparam name="TValue">Generic value</typeparam>
	public interface IOrganizationCache<TValue>
	{
		/// <summary>
		/// Gets or sets the value associated with the specified key.
		/// </summary>
		/// <param name="key">The key of the value to get or set.</param>
		/// <returns>The value of the key/value pair at the specified index.</returns>
		TValue this[string key] { get; set; }

		/// <summary>
		/// Attempts to add the specified key and value to the cache.
		/// </summary>
		/// <param name="key">The key of the element to add.</param>
		/// <param name="value">The value of the element to add.</param>
		/// <param name="maxCacheAge">The maximum time after which the item expires. Defaults to 5 minutes if unspecified.</param>
		/// <returns>True if the key/value pair was added to the cache successfully; false if the key already exists.</returns>
		bool TryAdd(string key, TValue value, TimeSpan? maxCacheAge = null);

		/// <summary>
		/// Attempts to get the value associated with the specified key from the cache.
		/// </summary>
		/// <param name="key">The key of the element to get.</param>
		/// <param name="value">When this method returns, contains the object from the cache that has the specified key, or the default value if the operation failed.</param>
		/// <returns>True if the key was found in the cache successfully; false otherwise.</returns>
		bool TryGetValue(string key, out TValue value);

		/// <summary>
		/// Attempts to remove and return the value that has the specified key from the cache.
		/// </summary>
		/// <param name="key">The key of the element to remove.</param>
		/// <param name="value">When this method returns, contains the object from the cache that has the specified key, or the default value if the operation failed.</param>
		/// <returns>True if the object was removed successfully; otherwise, false.</returns>
		bool TryRemove(string key, out TValue value);

		/// <summary>
		/// Determines whether the cache contains the specified key.
		/// </summary>
		/// <param name="key">The key of the element to find.</param>
		/// <returns>True if the key was found in the cache successfully; false otherwise.</returns>
		bool ContainsKey(string key);
	}
}
