using System;
using Microsoft.Xrm.Sdk;

namespace Plugins.Extensions
{
	public static class PluginExecutionContextExtensions
	{
		// Upper bound for walking parent contexts; Dataverse limits the pipeline depth well below this value.
		private const int MaxParentContextLevels = 16;

		/// <summary>
		/// Returns true when the request came from a Power Pages client, e.g. a portal form or the portal Web API.
		/// The execution context and its parent contexts are inspected.
		/// </summary>
		/// <param name="context">Plugin execution context</param>
		/// <returns>True if the request came from a Power Pages client</returns>
		public static bool IsPortalOriginated(this IPluginExecutionContext context)
		{
			var current = context;
			for (var level = 0; current != null && level <= MaxParentContextLevels; level++)
			{
				if (current is IPluginExecutionContext2 portalsContext
					&& (portalsContext.IsPortalsClientCall || portalsContext.PortalsContactId != Guid.Empty))
				{
					return true;
				}

				current = current.ParentContext;
			}

			return false;
		}

		/// <summary>
		/// Returns true when the plugin runs for a request sent directly by the caller and not for an operation
		/// performed by another plugin or workflow (context depth is 1).
		/// </summary>
		/// <param name="context">Plugin execution context</param>
		/// <returns>True if the context depth is 1</returns>
		public static bool IsTopLevelRequest(this IPluginExecutionContext context)
		{
			return context.Depth <= 1;
		}
	}
}
