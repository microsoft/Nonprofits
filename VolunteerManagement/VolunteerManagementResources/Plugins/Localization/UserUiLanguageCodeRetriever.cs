using System;
using System.Linq;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Cache;

namespace Plugins.Localization
{

	/// <summary>
	///     User UI language code retriever interface
	/// </summary>
	public class UserUiLanguageCodeRetriever : IUserUiLanguageCodeRetriever
	{
		private const string LanguageCodeOverrideKey = "LANGUAGE_CODE_OVERRIDE";
		private const int NativeLocaleId = 1033;
		private readonly IExecutionContext context;
		private readonly IOrganizationService orgService;
		private readonly ITracingService tracingService;
		private readonly IOrganizationCache<int> localeIdPerUser;

		/// <summary>
		///     Initializes a new instance of the <see cref="UserUiLanguageCodeRetriever" /> class
		/// </summary>
		/// <param name="orgService">Organization service</param>
		/// <param name="tracingService">Tracing service</param>
		/// <param name="context">WorkFlow context</param>
		/// <param name="localeIdPerUser">Cache the localeId</param>
		public UserUiLanguageCodeRetriever(IOrganizationService orgService, ITracingService tracingService, IExecutionContext context, IOrganizationCache<int> localeIdPerUser = null)
		{
			this.orgService = orgService ?? throw new ArgumentNullException(nameof(orgService));
			this.tracingService = tracingService;
			this.context = context;
			this.localeIdPerUser = localeIdPerUser;
		}

		/// <summary>
		///     Gets CRM user UI language code
		/// </summary>
		/// <returns>CRM user UI language code</returns>
		public int? RetrieveUserUiLanguageCode()
		{
			int languageCodeOverride;
			if (TryGetLanguageCodeOverride(out languageCodeOverride))
			{
				this.tracingService.Trace("Using overridden language code: {0}", languageCodeOverride);
				return languageCodeOverride;
			}

			int localeId;
			var currentUserId = this.context.InitiatingUserId;
			if (this.localeIdPerUser != null && this.localeIdPerUser.TryGetValue(currentUserId.ToString(), out localeId))
			{
				this.tracingService?.Trace($"GetCurrentUserCulture Return localeId={localeId},");
				return localeId == default ? NativeLocaleId : localeId;
			}

			var userSettingsQuery = new QueryExpression("usersettings");
			userSettingsQuery.ColumnSet.AddColumns("uilanguageid", "systemuserid");
			userSettingsQuery.Criteria.AddCondition("systemuserid", ConditionOperator.Equal, this.context.InitiatingUserId);
			var userSettingsEntityCollection = this.orgService.RetrieveMultiple(userSettingsQuery);

			var userSettingsEntity = userSettingsEntityCollection.Entities.FirstOrDefault();
			if (userSettingsEntity?.Contains("uilanguageid") == true)
			{
				var userLcid = userSettingsEntity.GetAttributeValue<int>("uilanguageid");
				if (userLcid > 0)
				{
					this.tracingService.Trace("User language is: {0}", userLcid);

					return userLcid;
				}
			}

			this.tracingService.Trace("User language not found");
			return null;
		}

		/// <summary>
		///     Sets Language code override to be used instead of CRM user.
		/// </summary>
		/// <param name="langCode">Language code</param>
		public void SetLanguageCodeOverride(int langCode)
		{
			this.context.SharedVariables[LanguageCodeOverrideKey] = langCode;
			this.tracingService.Trace("Language override code is set to: {0}", langCode);
		}

		private bool TryGetLanguageCodeOverride(out int languageCode)
		{
			if (!this.context.SharedVariables.ContainsKey(LanguageCodeOverrideKey))
			{
				languageCode = 0;
				return false;
			}

			languageCode = (int)this.context.SharedVariables[LanguageCodeOverrideKey];
			return true;
		}
	}
}
