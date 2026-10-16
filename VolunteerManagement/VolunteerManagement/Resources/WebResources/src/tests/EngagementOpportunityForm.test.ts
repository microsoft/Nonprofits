import { AttributeMock, EventContextMock, ItemCollectionMock, SaveEventContextMock, XrmMockGenerator } from 'xrm-mock';
import { EngagmentOpportunityForm } from '../EngagementOpportunityForm';

let scheduleForm: EngagmentOpportunityForm;

describe('EngagementOpportunityForm', () => {
	beforeEach(() => {
		XrmMockGenerator.formContext.ui.getFormType = () => XrmEnum.FormType.Create;

		XrmMockGenerator.Tab.createTab('tab_createdraft');
		XrmMockGenerator.Tab.createTab('other_tab');
		XrmMockGenerator.Attribute.createString('msnfp_location');
		XrmMockGenerator.Attribute.createOptionSet('msnfp_locationtype');
		XrmMockGenerator.Attribute.createBoolean('msnfp_multipledays');
		XrmMockGenerator.Attribute.createBoolean('msnfp_shifts');
		XrmMockGenerator.Attribute.createNumber('msnfp_minimum');
		XrmMockGenerator.Attribute.createNumber('msnfp_maximum');
		XrmMockGenerator.Attribute.createDate('msnfp_startingdate');
		XrmMockGenerator.Attribute.createDate('msnfp_endingdate');
		XrmMockGenerator.Attribute.createOptionSet('msnfp_engagementopportunitystatus');

		const globalContext = Xrm.Utility.getGlobalContext();
		Xrm.Utility.getGlobalContext = () => ({
			...globalContext,
			userSettings: {
				...globalContext.userSettings,
				getTimeZoneOffsetMinutes: () => 100
			}
		});

		Xrm.Utility.getResourceString = (webResourceName: string, key: string): string => {
			switch (key) {
				case 'MSNFP_minValueConditionallyMandatory':
					return 'MSNFP_minValueConditionallyMandatory';
				case 'MSNFP_minValueValidation':
					return 'MSNFP_minValueValidation';
				default:
					return '';
			}
		};

		Xrm.Navigation.openConfirmDialog = (confirmStrings: Xrm.Navigation.ConfirmStrings, confirmOptions?: Xrm.Navigation.DialogSizeOptions) => Promise.resolve({ confirmed: false }) as any;
		Xrm.Navigation.openErrorDialog = (errorOptions: Xrm.Navigation.ErrorDialogOptions) => Promise.resolve() as any;
		Xrm.Navigation.openForm = (entityFormOptions: Xrm.Navigation.EntityFormOptions, formParameters?: Xrm.Utility.OpenParameters) => Promise.resolve() as any;
		XrmMockGenerator.eventContext.formContext.data.save = () => ({}) as any;

		XrmMockGenerator.eventContext.formContext.data.entity.addOnPostSave = () => {};

		scheduleForm = new EngagmentOpportunityForm();

		scheduleForm.OnLoad(XrmMockGenerator.eventContext);
	});

	describe('OnLoad', () => {
		test('Show tab when form type === Create', () => {
			expect(Xrm.Page.ui.tabs.get('tab_createdraft').getVisible()).toBe(true);
		});

		test('Hide tab when form type is !== Create', () => {
			XrmMockGenerator.eventContext.formContext.ui.getFormType = () => XrmEnum.FormType.Update;

			scheduleForm.OnLoad(XrmMockGenerator.eventContext);
			expect(Xrm.Page.ui.tabs.get('tab_createdraft').getVisible()).toBe(false);
		});

		test('set msnfp_multipledays to true if it doesnt contain value', () => {
			expect(XrmMockGenerator.formContext.getAttribute('msnfp_multipledays').getValue()).toBe(false);
		});

		test('Does not throw when optional attributes are removed from the form', () => {
			const formContext = XrmMockGenerator.eventContext.formContext;
			const originalGetAttribute = formContext.getAttribute;
			const removed = ['msnfp_locationtype', 'msnfp_multipledays', 'msnfp_shifts'];
			formContext.getAttribute = ((name: string) => removed.includes(name) ? null : (originalGetAttribute as any).call(formContext, name)) as any;

			try {
				expect(() => scheduleForm.OnLoad(XrmMockGenerator.eventContext)).not.toThrow();
			}
			finally {
				formContext.getAttribute = originalGetAttribute;
			}
		});

		test('not set msnfp_multipledays to true if it already contains value', () => {
			XrmMockGenerator.formContext.getAttribute('msnfp_multipledays').setValue(true);

			expect(XrmMockGenerator.formContext.getAttribute('msnfp_multipledays').getValue()).toBe(true);
		});
	});

	describe('OnSaveAsync', () => {
		test('Save runs without errors', () => {
			const saveEventContext = new SaveEventContextMock(XrmMockGenerator.eventContext);
			saveEventContext.getEventArgs = () => ({
				getSaveMode: () => XrmEnum.SaveMode.Save,
				disableAsyncTimeout: () => {},
				preventDefault: () => {}
			} as unknown as Xrm.Events.SaveEventArguments);

			XrmMockGenerator.eventContext.formContext.ui.getFormType = () => XrmEnum.FormType.Update;
			XrmMockGenerator.formContext.getAttribute('msnfp_shifts').setValue(null);
			scheduleForm.OnSaveAsync(saveEventContext);
		});
	});

	describe('onPostSave', () => {
		test('Runs without errors', () => {
			scheduleForm.onPostSave(XrmMockGenerator.eventContext);
		});
	});

	describe('OpenQuickCreateFromSubgridRibbon', () => {
		test('Runs without errors', () => {
			scheduleForm.OpenQuickCreateFromSubgridRibbon(XrmMockGenerator.eventContext.formContext, [{Id: '888-888-888'}]);
		});
	});

	describe('setVisibilityLocationType', () => {
		test('Runs without errors', () => {
			scheduleForm.setVisibilityLocationType(XrmMockGenerator.eventContext);
		});

		test('Set visibility of location fields when msnfp_locationtype === OnLocation', () => {
			XrmMockGenerator.eventContext.formContext.getAttribute('msnfp_locationtype').setValue(Msnfp_engagementopportunityEnum.msnfp_locationtype.OnLocation);
			scheduleForm.setVisibilityLocationType(XrmMockGenerator.eventContext);

			expect(XrmMockGenerator.eventContext.formContext.getControl('msnfp_location').getVisible()).toEqual(true);
		});

		test('Set visibility of location fields when msnfp_locationtype === OnLocation', () => {
			XrmMockGenerator.eventContext.formContext.getAttribute('msnfp_locationtype').setValue(Msnfp_engagementopportunityEnum.msnfp_locationtype.Virtual);
			scheduleForm.setVisibilityLocationType(XrmMockGenerator.eventContext);

			expect(XrmMockGenerator.eventContext.formContext.getControl('msnfp_location').getVisible()).toEqual(false);
		});

		test('Set visibility of location fields when msnfp_locationtype === OnLocation', () => {
			XrmMockGenerator.eventContext.formContext.getAttribute('msnfp_locationtype').setValue(Msnfp_engagementopportunityEnum.msnfp_locationtype.Both);
			scheduleForm.setVisibilityLocationType(XrmMockGenerator.eventContext);

			expect(XrmMockGenerator.eventContext.formContext.getControl('msnfp_location').getVisible()).toEqual(true);
		});

		test('Set visibility of location fields when msnfp_locationtype === OnLocation', () => {
			XrmMockGenerator.eventContext.formContext.getAttribute('msnfp_locationtype').setValue(Msnfp_engagementopportunityEnum.msnfp_locationtype.None);
			scheduleForm.setVisibilityLocationType(XrmMockGenerator.eventContext);

			expect(XrmMockGenerator.eventContext.formContext.getControl('msnfp_location').getVisible()).toEqual(false);
		});
	});

	describe('validateScheduleEndIsNotGreaterThanStart', () => {
		test('Runs without errors', () => {
			scheduleForm.validateScheduleEndIsNotGreaterThanStart(null, null);
		});
	});

	describe('onScheduleDateChanges', () => {
		test('Runs without errors', () => {
			const eventContext = new EventContextMock({
				context: XrmMockGenerator.context as unknown as Xrm.GlobalContext,
				formContext: XrmMockGenerator.eventContext.formContext,
				eventSource: new AttributeMock({ name: 'msnfp_multipledays', attributeType: XrmEnum.AttributeType.Boolean, controls: new ItemCollectionMock([]) })
			});

			scheduleForm.onScheduleDateChanges(eventContext);
		});
	});

	describe('onChangeShifts', () => {
		test('Runs without errors', () => {
			scheduleForm.onChangeShifts(XrmMockGenerator.eventContext);
		});
	});

	describe('areDatesAtSameDay', () => {
		test('Return true when dates are the same day', () => {
			expect(scheduleForm.areDatesAtSameDay(new Date(), new Date())).toBe(true);
		});

		test('Return false when dates are NOT the same day', () => {
			expect(scheduleForm.areDatesAtSameDay(new Date(), new Date('2023-12-13'))).toBe(false);
		});

		test('Return false when dates are NOT provided', () => {
			expect(scheduleForm.areDatesAtSameDay(null, null)).toBe(false);
		});

		test('Uses the user time-zone offset to determine the day', () => {
			const twoHoursMs = 2 * 60 * EngagmentOpportunityForm.ONE_MINUTE_MS;
			// 22:30 UTC and 23:30 UTC are 00:30 and 01:30 the next day for a UTC+2 user.
			const date1 = new Date('2024-03-10T22:30:00Z');
			const date2 = new Date('2024-03-10T23:30:00Z');
			// 21:30 UTC is still 23:30 on the previous day for a UTC+2 user.
			const date3 = new Date('2024-03-10T21:30:00Z');

			expect(scheduleForm.areDatesAtSameDay(date1, date2, twoHoursMs)).toBe(true);
			expect(scheduleForm.areDatesAtSameDay(date3, date1, twoHoursMs)).toBe(false);
			expect(scheduleForm.areDatesAtSameDay(date3, date1, 0)).toBe(true);
			expect(scheduleForm.areDatesAtSameDay(date1, new Date('2024-03-11T00:30:00Z'), -twoHoursMs)).toBe(true);
		});

		test('Is consistent with getEndOfDayForDate for the same offset', () => {
			const offsetMs = -300 * EngagmentOpportunityForm.ONE_MINUTE_MS;
			const start = new Date('2024-03-10T23:00:00Z');
			const endOfDay = scheduleForm.getEndOfDayForDate(start, offsetMs);

			expect(scheduleForm.areDatesAtSameDay(start, endOfDay, offsetMs)).toBe(true);
			expect(scheduleForm.areDatesAtSameDay(start, new Date(endOfDay.getTime() + 1), offsetMs)).toBe(false);
		});
	});

	describe('getEndOfDayForDate', () => {
		test('Runs without errors', () => {
			scheduleForm.getEndOfDayForDate(new Date());
		});
	});

	describe('onChangeAutoApproveAsync', () => {
		test('Runs without errors', () => {
			scheduleForm.onChangeAutoApproveAsync(XrmMockGenerator.eventContext);
		});

		test('Passes a string message to the error dialog', async () => {
			Xrm.Navigation.openConfirmDialog = () => Promise.resolve({ confirmed: true }) as any;
			XrmMockGenerator.eventContext.formContext.data.save = () => Promise.reject(new Error('Auto approve failed')) as any;
			const errorDialogMock = jest.fn(() => Promise.resolve());
			Xrm.Navigation.openErrorDialog = errorDialogMock as any;

			await scheduleForm.onChangeAutoApproveAsync(XrmMockGenerator.eventContext);

			expect(errorDialogMock).toHaveBeenCalledWith({ message: 'Auto approve failed' });
		});
	});

	describe('PublishFromRibbon', () => {
		const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

		beforeEach(() => {
			Xrm.Navigation.openConfirmDialog = (confirmStrings: Xrm.Navigation.ConfirmStrings, confirmOptions?: Xrm.Navigation.DialogSizeOptions) => Promise.resolve({ confirmed: true }) as any;
			XrmMockGenerator.formContext.getAttribute('msnfp_engagementopportunitystatus').setValue(1);
		});

		test('Shows success notification only after save resolves', async () => {
			let resolveSave: () => void;
			const formContext = XrmMockGenerator.eventContext.formContext;
			formContext.data.save = jest.fn(() => new Promise<void>(resolve => { resolveSave = resolve; })) as any;
			const notificationSpy = jest.spyOn(formContext.ui, 'setFormNotification');

			const publishPromise = scheduleForm.PublishFromRibbon(formContext, 2, '', '');
			await flushPromises();

			expect(formContext.data.save).toHaveBeenCalledTimes(1);
			expect(formContext.getAttribute('msnfp_engagementopportunitystatus').getValue()).toBe(2);
			expect(notificationSpy).not.toHaveBeenCalled();

			resolveSave();
			await publishPromise;

			expect(notificationSpy).toHaveBeenCalledWith(expect.anything(), 'INFO', EngagmentOpportunityForm.NOTIFICATION_ID_PUBLISH_STATUS);
			expect(formContext.getAttribute('msnfp_engagementopportunitystatus').getValue()).toBe(2);
			notificationSpy.mockRestore();
		});

		test('Restores previous status and shows error when save fails', async () => {
			const formContext = XrmMockGenerator.eventContext.formContext;
			formContext.data.save = jest.fn(() => Promise.reject(new Error('Save failed'))) as any;
			const notificationSpy = jest.spyOn(formContext.ui, 'setFormNotification');
			const errorDialogMock = jest.fn(() => Promise.resolve());
			Xrm.Navigation.openErrorDialog = errorDialogMock as any;

			await scheduleForm.PublishFromRibbon(formContext, 2, '', '');

			expect(formContext.getAttribute('msnfp_engagementopportunitystatus').getValue()).toBe(1);
			expect(errorDialogMock).toHaveBeenCalledWith({ message: 'Save failed' });
			expect(notificationSpy).not.toHaveBeenCalled();
			notificationSpy.mockRestore();
		});

		test('Does nothing when not confirmed', async () => {
			Xrm.Navigation.openConfirmDialog = () => Promise.resolve({ confirmed: false }) as any;
			const formContext = XrmMockGenerator.eventContext.formContext;
			formContext.data.save = jest.fn(() => Promise.resolve()) as any;

			await scheduleForm.PublishFromRibbon(formContext, 2, '', '');

			expect(formContext.data.save).not.toHaveBeenCalled();
			expect(formContext.getAttribute('msnfp_engagementopportunitystatus').getValue()).toBe(1);
		});
	});

	describe('Minimum and Maximum participation test', () => {
		test('Min and Max not specified', () => {
			const scheduleForm = new EngagmentOpportunityForm();
			const formContext = XrmMockGenerator.eventContext.getFormContext();
			formContext.getAttribute('msnfp_minimum').setValue(null);
			formContext.getAttribute('msnfp_maximum').setValue(null);
			scheduleForm.ValidateMinAndMaxParticipants(XrmMockGenerator.eventContext);
			expect(formContext.getAttribute('msnfp_minimum').getValue()).toBe(null);
			expect(formContext.getAttribute('msnfp_maximum').getValue()).toBe(null);
		});

		test('Min specified Max not specified', () => {
			const scheduleForm = new EngagmentOpportunityForm();
			XrmMockGenerator.formContext.getAttribute('msnfp_minimum').setValue(2);
			XrmMockGenerator.formContext.getAttribute('msnfp_maximum').setValue(null);
			scheduleForm.ValidateMinAndMaxParticipants(XrmMockGenerator.eventContext);
			expect(XrmMockGenerator.formContext.getAttribute('msnfp_minimum').getValue()).toBe(2);
			expect(XrmMockGenerator.formContext.getAttribute('msnfp_maximum').getValue()).toBe(2);
		});

		test('Min not specified Max specified', () => {
			const scheduleForm = new EngagmentOpportunityForm();
			const formContext = XrmMockGenerator.eventContext.getFormContext();
			formContext.getAttribute('msnfp_minimum').setValue(null);
			formContext.getAttribute('msnfp_maximum').setValue(2);
			scheduleForm.ValidateMinAndMaxParticipants(XrmMockGenerator.eventContext);
		});

		test('Min not specified Max specified', () => {
			const scheduleForm = new EngagmentOpportunityForm();
			const formContext = XrmMockGenerator.eventContext.getFormContext();
			formContext.getAttribute('msnfp_minimum').setValue(4);
			formContext.getAttribute('msnfp_maximum').setValue(4);
			scheduleForm.ValidateMinAndMaxParticipants(XrmMockGenerator.eventContext);
		});

		test('Error messages are cleared', () => {
			const scheduleForm = new EngagmentOpportunityForm();
			const formContext = XrmMockGenerator.eventContext.getFormContext();
			formContext.getAttribute('msnfp_minimum').setValue(4);
			formContext.getAttribute('msnfp_maximum').setValue(2);
			scheduleForm.ValidateMinAndMaxParticipants(XrmMockGenerator.eventContext);
			formContext.getAttribute('msnfp_maximum').setValue(4);
			scheduleForm.ValidateMinAndMaxParticipants(XrmMockGenerator.eventContext);
		});
	});
});
