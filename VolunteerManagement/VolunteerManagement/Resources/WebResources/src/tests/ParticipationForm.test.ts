import { XrmMockGenerator, LookupValueMock } from 'xrm-mock';
import { ParticipationForm } from '../ParticipationForm';

describe('ParticipationForm', () => {
	beforeEach(() => {
		XrmMockGenerator.eventContext.formContext.ui.getFormType = () => XrmEnum.FormType.Create;

		XrmMockGenerator.Attribute.createOptionSet(
			'msnfp_status',
			Msnfp_participationEnum.msnfp_status.Cancelled
		);
		XrmMockGenerator.Attribute.createLookup(
			'msnfp_engagementopportunityid',
			[new LookupValueMock('id', 'contact')]
		);

		(Xrm.WebApi as any).retrieveRecord = () => Promise.resolve();
	});

	test('Loads without error', () => {
		const form = new ParticipationForm();
		form.OnLoad(XrmMockGenerator.eventContext);
	});

	test('Loads with empty msnfp_engagementopportunityid', () => {
		XrmMockGenerator.eventContext.formContext.getAttribute('msnfp_engagementopportunityid').setValue(null);

		const form = new ParticipationForm();
		form.OnLoad(XrmMockGenerator.eventContext);
	});

	test('Validate form context with true auto approve state', () => {
		const form = new ParticipationForm();
		form.UpdateAutoApprovedState(XrmMockGenerator.eventContext.formContext, true);
		expect(
			XrmMockGenerator.formContext.getAttribute('msnfp_status').getValue()
		).toBe(Msnfp_participationEnum.msnfp_status.Approved);
	});

	test('Validate form context with false auto approve state', () => {
		const form = new ParticipationForm();
		form.UpdateAutoApprovedState(XrmMockGenerator.eventContext.formContext, false);
		expect(
			XrmMockGenerator.eventContext.formContext.getAttribute('msnfp_status').getValue()
		).toBe(Msnfp_participationEnum.msnfp_status.NeedsReview);
	});
});
