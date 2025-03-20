namespace VolunteerManagement.Definitions
{
	/// <summary>DisplayName: Engagement Opportunity Schedule, OwnershipType: UserOwned, IntroducedVersion: 2.4.1.1</summary>
	public static class EngagementOpportunityScheduleDef
	{
		public const string EntityName = "msnfp_engagementopportunityschedule";
		public const string EntityCollectionName = "msnfp_engagementopportunityschedules";

		#region Attributes

		/// <summary>Type: Uniqueidentifier, RequiredLevel: SystemRequired</summary>
		public const string PrimaryKey = "msnfp_engagementopportunityscheduleid";
		/// <summary>Type: String, RequiredLevel: ApplicationRequired, MaxLength: 100, Format: Text</summary>
		public const string PrimaryName = "msnfp_engagementopportunityschedule";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: systemuser</summary>
		public const string CreatedBy = "createdby";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string CreatedOn = "createdon";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string EndDate = "msnfp_effectiveto";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateOnly, DateTimeBehavior: UserLocal</summary>
		public const string EndPeriod = "msnfp_endperiod";
		/// <summary>Type: Lookup, RequiredLevel: ApplicationRequired, Targets: msnfp_engagementopportunity</summary>
		public const string EngagementOpportunity = "msnfp_engagementopportunity";
		/// <summary>Type: Decimal, RequiredLevel: None, MinValue: -100000000000, MaxValue: 100000000000, Precision: 2</summary>
		public const string Hours = "msnfp_hours";
		/// <summary>Type: Decimal, RequiredLevel: None, MinValue: 0, MaxValue: 100000000000, Precision: 1</summary>
		public const string HoursperDay = "msnfp_hoursperday";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: 0, MaxValue: 2147483647</summary>
		public const string MaxofParticipants = "msnfp_maximum";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: 0, MaxValue: 2147483647</summary>
		public const string MinofParticipants = "msnfp_minimum";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: systemuser</summary>
		public const string ModifiedBy = "modifiedby";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string ModifiedOn = "modifiedon";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: 0, MaxValue: 2147483647</summary>
		public const string Number = "msnfp_number";
		/// <summary>Type: Owner, RequiredLevel: SystemRequired, Targets: systemuser,team</summary>
		public const string Owner = "ownerid";
		/// <summary>Type: String, RequiredLevel: ApplicationRequired, MaxLength: 250, Format: Text</summary>
		public const string ShiftName = "msnfp_shiftname";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string StartDate = "msnfp_effectivefrom";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateOnly, DateTimeBehavior: UserLocal</summary>
		public const string StartPeriod = "msnfp_startperiod";
		/// <summary>Type: State, RequiredLevel: SystemRequired, DisplayName: Status, OptionSetType: State</summary>
		public const string Status = "statecode";
		/// <summary>Type: Status, RequiredLevel: None, DisplayName: Status Reason, OptionSetType: Status</summary>
		public const string StatusReason = "statuscode";
		/// <summary>Type: Decimal, RequiredLevel: None, MinValue: 0, MaxValue: 100000000000, Precision: 1</summary>
		public const string TotalHours = "msnfp_totalhours";
		/// <summary>Type: Picklist, RequiredLevel: None, DisplayName: Engagement Opportunity Schedule Types, OptionSetType: Picklist, DefaultFormValue: -1</summary>
		public const string Type = "msnfp_type";
		/// <summary>Type: Virtual, RequiredLevel: None, DisplayName: Days of the Week, OptionSetType: Picklist</summary>
		public const string WorkingDays = "msnfp_workingdays";

		#endregion Attributes

		#region OptionSets

		public enum StatusOptionSet
		{
			Active = 0,
			Inactive = 1
		}
		public enum StatusReasonOptionSet
		{
			Active = 1,
			Inactive = 2
		}
		public enum TypeOptionSet
		{
			Annual = 844060000,
			Monthly = 844060001,
			Weekly = 844060002,
			Daily = 844060003
		}
		public enum WorkingDaysOptionSet
		{
			Monday = 844060000,
			Tuesday = 844060001,
			Wednesday = 844060002,
			Thursday = 844060003,
			Friday = 844060004,
			Saturday = 844060005,
			Sunday = 844060006
		}

		#endregion OptionSets
	}
}