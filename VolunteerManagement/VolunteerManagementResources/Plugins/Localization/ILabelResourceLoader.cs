namespace Plugins.Localization
{
	/// <summary>
	///     /// Label web resource provider
	/// </summary>
	/// <typeparam name="T">Labels class</typeparam>
	public interface ILabelResourceLoader<T> where T : class
	{
		/// <summary>
		/// Gets web resource file
		/// </summary>
		/// <param name="cultureId">CultureId for which to load the web resource</param>
		/// <returns>Web resource as XmlDocument</returns>
		T GetLabels(int cultureId);
	}
}
