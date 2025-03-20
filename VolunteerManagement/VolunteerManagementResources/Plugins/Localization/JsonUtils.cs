using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.IO;
using System.Linq;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Xml;
using System.Xml.Linq;

namespace Plugins.Localization
{
	/// <summary>
	///     Contains utils for JSON parsing based on the marketing services property bag.
	/// </summary>
	public static class JsonUtils
	{
		/// <summary>
		///     Serializes entity to JSON string.
		/// </summary>
		/// <typeparam name="T">Type of entity to serialize.</typeparam>
		/// <param name="entity">The entity to serialize.</param>
		/// <param name="settings">Serializer settings.</param>
		/// <returns>JSON string.</returns>
		[SuppressMessage("Microsoft.Usage", "CA2202:Do not dispose objects multiple times", Justification = "No violation.")]
		public static string Serialize<T>(T entity, DataContractJsonSerializerSettings settings = null)
		{
			using (var stream = new MemoryStream())
			using (var streamReader = new StreamReader(stream))
			{
				var serializerSettings = settings
										 ?? new DataContractJsonSerializerSettings
										 {
											 UseSimpleDictionaryFormat = true,
											 KnownTypes = new[] { typeof(string[]), typeof(List<object>) }
										 };

				var serializer = new DataContractJsonSerializer(typeof(T), serializerSettings);
				serializer.WriteObject(stream, entity);
				stream.Position = 0;
				return streamReader.ReadToEnd();
			}
		}

		/// <summary>
		///     Deserialize object from JSON string.
		/// </summary>
		/// <typeparam name="T">Type of data model.</typeparam>
		/// <param name="json">String to deserialize.</param>
		/// <param name="settings">Serializer settings.</param>
		/// <returns>Model of response</returns>
		public static T Deserialize<T>(string json, DataContractJsonSerializerSettings settings = null)
		{
			if (typeof(T) == typeof(string))
			{
				return (T)(object)json;
			}

			using (var memoryStream = new MemoryStream(Encoding.Unicode.GetBytes(json)))
			{
				var serializerSettings = settings ?? new DataContractJsonSerializerSettings { UseSimpleDictionaryFormat = true };

				var serializer = new DataContractJsonSerializer(typeof(T), serializerSettings);
				return (T)serializer.ReadObject(memoryStream);
			}
		}

		/// <summary>
		///     Convert a multilevel JSON activity bag string to dictionary
		/// </summary>
		/// <param name="propertyBag">The property bag.</param>
		/// <returns>The dictionary.</returns>
		public static Dictionary<string, object> ConvertJsonToComplexDictionary(string propertyBag)
		{
			var encoding = Encoding.Unicode;
			var readerQuotas = new XmlDictionaryReaderQuotas();
			var dict = new Dictionary<string, object>();
			using (var jsonReader = JsonReaderWriterFactory.CreateJsonReader(encoding.GetBytes(propertyBag), readerQuotas))
			{
				var entityElement = XElement.Load(jsonReader);

				foreach (var element in entityElement.Elements())
				{
					dict.Add(GetElementName(element), ParseXElement(element));
				}
			}

			return dict;
		}

		/// <summary>
		///     Convert a multilevel JSON activity bag string to an array
		/// </summary>
		/// <param name="propertyBag">The property bag.</param>
		/// <returns>The dictionary.</returns>
		public static IList<object> ConvertJsonToComplexArray(string propertyBag)
		{
			var encoding = Encoding.Unicode;
			var readerQuotas = new XmlDictionaryReaderQuotas();
			IList<object> result;
			using (var jsonReader = JsonReaderWriterFactory.CreateJsonReader(encoding.GetBytes(propertyBag), readerQuotas))
			{
				var entityElement = XElement.Load(jsonReader);
				result = (List<object>)ParseXElement(entityElement);
			}

			return result;
		}

		private static object ParseXElement(XElement element)
		{
			var attributes = element.Attributes().ToList();
			var type = attributes.First(x => x.Name.LocalName == "type").Value;
			switch (type)
			{
				case "object":
					var dict = ParseObject(element);

					return dict;
				case "array":
					var list = new List<object>();
					foreach (var innerElement in element.Elements())
					{
						list.Add(ParseXElement(innerElement));
					}

					return list;
				default:
					return element.Value;
			}
		}

		private static Dictionary<string, object> ParseObject(XElement element)
		{
			var dict = element.Elements().ToDictionary(innerElement => GetElementName(innerElement), ParseXElement);

			if (dict.Count == 2 && dict.ContainsKey("Key") && dict.ContainsKey("Value"))
			{
				dict = new Dictionary<string, object> { { (string)dict["Key"], dict["Value"] } };
			}

			return dict;
		}

		private static string GetElementName(XElement element)
		{
			var itemAttribute = element.Attribute("item");
			var elementName = element.Name.ToString();

			if (itemAttribute != null && elementName == "{item}item")
			{
				return itemAttribute.Value;
			}
			else
			{
				return elementName;
			}
		}
	}
}