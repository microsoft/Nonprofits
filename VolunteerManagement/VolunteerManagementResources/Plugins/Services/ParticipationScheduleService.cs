using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Localization;
using Plugins.Resx;
using VolunteerManagement.Definitions;

namespace Plugins.Services
{
	public class ParticipationScheduleService : IParticipationScheduleService
	{
		private readonly IOrganizationService orgService;
		ILocalizationHelper<Labels> localizationHelper;

		public ParticipationScheduleService(IOrganizationService orgService, ILocalizationHelper<Labels> localizationHelper)
		{
			this.orgService = orgService;
			this.localizationHelper = localizationHelper;
		}

		public void ValidateApprovalStatus(Entity participationSchedule)
		{
			Entity participation = orgService.Retrieve(ParticipationDef.EntityName,
				participationSchedule.GetAttributeValue<EntityReference>(ParticipationDef.PrimaryKey).Id,
				new ColumnSet(ParticipationDef.ParticipationStatus));
			if (participation.GetAttributeValue<OptionSetValue>(ParticipationDef.ParticipationStatus).Value
				!= (int)ParticipationStatus.Approved)
			{
				throw new InvalidPluginExecutionException(OperationStatus.Failed,
					this.localizationHelper.GetLocalizedMessage(l => l.Participation_NotApprovedException));
			}
		}
	}
}