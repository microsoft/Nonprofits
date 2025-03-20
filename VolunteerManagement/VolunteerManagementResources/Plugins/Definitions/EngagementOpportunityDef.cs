namespace VolunteerManagement.Definitions
{
	/// <summary>DisplayName: Engagement Opportunity, OwnershipType: UserOwned, IntroducedVersion: 2.4.1.1</summary>
	public static class EngagementOpportunityDef
	{
		public const string EntityName = "msnfp_engagementopportunity";
		public const string EntityCollectionName = "msnfp_engagementopportunities";

		#region Attributes

		/// <summary>Type: Uniqueidentifier, RequiredLevel: SystemRequired</summary>
		public const string PrimaryKey = "msnfp_engagementopportunityid";
		/// <summary>Type: String, RequiredLevel: ApplicationRequired, MaxLength: 100, Format: Text</summary>
		public const string PrimaryName = "msnfp_engagementopportunitytitle";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: 0, MaxValue: 2147483647</summary>
		public const string AppliedParticipants = "msnfp_appliedparticipants";
		/// <summary>Type: Boolean, RequiredLevel: None, True: 1, False: 0, DefaultValue: False</summary>
		public const string AutomaticallyApproveAllApplicants = "msnfp_automaticallyapproveallapplicants";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: 0, MaxValue: 2147483647</summary>
		public const string CancelledParticipants = "msnfp_cancelledparticipants";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: 0, MaxValue: 2147483647</summary>
		public const string CancelledShifts = "msnfp_cancelledshifts";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 80, Format: Text</summary>
		public const string City = "msnfp_city";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: -2147483648, MaxValue: 2147483647</summary>
		public const string Completed = "msnfp_completed";
		/// <summary>Type: Decimal, RequiredLevel: None, MinValue: -100000000000, MaxValue: 100000000000, Precision: 2</summary>
		public const string Countdown = "msnfp_countdown";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 80, Format: Text</summary>
		public const string Country_Region = "msnfp_country";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 50, Format: Text</summary>
		public const string County = "msnfp_county";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: msnfp_deliveryframework</summary>
		public const string DeliveryFramework = "msnfp_deliveryframeworkid";
		/// <summary>Type: Memo, RequiredLevel: None, MaxLength: 2000</summary>
		public const string Description = "msnfp_description";
		/// <summary>Type: DateTime, RequiredLevel: None, Format: DateOnly, DateTimeBehavior: UserLocal</summary>
		public const string EndingDate = "msnfp_endingdate";
		/// <summary>Type: Picklist, RequiredLevel: None, DisplayName: Engagement Opportunity Status, OptionSetType: Picklist, DefaultFormValue: 844060000</summary>
		public const string EngagementOpportunityStatus = "msnfp_engagementopportunitystatus";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: 0, MaxValue: 2147483647</summary>
		public const string FilledShifts = "msnfp_filledshifts";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 250, Format: Text</summary>
		public const string Geo_Reference = "msnfp_georeference";
		/// <summary>Type: Double, RequiredLevel: None, MinValue: -90, MaxValue: 90, Precision: 5</summary>
		public const string Latitude = "msnfp_latitude";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 100, Format: Text</summary>
		public const string LocationName = "msnfp_location";
		/// <summary>Type: Picklist, RequiredLevel: ApplicationRequired, DisplayName: Engagement Opportunity Location Types, OptionSetType: Picklist, DefaultFormValue: 844060000</summary>
		public const string LocationType = "msnfp_locationtype";
		/// <summary>Type: Double, RequiredLevel: None, MinValue: -180, MaxValue: 180, Precision: 5</summary>
		public const string Longitude = "msnfp_longitude";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: 0, MaxValue: 2147483647</summary>
		public const string Maximum = "msnfp_maximum";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: 0, MaxValue: 2147483647</summary>
		public const string Minimum = "msnfp_minimum";
		/// <summary>Type: Virtual (Logical), RequiredLevel: None</summary>
		public const string msnfp_automaticallyapproveallapplicantsname = "msnfp_automaticallyapproveallapplicantsname";
		/// <summary>Type: String (Logical), RequiredLevel: None, MaxLength: 100, Format: Text</summary>
		public const string msnfp_deliveryframeworkidname = "msnfp_deliveryframeworkidname";
		/// <summary>Type: Virtual (Logical), RequiredLevel: None</summary>
		public const string msnfp_engagementopportunitystatusname = "msnfp_engagementopportunitystatusname";
		/// <summary>Type: Virtual (Logical), RequiredLevel: None</summary>
		public const string msnfp_locationtypename = "msnfp_locationtypename";
		/// <summary>Type: Virtual (Logical), RequiredLevel: None</summary>
		public const string msnfp_multipledaysname = "msnfp_multipledaysname";
		/// <summary>Type: String (Logical), RequiredLevel: None, MaxLength: 250, Format: Text</summary>
		public const string msnfp_operationidname = "msnfp_operationidname";
		/// <summary>Type: Virtual (Logical), RequiredLevel: None</summary>
		public const string msnfp_publicaddressname = "msnfp_publicaddressname";
		/// <summary>Type: Virtual (Logical), RequiredLevel: None</summary>
		public const string msnfp_publiccityname = "msnfp_publiccityname";
		/// <summary>Type: Virtual (Logical), RequiredLevel: None</summary>
		public const string msnfp_shiftsname = "msnfp_shiftsname";
		/// <summary>Type: Virtual (Logical), RequiredLevel: None</summary>
		public const string msnfp_typename = "msnfp_typename";
		/// <summary>Type: Virtual (Logical), RequiredLevel: None</summary>
		public const string msnfp_virtualengagementurlname = "msnfp_virtualengagementurlname";
		/// <summary>Type: String (Logical), RequiredLevel: None, MaxLength: 250, Format: Text</summary>
		public const string msnfp_workitemidname = "msnfp_workitemidname";
		/// <summary>Type: Boolean, RequiredLevel: None, True: 1, False: 0, DefaultValue: False</summary>
		public const string MultipleDays = "msnfp_multipledays";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: -2147483648, MaxValue: 2147483647</summary>
		public const string NeedsReviewParticipants = "msnfp_needsreviewedparticipants";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: -2147483648, MaxValue: 2147483647</summary>
		public const string NoShow = "msnfp_noshow";
		/// <summary>Type: Integer, RequiredLevel: None, MinValue: 0, MaxValue: 2147483647</summary>
		public const string Number = "msnfp_number";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: msnfp_operation</summary>
		public const string Operation = "msnfp_operationid";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: contact</summary>
		public const string PrimaryContact = "msnfp_primarycontactid";
		/// <summary>Type: Boolean, RequiredLevel: None, True: 1, False: 0, DefaultValue: True</summary>
		public const string PublicAddress = "msnfp_publicaddress";
		/// <summary>Type: Boolean, RequiredLevel: None, True: 1, False: 0, DefaultValue: True</summary>
		public const string PublicCity = "msnfp_publiccity";
		/// <summary>Type: Boolean, RequiredLevel: None, True: 1, False: 0, DefaultValue: False</summary>
		public const string Shifts = "msnfp_shifts";
		/// <summary>Type: Memo, RequiredLevel: ApplicationRequired, MaxLength: 2000</summary>
		public const string ShortDescription = "msnfp_shortdescription";
		/// <summary>Type: DateTime, RequiredLevel: ApplicationRequired, Format: DateOnly, DateTimeBehavior: UserLocal</summary>
		public const string StartingDate = "msnfp_startingdate";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 50, Format: Text</summary>
		public const string State_Province = "msnfp_stateprovince";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 250, Format: Text</summary>
		public const string Street1 = "msnfp_street1";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 250, Format: Text</summary>
		public const string Street2 = "msnfp_street2";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 250, Format: Text</summary>
		public const string Street3 = "msnfp_street3";
		/// <summary>Type: Picklist, RequiredLevel: None, DisplayName: Engagement Opportunity Type, OptionSetType: Picklist, DefaultFormValue: -1</summary>
		public const string Type = "msnfp_type";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 600, Format: Url</summary>
		public const string URL = "msnfp_url";
		/// <summary>Type: Boolean, RequiredLevel: None, True: 1, False: 0, DefaultValue: True</summary>
		public const string VirtualEngagementUrl = "msnfp_virtualengagementurl";
		/// <summary>Type: Lookup, RequiredLevel: None, Targets: msnfp_workitem</summary>
		public const string WorkItem = "msnfp_workitemid";
		/// <summary>Type: String, RequiredLevel: None, MaxLength: 20, Format: Text</summary>
		public const string ZIP_PostalCode = "msnfp_zippostalcode";

		#endregion Attributes

		#region OptionSets

		public enum EngagementOpportunityStatusOptionSet
		{
			Draft = 844060000,
			SettoPublish = 844060001,
			PublishtoWeb = 844060002,
			PrivatelyPublished = 844060003,
			Closed = 844060004,
			Cancelled = 844060005
		}
		public enum LocationTypeOptionSet
		{
			OnLocation = 844060000,
			Virtual = 844060001,
			Both = 844060002,
			None = 844060003
		}

		#endregion OptionSets
	}
}