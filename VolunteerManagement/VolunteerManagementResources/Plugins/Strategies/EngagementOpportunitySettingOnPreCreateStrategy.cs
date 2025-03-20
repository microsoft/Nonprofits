using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;

namespace Plugins.Strategies
{
	public class EngagementOpportunitySettingOnPreCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly ILocalizationHelper<Labels> localizationHelper;
		private readonly IOrganizationServiceProvider organizationServiceProvider;

		public EngagementOpportunitySettingOnPreCreateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			ILocalizationHelper<Labels> localizationHelper,
			IOrganizationServiceProvider organizationServiceProvider)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.localizationHelper = localizationHelper;
			this.organizationServiceProvider = organizationServiceProvider;
		}

		public void Run()
		{
			tracingService.Trace("Beginning Pre-Create Engagement Opportunity Setting");
			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];

				if (target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid") == null)
				{
					throw new InvalidPluginExecutionException(OperationStatus.Failed, this.localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_RequiredException));
				}
				else
				{
					var organizationService = this.organizationServiceProvider.CreateCurrentUserOrganizationService();
					var eo = organizationService.Retrieve("msnfp_engagementopportunity", target.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid").Id, new ColumnSet("msnfp_engagementopportunitytitle"));
					if (target.Contains("msnfp_settingtype") && target.GetAttributeValue<OptionSetValue>("msnfp_settingtype") != null && target.GetAttributeValue<OptionSetValue>("msnfp_settingtype").Value == (int)EngagementOpportunitySettingSettingType.Message)
					{
						if (target.Contains("msnfp_messagewhensenttype") && target.GetAttributeValue<OptionSetValue>("msnfp_messagewhensenttype") != null)
							target["msnfp_name"] = $"{eo.GetAttributeValue<string>("msnfp_engagementopportunitytitle")} - Setting - {target.FormattedValues["msnfp_messagewhensenttype"]}";
					}
					else
					{
						target["msnfp_name"] = $"{eo.GetAttributeValue<string>("msnfp_engagementopportunitytitle")} - Setting";
					}
				}
			}
		}
	}
}