using System;
using System.Diagnostics.CodeAnalysis;
using System.Globalization;

namespace Plugins.Localization
{

	/// <summary>
	///     Localization helper interface
	/// </summary>
	/// <typeparam name="T">Type of labels</typeparam>
	public interface ILocalizationHelper<T>
	{
		/// <summary>
		///     Gets localized message for the passed messageCode
		/// </summary>
		/// <param name="messageGetter">Message getter function</param>
		/// <returns>Localized message</returns>
		string GetLocalizedMessage(Func<T, LocalizationInfoModel> messageGetter);

		/// <summary>
		///     Gets localized message for the passed messageCode
		/// </summary>
		/// <param name="messageGetter">Message getter function</param>
		/// <param name="cultureInfo">Culture info</param>
		/// <param name="values">Parameters for string.format</param>
		/// <returns>Localized message with params replaced</returns>
		[SuppressMessage("StyleCop.CSharp.DocumentationRules", "SA1650:ElementDocumentationMustBeSpelledCorrectly", Justification = "Reviewed.")]
		string GetLocalizedMessage(Func<T, LocalizationInfoModel> messageGetter, CultureInfo cultureInfo, params object[] values);

		/// <summary>
		///     Gets localized message for the passed messageCode
		/// </summary>
		/// <param name="messageGetter">Message getter function</param>
		/// <param name="values">Parameters for string.format</param>
		/// <returns>Localized message with params replaced</returns>
		[SuppressMessage("StyleCop.CSharp.DocumentationRules", "SA1650:ElementDocumentationMustBeSpelledCorrectly", Justification = "Reviewed.")]
		string GetLocalizedMessage(Func<T, LocalizationInfoModel> messageGetter, params object[] values);
	}
}