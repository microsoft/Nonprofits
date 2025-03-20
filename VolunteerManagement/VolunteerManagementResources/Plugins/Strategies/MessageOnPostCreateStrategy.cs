using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Plugins.Localization;
using Plugins.Resx;

namespace Plugins.Strategies
{
	public class MessageOnPostCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public MessageOnPostCreateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IOrganizationServiceProvider serviceProvider,
			ILocalizationHelper<Labels> localizationHelper)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.serviceProvider = serviceProvider;
			this.localizationHelper = localizationHelper;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Message Post-Create Plugin");
			if (!context.InputParameters.TryGetValue("Target", out var targetObj) || targetObj as Entity == default
				|| !context.PostEntityImages.TryGetValue("Image", out var postImage))
			{
				tracingService.Trace($"InputParameters=[{string.Join(",", context.InputParameters.Keys)}]; PreImages=[{string.Join(",", context.PreEntityImages.Keys)}]; PostImages=[{string.Join(", ", context.PostEntityImages.Keys)}]");
				throw new InvalidPluginExecutionException(OperationStatus.Failed, this.localizationHelper.GetLocalizedMessage(l => l.Plugins_Common_IncorrectlyRegisteredException, nameof(MessageOnPostCreate)));
			}

			var target = targetObj as Entity;
			var service = this.serviceProvider.CreateCurrentUserOrganizationService();
			Utilities.CreateEmailsFromMessage(service, tracingService, target);
			if (postImage.GetAttributeValue<bool>("msnfp_autocomplete"))
			{
				tracingService.Trace("Completing Message");
				var request = new SetStateRequest();
				request.EntityMoniker = target.ToEntityReference();
				request.State = new OptionSetValue(1);
				request.Status = new OptionSetValue(2);
				service.Execute(request);
			}
		}
	}
}