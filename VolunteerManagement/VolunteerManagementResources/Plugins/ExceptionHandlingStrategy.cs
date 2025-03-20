using System;
using Microsoft.Xrm.Sdk;
using System.ServiceModel;
using System.Globalization;
using Plugins.Resx;
using Plugins.Localization;

namespace Plugins
{
	public class ExceptionHandlingStrategy : IExceptionHandlingStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IExecutionContext executionContext;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public ExceptionHandlingStrategy(ITracingService tracingService, IExecutionContext executionContext, ILocalizationHelper<Labels> localizationHelper)
		{
			this.tracingService = tracingService ?? throw new ArgumentNullException(nameof(tracingService));
			this.executionContext = executionContext ?? throw new ArgumentNullException(nameof(executionContext));
			this.localizationHelper = localizationHelper;
		}

		public void HandleFaultException(FaultException<OrganizationServiceFault> exception, string pluginType)
		{
			var message = string.Format(
				CultureInfo.InvariantCulture,
				"Exception '{0}' occured: {1}, error code: {2}, CorrelationId: {3}",
				exception.GetType().Name,
				exception.Message,
				exception.HResult,
				this.executionContext.CorrelationId);
			this.tracingService.Trace(message);

			this.LocalizeAndThrow(exception);
		}

		public void HandleGenericException(Exception exception, string pluginType)
		{
			var message = string.Format(
				CultureInfo.InvariantCulture,
				@"Exception '{0}' occured: {1}, CorrelationId: {2}",
				exception.GetType().Name,
				exception.Message,
				this.executionContext.CorrelationId);
			this.tracingService.Trace(message);

			this.LocalizeAndThrow(exception);
		}

		public void HandleInvalidPluginException(InvalidPluginExecutionException exception, string pluginType)
		{
			var message = string.Format(
				CultureInfo.InvariantCulture,
				"Exception '{0}' occured: {1}, CorrelationId: {2}",
				exception.GetType().Name,
				exception.Message,
				this.executionContext.CorrelationId);
			this.tracingService.Trace(message);

			throw new InvalidPluginExecutionException(exception.Status, exception.ErrorCode, message);
		}

		private void LocalizeAndThrow(Exception ex)
		{
			throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l => l.Plugins_Common_GenericPluginException, ex.Message));
		}
	}
}
