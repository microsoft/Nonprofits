using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Plugins
{
	public enum EOScheduleType
	{
		SingleDate = 844060000,
		Shifts = 844060001,
		Multiday = 844060002,
		NoShifts = 844060003
	}
	public enum ParticipationStatus
	{
		NeedsReview = 844060000,
		InReview = 844060001,
		Approved = 844060002,
		Dismissed = 844060003,
		Cancelled = 844060004
	}
	public enum ParticipationScheduleStatus
	{
		Pending = 335940000,
		Completed = 335940001,
		NoShow = 335940002,
		Cancelled = 335940003,
	}
	public enum EngagementOpportunitySettingMessageEventType
	{
		SignUpCompleted = 844060000,
		SignUpApproved = 844060001,
		EngagementCompleted = 844060002
	}
	public enum EngagementOpportunitySettingSettingType
	{
		Message = 844060000
	}
	public enum EngagementOpportunitySettingSendToType
	{
		AllVolunteers = 844060000,
		ApprovedVolunteers = 844060001,
	}

	public enum ContactStatus
	{
		Active = 0,
		InActive = 1
	}
	public enum EngagementOpportunityStatus
	{
		Draft = 844060000,
		SetToPublish = 844060001,
		PublishToWeb = 844060002,
		PrivatelyPublished = 844060003,
		Closed = 844060004,
		Cancelled = 844060005
	}
	public enum OnboardingQualificationStatus
	{
		Pending = 844060000,
		Completed = 844060001,
		Abandoned = 844060002
	}
	public enum QualificationTypeTypes
	{
		Certification = 844060000,
		Language = 844060001,
		Skill = 844060002,
		Training = 844060003,
		Onboarding = 844060004
	}
	public enum QualificationStageStatus
	{
		Pending = 844060000,
		Active = 844060001,
		Completed = 844060002,
		Abandon = 844060003
	}
	public enum QualificationStepActivtyType
	{
		OnboardingTask = 844060000,
		PhoneCall = 844060001,
		Appointment = 844060002
	}
	public enum EngagementOpportunityScheduleStatus
	{
		Active = 0,
		InActive = 1
	}
	public enum EngagementOpportunityScheduleStatusReason
	{
		Active = 1,
		InActive = 2
	}
}