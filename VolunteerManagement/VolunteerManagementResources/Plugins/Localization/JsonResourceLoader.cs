using System;
using System.Linq;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Plugins.Localization
{
	/// <summary>
	/// Class to load json web resource
	/// </summary>
	/// <typeparam name="T">Labels class</typeparam>
	public class JsonResourceLoader<T> : ILabelResourceLoader<T>
		where T : class
	{
		private readonly ITracingService tracingService;
		private readonly IOrganizationService orgService;
		private readonly string webResourceSourcePath;

		/// <summary>
		/// Initializes a new instance of the <see cref="JsonResourceLoader{T}" /> class
		/// </summary>
		/// <param name="tracingService">Tracing service</param>
		/// <param name="organizationService">Organization service</param>
		/// <param name="options">WebResourceOptions</param>
		public JsonResourceLoader(ITracingService tracingService, IOrganizationService organizationService, IOptions<WebResourceOptions> options)
		{
			this.tracingService = tracingService;
			this.orgService = organizationService;
			this.webResourceSourcePath = options.Value.WebResourceSourcePath;
		}

		/// <summary>
		/// Get labels class from web resource json
		/// </summary>
		/// <param name="lcid">language id</param>
		/// <returns>Labels object</returns>
		public T GetLabels(int lcid)
		{
			var json = this.RetrieveJsonWebResourceByName(lcid);
			if (json == null)
			{
				return default(T);
			}

			if (json == string.Empty)
			{
				return default(T);
			}

			return JsonUtils.Deserialize<T>(json);
		}

		private string RetrieveJsonWebResourceByName(int lcid)
		{
			this.tracingService.Trace("Begin: RetrieveJsonWebResourceByName, languageCode: {0}", lcid);

			var webresourcePath = this.GetWebResourcePath(lcid);
			var webresourceQuery = new QueryExpression("webresource");
			webresourceQuery.ColumnSet.AddColumn("content");
			webresourceQuery.Criteria.AddCondition("name", ConditionOperator.Equal, webresourcePath);

			var webresources = this.orgService.RetrieveMultiple(webresourceQuery);

			if (!webresources.Entities.Any())
			{
				this.tracingService.Trace("End: RetrieveJsonWebResourceByName, no resources found for languageCode {0}", lcid);
				return null;
			}

			this.tracingService.Trace("Webresources returned from server. Count: {0}", webresources.Entities.Count);

			var bytes = Convert.FromBase64String((string)webresources.Entities.First()["content"]);
			var document = Encoding.UTF8.GetString(bytes);

			this.tracingService.Trace("End: RetrieveJsonWebResourceByName , webresourcePath: {0}", webresourcePath);

			return document;
		}

		private string GetWebResourcePath(int lcid)
		{
			return this.webResourceSourcePath + lcid;
		}
	}
}
