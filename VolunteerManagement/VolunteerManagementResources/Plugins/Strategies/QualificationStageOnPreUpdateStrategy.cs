using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;

namespace Plugins.Strategies
{
	public class QualificationStageOnPreUpdateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IOrganizationServiceProvider serviceProvider;
		private readonly ILocalizationHelper<Labels> localizationHelper;

		public QualificationStageOnPreUpdateStrategy(
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
			tracingService.Trace("Beginning Qualification Pre-Update");

			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];
				var preImage = context.PreEntityImages["Image"];
				var postImage = target;

				var preStatus = (QualificationStageStatus)preImage.GetAttributeValue<OptionSetValue>("msnfp_stagestatus").Value;
				var postStatus = (QualificationStageStatus)postImage.GetAttributeValue<OptionSetValue>("msnfp_stagestatus").Value;

				if (preStatus != QualificationStageStatus.Active && postStatus == QualificationStageStatus.Active)
				{
					var service = this.serviceProvider.CreateCurrentUserOrganizationService();
					var stages = Utilities.QueryByAttributeExt(service, "msnfp_qualificationstage", "msnfp_qualificationid", preImage.GetAttributeValue<EntityReference>("msnfp_qualificationid").Id, new ColumnSet("msnfp_qualificationid", "msnfp_stagestatus"));
					if (stages.Entities.Where(s => s.GetAttributeValue<OptionSetValue>("msnfp_stagestatus").Value == (int)QualificationStageStatus.Active).ToList().Count() > 1)
					{
						throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l => l.QualificationStage_OnlyOneActiveAllowedException));
					}
				}
				if (preStatus != QualificationStageStatus.Pending && postStatus == QualificationStageStatus.Pending)
				{
					throw new InvalidPluginExecutionException(this.localizationHelper.GetLocalizedMessage(l => l.QualificationStage_RevertingNotSupportedException));
				}
			}
		}
	}
}