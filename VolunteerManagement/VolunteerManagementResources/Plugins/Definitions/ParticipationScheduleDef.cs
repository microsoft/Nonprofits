namespace VolunteerManagement.Definitions
{
	/// <summary>DisplayName: Participation Schedule, OwnershipType: UserOwned, IntroducedVersion: 1.0.0.0</summary>
	public static class ParticipationScheduleDef
	{
		public const string EntityName = "msnfp_participationschedule";
		public const string EntityCollectionName = "msnfp_participationschedules";

		#region Attributes

		/// <summary>Type: Uniqueidentifier, RequiredLevel: SystemRequired</summary>
		public const string PrimaryKey = "msnfp_participationscheduleid";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 100, Format: Text</summary>
		public const string PrimaryName = "msnfp_name";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: systemuser</summary>
		public const string CreatedBy = "createdby";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string CreatedOn = "createdon";
		/// <summary>Type: Lookup, RequiredLevel: ApplicationRequired, Targets: msnfp_engagementopportunityschedule</summary>
		public const string EngagementOpportunitySchedule = "msnfp_engagementopportunityscheduleid";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: systemuser</summary>
		public const string ModifiedBy = "modifiedby";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string ModifiedOn = "modifiedon";
		/// <summary>Type: Owner, RequiredLevel: SystemRequired, Targets: systemuser,team</summary>
		public const string Owner = "ownerid";
		/// <summary>Type: Lookup, RequiredLevel: ApplicationRequired, Targets: msnfp_participation</summary>
		public const string Participation = "msnfp_participationid";
		/// <summary>Type: Picklist, RequiredLevel: ApplicationRequired, DisplayName: Participation Schedule Status, OptionSetType: Picklist, DefaultFormValue: 335940000</summary>
		public const string ScheduleStatus = "msnfp_schedulestatus";
		/// <summary>Type: State, RequiredLevel: SystemRequired, DisplayName: Status, OptionSetType: State</summary>
		public const string Status = "statecode";
		/// <summary>Type: Status, RequiredLevel: None, DisplayName: Status Reason, OptionSetType: Status</summary>
		public const string StatusReason = "statuscode";

		#endregion Attributes

		#region OptionSets

		public enum ScheduleStatus_OptionSet
		{
			Pending = 335940000,
			Completed = 335940001,
			NoShow = 335940002,
			Cancelled = 335940003
		}
		public enum Status_OptionSet
		{
			Active = 0,
			Inactive = 1
		}
		public enum StatusReason_OptionSet
		{
			Active = 1,
			Inactive = 2
		}

		#endregion OptionSets
	}
}