import { XrmMockGenerator } from 'xrm-mock';
import { EngagementQualification } from '../EngagementQualificationForm';

describe('Enagagement Qualification form tests', () => {
	beforeEach(() => {
		XrmMockGenerator.Attribute.createLookup('msnfp_engagementopportunityid', { id: '{00000000-0000-0000-0000-000000000000}', entityType: 'msnfp_engagementopportunity', name: ''});
		XrmMockGenerator.Attribute.createLookup('msnfp_qualificationtypeid', { id: '{00000000-0000-0000-0000-000000000000}', entityType: 'msnfp_qualificationtype', name: ''});
		XrmMockGenerator.Attribute.createBoolean('msnfp_isrequired', false);
		XrmMockGenerator.Attribute.createString('msnfp_engagementopportunityparticipantquatitle', '');

		Xrm.Utility.getResourceString = (webResourceName: string, key: string): string => {
			switch (key) {
				case 'MSNFP_required':
					return 'MSNFP_required';
				case 'MSNFP_desired':
					return 'MSNFP_desired';
				default:
					return '';
			}
		};
	});

	test('Test participation title with all fields present', () => {
		const engagementQualification = new EngagementQualification();
		engagementQualification.UpdateName(XrmMockGenerator.eventContext);
		expect(
			XrmMockGenerator.eventContext.formContext
				.getAttribute('msnfp_engagementopportunityparticipantquatitle')
				.getValue()
		).toContain('EngagementOpportunityParticipantQualification.General.IsRequired.TitleDesiredText');
	});

	test('Test participation title with all field absent', () => {
		const engagementQualification = new EngagementQualification();
		engagementQualification.UpdateName(XrmMockGenerator.eventContext);
		expect(
			XrmMockGenerator.eventContext.formContext
				.getAttribute('msnfp_engagementopportunityparticipantquatitle')
				.getValue()
		).toContain('EngagementOpportunityParticipantQualification.General.IsRequired.TitleDesiredText');
	});

	test('Test participation title when msnfp_isrequired is true', () => {
		XrmMockGenerator.eventContext.formContext.getAttribute('msnfp_isrequired').setValue(true);
		const engagementQualification = new EngagementQualification();
		engagementQualification.UpdateName(XrmMockGenerator.eventContext);
		expect(
			XrmMockGenerator.eventContext.formContext
				.getAttribute('msnfp_engagementopportunityparticipantquatitle')
				.getValue()
		).toContain('EngagementOpportunityParticipantQualification.General.IsRequired.TitleRequiredText');
	});
});
