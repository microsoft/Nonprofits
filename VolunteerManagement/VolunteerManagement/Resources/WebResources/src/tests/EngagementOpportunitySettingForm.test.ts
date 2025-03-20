import { XrmMockGenerator } from 'xrm-mock';
import { EngagementOppurtunitySettingForm } from '../EngagementOpportunitySettingForm';

describe('EngagementOpportunitySettingForm', () => {
	beforeEach(() => {
		XrmMockGenerator.Attribute.createLookup('msnfp_engagementopportunityid', {id: '888-888-888', name: 'msnfp_engagementopportunity', entityType: ''});
		XrmMockGenerator.Attribute.createOptionSet('msnfp_settingtype', Msnfp_engagementopportunitysettingEnum.msnfp_settingtype.Message, [
			{ text: 'msnfpEOSettingType.Message', value:  Msnfp_engagementopportunitysettingEnum.msnfp_settingtype.Message },
			{ text: 'other option', value:  0 }]
		);
		XrmMockGenerator.Attribute.createString('msnfp_messagesubject', 'subject');
		XrmMockGenerator.Attribute.createString('msnfp_name', 'testName');
	});

	describe('UpdateName', () => {
		test('Runs without errors', () => {
			const settingForm = new EngagementOppurtunitySettingForm();

			settingForm.UpdateName(XrmMockGenerator.eventContext);
		});

		test('Runs without errors with different msnfp_settingtype', () => {
			XrmMockGenerator.formContext.getAttribute('msnfp_settingtype').setValue(0);
			const settingForm = new EngagementOppurtunitySettingForm();

			settingForm.UpdateName(XrmMockGenerator.eventContext);
		});
	});
});