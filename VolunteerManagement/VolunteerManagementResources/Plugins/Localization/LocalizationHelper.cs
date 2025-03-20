using System;
using System.Globalization;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Cache;

namespace Plugins.Localization
{
	/// <summary>
	///     Localization Helper
	/// </summary>
	/// <typeparam name="T">Type of labels</typeparam>
	public class LocalizationHelper<T> : ILocalizationHelper<T>
		where T : class
	{
		private const int DefaultLcid = 1033;
		private const string DefaultLanguageCodeCacheName = "DefaultLanguageCode";

		private readonly IExecutionContext context;
		private readonly IOrganizationService orgService;
		private readonly ITracingService tracingService;
		private readonly IUserUiLanguageCodeRetriever userUILanguageCodeRetriever;
		private readonly ILabelResourceLoader<T> labelResourceLoader;

		private readonly Lazy<T> userLabels;
		private readonly Lazy<T> defaultLabels;
		private readonly Lazy<IOrganizationCache<int>> defaultOrgLanguageCache;

		/// <summary>
		///     Initializes a new instance of the <see cref="LocalizationHelper{T}" /> class
		/// </summary>
		/// <param name="orgService">Organization service</param>
		/// <param name="tracingService">Tracing service</param>
		/// <param name="context">WorkFlow context</param>
		/// <param name="userUILanguageCodeRetriever">CRM user UI language code retriever</param>
		/// <param name="labelResourceLoader">Web resource loader</param>
		public LocalizationHelper(IOrganizationService orgService, ITracingService tracingService, IExecutionContext context, IUserUiLanguageCodeRetriever userUILanguageCodeRetriever, ILabelResourceLoader<T> labelResourceLoader)
		{
			this.orgService = orgService;
			this.tracingService = tracingService;
			this.context = context;
			this.userUILanguageCodeRetriever = userUILanguageCodeRetriever;
			this.labelResourceLoader = labelResourceLoader;

			this.userLabels = new Lazy<T>(GetUserLabels, false);
			this.defaultLabels = new Lazy<T>(GetDefaultLabels, false);
			this.defaultOrgLanguageCache = new Lazy<IOrganizationCache<int>>(() =>
				new OrganizationCache<int>(
					new OrganizationCacheConfiguration(),
					tracingService,
					this.context.OrganizationId,
					DefaultLanguageCodeCacheName,
					OrganizationCacheFactory.DefaultOrganizationCache));
		}

		/// <inheritdoc />
		public string GetLocalizedMessage(Func<T, LocalizationInfoModel> messageGetter)
		{
			if (messageGetter == null)
			{
				throw new ArgumentNullException(nameof(messageGetter));
			}

			this.tracingService.Trace("Begin: GetLocalizedMessage");

			// the following code could be potentially refactored into a chain pattern if more fallback langs are introduced
			this.tracingService.Trace("Retrieving localized message using the user language");
			var message = RetrieveLocalizedStringFromWebResource(this.userLabels.Value, messageGetter);
			if (message == null)
			{
				this.tracingService.Trace("Retrieving localized message using the default language");
				message = RetrieveLocalizedStringFromWebResource(this.defaultLabels.Value, messageGetter);
			}

			if (message == null)
			{
				this.tracingService.Trace("Message could not be localized");

				throw new InvalidPluginExecutionException("Message could not be localized");
			}

			if (message == string.Empty)
			{
				this.tracingService.Trace("Message has been localized but the localization string is empty");
			}

			this.tracingService.Trace("End: GetLocalizedMessage, message: {0}", message);

			return message;
		}

		/// <inheritdoc />
		public string GetLocalizedMessage(Func<T, LocalizationInfoModel> messageGetter, CultureInfo cultureInfo, params object[] values)
		{
			var localizedMessageFormat = GetLocalizedMessage(messageGetter);
			if (values != null && values.Any())
			{
				return string.Format(cultureInfo, localizedMessageFormat, values);
			}

			return localizedMessageFormat;
		}

		/// <inheritdoc />
		public string GetLocalizedMessage(Func<T, LocalizationInfoModel> messageGetter, params object[] values)
		{
			return GetLocalizedMessage(messageGetter, CultureInfo.InvariantCulture, values);
		}

		private string RetrieveLocalizedStringFromWebResource(T allMessages, Func<T, LocalizationInfoModel> messageGetter)
		{
			if (allMessages == null)
			{
				return null;
			}

			try
			{
				var message = messageGetter(allMessages);
				if (message == null)
				{
					this.tracingService.Trace("Localized message not found");
					return null;
				}

				this.tracingService.Trace("Message value: {0} ", message.Value);
				return message.Value;
			}
			catch (Exception ex)
			{
				this.tracingService.Trace("Could not get the localized message: {0}", ex);
				return null;
			}
		}

		private T GetUserLabels()
		{
			var lcid = this.userUILanguageCodeRetriever.RetrieveUserUiLanguageCode();
			if (!lcid.HasValue)
			{
				return null;
			}

			var defaultLcid = GetDefaultOrganizationLcid();

			if (lcid.Value == defaultLcid)
			{
				this.tracingService.Trace("User language is the same as default language: {0}", defaultLcid);

				// we can afford to return null here because we know that the default language processing
				// happens right after the user language processing
				return null;
			}

			return this.labelResourceLoader.GetLabels(lcid.Value);
		}

		private T GetDefaultLabels()
		{
			return this.labelResourceLoader.GetLabels(GetDefaultOrganizationLcid());
		}

		private int GetDefaultOrganizationLcid()
		{
			try
			{
				if (this.defaultOrgLanguageCache.Value.TryGetValue(this.context.OrganizationId.ToString(), out var cachedLcid))
				{
					return cachedLcid;
				}
				else
				{
					var orgEntity = this.orgService.Retrieve(Organization.OrganizationEntityName, this.context.OrganizationId, new ColumnSet(Organization.AttributeLanguageCode));
					if (orgEntity != null && orgEntity.Contains(Organization.AttributeLanguageCode))
					{
						var lcid = orgEntity.GetAttributeValue<int>(Organization.AttributeLanguageCode);

						if (this.defaultOrgLanguageCache.Value.TryAdd(this.context.OrganizationId.ToString(), lcid) == false)
						{
							this.tracingService.Trace("Could not add the default organization language to the cache");
						}

						return lcid;
					}
				}
			}
			catch (Exception ex)
			{
				this.tracingService.Trace("Could not retrieve the default organization language: {0}", ex);
			}

			return DefaultLcid;
		}
	}

	public static class Organization
	{
		/// <summary>
		/// Organization logical name
		/// </summary>
		public const string OrganizationEntityName = "organization";

		/// <summary>
		/// Organization unique id attribute name
		/// </summary>
		public const string OrganizationId = "organizationid";

		/// <summary>
		/// System user id attribute name
		/// </summary>
		public const string SystemUserId = "systemuserid";

		public const string AttributeLanguageCode = "languagecode";
	}
}