namespace Plugins.Localization
{
	public interface IUserUiLanguageCodeRetriever
	{
		/// <summary>
		///     Gets CRM user UI language code
		/// </summary>
		/// <returns>CRM user UI language code</returns>
		int? RetrieveUserUiLanguageCode();

		/// <summary>
		///     Sets Language code override to be used instead of CRM user
		/// </summary>
		/// <param name="langCode">Language code</param>
		void SetLanguageCodeOverride(int langCode);
	}
}
