import { XrmMockGenerator } from 'xrm-mock';
import { ParticipationScheduleForm } from '../ParticipationScheduleForm';

class XMLHttpRequestMock {
	status: number;
	responseText: string;

	constructor() {
		this.status = 200;
		this.responseText = '{"_msnfp_engagementopportunityid_value":"888-888-888"}';
	}

	open(...params: any) {}
	send(...params: any) {}
}

describe('ParticipationScheduleForm', () => {
	beforeEach(() => {
		XrmMockGenerator.Attribute.createLookup('msnfp_engagementopportunityscheduleid', { id: '888-888-888', name: 'msnfp_engagementopportunity', entityType: '' });
		XrmMockGenerator.Attribute.createLookup('msnfp_participationid', { id: '888-888-888', name: 'msnfp_participation', entityType: '' });

		(window as any).XMLHttpRequest = XMLHttpRequestMock;
	});

	describe('OnLoad', () => {
		test('Runs without errors', () => {
			const participationScheduleForm = new ParticipationScheduleForm();

			participationScheduleForm.OnLoad(XrmMockGenerator.eventContext);
		});
	});

	describe('OnPreSearchAddFilterSync', () => {
		test('Runs without errors', () => {
			const participationScheduleForm = new ParticipationScheduleForm();

			participationScheduleForm.OnPreSearchAddFilterSync(XrmMockGenerator.eventContext);
		});
	});
});