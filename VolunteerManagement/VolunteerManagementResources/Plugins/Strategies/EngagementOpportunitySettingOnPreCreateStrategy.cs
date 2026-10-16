using System;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Messages;
using Microsoft.Xrm.Sdk.Metadata;
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
							target["msnfp_name"] = $"{eo.GetAttributeValue<string>("msnfp_engagementopportunitytitle")} - Setting - {GetMessageWhenSentLabel(organizationService, target)}";
					}
					else
					{
						target["msnfp_name"] = $"{eo.GetAttributeValue<string>("msnfp_engagementopportunitytitle")} - Setting";
					}
				}
			}
		}

		/// <summary>
		/// The Target of a pre-operation Create usually has no FormattedValues, so the option label is read from metadata.
		/// </summary>
		private string GetMessageWhenSentLabel(IOrganizationService organizationService, Entity target)
		{
			var value = target.GetAttributeValue<OptionSetValue>("msnfp_messagewhensenttype").Value;
			if (target.FormattedValues.TryGetValue("msnfp_messagewhensenttype", out var formattedValue) && !string.IsNullOrEmpty(formattedValue))
			{
				return formattedValue;
			}

			try
			{
				var response = (RetrieveAttributeResponse)organizationService.Execute(new RetrieveAttributeRequest
				{
					EntityLogicalName = target.LogicalName,
					LogicalName = "msnfp_messagewhensenttype",
					RetrieveAsIfPublished = false
				});
				var option = (response.AttributeMetadata as EnumAttributeMetadata)?.OptionSet?.Options.FirstOrDefault(o => o.Value == value);
				var label = option?.Label?.UserLocalizedLabel?.Label;
				if (!string.IsNullOrEmpty(label))
				{
					return label;
				}
			}
			catch (Exception ex)
			{
				tracingService.Trace($"Could not read the label of msnfp_messagewhensenttype option {value}: {ex.Message}");
			}

			return Enum.IsDefined(typeof(EngagementOpportunitySettingMessageEventType), value)
				? ((EngagementOpportunitySettingMessageEventType)value).ToString()
				: value.ToString();
		}
	}
}