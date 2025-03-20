using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Xrm.Sdk;

namespace Plugins.Extensions
{
	public static class EntityExtensions
	{
		/// <summary>
		/// Returns a value of the aliased attribute of the entity cast to T in the safe manner
		/// </summary>
		/// <typeparam name="T">Type of the value</typeparam>
		/// <param name="e">Entity</param>
		/// <param name="attributeName">Attribute name</param>
		/// <returns>Value of the attribute of the entity</returns>
		public static T SafeGetAliasedValue<T>(this Entity e, string attributeName)
		{
			if (!e.Attributes.Contains(attributeName))
				return default;

			return !(e[attributeName] is AliasedValue attributeValue) ? default : (T)attributeValue.Value;

		}

		/// <summary>
		/// Returns a value of the attribute of the entity cast to T
		/// </summary>
		/// <typeparam name="T">Type of the value</typeparam>
		/// <param name="entity">Entity</param>
		/// <param name="attributeName">Attribute name</param>
		/// <returns>Value of the attribute of the entity</returns>
		public static T GetAttribute<T>(this Entity entity, string attributeName)
		{
			return entity.GetAttribute<T>(null, attributeName);
		}

		/// <summary>
		/// Returns a value of the attribute of the entity cast to T, if null then a value of image if null - default value of @T
		/// </summary>
		/// <typeparam name="T">Type of the value</typeparam>
		/// <param name="entity">Entity</param>
		/// <param name="image">Image</param>
		/// <param name="attributeName">Attribute name</param>
		/// <exception cref="ArgumentException">Argument exception</exception>
		/// <returns>Value of the attribute of the entity or image</returns>
		public static T GetAttribute<T>(this Entity entity, Entity image, string attributeName)
		{
			if (entity == null) throw new ArgumentNullException(nameof(entity));
			if (attributeName == null) throw new ArgumentNullException(nameof(attributeName));

			object returnValue = default(T);

			if (entity.Contains(attributeName))
			{
				returnValue = entity.Attributes[attributeName];
			}
			else if (image != null && image.Contains(attributeName))
			{
				returnValue = image.Attributes[attributeName];
			}

			return (T)returnValue;
		}

		/// <summary>
		/// Gets option set field's value and casts it to a specific enum
		/// </summary>
		/// <typeparam name="T">Outgoing enum type</typeparam>
		/// <param name="entity">Entity instance</param>
		/// <param name="image">Pre operation entity instance</param>
		/// <param name="fieldName">Attribute name</param>
		/// <param name="defaultValue">Default value of T type</param>
		/// <returns>Enum value</returns>
		public static T GetOptionSetValue<T>(this Entity entity, Entity image, string fieldName, T defaultValue) where T : Enum
		{
			var value = defaultValue;
			var tempValue = GetAttribute<OptionSetValue>(entity, image, fieldName);

			if (tempValue != null)
			{
				value = (T)Enum.ToObject(typeof(T), tempValue.Value);
			}
			return value;
		}

		/// <summary>
		/// Gets option set field's value and casts it to a specific enum
		/// </summary>
		/// <typeparam name="T">Outgoing enum type</typeparam>
		/// <param name="entity">Entity instance</param>
		/// <param name="image">Pre operation entity instance</param>
		/// <param name="fieldName">Attribute name</param>
		/// <returns>Enum value</returns>
		public static T GetOptionSetValue<T>(this Entity entity, Entity image, string fieldName) where T : Enum
		{
			return GetOptionSetValue<T>(entity, image, fieldName, default);
		}

		/// <summary>
		/// Gets option set field's value and casts it to a specific enum
		/// </summary>
		/// <typeparam name="T">Outgoing enum type</typeparam>
		/// <param name="entity">Entity instance</param>
		/// <param name="fieldName">Attribute name</param>
		/// <returns>Enum value</returns>
		public static T GetOptionSetValue<T>(this Entity entity, string fieldName) where T : Enum
		{
			return GetOptionSetValue<T>(entity, null, fieldName);
		}

		/// <summary>
		/// Gets option set field's value and casts it to a specific enum
		/// </summary>
		/// <typeparam name="T">Outgoing enum type</typeparam>
		/// <param name="entity">Entity instance</param>
		/// <param name="fieldName">Filed name</param>
		/// <param name="defaultValue">Default value of T type</param>
		/// <returns>Enum value</returns>
		public static T GetOptionSetValue<T>(this Entity entity, string fieldName, T defaultValue) where T : Enum
		{
			return GetOptionSetValue(entity, null, fieldName, defaultValue);
		}

		/// <summary>
		/// Gets int value of an enum value
		/// </summary>
		/// <param name="enumValue">Enum value</param>
		/// <returns>Int value</returns>
		public static int ToInt(this Enum enumValue)
		{
			return Convert.ToInt32(enumValue);
		}

		/// <summary>
		/// Converts Enum value to an Option Set value
		/// </summary>
		/// <param name="enumValue">Enum value</param>
		/// <returns>Option set value</returns>
		public static OptionSetValue ToOptionSetValue(this Enum enumValue)
		{
			return new OptionSetValue(enumValue.ToInt());
		}

		/// <summary>
		/// Gets Aliased typed value
		/// </summary>
		/// <typeparam name="T">Type of the value</typeparam>
		/// <param name="entity">Entity instance</param>
		/// <param name="attributeName">Attribute name</param>
		/// <returns>Typed value of an attribute</returns>
		/// <exception cref="InvalidCastException">Invalid cast exception</exception>
		public static T GetAliasedValue<T>(this Entity entity, string attributeName)
		{
			if (entity.Contains(attributeName) && entity[attributeName] is AliasedValue)
			{
				try
				{
					return (T)entity.GetAttributeValue<AliasedValue>(attributeName).Value;
				}
				catch (InvalidCastException)
				{
					throw new InvalidCastException($"Unable to cast attribute {attributeName} to {typeof(T).Name}");
				}
			}

			return default;
		}

		public static bool HasValueChanged<T>(this Entity target, string attributeName, out T currentValue)
		{
			return HasValueChanged<T>(target, attributeName, out currentValue, default(Entity), out T previousValue);
		}

		public static bool HasValueChanged<T>(this Entity target, string attributeName, out T currentValue, Entity preImage)
		{
			return HasValueChanged<T>(target, attributeName, out currentValue, preImage, out T previousValue);
		}

		public static bool HasValueChanged<T>(this Entity target, string attributeName, out T currentValue, Entity preImage, out T previousValue)
		{
			if (target == null) { throw new ArgumentNullException(nameof(target)); }

			previousValue = (preImage != default(Entity)) ? preImage.GetAttributeValue<T>(attributeName) : default(T);
			if (target.Contains(attributeName))
			{
				currentValue = target.GetAttributeValue<T>(attributeName);
				if (preImage == default(Entity)) { return true; }

				var isSameValue = currentValue?.Equals(previousValue) == true;
				return !isSameValue;
			}

			currentValue = previousValue;
			return false;
		}

		public static void NormalizeAliasedValues(this Entity entity, ITracingService tracingService = default)
		{
			tracingService?.Trace($"Normalizing attributes (AliasedValues) for {entity?.LogicalName} ({entity?.Id})");
			if (entity == default) throw new ArgumentNullException(nameof(entity));

			foreach (var aliasedAttr in entity.Attributes.Where(t => t.Value is AliasedValue).ToArray())
			{
				entity[aliasedAttr.Key] = (aliasedAttr.Value as AliasedValue)?.Value;
			}

			tracingService?.Trace($"AliasedValues are normalized now");
		}

		public static void AssertEntityParameter(this Entity entity, string entityName, string parameterName = "entity")
		{
			if (entity == default) throw new ArgumentNullException(parameterName);

			if (entity.LogicalName != entityName)
			{
				throw new ArgumentException($"Parameter {parameterName} has incorrect type ({entity.LogicalName}) and it should be {entityName}");
			}
		}

		public static void AssertEntityParameter(this EntityReference entityReference, string entityName, string parameterName = "entityReference")
		{
			if (entityReference == default) throw new ArgumentNullException(parameterName);

			if (entityReference.LogicalName != entityName)
			{
				throw new ArgumentException($"Parameter {parameterName} has incorrect type ({entityReference.LogicalName}) and it should be {entityName}");
			}
		}

		/// <summary>
		/// 
		/// </summary>
		/// <param name="entity"></param>
		/// <param name="requiredAttributes"></param>
		/// <returns>Missing attributes</returns>
		/// <exception cref="ArgumentNullException"></exception>
		public static IEnumerable<string> ContainsAttributes(this Entity entity, params string[] requiredAttributes)
		{
			if (entity == default) throw new ArgumentNullException(nameof(entity));
			if (requiredAttributes == default) throw new ArgumentNullException(nameof(requiredAttributes));

			var missingAttributes = new HashSet<string>();
			foreach (var attribute in requiredAttributes)
			{
				if (!entity.Contains(attribute))
				{
					missingAttributes.Add(attribute);
				}
			}

			return missingAttributes;
		}

		public static void AssertEntityAttributes(this Entity entity, string[] requiredAttributes, string parameterName = "entity")
		{
			var missingAttributes = entity.ContainsAttributes(requiredAttributes);
			if (missingAttributes == default || missingAttributes.Count() == 0)
			{
				return;
			}

			var message = $"Parameter {parameterName} is missing following attributes: {string.Join(", ", missingAttributes)}";
			throw new ArgumentException(message);
		}

	}
}