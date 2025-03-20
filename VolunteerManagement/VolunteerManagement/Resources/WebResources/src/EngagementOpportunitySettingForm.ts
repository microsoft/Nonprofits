export class EngagementOppurtunitySettingForm {
	UpdateName = (executionContext: Xrm.Events.EventContext) => {
		const formContext = executionContext.getFormContext();
		const engagementOpportunity = formContext
			.getAttribute('msnfp_engagementopportunityid')
			?.getValue();
		const engagementOpportunityName = engagementOpportunity.length > 0 ? engagementOpportunity[0].name : '';
		const settingType = formContext
			.getAttribute('msnfp_settingtype')
			?.getValue();

		const settingTypeText = formContext
			.getAttribute<Xrm.Attributes.OptionSetAttribute>('msnfp_settingtype')
			?.getText();
		if (
			settingType != null &&
			settingType == Msnfp_engagementopportunitysettingEnum.msnfp_settingtype.Message
		) {
			const subject = formContext
				.getAttribute('msnfp_messagesubject')
				?.getValue();
			formContext
				.getAttribute('msnfp_name')
				?.setValue(
					engagementOpportunityName +
					` - ${settingTypeText}: ` +
					subject +
					' - ' +
					new Date().toLocaleString()
				);
		} else {
			formContext
				.getAttribute('msnfp_name')
				?.setValue(engagementOpportunityName + ' - ' + new Date().toLocaleString());
		}
	};
}

window.EngagementOppurtunitySettingForm = new EngagementOppurtunitySettingForm();
