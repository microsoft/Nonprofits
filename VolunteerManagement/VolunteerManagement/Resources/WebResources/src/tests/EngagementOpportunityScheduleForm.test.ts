import { XrmMockGenerator } from 'xrm-mock';
import { EngagementOpportunityScheduleForm } from '../EngagementOpportunityScheduleForm';

describe('EngagementOpportunityScheduleForm', () => {
	beforeEach(() => {
		XrmMockGenerator.Attribute.createLookup('msnfp_engagementopportunity', { id: '888-888-888', name: '', entityType: '' });
		XrmMockGenerator.Attribute.createDate('msnfp_effectivefrom', new Date());
		XrmMockGenerator.Attribute.createDate('msnfp_effectiveto', new Date());
		XrmMockGenerator.Attribute.createNumber('msnfp_hours');
		XrmMockGenerator.Attribute.createNumber('msnfp_number');
		XrmMockGenerator.Attribute.createNumber('msnfp_minimum');
		XrmMockGenerator.Attribute.createNumber('msnfp_maximum');

		Xrm.Navigation.openConfirmDialog = (confirmStrings: Xrm.Navigation.ConfirmStrings, confirmOptions?: Xrm.Navigation.DialogSizeOptions) => Promise.resolve({ confirmed: false }) as any;
		Xrm.Navigation.openErrorDialog = (errorOptions: Xrm.Navigation.ErrorDialogOptions) => Promise.resolve() as any;
	});

	describe('OnLoad', () => {
		test('Runs without errors', () => {
			const form = new EngagementOpportunityScheduleForm();
			XrmMockGenerator.eventContext.formContext.data.entity.addOnPostSave  = () => {};

			form.OnLoad(XrmMockGenerator.eventContext);
		});
	});

	describe('onPostSave', () => {
		test('Runs without errors', () => {
			const form = new EngagementOpportunityScheduleForm();

			form.onPostSave(XrmMockGenerator.eventContext);
		});
	});

	describe('onScheduleDateChange', () => {
		test('Runs without errors', () => {
			const form = new EngagementOpportunityScheduleForm();

			form.onScheduleDateChange(XrmMockGenerator.eventContext);
		});
	});

	describe('onOpportunityChange', () => {
		test('Runs without errors', () => {
			const form = new EngagementOpportunityScheduleForm();

			form.onOpportunityChange(XrmMockGenerator.eventContext);
		});
	});

	describe('validateScheduleEndIsNotGreaterThanStart', () => {
		test('Runs without errors', () => {
			const form = new EngagementOpportunityScheduleForm();

			form.validateScheduleEndIsNotGreaterThanStart(
				XrmMockGenerator.eventContext.formContext.getAttribute('msnfp_effectivefrom'),
				XrmMockGenerator.eventContext.formContext.getAttribute('msnfp_effectiveto'),
			);
		});
	});
});