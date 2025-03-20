using System.Runtime.Serialization;

namespace Plugins.Localization
{
	/// <summary>
	///     A model of localization label info.
	/// </summary>
	[DataContract]
	public class LocalizationInfoModel
	{
		/// <summary>
		///     Gets or sets the purpose of label
		/// </summary>
		[DataMember]
		public string Purpose { get; set; }

		/// <summary>
		///     Gets or sets value of label
		/// </summary>
		[DataMember]
		public string Value { get; set; }
	}
}