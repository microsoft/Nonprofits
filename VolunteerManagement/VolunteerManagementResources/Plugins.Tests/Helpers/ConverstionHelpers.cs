using System;
using Microsoft.Xrm.Sdk;

namespace Plugins.Tests.Helpers
{
	/*
     *  This class providers helpers to get different interfaces in the Object
     *  hierarchy.
     *  For e.g. a helper for getting IPluginExecutionContext from IServiceProvider
     * */
	class ConversionHelpers
	{
		public static IPluginExecutionContext GetPluginExecutionContextFromServiceProvider(IServiceProvider serviceProvider)
		{
			return (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
		}

		public static Entity GetInputEntity(IPluginExecutionContext pluginContext, String entityName)
		{
			if (pluginContext.InputParameters.Contains(entityName))
			{
				return (Entity)pluginContext.InputParameters[entityName];
			}
			return null;
		}
	}
}