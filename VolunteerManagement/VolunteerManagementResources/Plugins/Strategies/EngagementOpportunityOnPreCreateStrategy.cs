using Microsoft.Xrm.Sdk;

namespace Plugins.Strategies
{
	public class EngagementOpportunityOnPreCreateStrategy : IPluginStrategy
	{
		private readonly IPluginExecutionContext context;

		public EngagementOpportunityOnPreCreateStrategy(
			IPluginExecutionContext context)
		{
			this.context = context;
		}

		public void Run()
		{
			if (context.InputParameters.Contains("Target") && context.InputParameters["Target"] is Entity && context.InputParameters["Target"] != null)
			{
				var target = (Entity)context.InputParameters["Target"];

				target["msnfp_maximum"] = target.GetAttributeValue<int?>("msnfp_maximum") == null ? 0 : target.GetAttributeValue<int>("msnfp_maximum");
				target["msnfp_minimum"] = target.GetAttributeValue<int?>("msnfp_minimum") == null ? 0 : target.GetAttributeValue<int>("msnfp_minimum");
				target["msnfp_filledshifts"] = target.GetAttributeValue<int?>("msnfp_filledshifts") == null ? 0 : target.GetAttributeValue<int>("msnfp_filledshifts");
				target["msnfp_cancelledshifts"] = target.GetAttributeValue<int?>("msnfp_cancelledshifts") == null ? 0 : target.GetAttributeValue<int>("msnfp_cancelledshifts");
				target["msnfp_noshow"] = target.GetAttributeValue<int?>("msnfp_noshow") == null ? 0 : target.GetAttributeValue<int>("msnfp_noshow");
				target["msnfp_completed"] = target.GetAttributeValue<int?>("msnfp_completed") == null ? 0 : target.GetAttributeValue<int>("msnfp_completed");
				target["msnfp_appliedparticipants"] = target.GetAttributeValue<int?>("msnfp_appliedparticipants") == null ? 0 : target.GetAttributeValue<int>("msnfp_appliedparticipants");
				target["msnfp_number"] = target.GetAttributeValue<int?>("msnfp_number") == null ? 0 : target.GetAttributeValue<int>("msnfp_number");
				target["msnfp_needsreviewedparticipants"] = target.GetAttributeValue<int?>("msnfp_needsreviewedparticipants") == null ? 0 : target.GetAttributeValue<int>("msnfp_needsreviewedparticipants");
				target["msnfp_cancelledparticipants"] = target.GetAttributeValue<int?>("msnfp_cancelledparticipants") == null ? 0 : target.GetAttributeValue<int>("msnfp_cancelledparticipants");
			}
		}
	}
}