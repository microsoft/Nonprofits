namespace Plugins.Resx
{
    using Plugins.Localization;

    public class Labels
    {
        public const string LabelWebResourcePrefix = "msnfp_/strings/VolunteerManagement.Plugins";

		/// <summary>
		/// An error occurred in plugin: {0}
		/// </summary>
        public LocalizationInfoModel Plugins_Common_GenericPluginException { get; set; }
		/// <summary>
		/// Plugin step for the {0} is incorrectly registered!
		/// </summary>
        public LocalizationInfoModel Plugins_Common_IncorrectlyRegisteredException { get; set; }
		/// <summary>
		/// for the selected date range: {0}
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_InvalidShifts_SelectedDateMessage { get; set; }
		/// <summary>
		/// Invalid shift
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_InvalidShiftMessage { get; set; }
		/// <summary>
		/// Invalid shifts
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_InvalidShiftsMessage { get; set; }
		/// <summary>
		/// Engagement Opportunity and Preference Type are required.
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_Preference_RequiredException { get; set; }
		/// <summary>
		/// Engagement Opportunity and Qualification Type are required.
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_Qualification_RequiredException { get; set; }
		/// <summary>
		/// An Engagement Opportunity is required.
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_RequiredException { get; set; }
		/// <summary>
		/// Contact: {0} is a deactivated user.
		/// </summary>
        public LocalizationInfoModel Contact_DeactivatedException { get; set; }
		/// <summary>
		/// You can not add volunteers to the closed or canceled Engagement Opportunities
		/// </summary>
        public LocalizationInfoModel Participation_EngagementOpportunity_CanceledException { get; set; }
		/// <summary>
		/// There may only be one stage at a time that is marked as active. Please complete other stages prior to marking a stage as active.
		/// </summary>
        public LocalizationInfoModel QualificationStage_OnlyOneActiveAllowedException { get; set; }
		/// <summary>
		/// Reverting a stage is not supported.
		/// </summary>
        public LocalizationInfoModel QualificationStage_RevertingNotSupportedException { get; set; }
		/// <summary>
		/// Engagement Opportunities with no shifts should only have one engagement opportunity schedule.
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_EngagementOpportunitySchedule_OnlyOneRequiredException { get; set; }
		/// <summary>
		/// Start Date not specified
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_Schedule_StartDateNotSpecifiedException { get; set; }
		/// <summary>
		/// Start Date cannot be greater than End Date date
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_Schedule_InvalidStartDateException { get; set; }
		/// <summary>
		/// Start and End date of the Schedule cannot be out of Start and End date of the Engagement Opportunity.
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_Schedule_OutOfRangeException { get; set; }
		/// <summary>
		/// Minimum participants should be specified with Maximum participants
		/// </summary>
        public LocalizationInfoModel EngagementOpportunitySchedule_Participants_NotSpecifiedException { get; set; }
		/// <summary>
		/// Minimum participants cannot be greater than Maximum participants value
		/// </summary>
        public LocalizationInfoModel EngagementOpportunitySchedule_Participants_MinimumException { get; set; }
		/// <summary>
		/// Related shift ({0}) has incorrect table type ({1})
		/// </summary>
        public LocalizationInfoModel EngagementOpportunity_Shifts_IncorrectTypeException { get; set; }
		/// <summary>
		/// The selected participation record must be approved.
		/// </summary>
        public LocalizationInfoModel Participation_NotApprovedException { get; set; }
		/// <summary>
		/// This shift is full. Please choose another shift.
		/// </summary>
        public LocalizationInfoModel ParticipationSchedule_ShiftFullException { get; set; }
		/// <summary>
		/// The selected shift belongs to a different engagement opportunity. Please choose a shift of this participation's engagement opportunity.
		/// </summary>
        public LocalizationInfoModel ParticipationSchedule_ShiftNotInEngagementOpportunityException { get; set; }
		/// <summary>
		/// The selected shift is no longer available.
		/// </summary>
        public LocalizationInfoModel ParticipationSchedule_ShiftNotActiveException { get; set; }
		/// <summary>
		/// The participation status can't be changed to the selected value.
		/// </summary>
        public LocalizationInfoModel Participation_StatusChangeNotAllowedException { get; set; }
		/// <summary>
		/// The participation schedule status can't be changed to the selected value.
		/// </summary>
        public LocalizationInfoModel ParticipationSchedule_StatusChangeNotAllowedException { get; set; }
		/// <summary>
		/// The volunteer or engagement opportunity of a participation can't be changed.
		/// </summary>
        public LocalizationInfoModel Participation_ReassignmentNotAllowedException { get; set; }
		/// <summary>
		/// The participation or shift of a participation schedule can't be changed.
		/// </summary>
        public LocalizationInfoModel ParticipationSchedule_ReassignmentNotAllowedException { get; set; }
		/// <summary>
		/// No more volunteers needed.
		/// </summary>
        public LocalizationInfoModel Participation_NoMoreVolunteersNeededException { get; set; }
		/// <summary>
		/// A Contact is required.
		/// </summary>
        public LocalizationInfoModel Participation_Contact_RequiredException { get; set; }
		/// <summary>
		/// Contact and Group are required.
		/// </summary>
        public LocalizationInfoModel GroupMembership_ContactAndGroup_RequiredException { get; set; }
    }
}