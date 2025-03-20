using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using Plugins.Extensions;
using Plugins.Localization;
using Plugins.Resx;
using VolunteerManagement.Definitions;

namespace Plugins
{
	public static class Utilities
	{
		public const string DefaultShiftName = "Default Shift";
		public const string TagSkipEosSchedule = "SkipEngagementOpportuniyScheduleRecalculation";
		public const string RequestName = "RetrieveEnvironmentVariableValue";
		public const string DefinitionSchemaNameRequestParameter = "DefinitionSchemaName";
		public const string ValueResponseParameter = "Value";
		
		/// <summary>
		/// The limit of recipients per an email based on email server (e.g. Exchange Online)
		/// </summary>
		public const int MaxLimitOfRecipients = 450;

		public const int MaxRecordsInRetrieveRequest = 5000;

		public static EntityCollection QueryByAttributeExt(IOrganizationService service, string entityName, string attributeName, object attributeValue, ColumnSet columnSet, string orderAttributeName = "")
		{
			QueryByAttribute query = new QueryByAttribute(entityName);
			query.Attributes.Add(attributeName);
			query.Values.Add(attributeValue);
			query.Attributes.Add("statecode");
			query.Values.Add("Active");
			query.PageInfo = new PagingInfo() { ReturnTotalRecordCount = true };
			query.ColumnSet = columnSet;
			if (!string.IsNullOrEmpty(orderAttributeName)) query.AddOrder(orderAttributeName, OrderType.Ascending);
			EntityCollection results = service.RetrieveMultiple(query);
			return results;
		}

		public static void CalculateParticpationsCountsByEO(IOrganizationService service, EntityReference eoRef)
		{
			if (eoRef.LogicalName != "msnfp_engagementopportunity") throw new InvalidPluginExecutionException(OperationStatus.Failed, "Incorrect Entity passed to CalculateParticpationsCountsByEO");

			QueryByAttribute query = new QueryByAttribute("msnfp_participation");
			query.Attributes.Add("msnfp_engagementopportunityid");
			query.Values.Add(eoRef.Id);
			query.Attributes.Add("statecode");
			query.Values.Add("Active");
			query.PageInfo = new PagingInfo() { ReturnTotalRecordCount = true };
			query.ColumnSet = new ColumnSet("msnfp_status", "msnfp_engagementopportunityid", "statecode");
			EntityCollection participants = service.RetrieveMultiple(query);

			int applied = participants.Entities.Count;
			int needReview = 0;
			int approved = 0;
			int dismissed = 0;
			int cancelled = 0;
			foreach (Entity p in participants.Entities)
			{
				switch (p.GetAttributeValue<OptionSetValue>("msnfp_status").Value)
				{
					case (int)ParticipationStatus.NeedsReview:
						needReview += 1;
						break;
					case (int)ParticipationStatus.InReview:
						needReview += 1;
						break;
					case (int)ParticipationStatus.Approved:
						approved += 1;
						break;
					case (int)ParticipationStatus.Dismissed:
						dismissed += 1;
						break;
					case (int)ParticipationStatus.Cancelled:
						cancelled += 1;
						break;
				}
			}

			Entity updateEntity = new Entity(eoRef.LogicalName, eoRef.Id);
			updateEntity["msnfp_appliedparticipants"] = applied;
			updateEntity["msnfp_number"] = approved;
			updateEntity["msnfp_needsreviewedparticipants"] = needReview;
			updateEntity["msnfp_cancelledparticipants"] = cancelled;
			service.Update(updateEntity);
		}
		public static void CalculateShiftCountsByEO(IOrganizationService service, ITracingService tracingService, EntityReference eoRef)
		{
			tracingService.Trace("Starting CalculateEOScheduleCurrentCount");
			if (eoRef.LogicalName != "msnfp_engagementopportunity") throw new InvalidPluginExecutionException(OperationStatus.Failed, "Incorrect Entity passed to CalculateShiftCountsByEO");

			QueryByAttribute query = new QueryByAttribute("msnfp_participation");
			query.Attributes.Add("msnfp_engagementopportunityid");
			query.Values.Add(eoRef.Id);
			query.Attributes.Add("statecode");
			query.Values.Add("Active");
			query.Attributes.Add("msnfp_status");
			query.Values.Add((int)ParticipationStatus.Approved);
			query.PageInfo = new PagingInfo() { ReturnTotalRecordCount = true };
			query.ColumnSet = new ColumnSet("msnfp_status", "msnfp_engagementopportunityid", "statecode");
			EntityCollection participants = service.RetrieveMultiple(query);
			tracingService.Trace($"Participations retrived: {participants.Entities.Count}");

			EntityCollection shifts = new EntityCollection();
			if (participants.Entities.Count > 0)
			{
				foreach (Entity e in participants.Entities)
				{
					DataCollection<Entity> entities = Utilities.QueryByAttributeExt(service, "msnfp_participationschedule", "msnfp_participationid", e.Id, new ColumnSet("statecode", "msnfp_schedulestatus", "msnfp_participationid")).Entities;
					if (entities.Count > 0) shifts.Entities.AddRange(entities);
				}
				tracingService.Trace($"Shifts Found: {shifts.Entities.Count}");
				if (shifts.Entities.Count > 0)
				{
					Entity eo = service.Retrieve("msnfp_engagementopportunity", eoRef.Id, new ColumnSet("msnfp_filledshifts", "msnfp_cancelledshifts", "msnfp_noshow", "msnfp_completed"));

					tracingService.Trace($"{shifts.Entities.First().GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value} vs {(int)ParticipationScheduleStatus.Pending} = {shifts.Entities.First().GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value == (int)ParticipationScheduleStatus.Pending}");

					int filledShifts = shifts.Entities.Count(s => s.GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value == (int)ParticipationScheduleStatus.Pending || s.GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value == (int)ParticipationScheduleStatus.Completed);
					int cancelledShifts = shifts.Entities.Count(s => s.GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value == (int)ParticipationScheduleStatus.Cancelled);
					int noShowShifts = shifts.Entities.Count(s => s.GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value == (int)ParticipationScheduleStatus.NoShow);
					int completedShifts = shifts.Entities.Count(s => s.GetAttributeValue<OptionSetValue>("msnfp_schedulestatus")?.Value == (int)ParticipationScheduleStatus.Completed);

					tracingService.Trace($"Updating EO from {shifts.Entities.Count} shifts.");
					Entity eoUpdate = new Entity("msnfp_engagementopportunity", eoRef.Id);
					if (eo.GetAttributeValue<int?>("msnfp_filledshifts") != filledShifts) eoUpdate["msnfp_filledshifts"] = filledShifts;
					if (eo.GetAttributeValue<int?>("msnfp_cancelledshifts") != cancelledShifts) eoUpdate["msnfp_cancelledshifts"] = cancelledShifts;
					if (eo.GetAttributeValue<int?>("msnfp_noshow") != noShowShifts) eoUpdate["msnfp_noshow"] = noShowShifts;
					if (eo.GetAttributeValue<int?>("msnfp_completed") != completedShifts) eoUpdate["msnfp_completed"] = completedShifts;
					service.Update(eoUpdate);
				}
			}
		}
		public static void CalculateEOScheduleCurrentCount(IOrganizationService service, ITracingService tracingService, EntityReference eoScheduleRef)
		{
			tracingService.Trace("Starting CalculateEOScheduleCurrentCount");
			if (eoScheduleRef.LogicalName != "msnfp_engagementopportunityschedule") throw new InvalidPluginExecutionException(OperationStatus.Failed, "Incorrect Entity passed to CalculateEOScheduleCurrentCount");

			Entity eoSchedule = service.Retrieve(eoScheduleRef.LogicalName, eoScheduleRef.Id, new ColumnSet("statecode", "msnfp_number"));

			QueryExpression queryExpression = new QueryExpression("msnfp_participationschedule");
			queryExpression.ColumnSet = new ColumnSet("msnfp_engagementopportunityscheduleid", "statecode", "msnfp_schedulestatus");
			queryExpression.PageInfo = new PagingInfo() { ReturnTotalRecordCount = true };
			FilterExpression filter = new FilterExpression(LogicalOperator.And);
			filter.AddCondition("msnfp_engagementopportunityscheduleid", ConditionOperator.Equal, eoSchedule.Id);
			filter.AddCondition("statecode", ConditionOperator.Equal, "Active");
			filter.AddCondition("msnfp_schedulestatus", ConditionOperator.In, (int)ParticipationScheduleStatus.Pending, (int)ParticipationScheduleStatus.Completed);
			queryExpression.Criteria = filter;
			EntityCollection shifts = service.RetrieveMultiple(queryExpression);

			tracingService.Trace($"{shifts.Entities.Count} shifts found. EO Schedule currently has {eoSchedule.GetAttributeValue<int?>("msnfp_number")}");
			int currentNumber = eoSchedule.GetAttributeValue<int?>("msnfp_number") != null ? eoSchedule.GetAttributeValue<int>("msnfp_number") : 0;
			if (shifts.Entities.Count != currentNumber)
			{
				tracingService.Trace($"Updating EO Schedule with {shifts.Entities.Count} shifts.");
				Entity eoScheduleUpdate = new Entity("msnfp_engagementopportunityschedule", eoScheduleRef.Id);
				eoScheduleUpdate["msnfp_number"] = shifts.Entities.Count;
				service.Update(eoScheduleUpdate);
			}
		}

		public static void CalculateParticipationTotalHours(IOrganizationService service, ITracingService tracingService, EntityReference participationRef, decimal participationHours)
		{
			tracingService.Trace($"Starting CalculateParticipationTotalHours");
			if (participationRef.LogicalName != "msnfp_participation") throw new InvalidPluginExecutionException(OperationStatus.Failed, "Incorrect Entity passed to CalculateParticipationTotalHours");

			FetchExpression fetch = new FetchExpression(@"<fetch version='1.0' output-format='xml - platform' mapping='logical' distinct='false'>
                  <entity name='msnfp_participationschedule'>
                    <attribute name='msnfp_participationscheduleid'/>
                    <filter type='and'>
                      <condition attribute='statecode' operator='eq' value='0'/>
                      <condition attribute='msnfp_schedulestatus' operator='eq' value='335940001'/>
                      <condition attribute='msnfp_participationid' operator='eq' uitype='msnfp_participation' value ='{" + participationRef.Id + @"}'/>
                    </filter>
                    <link-entity name='msnfp_engagementopportunityschedule' from='msnfp_engagementopportunityscheduleid' to='msnfp_engagementopportunityscheduleid' visible='false' link-type='outer' alias='a_msnfp_engagementopportunityschedule'>
                      <attribute name='msnfp_hours'/>
                    </link-entity>
                  </entity>
                </fetch>
            ");

			tracingService.Trace($"Fetching Shifts");
			EntityCollection shifts = service.RetrieveMultiple(fetch);
			tracingService.Trace($"{shifts.Entities.Count} shifts found.");

			decimal totalHours = new decimal();
			if (shifts.Entities.Count > 0)
			{
				foreach (Entity s in shifts.Entities)
				{
					if (s.GetAttributeValue<AliasedValue>("a_msnfp_engagementopportunityschedule.msnfp_hours") != null)
					{
						decimal hours = (decimal)s.GetAttributeValue<AliasedValue>("a_msnfp_engagementopportunityschedule.msnfp_hours").Value;
						totalHours += hours;
						tracingService.Trace($"Found: {hours}");
					}
				}
			}

			tracingService.Trace($"{shifts.Entities.Count} shifts found with {totalHours}.");

			if (totalHours != participationHours)
			{
				Entity participationUpdate = new Entity("msnfp_participation", participationRef.Id);
				participationUpdate["msnfp_hours"] = Decimal.Round(totalHours, 1);
				tracingService.Trace($"Updating participation with {totalHours}.");
				service.Update(participationUpdate);
			}
		}

		public static void CalculateContactTotalHours(IOrganizationService service, ITracingService tracingService, EntityReference contactRef)
		{
			tracingService.Trace("Starting CalculateContactTotalHours");
			if (contactRef.LogicalName != "contact") throw new InvalidPluginExecutionException(OperationStatus.Failed, "Incorrect Entity passed to CalculateContactTotalHours");

			FetchExpression fetch = new FetchExpression(@"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
                      <entity name='msnfp_participation'>
                        <attribute name='msnfp_status' />
                        <attribute name='msnfp_engagementopportunityid' />
                        <attribute name='msnfp_contactid' />
                        <attribute name='msnfp_participationid' />
                        <attribute name='msnfp_hours' />
                        <filter type='and'>
                          <condition attribute='statecode' operator='eq' value='0' />
                          <condition attribute='msnfp_status' operator='eq' value='844060002' />
                          <condition attribute='msnfp_contactid' operator='eq' uitype='contact' value='{" + contactRef.Id + @"}' />
                        </filter>
                        <link-entity name='msnfp_engagementopportunity' from='msnfp_engagementopportunityid' to='msnfp_engagementopportunityid' visible='false' link-type='outer' alias='a_msnfp_engagementopportunity'>
                          <attribute name='msnfp_shifts' />
                        </link-entity>
                      </entity>
                    </fetch>"
				);
			EntityCollection participants = service.RetrieveMultiple(fetch);

			Entity contact = service.Retrieve("contact", contactRef.Id, new ColumnSet("msnfp_totalengagements", "msnfp_totalengagementhours"));
			decimal newTotalHours = participants.Entities.Where(p => (bool)p.GetAttributeValue<AliasedValue>("a_msnfp_engagementopportunity.msnfp_shifts").Value).Sum(p => p.GetAttributeValue<decimal>("msnfp_hours"));
			decimal oldTotalHours = contact.GetAttributeValue<decimal>("msnfp_totalengagementhours");

			int newEoCount = participants.Entities.Count;
			int oldEoCount = contact.GetAttributeValue<int>("msnfp_totalengagements");
			tracingService.Trace($"Found {newTotalHours} vs Old: {oldTotalHours} from {newEoCount} vs Old: {oldEoCount}");

			if (newTotalHours != oldTotalHours || newEoCount != oldEoCount)
			{
				Entity contactUpdate = new Entity("contact", contactRef.Id);
				if (newTotalHours != oldTotalHours) contactUpdate["msnfp_totalengagementhours"] = newTotalHours;
				if (newEoCount != oldEoCount) contactUpdate["msnfp_totalengagements"] = newEoCount;
				service.Update(contactUpdate);
			}
		}

		public static void EngagementOpportunityMessage(IOrganizationService service, ITracingService tracingService, EntityReference contactRef, EntityReference EngagementRef, EngagementOpportunitySettingMessageEventType messageEvent)
		{
			tracingService.Trace("Starting EngagementOpportunityMessage");
			if (contactRef.LogicalName != "contact" || EngagementRef.LogicalName != "msnfp_engagementopportunity") throw new InvalidPluginExecutionException(OperationStatus.Failed, "Incorrect Entity passed to CalculateContactTotalHours");

			QueryExpression queryExpression = new QueryExpression("msnfp_engagementopportunitysetting");
			queryExpression.ColumnSet = new ColumnSet("msnfp_engagementopportunityid", "statecode", "msnfp_messagewhensenttype", "msnfp_messagetext", "msnfp_messagesubject", "msnfp_messagesendtotype", "msnfp_settingtype", "createdby");
			queryExpression.PageInfo = new PagingInfo() { ReturnTotalRecordCount = true };
			FilterExpression filter = new FilterExpression(LogicalOperator.And);
			filter.AddCondition("statecode", ConditionOperator.Equal, "Active");
			filter.AddCondition("msnfp_engagementopportunityid", ConditionOperator.Equal, EngagementRef.Id);
			filter.AddCondition("msnfp_settingtype", ConditionOperator.Equal, (int)EngagementOpportunitySettingSettingType.Message);
			filter.AddCondition("msnfp_messagewhensenttype", ConditionOperator.Equal, (int)messageEvent);
			queryExpression.Criteria = filter;
			EntityCollection settings = service.RetrieveMultiple(queryExpression);
			tracingService.Trace($"Found {settings.Entities.Count} Relevant Settings");

			if (settings.Entities.Count > 0)
			{
				Entity eos = settings.Entities.First();

				Entity to = new Entity("activityparty");
				to["partyid"] = contactRef;
				Entity from = new Entity("activityparty");
				from["partyid"] = eos.GetAttributeValue<EntityReference>("createdby");

				Entity message = new Entity("msnfp_message");
				message["subject"] = eos.GetAttributeValue<string>("msnfp_messagesubject");
				message["description"] = eos.GetAttributeValue<string>("msnfp_messagetext");
				message["regardingobjectid"] = EngagementRef;
				message["from"] = new Entity[] { from };
				message["to"] = new Entity[] { to };
				Guid messageId = service.Create(message);

				tracingService.Trace($"Created message: {messageId}");

				SetStateRequest request = new SetStateRequest();
				request.EntityMoniker = new EntityReference("msnfp_message", messageId);
				request.State = new OptionSetValue(1);
				request.Status = new OptionSetValue(2);
				service.Execute(request);

			}
		}

		public static void CreateEmailsFromMessage(IOrganizationService service, ITracingService tracingService, Entity message)
		{
			tracingService.Trace($"Starting {nameof(CreateEmailsFromMessage)}");
			if (message == default)
			{
				throw new ArgumentNullException(nameof(message));
			}

			var bccLimit = GetEnvironmentalVariable<int>(service, "msnfp_VolunteerEmailBCCLimit");
			tracingService.Trace($"Bcc limit is set to {bccLimit}");
			if (bccLimit == 0 || bccLimit > MaxLimitOfRecipients)
			{
				tracingService.Trace($"The configured recipient limit is not allowed. Using the highest allowed limit ({MaxLimitOfRecipients}).");
				bccLimit = MaxLimitOfRecipients;
			}

			var enableVolunteerEmailingVariable = GetEnvironmentalVariable<string>(service, "msnfp_EnableVolunteerEmailing");
			var sendEmailEnabled = string.Equals(enableVolunteerEmailingVariable, "yes", StringComparison.CurrentCultureIgnoreCase); 
			tracingService.Trace($"Email sending enabled: {sendEmailEnabled}");
						
			var messageFrom = message.GetAttributeValue<EntityCollection>("from")?.Entities;
			var messageTo = message.GetAttributeValue<EntityCollection>("to")?.Entities;
			var messageBcc = message.GetAttributeValue<EntityCollection>("bcc")?.Entities;

			var emailFrom = Utilities.CopyActivityParties(service, messageFrom);
			var emailTo = Utilities.CopyActivityParties(service, messageTo);
			var emailBcc = Utilities.CopyActivityParties(service, messageBcc);
			if (!emailFrom.Any() || (!emailTo.Any() && !emailBcc.Any()))
			{
				tracingService.Trace("There are no activity parties for creating Email activities.");
				return;
			}

			var emailSubject = message.GetAttributeValue<string>("subject");
			var emailDescription = message.GetAttributeValue<string>("description");
			var regardingObject = message.GetAttributeValue<EntityReference>("regardingobjectid");

			if (emailBcc.Any())
			{
				#region Bulk emails to multiple recipient (Bcc)
				int emailIndex = 1;
				foreach (var emailBccGroup in emailBcc.MakeGroupsOf(bccLimit))
				{
					Utilities.CreateAndSendEmail(
						service, tracingService,
						emailSubject, emailDescription, regardingObject, 
						sendEmailEnabled, emailFrom, emailTo, emailBccGroup, emailIndex
					);
					emailIndex++;
				}
				#endregion Bulk emails to multiple recipient (Bcc)
			}
			else
			{
				#region Email to a specific recipient (To)
				Utilities.CreateAndSendEmail(
					service, tracingService,
					emailSubject, emailDescription, regardingObject,
					sendEmailEnabled, emailFrom, emailTo
				);
				#endregion Email to a specific recipient (To)
			}
		}

		public static void CreateAndSendEmail(
			IOrganizationService service, ITracingService tracingService,
			string subject, string description, EntityReference regardingObject,
			bool sendEmailEnabled, Entity[] emailFrom, Entity[] emailTo, IEnumerable<Entity> emailBccGroup = default, int emailIndex = default
		)
		{
			tracingService.Trace($"Creating an Email record ({emailIndex})");

			var email = new Entity("email");
			email["subject"] = subject;
			email["description"] = description;
			email["regardingobjectid"] = regardingObject;
			email["from"] = emailFrom;
			email["to"] = emailTo;
			email["bcc"] = emailBccGroup?.ToArray();

			tracingService.Trace($"Creating Email ({emailIndex})");
			var emailId = service.Create(email);
			tracingService.Trace($"Email created ({emailIndex}): {emailId}");

			var request = new SendEmailRequest
			{
				EmailId = emailId,
				TrackingToken = string.Empty,
				IssueSend = sendEmailEnabled
			};
			service.Execute(request);
			tracingService.Trace($"SendEmailRequest ({emailIndex}) sent");
		}

		static T GetEnvironmentalVariable<T>(IOrganizationService service, string schemaName = "msnfp_EnableVolunteerEmailing")
		{
			try
			{
				var retrieveEnvironmentVariableValueRequest = new OrganizationRequest(RequestName)
				{
					[DefinitionSchemaNameRequestParameter] = schemaName,
				};

				var textValue = service.Execute(retrieveEnvironmentVariableValueRequest)[ValueResponseParameter];
				return (T)Convert.ChangeType(textValue, typeof(T));
			}
			catch
			{
				return default;
			}
		}

		public static Entity[] CopyActivityParties(IOrganizationService service, IEnumerable<Entity> existingParty)
		{
			if (existingParty == null)
			{
				return new Entity[0];
			}

			var newActivityParties = new List<Entity>();
			var partiesByEntity = existingParty
				.Select(p => p.GetAttributeValue<EntityReference>("partyid"))
				.GroupBy(x => x.LogicalName)
				.ToDictionary(k => k.Key, v => v.ToArray());

			foreach (var entityName in partiesByEntity.Keys)
			{
				var records = partiesByEntity[entityName];

				if (entityName == "systemuser")
				{
					foreach (var recordRef in records)
					{
						var newActivityParty = new Entity("activityparty");
						newActivityParty["partyid"] = recordRef;

						newActivityParties.Add(newActivityParty);
					}

					continue;
				}

				foreach (var recordsGroup in records.MakeGroupsOf(MaxRecordsInRetrieveRequest))
				{
					var recordIds = recordsGroup.Select(r => r.Id).ToArray();
					var query = new QueryExpression(entityName)
					{
						NoLock = true,
						ColumnSet = new ColumnSet("emailaddress1", "emailaddress2", "emailaddress3", "donotemail"),
						Criteria =
						{
							Conditions =
							{
								new ConditionExpression($"{entityName}id", ConditionOperator.In, recordIds)
							}
						}
					};
					var retrievedRecords = service.RetrieveMultiple(query).Entities;

					foreach (var retrievedRecord in retrievedRecords)
					{
						var canSendEmail = (retrievedRecord.GetAttributeValue<bool>("donotemail") == false);
						var isEmailValid = (
							!string.IsNullOrEmpty(retrievedRecord.GetAttributeValue<string>("emailaddress1"))
							|| !string.IsNullOrEmpty(retrievedRecord.GetAttributeValue<string>("emailaddress2"))
							|| !string.IsNullOrEmpty(retrievedRecord.GetAttributeValue<string>("emailaddress3"))
						);

						if (canSendEmail && isEmailValid)
						{
							var newActivityParty = new Entity("activityparty");
							newActivityParty["partyid"] = retrievedRecord.ToEntityReference();

							newActivityParties.Add(newActivityParty);
						}
					}
				}
			}

			return newActivityParties.ToArray();
		}

		/// <summary>
		/// Creates a default participation schedule from a participation. Must pass msnfp_contactid && msnfp_engagementopportunityid on participation. 
		/// </summary>
		/// <param name="service"></param>
		/// <param name="participation"></param>
		public static void CreateParticipationSchedule(IOrganizationService service, Entity participation, ILocalizationHelper<Labels> localizationHelper)
		{
			EntityCollection participationScehdules = Utilities.QueryByAttributeExt(service, "msnfp_participationschedule", "msnfp_participationid", participation.Id, new ColumnSet("statecode", "msnfp_participationid"));
			if (participationScehdules.TotalRecordCount < 1)
			{
				EntityCollection schedules = Utilities.QueryByAttributeExt(service, "msnfp_engagementopportunityschedule", "msnfp_engagementopportunity", participation.GetAttributeValue<EntityReference>("msnfp_engagementopportunityid").Id, new ColumnSet("msnfp_engagementopportunity", "statecode", "msnfp_engagementopportunityschedule"));
				if (schedules.Entities.Count != 1)
				{
					throw new InvalidPluginExecutionException(OperationStatus.Failed, localizationHelper.GetLocalizedMessage(l => l.EngagementOpportunity_EngagementOpportunitySchedule_OnlyOneRequiredException));
				}

				Entity entity = new Entity("msnfp_participationschedule");
				entity["msnfp_name"] = $"{participation.GetAttributeValue<EntityReference>("msnfp_contactid").Name} - {schedules.Entities.First().GetAttributeValue<string>("msnfp_engagementopportunityschedule")}";
				entity["msnfp_participationid"] = new EntityReference("msnfp_participation", participation.Id);
				entity["msnfp_engagementopportunityscheduleid"] = new EntityReference("msnfp_engagementopportunityschedule", schedules.Entities.First().Id);
				service.Create(entity);
			}
		}

		public static string GetNameOfDefaultShift(Entity engagementOpportunity)
		{
			engagementOpportunity.AssertEntityParameter(EngagementOpportunityDef.EntityName, nameof(engagementOpportunity));
			engagementOpportunity.AssertEntityAttributes(new[] { EngagementOpportunityDef.PrimaryName }, nameof(engagementOpportunity));

			return $"{DefaultShiftName} - {engagementOpportunity.GetAttributeValue<string>(EngagementOpportunityDef.PrimaryName)}";
		}

		/// <summary>
		/// Creates Default Engagement Opportunity Schedule for a Shiftless EO. Optional Entity must have: "msnfp_maximum", "msnfp_minimum", "msnfp_engagementopportunitytitle", "msnfp_startingdate"
		/// </summary>
		/// <param name="service"></param>
		/// <param name="engagementOpportunityReference"></param>
		/// <param name="engagementOpportunity"></param>
		public static Entity CreateDefaultEngOppSchedule(IOrganizationService service, EntityReference engagementOpportunityReference, Entity engagementOpportunity = null)
		{
			engagementOpportunityReference.AssertEntityParameter(EngagementOpportunityDef.EntityName, nameof(engagementOpportunityReference));

			Entity target = engagementOpportunity;
			if (engagementOpportunity == null || string.IsNullOrWhiteSpace(engagementOpportunity.GetAttributeValue<string>(EngagementOpportunityDef.PrimaryName)))
			{
				target = service.Retrieve(
					engagementOpportunityReference.LogicalName,
					engagementOpportunityReference.Id,
					new ColumnSet(
						EngagementOpportunityDef.Maximum,
						EngagementOpportunityDef.Minimum,
						EngagementOpportunityDef.PrimaryName,
						EngagementOpportunityDef.StartingDate,
						EngagementOpportunityDef.EndingDate
					)
				);
			}

			Entity engagementOpportunitySchedule = new Entity(EngagementOpportunityScheduleDef.EntityName);
			engagementOpportunitySchedule[EngagementOpportunityScheduleDef.EngagementOpportunity] = target.ToEntityReference();
			engagementOpportunitySchedule[EngagementOpportunityScheduleDef.MaxofParticipants] = target.GetAttributeValue<int?>(EngagementOpportunityDef.Maximum) ?? 0;
			engagementOpportunitySchedule[EngagementOpportunityScheduleDef.MinofParticipants] = target.GetAttributeValue<int?>(EngagementOpportunityDef.Minimum) ?? 0;
			engagementOpportunitySchedule[EngagementOpportunityScheduleDef.ShiftName] = DefaultShiftName;
			engagementOpportunitySchedule[EngagementOpportunityScheduleDef.PrimaryName] = GetNameOfDefaultShift(target);
			engagementOpportunitySchedule[EngagementOpportunityScheduleDef.StartDate] = target.GetAttributeValue<DateTime?>(EngagementOpportunityDef.StartingDate);
			engagementOpportunitySchedule[EngagementOpportunityScheduleDef.EndDate] = target.GetAttributeValue<DateTime>(EngagementOpportunityDef.EndingDate);
			engagementOpportunitySchedule.Id = service.Create(engagementOpportunitySchedule);

			return engagementOpportunitySchedule;
		}

		public static void CancelAllPendingParticipations(IOrganizationService service, Guid participantId)
		{
			QueryExpression expression = new QueryExpression("msnfp_participation");
			expression.ColumnSet = new ColumnSet("msnfp_engagementopportunityid");
			FilterExpression criteria = new FilterExpression(LogicalOperator.And);
			criteria.AddCondition("msnfp_contactid", ConditionOperator.Equal, participantId);
			criteria.AddCondition("msnfp_status", ConditionOperator.In, (int)ParticipationStatus.InReview, (int)ParticipationStatus.NeedsReview);
			expression.Criteria = criteria;
			EntityCollection participations = service.RetrieveMultiple(expression);

			for (int pos = 0; pos < participations.Entities.Count; ++pos)
			{
				Entity participationUpdate = new Entity("msnfp_participation", participations[pos].Id);
				participationUpdate["msnfp_status"] = new OptionSetValue((int)ParticipationStatus.Cancelled);
				service.Update(participationUpdate);
			}
		}

		public static string GetEOPreferenceString(IOrganizationService service, Guid EOId)
		{
			FetchExpression fetch = new FetchExpression($@"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
              <entity name='msnfp_engagementopportunitypreference'>
                <attribute name='msnfp_engagementopportunitypreferenceid' />
                <attribute name='msnfp_engagementopportunitypreferencestitle' />
                <order attribute='msnfp_engagementopportunitypreferencestitle' descending='false' />
                <filter type='and'>
                  <condition attribute='msnfp_engagementopportunityid' operator='eq' uitype='msnfp_engagementopportunity' value='{EOId}' />
                  <condition attribute='statecode' operator='eq' value='0' />
                </filter>
                <link-entity name='msnfp_preferencetype' from='msnfp_preferencetypeid' to='msnfp_preferencetypeid' visible='false' link-type='outer' alias='a_msnfp_preferencetypeid'>
                  <attribute name='msnfp_preferencetypetitle' />
                </link-entity>
              </entity>
            </fetch>");
			EntityCollection preferences = service.RetrieveMultiple(fetch);
			return ConvertAliasedAttributeToCsv(preferences, "a_msnfp_preferencetypeid.msnfp_preferencetypetitle");
		}

		public static string GetEOQualificationString(IOrganizationService service, Guid EOId)
		{
			FetchExpression fetch = new FetchExpression($@"<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>
              <entity name='msnfp_engagementopportunityparticipantqual'>
                <attribute name='msnfp_engagementopportunityparticipantqualid' />
                <filter type='and'>
                  <condition attribute='msnfp_engagementopportunityid' operator='eq' uitype='msnfp_engagementopportunity' value='{EOId}' />
                  <condition attribute='statecode' operator='eq' value='0' />
                </filter>
                <link-entity name='msnfp_qualificationtype' from='msnfp_qualificationtypeid' to='msnfp_qualificationtypeid' visible='false' link-type='outer' alias='a_msnfp_qualificationtypeid'>
                  <attribute name='msnfp_qualificationtypetitle' />
                </link-entity>
              </entity>
            </fetch>");
			EntityCollection qualifications = service.RetrieveMultiple(fetch);
			return ConvertAliasedAttributeToCsv(qualifications, "a_msnfp_qualificationtypeid.msnfp_qualificationtypetitle");
		}

		private static string ConvertAliasedAttributeToCsv(EntityCollection entityCollection, string targetAttribute)
		{
			StringBuilder csv = new StringBuilder("");
			for (int i = 0; i < entityCollection.Entities.Count; i++)
			{
				string tempString = $"\"{((string)entityCollection.Entities[i].GetAttributeValue<AliasedValue>(targetAttribute).Value).Replace("\"", "\"\"")}\"";
				csv.Append(i == (entityCollection.Entities.Count - 1) ? tempString : tempString + ", ");
			}
			return csv.ToString();
		}

		public static void CreatePublicEOFromEO(IOrganizationService service, Guid EOId, Guid? PublicEOId = null)
		{
			bool update = PublicEOId != null;
			Entity eO = service.Retrieve("msnfp_engagementopportunity", EOId, new ColumnSet("msnfp_engagementopportunitytitle", "msnfp_description", "msnfp_maximum", "msnfp_minimum", "msnfp_publicaddress", "msnfp_street1", "msnfp_street2", "msnfp_street3", "msnfp_publiccity", "msnfp_city", "msnfp_stateprovince", "msnfp_zippostalcode", "msnfp_country", "msnfp_startingdate", "msnfp_endingdate", "msnfp_shortdescription", "msnfp_url", "msnfp_virtualengagementurl", "msnfp_number", "msnfp_location", "msnfp_locationtype", "msnfp_shifts", "msnfp_multipledays", "msnfp_engagementopportunitystatus"));
			Entity publicEO = new Entity("msnfp_publicengagementopportunity");
			if (update)
			{
				publicEO.Id = (Guid)PublicEOId;
			}
			publicEO["msnfp_engagementopportunityid"] = eO.ToEntityReference();
			publicEO["msnfp_engagementopportunitytitle"] = eO.GetAttributeValue<string>("msnfp_engagementopportunitytitle");
			publicEO["msnfp_description"] = eO.GetAttributeValue<string>("msnfp_description");
			publicEO["msnfp_shortdescription"] = eO.GetAttributeValue<string>("msnfp_shortdescription");
			publicEO["msnfp_startingdate"] = eO.GetAttributeValue<DateTime>("msnfp_startingdate");

			publicEO["msnfp_locationtype"] = eO.GetAttributeValue<OptionSetValue>("msnfp_locationtype");
			publicEO["msnfp_shifts"] = eO.GetAttributeValue<bool>("msnfp_shifts");
			publicEO["msnfp_multipledays"] = eO.GetAttributeValue<bool>("msnfp_multipledays");
			if (eO.GetAttributeValue<DateTime?>("msnfp_endingdate") != null)
			{
				publicEO["msnfp_endingdate"] = eO.GetAttributeValue<DateTime>("msnfp_endingdate");
			}
			else if (update)
			{
				publicEO["msnfp_endingdate"] = null;
			}
			publicEO["msnfp_number"] = eO.GetAttributeValue<int?>("msnfp_number");
			publicEO["msnfp_maximum"] = eO.GetAttributeValue<int?>("msnfp_maximum");
			publicEO["msnfp_minimum"] = eO.GetAttributeValue<int?>("msnfp_minimum");
			publicEO["msnfp_engagementopportunitystatus"] = eO.GetAttributeValue<OptionSetValue>("msnfp_engagementopportunitystatus");

			publicEO["msnfp_locationname"] = "";
			string location = "";
			if (eO.GetAttributeValue<bool>("msnfp_publicaddress"))
			{
				publicEO["msnfp_locationname"] = eO.GetAttributeValue<string>("msnfp_location");
				location += $"{eO.GetAttributeValue<string>("msnfp_location")}{Environment.NewLine}";
				location += $"{eO.GetAttributeValue<string>("msnfp_street1")} {eO.GetAttributeValue<string>("msnfp_street2")} {eO.GetAttributeValue<string>("msnfp_street3")}{Environment.NewLine}";
			}
			if (eO.GetAttributeValue<bool>("msnfp_publiccity"))
			{
				publicEO["msnfp_locationcitystate"] = $"{eO.GetAttributeValue<string>("msnfp_city")}, {eO.GetAttributeValue<string>("msnfp_stateprovince")}";
				location += $"{eO.GetAttributeValue<string>("msnfp_city")}, {eO.GetAttributeValue<string>("msnfp_stateprovince")} {eO.GetAttributeValue<string>("msnfp_zippostalcode")}";
			}
			else
			{
				publicEO["msnfp_locationcitystate"] = $"{eO.GetAttributeValue<string>("msnfp_stateprovince")}";
				location += eO.GetAttributeValue<string>("msnfp_stateprovince");
			}
			if (!string.IsNullOrEmpty(eO.GetAttributeValue<string>("msnfp_country")))
			{
				location += Environment.NewLine + eO.GetAttributeValue<string>("msnfp_country");
			}
			publicEO["msnfp_url"] = eO.GetAttributeValue<bool>("msnfp_virtualengagementurl") ? eO.GetAttributeValue<string>("msnfp_url") : string.Empty;
			publicEO["msnfp_location"] = location;
			publicEO["msnfp_areas"] = Utilities.GetEOPreferenceString(service, EOId);
			publicEO["msnfp_qualifications"] = Utilities.GetEOQualificationString(service, EOId);
			if (update)
			{
				service.Update(publicEO);
			}
			else
			{
				service.Create(publicEO);
			}
		}

		/// <summary>
		/// 
		/// </summary>
		/// <param name="dateToCompare"></param>
		/// <param name="startDate"></param>
		/// <param name="endDate"></param>
		/// <param name="tracingService"></param>
		/// <returns>If endDate is null then it compares only startDate.</returns>
		public static bool IsDateTimeInRange(DateTime dateToCompare, DateTime startDate, DateTime? endDate, ITracingService tracingService = null)
		{
			var isInRange = (endDate.HasValue) ?
				(startDate <= dateToCompare && dateToCompare <= endDate)
				:
				(startDate <= dateToCompare)
			;

			tracingService?.Trace($"Checking if {dateToCompare} is in range (start={startDate}; end={endDate};): {isInRange}");

			return isInRange;
		}

	}
}