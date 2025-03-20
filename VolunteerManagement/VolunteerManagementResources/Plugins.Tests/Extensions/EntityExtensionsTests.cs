using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Xrm.Sdk;
using NUnit.Framework;
using Plugins.Extensions;

namespace Plugins.Tests.Extensions
{
	class EntityExtensionsTests
	{
		public const string ATTR_NAME = "new_name";
		public const string ATTR_VALUE_TEXT = "Text";
		public const int ATTR_VALUE_INT = 7;
		public static readonly OptionSetValue ATTR_VALUE_OPTIONSET = new OptionSetValue(1);
		public static readonly EntityReference ATTR_VALUE_LOOKUP = new EntityReference()
		{
			LogicalName = "account",
			Id = Guid.NewGuid(),
			Name = ATTR_VALUE_TEXT
		};

		#region HasValueChanged
		[Test]
		public void HasValueChanged_TargetNull()
		{
			Entity target = default(Entity);
			Assert.Throws<ArgumentNullException>(() => target.HasValueChanged(ATTR_NAME, out string currentValue));
		}

		[Test]
		public void HasValueChanged_PreImageNull()
		{
			Entity preImage = default(Entity);
			Entity target = new Entity();
			Assert.DoesNotThrow(() => target.HasValueChanged(ATTR_NAME, out string currentValue, preImage));
		}

		#region Text value
		[Test]
		public void HasValueChanged_Text_SetValueInTarget()
		{
			var target = new Entity();
			target[ATTR_NAME] = ATTR_VALUE_TEXT;

			var valueChanged = target.HasValueChanged(ATTR_NAME, out string currentValue);
			Assert.IsTrue(valueChanged);
			Assert.AreEqual(ATTR_VALUE_TEXT, currentValue);
		}

		[Test]
		public void HasValueChanged_Text_NoValueInTarget()
		{
			var target = new Entity();

			var valueChanged = target.HasValueChanged(ATTR_NAME, out string currentValue);
			Assert.IsFalse(valueChanged);
			Assert.IsNull(currentValue);
		}

		[Test]
		public void HasValueChanged_Text_NoValueInTargetAndImage()
		{
			var preImage = new Entity();
			var target = new Entity();

			var valueChanged = target.HasValueChanged(ATTR_NAME, out string currentValue, preImage, out string previousValue);
			Assert.IsFalse(valueChanged);
			Assert.IsNull(currentValue);
			Assert.IsNull(previousValue);
		}

		[Test]
		public void HasValueChanged_Text_SetValueWithBlankImage()
		{
			var preImage = new Entity();

			var target = new Entity();
			target[ATTR_NAME] = ATTR_VALUE_TEXT;

			var valueChanged = target.HasValueChanged(ATTR_NAME, out string currentValue, preImage);
			Assert.IsTrue(valueChanged);
			Assert.AreEqual(ATTR_VALUE_TEXT, currentValue);
		}

		[Test]
		public void HasValueChanged_Text_SetValueWithImage()
		{
			const string NEW_VALUE = "NEW TEXT";

			var preImage = new Entity();
			preImage[ATTR_NAME] = ATTR_VALUE_TEXT;

			var target = new Entity();
			target[ATTR_NAME] = NEW_VALUE;

			var valueChanged = target.HasValueChanged(ATTR_NAME, out string currentValue, preImage, out string previousValue);
			Assert.IsTrue(valueChanged);
			Assert.AreEqual(NEW_VALUE, currentValue);
			Assert.AreEqual(previousValue, ATTR_VALUE_TEXT);
		}

		[Test]
		public void HasValueChanged_Text_SetValueToNull()
		{
			const string NEW_VALUE = null;

			var preImage = new Entity();
			preImage[ATTR_NAME] = ATTR_VALUE_TEXT;

			var target = new Entity();
			target[ATTR_NAME] = NEW_VALUE;

			var valueChanged = target.HasValueChanged(ATTR_NAME, out string currentValue, preImage, out string previousValue);
			Assert.IsTrue(valueChanged);
			Assert.IsNull(currentValue);
			Assert.AreEqual(NEW_VALUE, currentValue);
			Assert.AreEqual(previousValue, ATTR_VALUE_TEXT);
		}
		#endregion Text value

		#region OptionSetValue
		[Test]
		public void HasValueChanged_OptionSet_SetValueInTarget()
		{
			var target = new Entity();
			target[ATTR_NAME] = ATTR_VALUE_OPTIONSET;

			var valueChanged = target.HasValueChanged(ATTR_NAME, out OptionSetValue currentValue);
			Assert.IsTrue(valueChanged);
			Assert.IsNotNull(currentValue);
			Assert.AreEqual(ATTR_VALUE_OPTIONSET, currentValue);
		}

		[Test]
		public void HasValueChanged_OptionSet_SetValueInTargetAndImage()
		{
			const int NEW_VALUE_INT = 123;
			OptionSetValue NEW_VALUE = new OptionSetValue(NEW_VALUE_INT);

			var preImage = new Entity();
			preImage[ATTR_NAME] = ATTR_VALUE_OPTIONSET;

			var target = new Entity();
			target[ATTR_NAME] = NEW_VALUE;

			var valueChanged = target.HasValueChanged(ATTR_NAME, out OptionSetValue currentValue, preImage, out OptionSetValue previousValue);
			Assert.IsTrue(valueChanged);
			Assert.IsNotNull(currentValue);
			Assert.AreEqual(NEW_VALUE, currentValue);
			Assert.AreEqual(NEW_VALUE_INT, currentValue.Value);
			Assert.AreEqual(previousValue, ATTR_VALUE_OPTIONSET);
		}

		[Test]
		public void HasValueChanged_OptionSet_SetNullValueInTargetAndImage()
		{
			OptionSetValue NEW_VALUE = null;

			var preImage = new Entity();
			preImage[ATTR_NAME] = ATTR_VALUE_OPTIONSET;

			var target = new Entity();
			target[ATTR_NAME] = NEW_VALUE;

			var valueChanged = target.HasValueChanged(ATTR_NAME, out OptionSetValue currentValue, preImage, out OptionSetValue previousValue);
			Assert.IsTrue(valueChanged);
			Assert.IsNull(currentValue);
			Assert.AreEqual(NEW_VALUE, currentValue);
			Assert.AreEqual(previousValue, ATTR_VALUE_OPTIONSET);
		}
		#endregion OptionSetValue

		#region EntityReference
		[Test]
		public void HasValueChanged_EntityReference_SetValueInTarget()
		{
			var target = new Entity();
			target[ATTR_NAME] = ATTR_VALUE_LOOKUP;

			var valueChanged = target.HasValueChanged(ATTR_NAME, out EntityReference currentValue);
			Assert.IsTrue(valueChanged);
			Assert.IsNotNull(currentValue);
			Assert.AreEqual(ATTR_VALUE_LOOKUP, currentValue);
		}

		[Test]
		public void HasValueChanged_EntityReference_SetValueInTargetAndImage()
		{
			Guid NEW_VALUE_ID = Guid.NewGuid();
			EntityReference NEW_VALUE = new EntityReference(ATTR_VALUE_LOOKUP.LogicalName, NEW_VALUE_ID);

			var preImage = new Entity();
			preImage[ATTR_NAME] = ATTR_VALUE_LOOKUP;

			var target = new Entity();
			target[ATTR_NAME] = NEW_VALUE;

			var valueChanged = target.HasValueChanged(ATTR_NAME, out EntityReference currentValue, preImage, out EntityReference previousValue);
			Assert.IsTrue(valueChanged);
			Assert.IsNotNull(currentValue);
			Assert.AreEqual(NEW_VALUE, currentValue);
			Assert.AreEqual(previousValue, ATTR_VALUE_LOOKUP);
			Assert.AreEqual(NEW_VALUE_ID, currentValue.Id);
			Assert.AreEqual(ATTR_VALUE_LOOKUP.LogicalName, currentValue.LogicalName);
		}

		[Test]
		public void HasValueChanged_EntityReference_SetNullValueInTargetAndImage()
		{
			EntityReference NEW_VALUE = null;

			var preImage = new Entity();
			preImage[ATTR_NAME] = ATTR_VALUE_LOOKUP;

			var target = new Entity();
			target[ATTR_NAME] = NEW_VALUE;

			var valueChanged = target.HasValueChanged(ATTR_NAME, out EntityReference currentValue, preImage, out EntityReference previousValue);
			Assert.IsTrue(valueChanged);
			Assert.IsNull(currentValue);
			Assert.AreEqual(NEW_VALUE, currentValue);
			Assert.AreEqual(previousValue, ATTR_VALUE_LOOKUP);
		}
		#endregion EntityReference
		#endregion HasValueChanged

		#region NormalizeAliasedValues
		[Test]
		public void NormalizeAliasedValues_NoAliasedValues()
		{
			var entity = new Entity();
			Assert.DoesNotThrow(() => entity.NormalizeAliasedValues());
			Assert.AreEqual(0, entity.Attributes.Count);
		}

		[Test]
		public void NormalizeAliasedValues_AliasedValue()
		{
			var entity = new Entity();
			entity[ATTR_NAME] = new AliasedValue(
				entityLogicalName: null,
				attributeLogicalName: ATTR_NAME,
				value: ATTR_VALUE_TEXT
			);
			Assert.DoesNotThrow(() => entity.NormalizeAliasedValues());
			Assert.AreEqual(1, entity.Attributes.Count);

			var actualValue = entity[ATTR_NAME];
			Assert.IsInstanceOf<string>(actualValue);
			Assert.IsNotNull(actualValue);
			Assert.AreEqual(ATTR_VALUE_TEXT, actualValue);
		}
		#endregion NormalizeAliasedValues

		#region AssertEntityParameter
		#region Entity
		[Test]
		public void AssertEntityParameter_Entity_NullValues()
		{
			Assert.Throws<ArgumentNullException>(() => default(Entity).AssertEntityParameter(null));

			const string ENTITY_NAME = "account";
			var target = new Entity(ENTITY_NAME);
			Assert.Throws<ArgumentException>(() => target.AssertEntityParameter(null));
		}

		[Test]
		public void AssertEntityParameter_Entity_NonNullValue()
		{
			const string ENTITY_NAME = "account";
			var target = new Entity(ENTITY_NAME);

			Assert.DoesNotThrow(() => target.AssertEntityParameter(ENTITY_NAME));
		}

		[Test]
		public void AssertEntityParameter_Entity_EntityNameMismatch()
		{
			const string ENTITY_NAME = "account";
			const string NEW_ENTITY_NAME = "contact";
			var target = new Entity(ENTITY_NAME);

			Assert.Throws<ArgumentException>(() => target.AssertEntityParameter(NEW_ENTITY_NAME));
		}
		#endregion Entity

		#region EntityReference
		[Test]
		public void AssertEntityParameter_EntityReference_NullValues()
		{
			Assert.Throws<ArgumentNullException>(() => default(EntityReference).AssertEntityParameter(null));

			const string ENTITY_NAME = "account";
			var target = new EntityReference(ENTITY_NAME);
			Assert.Throws<ArgumentException>(() => target.AssertEntityParameter(null));
		}

		[Test]
		public void AssertEntityParameter_EntityReference_NonNullValue()
		{
			const string ENTITY_NAME = "account";
			var target = new EntityReference(ENTITY_NAME);

			Assert.DoesNotThrow(() => target.AssertEntityParameter(ENTITY_NAME));
		}

		[Test]
		public void AssertEntityParameter_EntityReference_EntityNameMismatch()
		{
			const string ENTITY_NAME = "account";
			const string NEW_ENTITY_NAME = "contact";
			var target = new EntityReference(ENTITY_NAME);

			Assert.Throws<ArgumentException>(() => target.AssertEntityParameter(NEW_ENTITY_NAME));
		}
		#endregion EntityReference
		#endregion AssertEntityParameter

		#region ContainsAttributes
		[Test]
		public void ContainsAttributes_NullValues()
		{
			Assert.Throws<ArgumentNullException>(() => default(Entity).ContainsAttributes());
			Assert.DoesNotThrow(() => new Entity().ContainsAttributes());
			Assert.Throws<ArgumentNullException>(() => new Entity().ContainsAttributes(null));
		}

		[Test]
		public void ContainsAttributes_MissingAttribute()
		{
			string[] REQUIRED_ATTRS = new string[]
			{
				ATTR_NAME
			};
			var entity = new Entity();

			var missingAttrs = entity.ContainsAttributes(REQUIRED_ATTRS);
			var missingAttr = missingAttrs.FirstOrDefault();
			Assert.IsNotNull(missingAttr);
			Assert.AreEqual(REQUIRED_ATTRS[0], missingAttr);
		}

		[Test]
		public void ContainsAttributes_MissingAttributes()
		{
			string[] REQUIRED_ATTRS = new string[]
			{
				ATTR_NAME,
				$"new_{ATTR_NAME}"
			};
			var entity = new Entity();
			entity[ATTR_NAME] = ATTR_VALUE_TEXT;

			var missingAttrs = entity.ContainsAttributes(REQUIRED_ATTRS);
			Assert.IsNotNull(missingAttrs);
			Assert.AreEqual(1, missingAttrs.Count());

			var missingAttr = missingAttrs.First();
			Assert.IsNotNull(missingAttr);
			Assert.AreEqual(REQUIRED_ATTRS[1], missingAttr);
		}

		[Test]
		public void ContainsAttributes_NonMissingAttributes()
		{
			string[] REQUIRED_ATTRS = new string[]
			{
				ATTR_NAME,
				$"new_{ATTR_NAME}"
			};
			var entity = new Entity();
			entity[ATTR_NAME] = ATTR_VALUE_TEXT;
			entity[$"new_{ATTR_NAME}"] = ATTR_VALUE_TEXT;

			var missingAttrs = entity.ContainsAttributes(REQUIRED_ATTRS);
			Assert.IsNotNull(missingAttrs);
			Assert.AreEqual(0, missingAttrs.Count());
		}
		#endregion ContainsAttributes

		#region AssertEntityAttributes
		[Test]
		public void AssertEntityAttributes_MissingAttributes()
		{
			string[] REQUIRED_ATTRS = new string[]
			{
				ATTR_NAME,
				$"new_{ATTR_NAME}"
			};
			var entity = new Entity();
			entity[ATTR_NAME] = ATTR_VALUE_TEXT;

			var exception = Assert.Throws<ArgumentException>(() => entity.AssertEntityAttributes(REQUIRED_ATTRS, "entityRef"));
			Assert.AreEqual(
				$"Parameter entityRef is missing following attributes: new_{ATTR_NAME}",
				exception.Message
			);
		}
		#endregion AssertEntityAttributes

	}
}