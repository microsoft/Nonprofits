using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Update,
		"contact",
		StageEnum.PostOperation,
		ExecutionModeEnum.Asynchronous,
		"statecode",
		"Post-Update Contact",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "statecode",
		Image1Type = ImageTypeEnum.Both, Image1Name = "contact")]
	public class ContactPostUpdate : BasePlugin
	{
		public ContactPostUpdate()
		{
			RegisterPluginStrategy<ContactPostUpdateStrategy>();
		}
	}
}