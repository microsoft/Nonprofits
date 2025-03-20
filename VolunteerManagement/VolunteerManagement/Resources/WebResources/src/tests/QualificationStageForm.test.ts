import { XrmMockGenerator } from 'xrm-mock';
import { QualificationStageForm } from '../QualificationStageForm';

describe('QualificationStageForm', () => {
	beforeEach(() => {
		XrmMockGenerator.Attribute.createOptionSet('msnfp_stagestatus', Msnfp_qualificationstageEnum.msnfp_stagestatus.Pending, [
			{ value: Msnfp_qualificationstageEnum.msnfp_stagestatus.Pending, text: '' },
			{ value: Msnfp_qualificationstageEnum.msnfp_stagestatus.Abandon, text: '' }
		]);
		XrmMockGenerator.Control.createGrid('Subgrid_1');
		XrmMockGenerator.Control.createGrid('Subgrid_2');
	});

	describe('OnLoad', () => {
		test('Runs without errors', () => {
			const form = new QualificationStageForm();

			form.OnLoad(XrmMockGenerator.eventContext);
		});

		test('Loads when stageStatus !== Pending', () => {
			const form = new QualificationStageForm();
			XrmMockGenerator.formContext.getAttribute('msnfp_stagestatus').setValue(Msnfp_qualificationstageEnum.msnfp_stagestatus.Abandon);

			form.OnLoad(XrmMockGenerator.eventContext);
		});
	});
});