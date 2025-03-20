using System;
using System.Collections.Generic;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Plugins.Services
{
	public class QualificationService : IQualificationService
	{
		private readonly IOrganizationService service;

		public QualificationService(IOrganizationService service)
		{
			this.service = service;
		}

		public KeyValuePair<Guid, Entity> CreateQualificationStage(Entity onboardingProcesseStage, EntityReference qualificationRef)
		{
			Entity qStage = new Entity("msnfp_qualificationstage");
			qStage["msnfp_stagename"] = onboardingProcesseStage.GetAttributeValue<string>("msnfp_stagename");
			qStage["msnfp_duedate"] = null;
			qStage["msnfp_description"] = onboardingProcesseStage.GetAttributeValue<string>("msnfp_description");
			qStage["msnfp_sequencenumber"] = onboardingProcesseStage.GetAttributeValue<int>("msnfp_sequencenumber");
			qStage["msnfp_stagestatus"] = new OptionSetValue((int)QualificationStageStatus.Pending);
			qStage["msnfp_qualificationid"] = qualificationRef;

			Guid id = service.Create(qStage);
			qStage.Id = id;
			return new KeyValuePair<Guid, Entity>(onboardingProcesseStage.Id, qStage);
		}

		public KeyValuePair<Guid, Entity> CreateQualificationStep(Entity onboardingProcesseStep, EntityReference qualificationStage)
		{

			Entity qStep = new Entity("msnfp_qualificationstep");
			qStep["msnfp_activitytype"] = onboardingProcesseStep.GetAttributeValue<OptionSetValue>("msnfp_activitytype");
			qStep["msnfp_assignto"] = onboardingProcesseStep.GetAttributeValue<EntityReference>("msnfp_assignto");
			qStep["msnfp_description"] = onboardingProcesseStep.GetAttributeValue<string>("msnfp_description");
			qStep["msnfp_dueindays"] = onboardingProcesseStep.GetAttributeValue<int>("msnfp_duedate");
			qStep["msnfp_qualificationstage"] = qualificationStage;
			qStep["msnfp_title"] = onboardingProcesseStep.GetAttributeValue<string>("msnfp_title");

			Guid id = service.Create(qStep);
			qStep.Id = id;
			return new KeyValuePair<Guid, Entity>(onboardingProcesseStep.Id, qStep);
		}

		public bool CheckForActiveStages(EntityReference qualficationStage)
		{
			QueryByAttribute query = new QueryByAttribute("msnfp_qualificationstage");
			query.Attributes.Add("msnfp_qualificationid");
			query.Values.Add(qualficationStage);
			query.Attributes.Add("msnfp_stagestatus");
			query.Values.Add(QualificationStageStatus.Active);
			query.Attributes.Add("statecode");
			query.Values.Add("Active");
			query.PageInfo = new PagingInfo() { ReturnTotalRecordCount = true };
			query.ColumnSet = new ColumnSet("msnfp_qualificationid", "msnfp_stagestatus", "statecode");
			EntityCollection results = service.RetrieveMultiple(query);
			return (results.TotalRecordCount <= 1);
		}

		public void CreateActivityFromStep(Entity qualificationStep, Guid userId)
		{
			OptionSetValue activityType = qualificationStep.GetAttributeValue<OptionSetValue>("msnfp_activitytype");
			Entity activity = new Entity("msnfp_onboardingtask");
			switch (activityType.Value)
			{
				case (int)QualificationStepActivtyType.OnboardingTask:
					activity = new Entity("msnfp_onboardingtask");
					break;
				case (int)QualificationStepActivtyType.PhoneCall:
					activity = new Entity("phonecall");
					break;
				case (int)QualificationStepActivtyType.Appointment:
					activity = new Entity("appointment");
					break;
			}
			EntityReference qualStage = qualificationStep.GetAttributeValue<EntityReference>("msnfp_qualificationstage");

			EntityReference QualificationRef = service.Retrieve(qualStage.LogicalName, qualStage.Id, new ColumnSet("msnfp_qualificationid")).GetAttributeValue<EntityReference>("msnfp_qualificationid");
			EntityReference ContactRef = service.Retrieve(QualificationRef.LogicalName, QualificationRef.Id, new ColumnSet("msnfp_contactid")).GetAttributeValue<EntityReference>("msnfp_contactid");

			EntityReference assignTo = qualificationStep.GetAttributeValue<EntityReference>("msnfp_assignto") != null ? qualificationStep.GetAttributeValue<EntityReference>("msnfp_assignto") : new EntityReference("systemuser", userId);

			Entity to = new Entity("activityparty");
			to["partyid"] = ContactRef;

			Entity from = new Entity("activityparty");
			from["partyid"] = assignTo;

			activity["ownerid"] = assignTo;
			activity["description"] = qualificationStep.GetAttributeValue<string>("msnfp_description");
			activity["scheduledend"] = DateTime.Now.AddDays(qualificationStep.GetAttributeValue<int>("msnfp_dueindays"));
			activity["regardingobjectid"] = qualStage;
			activity["subject"] = qualificationStep.GetAttributeValue<string>("msnfp_title");

			if (activityType.Value != (int)QualificationStepActivtyType.Appointment)
			{
				activity["to"] = new Entity[] { to };
				activity["from"] = new Entity[] { from };
			}

			service.Create(activity);
		}

		public EntityCollection GetOpenStageActivities(EntityReference stage)
		{
			string query = @"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
                  <entity name='activitypointer'>
                    <attribute name='activitytypecode' />
                    <attribute name='regardingobjectid' />
                    <attribute name='statecode' />
                    <attribute name='statuscode' />
                    <attribute name='activityid' />
                    <order attribute='subject' descending='false' />
                    <filter type='and'>
                      <condition attribute='isregularactivity' operator='eq' value='1' />
                      <condition attribute='statecode' operator='eq' value='0' />
                      <condition attribute='regardingobjectid' operator='eq' uitype='msnfp_qualificationstage' value='{" + stage.Id + @"}' />
                    </filter>
                    <link-entity name='email' from='activityid' to='activityid' visible='false' link-type='outer' alias='email_engagement'>
                      <attribute name='isemailfollowed' />
                      <attribute name='lastopenedtime' />
                      <attribute name='delayedemailsendtime' />
                    </link-entity>
                  </entity>
                </fetch>";
			EntityCollection activtiies = service.RetrieveMultiple(new FetchExpression(query));
			return activtiies;
		}
	}
}