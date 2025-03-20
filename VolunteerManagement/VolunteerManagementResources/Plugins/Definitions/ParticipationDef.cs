namespace VolunteerManagement.Definitions
{
	/// <summary>OwnershipType: UserOwned, IntroducedVersion: 2.4.1.1</summary>
	public static class ParticipationDef
	{
		public const string EntityName = "msnfp_participation";
		public const string EntityCollectionName = "msnfp_participations";

		#region Attributes

		/// <summary>Type: Uniqueidentifier, RequiredLevel: SystemRequired</summary>
		public const string PrimaryKey = "msnfp_participationid";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 100, Format: Text</summary>
		public const string PrimaryName = "msnfp_participationtitle";
		/// <summary>Type: Lookup, RequiredLevel: ApplicationRequired, Targets: contact</summary>
		public const string Contact = "msnfp_contactid";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: systemuser</summary>
		public const string CreatedBy = "createdby";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string CreatedOn = "createdon";
		/// <summary>Type: Memo, RequiredLevel: None, MaxLength: 2000</summary>
		public const string Description = "msnfp_description";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string EndDate = "msnfp_enddate";
		/// <summary>Type: Lookup, RequiredLevel: ApplicationRequired, Targets: msnfp_engagementopportunity</summary>
		public const string EngagementOpportunity = "msnfp_engagementopportunityid";
		/// <summary>Type: Decimal, RequiredLevel: None, MinValue: 0, MaxValue: 100000000000, Precision: 1</summary>
		public const string Hours = "msnfp_hours";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: systemuser</summary>
		public const string ModifiedBy = "modifiedby";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string ModifiedOn = "modifiedon";
		/// <summary>Type: Owner, RequiredLevel: SystemRequired, Targets: systemuser,team</summary>
		public const string Owner = "ownerid";
		/// <summary>Type: Picklist, RequiredLevel: ApplicationRequired, DisplayName: Participation Status, OptionSetType: Picklist, DefaultFormValue: 844060000</summary>
		public const string ParticipationStatus = "msnfp_status";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: msnfp_participationtype</summary>
		public const string ParticipationType = "msnfp_participationtypeid";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string StartDate = "msnfp_startdate";
		/// <summary>Type: State, RequiredLevel: SystemRequired, DisplayName: Status, OptionSetType: State</summary>
		public const string Status = "statecode";
		/// <summary>Type: Status, RequiredLevel: None, DisplayName: Status Reason, OptionSetType: Status</summary>
		public const string StatusReason = "statuscode";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: msnfp_group</summary>
		public const string VolunteerGroup = "msnfp_volunteergroupid";

		#endregion Attributes

		#region OptionSets

		public enum ParticipationStatus_OptionSet
		{
			NeedsReview = 844060000,
			InReview = 844060001,
			Approved = 844060002,
			Dismissed = 844060003,
			Cancelled = 844060004
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