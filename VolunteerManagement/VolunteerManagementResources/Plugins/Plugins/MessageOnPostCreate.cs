using Plugins.Strategies;

namespace Plugins
{
	[CrmPluginRegistration(MessageNameEnum.Create,
		"msnfp_message",
		StageEnum.PostOperation,
		ExecutionModeEnum.Asynchronous,
		"",
		"Post-Create Message AutoComplete",
		1,
		IsolationModeEnum.Sandbox,
		Image1Attributes = "msnfp_autocomplete",
		Image1Type = ImageTypeEnum.PostImage,
		Image1Name = "Image")]
	public class MessageOnPostCreate : BasePlugin
	{
		public MessageOnPostCreate() 
		{
			RegisterPluginStrategy<MessageOnPostCreateStrategy>();
		}
	}
}