using Microsoft.Xrm.Sdk;
using Plugins.Services;

namespace Plugins.Strategies
{
	public class ParticipationScheduleOnPreCreateStrategy : IPluginStrategy
	{
		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IParticipationScheduleService participationScheduleService;

		public ParticipationScheduleOnPreCreateStrategy(
			ITracingService tracingService,
			IPluginExecutionContext context,
			IParticipationScheduleService participationScheduleService)
		{
			this.tracingService = tracingService;
			this.context = context;
			this.participationScheduleService = participationScheduleService;
		}

		public void Run()
		{
			tracingService.Trace($"Beginning Participation Schedule On {context.MessageName} Plugin");

			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity)
			{
				var target = (Entity)context.InputParameters["Target"];
				participationScheduleService.ValidateApprovalStatus(target);
			}
		}
	}
}