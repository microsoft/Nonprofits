using System;
using System.Collections.Generic;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Plugins.Tests.Mock
{
	class OrganizationServiceMock : IOrganizationService
	{
		private readonly EntityCollection collection = new EntityCollection();
		private readonly EntityCollection updateCollection = new EntityCollection();
		private readonly List<QueryBase> invokedRetriveMultipleQueries = new List<QueryBase>();
		public EntityCollection createCollection { get; set; } = new EntityCollection();

		public void Associate(string entityName, Guid entityId, Relationship relationship, EntityReferenceCollection relatedEntities)
		{
			throw new NotImplementedException();
		}

		public Guid Create(Entity entity)
		{
			entity.Id = System.Guid.NewGuid();
			this.createCollection.Entities.Add(entity);
			return entity.Id;
		}

		public void Delete(string entityName, Guid id)
		{
			throw new NotImplementedException();
		}

		public void Disassociate(string entityName, Guid entityId, Relationship relationship, EntityReferenceCollection relatedEntities)
		{
			throw new NotImplementedException();
		}

		public OrganizationResponse Execute(OrganizationRequest request)
		{
			throw new NotImplementedException();
		}

		public Entity Retrieve(string entityName, Guid id, ColumnSet columnSet)
		{
			foreach (Entity entity in collection.Entities)
			{
				if (entity.LogicalName == entityName && entity.Id == id)
				{
					ValidatePresenceOfAllColumn(entity, columnSet);
					return entity;
				}
			}
			return new Entity();
		}

		public EntityCollection RetrieveMultiple(QueryBase query)
		{
			invokedRetriveMultipleQueries.Add(query);
			EntityCollection entity_collection = new EntityCollection();
			string entityLogicalName = String.Empty;
			if (query.GetType() == typeof(QueryByAttribute))
			{
				entityLogicalName = (query as QueryByAttribute).EntityName;
			}
			else if (query.GetType() == typeof(QueryExpression))
			{
				entityLogicalName = (query as QueryExpression).EntityName;
			}

			foreach (Entity entity in collection.Entities)
			{
				if (entity.LogicalName == entityLogicalName)
				{
					entity_collection.Entities.Add(entity);
				}
			}
			return entity_collection;
		}

		public void Update(Entity entity)
		{
			updateCollection.Entities.Add(entity);
		}

		public EntityCollection GetUpdateCollection()
		{
			return updateCollection;
		}

		public void AddEntity(Entity entity)
		{
			collection.Entities.Add(entity);
		}

		public List<QueryBase> GetAllInvokedRetriveQueries()
		{
			return invokedRetriveMultipleQueries;
		}

		private void ValidatePresenceOfAllColumn(Entity entity, ColumnSet columnSet)
		{
			for (int index = 0; index < columnSet.Columns.Count; ++index)
			{
				if (!entity.Contains(columnSet.Columns[index]))
				{
					throw new Exception(String.Format("Missing {0} in the entity {1}"
						, columnSet.Columns[index], entity.LogicalName));
				}
			}
		}
	}
}