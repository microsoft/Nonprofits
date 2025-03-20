using System;
using System.ServiceModel;
using Microsoft.Xrm.Sdk;

namespace Plugins
{
	/// <summary>
	/// Contract for exception handling strategy
	/// </summary>
	public interface IExceptionHandlingStrategy
	{
		/// <summary>
		/// Handles exception of type <see cref="InvalidPluginExecutionException"/>
		/// </summary>
		/// <param name="exception">An exception</param>
		/// <param name="pluginType">Plugin type</param>
		void HandleInvalidPluginException(InvalidPluginExecutionException exception, string pluginType);

		/// <summary>
		/// Handles exception of type <see cref="FaultException{OrganizationServiceFault}"/>
		/// </summary>
		/// <param name="exception">An exception</param>
		/// <param name="pluginType">Plugin type</param>
		void HandleFaultException(FaultException<OrganizationServiceFault> exception, string pluginType);

		/// <summary>
		/// Handles generic exception
		/// </summary>
		/// <param name="exception">An exception</param>
		/// <param name="pluginType">Plugin type</param>
		void HandleGenericException(Exception exception, string pluginType);
	}
}
