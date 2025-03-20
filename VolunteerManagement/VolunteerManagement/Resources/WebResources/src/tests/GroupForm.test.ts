import { XrmMockGenerator } from 'xrm-mock';
import { GroupForm } from '../GroupForm';

describe('GroupForm ', () => {
	beforeEach(() => {
		XrmMockGenerator.Tab.createTab('tab_summary');
		XrmMockGenerator.formContext.ui.getFormType = () => XrmEnum.FormType.Create;
	});

	describe('OnLoad', () => {
		test('Runs without errors', () => {
			const form = new GroupForm();

			form.OnLoad(XrmMockGenerator.eventContext);
		});

		test('Loads Update form', () => {
			const form = new GroupForm();
			XrmMockGenerator.formContext.ui.getFormType = () => XrmEnum.FormType.Update;

			form.OnLoad(XrmMockGenerator.eventContext);
		});

		test('Loads different form type', () => {
			const form = new GroupForm();
			XrmMockGenerator.formContext.ui.getFormType = () => XrmEnum.FormType.ReadOnly;

			form.OnLoad(XrmMockGenerator.eventContext);
		});
	});
});