import { XrmMockGenerator } from 'xrm-mock';
import { ParticipationScheduleForm } from '../ParticipationScheduleForm';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
const noShiftsFilter = '<filter type=\'and\'><condition attribute=\'msnfp_engagementopportunityscheduleid\' operator=\'null\'/></filter>';

describe('ParticipationScheduleForm', () => {
	let retrieveRecordMock: jest.Mock;
	let xhrOpenSpy: jest.SpyInstance;

	beforeEach(() => {
		XrmMockGenerator.initialise();
		XrmMockGenerator.Attribute.createLookup('msnfp_engagementopportunityscheduleid', { id: '{111-111-111}', name: 'msnfp_engagementopportunityschedule', entityType: 'msnfp_engagementopportunityschedule' });
		XrmMockGenerator.Attribute.createLookup('msnfp_participationid', { id: '{888-888-888}', name: 'msnfp_participation', entityType: 'msnfp_participation' });

		retrieveRecordMock = jest.fn().mockResolvedValue({ _msnfp_engagementopportunityid_value: '999-999-999' });
		Xrm.WebApi.retrieveRecord = retrieveRecordMock;
		xhrOpenSpy = jest.spyOn(XMLHttpRequest.prototype, 'open');
	});

	afterEach(() => {
		xhrOpenSpy.mockRestore();
	});

	const getScheduleControl = () => XrmMockGenerator.formContext.getControl<Xrm.Controls.LookupControl>('msnfp_engagementopportunityscheduleid') as any;

	describe('OnLoad', () => {
		test('Reads the engagement opportunity asynchronously via Xrm.WebApi', async () => {
			const form = new ParticipationScheduleForm();

			form.OnLoad(XrmMockGenerator.eventContext);
			await flushPromises();

			expect(retrieveRecordMock).toHaveBeenCalledTimes(1);
			expect(retrieveRecordMock).toHaveBeenCalledWith('msnfp_participation', '888-888-888', '?$select=_msnfp_engagementopportunityid_value');
			expect(xhrOpenSpy).not.toHaveBeenCalled();
		});

		test('Registers the pre-search handler only once', () => {
			const form = new ParticipationScheduleForm();

			form.OnLoad(XrmMockGenerator.eventContext);
			form.OnLoad(XrmMockGenerator.eventContext);

			const handlers = getScheduleControl().preSearchHandlers.filter((h: unknown) => h === form.OnPreSearchAddFilterSync);
			expect(handlers).toHaveLength(1);
		});

		test('Refreshes the cached opportunity when the participation changes', async () => {
			const form = new ParticipationScheduleForm();
			form.OnLoad(XrmMockGenerator.eventContext);
			await flushPromises();

			retrieveRecordMock.mockResolvedValue({ _msnfp_engagementopportunityid_value: '777-777-777' });
			const participation = XrmMockGenerator.formContext.getAttribute('msnfp_participationid');
			participation.setValue([{ id: '{555-555-555}', name: 'other', entityType: 'msnfp_participation' }]);
			participation.fireOnChange();
			await flushPromises();

			expect(retrieveRecordMock).toHaveBeenLastCalledWith('msnfp_participation', '555-555-555', '?$select=_msnfp_engagementopportunityid_value');

			form.OnPreSearchAddFilterSync(XrmMockGenerator.eventContext);
			expect(getScheduleControl().filters.pop().filter).toContain('value=\'{777-777-777}\'');
		});
	});

	describe('OnPreSearchAddFilterSync', () => {
		test('Uses the cached opportunity id and makes no network call', async () => {
			const form = new ParticipationScheduleForm();
			form.OnLoad(XrmMockGenerator.eventContext);
			await flushPromises();
			retrieveRecordMock.mockClear();

			form.OnPreSearchAddFilterSync(XrmMockGenerator.eventContext);

			expect(retrieveRecordMock).not.toHaveBeenCalled();
			expect(xhrOpenSpy).not.toHaveBeenCalled();
			const filters = getScheduleControl().filters;
			expect(filters).toHaveLength(1);
			expect(filters[0].filter).toBe('<filter type=\'and\'><condition attribute=\'msnfp_engagementopportunity\' operator=\'eq\' value=\'{999-999-999}\'/></filter>');
		});

		test('Adds no filter when no participation is selected', () => {
			XrmMockGenerator.formContext.getAttribute('msnfp_participationid').setValue(null);
			const form = new ParticipationScheduleForm();

			form.OnPreSearchAddFilterSync(XrmMockGenerator.eventContext);

			expect(retrieveRecordMock).not.toHaveBeenCalled();
			expect(getScheduleControl().filters).toHaveLength(0);
		});

		test('Lists no shifts while the opportunity is still loading, without starting a second load', async () => {
			let resolveRetrieve: (value: unknown) => void;
			retrieveRecordMock.mockReturnValue(new Promise(resolve => { resolveRetrieve = resolve; }));
			const form = new ParticipationScheduleForm();
			form.OnLoad(XrmMockGenerator.eventContext);

			form.OnPreSearchAddFilterSync(XrmMockGenerator.eventContext);

			expect(getScheduleControl().filters.pop().filter).toBe(noShiftsFilter);
			expect(retrieveRecordMock).toHaveBeenCalledTimes(1);

			resolveRetrieve({ _msnfp_engagementopportunityid_value: '999-999-999' });
			await flushPromises();
			form.OnPreSearchAddFilterSync(XrmMockGenerator.eventContext);

			expect(getScheduleControl().filters.pop().filter).toContain('value=\'{999-999-999}\'');
			expect(xhrOpenSpy).not.toHaveBeenCalled();
		});

		test('Lists no shifts and retries the load when the retrieve failed', async () => {
			retrieveRecordMock.mockRejectedValueOnce(new Error('failure'));
			const form = new ParticipationScheduleForm();
			form.OnLoad(XrmMockGenerator.eventContext);
			await flushPromises();

			form.OnPreSearchAddFilterSync(XrmMockGenerator.eventContext);
			expect(getScheduleControl().filters.pop().filter).toBe(noShiftsFilter);
			expect(retrieveRecordMock).toHaveBeenCalledTimes(2);

			await flushPromises();
			form.OnPreSearchAddFilterSync(XrmMockGenerator.eventContext);
			expect(getScheduleControl().filters.pop().filter).toContain('value=\'{999-999-999}\'');
		});
	});
});
