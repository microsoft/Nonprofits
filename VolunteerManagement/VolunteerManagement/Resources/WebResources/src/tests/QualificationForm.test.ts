import { XrmMockGenerator } from 'xrm-mock';
import { QualificationForm } from '../QualificationForm';

describe('QualificationForm', () => {
	beforeEach(() => {
		XrmMockGenerator.Attribute.createLookup('msnfp_typeid', { id: '888-888-888', name: 'msnfp_type', entityType: '' } );
		XrmMockGenerator.Tab.createTab('tab_2');
		XrmMockGenerator.eventContext.formContext.ui.getFormType = () => XrmEnum.FormType.Undefined;

		const grid = XrmMockGenerator.Control.createGrid('WebResource_nextstage');
		(grid as any).getContentWindow = () => Promise.resolve({ setClientApiContext: () => {} });

		Xrm.WebApi.retrieveRecord = () => Promise.resolve({ msnfp_type: 844060004 }) as any;
		Xrm.Navigation.openConfirmDialog = () => Promise.resolve({ confirmed: false }) as any;
	});

	describe('OnLoad', () => {
		test('Runs without errors', () => {
			const form = new QualificationForm();

			form.OnLoad(XrmMockGenerator.eventContext);
		});

		test('Loads Create form', () => {
			const form = new QualificationForm();
			XrmMockGenerator.eventContext.formContext.ui.getFormType = () => XrmEnum.FormType.Create;

			form.OnLoad(XrmMockGenerator.eventContext);
		});
	});
});
