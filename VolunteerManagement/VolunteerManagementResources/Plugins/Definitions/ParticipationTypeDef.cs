namespace VolunteerManagement.Definitions
{
	/// <summary>DisplayName: Participation Type, OwnershipType: UserOwned, IntroducedVersion: 2.4.1.1</summary>
	public static class ParticipationType
	{
		public const string EntityName = "msnfp_participationtype";
		public const string EntityCollectionName = "msnfp_participationtypes";

		#region Attributes

		/// <summary>Type: Uniqueidentifier, RequiredLevel: SystemRequired</summary>
		public const string PrimaryKey = "msnfp_participationtypeid";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 100, Format: Text</summary>
		public const string PrimaryName = "msnfp_participationtypetitle";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: systemuser</summary>
		public const string CreatedBy = "createdby";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string CreatedOn = "createdon";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: systemuser</summary>
		public const string ModifiedBy = "modifiedby";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateAndTime, DateTimeBehavior: UserLocal</summary>
		public const string ModifiedOn = "modifiedon";
		/// <summary>Type: Owner, RequiredLevel: SystemRequired, Targets: systemuser,team</summary>
		public const string Owner = "ownerid";
		/// <summary>Type: State, RequiredLevel: SystemRequired, DisplayName: Status, OptionSetType: State</summary>
		public const string Status = "statecode";
		/// <summary>Type: Status, RequiredLevel: None, DisplayName: Status Reason, OptionSetType: Status</summary>
		public const string StatusReason = "statuscode";

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

		#endregion OptionSets
	}
}