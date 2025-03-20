using Plugins.Services;
using Plugins.Strategies;
using VolunteerManagement.Definitions;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Create,
		ParticipationScheduleDef.EntityName,
		StageEnum.PreOperation,
		ExecutionModeEnum.Synchronous,
		"",
		"Pre-Create Participation Schedule",
		1,
		IsolationModeEnum.Sandbox)]
	public class ParticipationScheduleOnPreCreate : BasePlugin
	{
		public ParticipationScheduleOnPreCreate() 
		{
			RegisterPluginStrategy<ParticipationScheduleOnPreCreateStrategy>();
			RegisterService<IParticipationScheduleService, ParticipationScheduleService>();
		}
	}
}