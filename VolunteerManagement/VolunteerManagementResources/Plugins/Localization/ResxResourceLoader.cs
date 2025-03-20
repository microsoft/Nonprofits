using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Xml;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Cache;

namespace Plugins.Localization
{
	/// <inheritdoc />
	public class ResxResourceLoader<T> : ILabelResourceLoader<T>
		where T : class, new()
	{
		private readonly string webResourceSourcePath;
		private readonly IExecutionContext executionContext;
		private readonly ITracingService tracingService;
		private readonly IOrganizationServiceProvider organizationServiceProvider;
		private readonly IOrganizationCache<T> resourcesPerLocaleCache;

		/// <summary>
		/// Initializes a new instance of the <see cref="ResxResourceLoader{T}"/> class.
		/// </summary>
		/// <param name="tracingService">Tracing service</param>
		/// <param name="executionContext">Plugin execution context</param>
		/// <param name="organizationServiceProvider">Organization service provider</param>
		/// <param name="resourcesPerLocale">Resources per locale cache</param>
		/// <param name="webResourceSourcePath">Path to the web resource file</param>
		public ResxResourceLoader(
			ITracingService tracingService,
			IExecutionContext executionContext,
			IOrganizationServiceProvider organizationServiceProvider,
			IOrganizationCache<T> resourcesPerLocale,
			string webResourceSourcePath)
		{
			this.webResourceSourcePath = webResourceSourcePath;
			this.executionContext = executionContext;
			this.organizationServiceProvider = organizationServiceProvider ?? throw new ArgumentNullException(nameof(organizationServiceProvider));
			this.resourcesPerLocaleCache = resourcesPerLocale ?? throw new ArgumentNullException(nameof(resourcesPerLocale));
			this.tracingService = tracingService ?? throw new ArgumentNullException(nameof(tracingService));
		}

		/// <summary>
		/// Fetches the XML document with the resource in a given culture.
		/// </summary>
		/// <param name="cultureId">The ID of the culture to retrieve the resource.</param>
		/// <returns>An XML document with the resource in the given culture; if no resource was found, null is returned.</returns>
		public T GetLabels(int cultureId)
		{
			var cacheKey = $"{GetWebResourcePath(cultureId)}";
			if (this.resourcesPerLocaleCache.ContainsKey(cacheKey))
			{
				this.tracingService.Trace($"Item with key {cacheKey} found in cache");
				return this.resourcesPerLocaleCache[cacheKey];
			}

			this.tracingService.Trace($"Item with key {cacheKey} not found in cache");
			var labels = this.GetResourceFromServer(cultureId);
			if (labels != null)
			{
				this.resourcesPerLocaleCache[cacheKey] = labels;
			}

			return labels;
		}

		private string GetWebResourcePath(int lcid) => $"{this.webResourceSourcePath}.{lcid}.resx";

		/// <summary>
		/// Retrieves an XML document with the labels in a given culture from the server.
		/// </summary>
		/// <param name="cultureId">The culture to retrieve the labels for.</param>
		/// <returns>An XML document with the labels in the given culture; 
		/// if no resource exists for the given culture, null is returned.</returns>
		private T GetResourceFromServer(int cultureId)
		{
			var xmlBytes = this.RetrieveResourceContent(cultureId);
			if (xmlBytes != null)
			{
				var document = this.BuildXmlDocumentFromResourceContent(xmlBytes);
				return this.BuildLabelsFromXmlDocument(document);
			}

			return null;
		}

		private T BuildLabelsFromXmlDocument(XmlDocument xmlDocument)
		{
			var resxDataList = new List<ResxDataModel>();
			var root = xmlDocument.DocumentElement;
			var nodes = root?.SelectNodes("data");

			if (nodes == null || nodes.Count == 0)
			{
				throw new ArgumentException("The provided XML document does not contain a valid ResX file.");
			}

			foreach (XmlNode node in nodes)
			{
				var name = node.Attributes["name"]?.Value;
				var value = node.SelectSingleNode("value")?.InnerText;
				resxDataList.Add(new ResxDataModel { Name = name.Replace(".", "_"), Value = value });
			}

			var labels = new T();
			var properties = typeof(T).GetProperties();

			foreach (var property in properties)
			{
				var matchingResxData = resxDataList.Find(rd => rd.Name == property.Name);
				if (matchingResxData != null)
				{
					property.SetValue(labels, new LocalizationInfoModel() { Value = matchingResxData.Value });
				}
			}

			return labels;
		}

		/// <summary>
		/// Builds an <c>XmlDocument</c> from the data in the content of the web resource.
		/// </summary>
		/// <param name="xml">The content of a web resource.</param>
		/// <returns>The <c>XmlDocument</c>.</returns>
		private XmlDocument BuildXmlDocumentFromResourceContent(byte[] xml)
		{
			XmlDocument document = new XmlDocument();
			using (MemoryStream ms = new MemoryStream(xml))
			{
				XmlReaderSettings settings = new XmlReaderSettings();
				settings.XmlResolver = null;

				using (XmlReader reader = XmlReader.Create(ms, settings))
				{
					document.Load(reader);
				}
			}

			return document;
		}

		/// <summary>
		/// Retrieves the content of the web resource containing the labels for a given culture.
		/// </summary>
		/// <param name="localeId">The ID of the culture to retrieve the labels for.</param>
		/// <returns>The content of the web resource; null if no web resource was found.</returns>
		private byte[] RetrieveResourceContent(int localeId)
		{
			var webresourcePath = this.GetWebResourcePath(localeId);
			var webresourceQuery = new QueryExpression("webresource");
			webresourceQuery.ColumnSet.AddColumn("content");
			webresourceQuery.Criteria.AddCondition("name", ConditionOperator.Equal, webresourcePath);
			var orgService = this.organizationServiceProvider.CreateSystemUserOrganizationService();

			var webresources = orgService.RetrieveMultiple(webresourceQuery);
			var webresource = webresources.Entities.FirstOrDefault();

			if (webresource != null)
			{
				return Convert.FromBase64String(webresource.GetAttributeValue<string>("content"));
			}

			return null;
		}
	}
}
