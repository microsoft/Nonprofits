using System;
using System.Collections.Generic;

namespace Plugins.Extensions
{
	public static class IEnumerableExtensions
	{
		public static IEnumerable<IEnumerable<T>> MakeGroupsOf<T>(this IEnumerable<T> source, int count)
		{
			if (source == null) throw new ArgumentNullException(nameof(source));
			if (count <= 0) throw new ArgumentOutOfRangeException(nameof(count));

			var grouping = new List<T>();

			foreach (var item in source)
			{
				grouping.Add(item);
				if (grouping.Count == count)
				{
					yield return grouping;
					grouping = new List<T>();
				}
			}

			if (grouping.Count != 0)
			{
				yield return grouping;
			}
		}
	}
}