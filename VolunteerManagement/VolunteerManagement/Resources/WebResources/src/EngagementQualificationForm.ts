import { getLocalizedText } from './Common';

export class EngagementQualification {
	UpdateName = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();

		const engagementOpportunity = formContext
			.getAttribute('msnfp_engagementopportunityid')
			?.getValue();
		const engagementOpportunityName = engagementOpportunity.length > 0 ? engagementOpportunity[0].name : '';

		const qualificationType = formContext
			.getAttribute('msnfp_qualificationtypeid')
			?.getValue();

		const qualificationTypeName =
			qualificationType != null && qualificationType.length > 0
				? qualificationType[0].name
				: '';


		const isRequired = formContext.getAttribute<Xrm.Attributes.BooleanAttribute>('msnfp_isrequired')?.getValue();

		const requiredTitleText = getLocalizedText('EngagementOpportunityParticipantQualification.General.IsRequired.TitleRequiredText', qualificationTypeName, engagementOpportunityName);
		const desiredTitleText = getLocalizedText('EngagementOpportunityParticipantQualification.General.IsRequired.TitleDesiredText', qualificationTypeName, engagementOpportunityName);

		formContext
			.getAttribute('msnfp_engagementopportunityparticipantquatitle')
			?.setValue(isRequired ? requiredTitleText : desiredTitleText);
	};
}

window.EngagementQualification = new EngagementQualification();