import { ItemCollectionMock, SectionMock, XrmMockGenerator } from 'xrm-mock';
import { QualificationTypeForm } from '../QualificationTypeForm';

describe('Qualification Type form tests', () => {
	beforeEach(() => {
		XrmMockGenerator.Attribute.createOptionSet('msnfp_type', Msnfp_qualificationtypeEnum.msnfp_type.Onboarding);
		XrmMockGenerator.eventContext.formContext.getAttribute('msnfp_type').setValue(Msnfp_qualificationtypeEnum.msnfp_type.Onboarding);
		XrmMockGenerator.eventContext.formContext.ui.getFormType = () => XrmEnum.FormType.Create;
		XrmMockGenerator.Tab.createTab(
			'tab_general', 'tab_general', true, 'expanded', undefined, new ItemCollectionMock([ new SectionMock('section_stages') ])
		);

		Xrm.Utility.getResourceString = (webResourceName: string, key: string): string => {
			switch (key) {
				case 'MSNFP_createFormNotification':
					return 'MSNFP_createFormNotification';
				default:
					return '';
			}
		};
		Xrm.Navigation.openConfirmDialog = (
			confirmStrings: Xrm.Navigation.ConfirmStrings,
			confirmOptions?: Xrm.Navigation.DialogSizeOptions
		) => {
			return new Promise<Xrm.Navigation.ConfirmResult>((resolve, reject) => {
				resolve({ confirmed: false });
			}) as any;
		};

		(Xrm.Navigation as any).openForm = (entityFormOptions: Xrm.Navigation.EntityFormOptions, formParameters?:  Xrm.Utility.OpenParameters) => Promise.resolve({savedEntityReference: []});
	});

	test('OpenQuickCreateFromSubgridRibbon', () => {
		const qualificationTypeForm = new QualificationTypeForm();

		qualificationTypeForm.OpenQuickCreateFromSubgridRibbon(XrmMockGenerator.eventContext.formContext, [{ id: '888-888-888' }]);
	});

	test('Test qualification type Create form', () => {
		const qualificationTypeForm = new QualificationTypeForm();

		qualificationTypeForm.CheckType(XrmMockGenerator.eventContext);
		expect(XrmMockGenerator.eventContext.formContext.ui.tabs.get('tab_general').sections.get('section_stages').getVisible()).toBe(false);
	});

	test('Test qualification type Update form', () => {
		XrmMockGenerator.eventContext.formContext.ui.getFormType = () => XrmEnum.FormType.Update;
		const qualificationTypeForm = new QualificationTypeForm();

		qualificationTypeForm.CheckType(XrmMockGenerator.eventContext);
		expect(XrmMockGenerator.eventContext.formContext.ui.tabs.get('tab_general').sections.get('section_stages').getVisible()).toBe(true);
	});

	test('Load qualification type Create form', () => {
		const qualificationTypeForm = new QualificationTypeForm();

		qualificationTypeForm.OnLoad(XrmMockGenerator.eventContext);
		expect(XrmMockGenerator.eventContext.formContext.ui.tabs.get('tab_general').sections.get('section_stages').getVisible()).toBe(false);
	});

	test('Load qualification type update form', () => {
		XrmMockGenerator.eventContext.formContext.ui.getFormType = () => XrmEnum.FormType.Update;
		const qualificationTypeForm = new QualificationTypeForm();

		qualificationTypeForm.OnLoad(XrmMockGenerator.eventContext);
		expect(XrmMockGenerator.eventContext.formContext.ui.tabs.get('tab_general').sections.get('section_stages').getVisible()).toBe(true);
	});
});
