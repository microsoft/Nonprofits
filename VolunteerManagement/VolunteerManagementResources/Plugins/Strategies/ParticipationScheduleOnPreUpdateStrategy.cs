using Microsoft.Xrm.Sdk;
using Plugins.Extensions;
using Plugins.Services;

namespace Plugins.Strategies
{
	/// <summary>
	/// Portal requests can only cancel a booked shift or book a cancelled one again, and can't move a booking to another
	/// participation or shift.
	/// </summary>
	public class ParticipationScheduleOnPreUpdateStrategy : IPluginStrategy
	{
		public const string PreImageName = "PreImage";

		private readonly ITracingService tracingService;
		private readonly IPluginExecutionContext context;
		private readonly IParticipationScheduleService participationScheduleService;

		public ParticipationScheduleOnPreUpdateStrategy(
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
			tracingService.Trace("Beginning Participation Schedule Pre-Update Plugin");

			// Only requests sent directly from the portal are restricted; staff users and updates made by other plugins or workflows are not.
			if (!context.IsTopLevelRequest() || !context.IsPortalOriginated())
			{
				return;
			}

			if (context.InputParameters.TryGetValue("Target", out var targetObject) && targetObject is Entity target)
			{
				context.PreEntityImages.TryGetValue(PreImageName, out var preImage);
				participationScheduleService.ValidatePortalScheduleUpdate(target, preImage);
			}
		}
	}
}
