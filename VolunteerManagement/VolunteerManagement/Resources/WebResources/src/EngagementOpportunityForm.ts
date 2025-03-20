import { getLocalizedText } from './Common';
import { VolunteerManagementResxKeys } from './types/Localization';

export class EngagmentOpportunityForm {
	static readonly NOTIFICATION_ID_SHIFTS_CHANGED = 'msnfp_shifts_changed';
	static readonly NOTIFICATION_ID_PUBLISH_STATUS = 'StatusUpdateConfirmationMessage';
	static readonly DEFAULT_MULTIPLE_DAYS = false;
	static readonly ONE_DAY_MS = 86400000;
	static readonly ONE_MINUTE_MS = 60000;
	static readonly ONE_MILLISECOND = 1;

	OnLoad = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		formContext.data.entity?.addOnPostSave(this.onPostSave);
		formContext.ui.clearFormNotification(EngagmentOpportunityForm.NOTIFICATION_ID_PUBLISH_STATUS);

		const locationTypeAttribute = formContext.getAttribute('msnfp_locationtype');
		locationTypeAttribute?.addOnChange(this.setVisibilityLocationType);
		locationTypeAttribute.fireOnChange();

		formContext.getAttribute('msnfp_startingdate')?.addOnChange(this.onScheduleDateChanges);
		formContext.getAttribute('msnfp_endingdate')?.addOnChange(this.onScheduleDateChanges);
		const multipleDaysAttribute = formContext.getAttribute('msnfp_multipledays');
		multipleDaysAttribute?.addOnChange(this.onScheduleDateChanges);
		multipleDaysAttribute.fireOnChange();

		const shiftsAttribute = formContext.getAttribute('msnfp_shifts');
		shiftsAttribute?.addOnChange(this.onChangeShifts);
		shiftsAttribute.fireOnChange();

		formContext.getAttribute('msnfp_minimum')?.addOnChange(this.ValidateMinAndMaxParticipants);
		formContext.getAttribute('msnfp_maximum')?.addOnChange(this.ValidateMinAndMaxParticipants);

		formContext.getAttribute('msnfp_automaticallyapproveallapplicants')?.addOnChange(this.onChangeAutoApproveAsync);

		const isCreateForm = (formContext.ui.getFormType() === XrmEnum.FormType.Create);
		formContext.ui.tabs.forEach((tab: Xrm.Controls.Tab) => {
			if (tab.getName() === 'tab_createdraft') {
				tab.setVisible(isCreateForm);
			}
			else {
				tab.setVisible(!isCreateForm);
			}
		});

		if (isCreateForm && !multipleDaysAttribute?.getValue()) {
			multipleDaysAttribute?.setValue(EngagmentOpportunityForm.DEFAULT_MULTIPLE_DAYS);
		}
	};

	OnSaveAsync = async (executionContext: Xrm.Events.SaveEventContext): Promise<void> => {
		const formContext = executionContext.getFormContext();
		(executionContext.getEventArgs() as any)?.disableAsyncTimeout();

		const associatedShiftsCount = (formContext.getControl('Schedules') as Xrm.Controls.GridControl)
			?.getGrid()
			?.getTotalRecordCount();
		if (associatedShiftsCount === 0) return;

		const isAutoSave = (executionContext.getEventArgs().getSaveMode() === XrmEnum.SaveMode.AutoSave);
		const shiftsAttr = formContext.getAttribute('msnfp_shifts');
		const hasShifts = shiftsAttr?.getValue();
		const shiftsChanged = (shiftsAttr?.getIsDirty() === true);
		const isUpdateForm = (formContext.ui.getFormType() === XrmEnum.FormType.Update);
		if (shiftsChanged && !hasShifts && isUpdateForm) {
			const titleSuffix = (isAutoSave) ? ` (${getLocalizedText('EngagementOpportunity.Schedule.Shifts.ShiftDeactivationDialog.TitleSuffix')})` : '';
			const confirmStrings: Xrm.Navigation.ConfirmStrings = {
				title: `${getLocalizedText('EngagementOpportunity.Schedule.Shifts.ShiftDeactivationDialog.Title')}${titleSuffix}`,
				text: getLocalizedText('EngagementOpportunity.Schedule.Shifts.ShiftDeactivationDialog.Text')
			};
			const confirmOptions: Xrm.Navigation.DialogSizeOptions = {
				height: 200,
				width: 450
			};
			const dialogResult = await Xrm.Navigation.openConfirmDialog(confirmStrings, confirmOptions);
			if (dialogResult.confirmed !== true) {
				executionContext.getEventArgs().preventDefault();
				return;
			}
		}
	};

	onPostSave = (executionContext: Xrm.Events.EventContext): void => {
		this.setShiftsVisibility(executionContext);
	};

	setVisibilityLocationType = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		const locationType = formContext.getAttribute('msnfp_locationtype')?.getValue();

		let showLocationFields = true;
		let showUrl = true;

		switch (locationType) {
			case Msnfp_engagementopportunityEnum.msnfp_locationtype.OnLocation:
				showLocationFields = true;
				showUrl = false;
				break;

			case Msnfp_engagementopportunityEnum.msnfp_locationtype.Virtual:
				showLocationFields = false;
				showUrl = true;
				break;

			case Msnfp_engagementopportunityEnum.msnfp_locationtype.Both:
				showLocationFields = true;
				showUrl = true;
				break;

			case Msnfp_engagementopportunityEnum.msnfp_locationtype.None:
				showLocationFields = false;
				showUrl = false;
				break;
		}

		this.setVisibleOnLocationFields(formContext, showLocationFields);
		formContext
			.getAttribute('msnfp_url')
			?.controls.forEach((c: Xrm.Controls.StandardControl) => c.setVisible(showUrl));
	};

	validateScheduleEndIsNotGreaterThanStart = (
		startDateAttribute: null | Xrm.Attributes.DateAttribute, endDateAttribute: null | Xrm.Attributes.DateAttribute
	): void => {
		const startDate: null | Date = startDateAttribute?.getValue() ?? null;
		const endDate: null | Date = endDateAttribute?.getValue() ?? null;
		if (startDate && endDate && (startDate > endDate)) {
			endDateAttribute.controls.forEach(
				(c: Xrm.Controls.StandardControl) => c.setNotification(
					getLocalizedText('EngagementOpportunity.Schedule.EndDate.EndDateValidationText'), ''
				)
			);
		}
		else {
			endDateAttribute?.controls.forEach((c: Xrm.Controls.StandardControl) => c.clearNotification());
		}
	};

	setScheduleEndDateIfNull = (
		isMultipleDays: boolean,
		startDateAttribute: null | Xrm.Attributes.DateAttribute,
		endDateAttribute: null | Xrm.Attributes.DateAttribute,
		userOffSetMs: number
	): void => {
		const startDate: null | Date = startDateAttribute?.getValue() ?? null;
		const endDate: null | Date = endDateAttribute?.getValue() ?? null;

		if (!isMultipleDays && startDate && !endDate) {
			endDateAttribute?.setValue(this.getEndOfDayForDate(startDate, userOffSetMs));
		}
	};

	setEndOfDayForSingleDaySchedule = (
		isMultipleDays: boolean,
		startDateAttribute: null | Xrm.Attributes.DateAttribute,
		endDateAttribute: null | Xrm.Attributes.DateAttribute,
		userOffSetMs: number
	): void => {
		const startDate: null | Date = startDateAttribute?.getValue() ?? null;
		const endDate: null | Date = endDateAttribute?.getValue() ?? null;
		if (isMultipleDays || !startDate) { return; }

		const endOfStartDate = this.getEndOfDayForDate(startDate, userOffSetMs);
		const datesAreInSameDay = this.areDatesAtSameDay(startDate, endDate);
		const isEndDateInRange: boolean = (startDate <= endDate && endDate <= endOfStartDate);
		if (!isEndDateInRange && !datesAreInSameDay) {
			endDateAttribute.setValue(endOfStartDate);
		}
	};

	onScheduleDateChanges = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		const eventSource = executionContext.getEventSource() as Xrm.Attributes.Attribute;
		const multipleDays = formContext.getAttribute('msnfp_multipledays');
		const multipleDaysChanged = (eventSource && eventSource.getName() === 'msnfp_multipledays');
		const endDateChanged = (eventSource && eventSource.getName() === 'msnfp_endingdate');

		const startDateAttribute: null | Xrm.Attributes.DateAttribute = formContext.getAttribute('msnfp_startingdate');
		const endDateAttribute: null | Xrm.Attributes.DateAttribute = formContext.getAttribute('msnfp_endingdate');
		const userOffSetMs = Xrm.Utility.getGlobalContext().userSettings.getTimeZoneOffsetMinutes() * EngagmentOpportunityForm.ONE_MINUTE_MS;

		this.setScheduleEndDateIfNull((multipleDays?.getValue() === true), startDateAttribute, endDateAttribute, userOffSetMs);
		if (!endDateChanged && multipleDaysChanged) {
			this.setEndOfDayForSingleDaySchedule((multipleDays?.getValue() === true), startDateAttribute, endDateAttribute, userOffSetMs);
		}

		const isMultipleDays = (multipleDays?.getValue() === true);
		const startDate = startDateAttribute?.getValue();
		const endDate = endDateAttribute?.getValue();
		if (startDate && endDate && !multipleDaysChanged) {
			const datesAreInSameDay = this.areDatesAtSameDay(startDate, endDate);
			if (isMultipleDays && datesAreInSameDay) {
				multipleDays?.setValue(false);
			}
			else if (!isMultipleDays && !datesAreInSameDay) {
				multipleDays?.setValue(true);
			}
		}

		this.validateScheduleEndIsNotGreaterThanStart(startDateAttribute, endDateAttribute);
	};

	onChangeShifts = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		const shiftsAttribute = formContext.getAttribute('msnfp_shifts');
		const hasShifts = (shiftsAttribute?.getValue() === true);
		const shiftsChanged = (shiftsAttribute?.getIsDirty() === true);
		formContext
			.getAttribute('msnfp_minimum')
			?.controls.forEach((c: Xrm.Controls.StandardControl) => c.setDisabled(hasShifts));
		formContext
			.getAttribute('msnfp_maximum')
			?.controls.forEach((c: Xrm.Controls.StandardControl) => c.setDisabled(hasShifts));

		this.setShiftsVisibility(executionContext);
		if (hasShifts && shiftsChanged) {
			formContext.ui.setFormNotification(
				getLocalizedText('EngagementOpportunity.Schedule.Shifts.EnablementNotificationText'),
				'INFO',
				EngagmentOpportunityForm.NOTIFICATION_ID_SHIFTS_CHANGED
			);
		}
	};

	setShiftsVisibility = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		const shiftsAttribute = formContext.getAttribute('msnfp_shifts');
		const hasShifts = (shiftsAttribute?.getValue() === true);
		const shiftsChanged = (shiftsAttribute?.getIsDirty() === true);

		let showShifts = hasShifts;
		if (hasShifts === true && shiftsChanged === true) {
			showShifts = false;
		}

		formContext.ui.tabs.get('tab_schedules')?.sections.get('Schedules_Schedules')?.setVisible(showShifts);
		formContext.ui.clearFormNotification(EngagmentOpportunityForm.NOTIFICATION_ID_SHIFTS_CHANGED);
	};

	setVisibleOnLocationFields = (formContext: Xrm.FormContext, show: boolean): void => {
		[
			'msnfp_location',
			'msnfp_street1',
			'msnfp_street2',
			'msnfp_street3',
			'msnfp_city',
			'msnfp_stateprovince',
			'msnfp_zippostalcode',
			'msnfp_country',
			'msnfp_county'
		].forEach(attributeName => {
			formContext
				.getAttribute(attributeName)
				?.controls.forEach((c: Xrm.Controls.StandardControl) => c.setVisible(show));
		});
	};

	onChangeAutoApproveAsync = async (executionContext: Xrm.Events.EventContext): Promise<void> => {
		const formContext = executionContext.getFormContext();
		const confirmStrings = {
			title: getLocalizedText('EngagementOpportunity.PostSettings.AutomaticallyApproveAllApplicants.AutomaticAproveDialog.Title'),
			text: getLocalizedText('EngagementOpportunity.PostSettings.AutomaticallyApproveAllApplicants.AutomaticAproveDialog.Text'),
		};

		try {
			const dialogResult = await Xrm.Navigation.openConfirmDialog(confirmStrings, null);
			if (dialogResult.confirmed) {
				await formContext.data.save();
			}
			else {
				const approve = formContext.getAttribute('msnfp_automaticallyapproveallapplicants');
				approve.setValue(!approve.getValue());
			}
		}
		catch (err) {
			Xrm.Navigation.openErrorDialog({
				message: err
			});
		}
	};

	PublishFromRibbon = (
		formContext: Xrm.FormContext,
		value: number,
		confirmTextKey: string,
		confirmTitleKey: string,
		confirmButtonText = getLocalizedText('EngagementOpportunity.PublishEngagementOpportunity.ConfirmButtonText')
	): void => {
		Xrm.Navigation.openConfirmDialog(
			{
				text: getLocalizedText(confirmTextKey as VolunteerManagementResxKeys),
				title: getLocalizedText(confirmTitleKey as VolunteerManagementResxKeys),
				confirmButtonLabel: confirmButtonText,
			},
			null
		).then(function (success) {
			if (success.confirmed) {
				formContext
					.getAttribute('msnfp_engagementopportunitystatus')
					.setValue(value);
				formContext.data.save();
				formContext.ui.setFormNotification(
					getLocalizedText('EngagementOpportunity.PublishEngagementOpportunity.FormNotificationText'),
					'INFO',
					EngagmentOpportunityForm.NOTIFICATION_ID_PUBLISH_STATUS
				);
			}
		});
	};

	OpenQuickCreateFromSubgridRibbon = (
		formContext: Xrm.FormContext,
		selectedItems: any
	): void => {
		const selectedItem = selectedItems[0];
		Xrm.Navigation.openForm({
			entityName: 'msnfp_participationschedule',
			createFromEntity: {
				entityType: 'msnfp_participation',
				id: selectedItem.Id,
			},
			useQuickCreateForm: true,
		});
	};

	getEndOfDayForDate = (date: undefined | null | Date, userOffsetMs = 0): null | Date => {
		if (!date) { return null; }

		const startDateUserLocal = (date.getTime() + userOffsetMs);
		const timeToNextMidnightMs = EngagmentOpportunityForm.ONE_DAY_MS - (startDateUserLocal % EngagmentOpportunityForm.ONE_DAY_MS);
		return new Date(date.getTime() + timeToNextMidnightMs - EngagmentOpportunityForm.ONE_MILLISECOND);
	};

	areDatesAtSameDay = (date1: null | Date, date2: null | Date): boolean => {
		if (!date1 || !date2) { return false; }
		return (
			date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate()
		);
	};

	/**
	* Validates the Min and Max fields on a form and requires both fields be present.
	*/
	ValidateMinAndMaxParticipants = (executionContext: any): void => {
		const formContext = executionContext.getFormContext();
		formContext.getControl('msnfp_minimum').clearNotification();
		formContext.getControl('msnfp_maximum').clearNotification();
		const minimum = formContext
			.getAttribute('msnfp_minimum')
			.getValue();
		let maximum = formContext.getAttribute('msnfp_maximum').getValue();
		if (minimum === null && maximum === null) {
			return;
		}

		if (minimum !== null && maximum === null) {
			formContext.getAttribute('msnfp_maximum').setValue(minimum);
			maximum = minimum;
		}

		if (minimum === null && maximum !== null) {
			formContext
				.getControl('msnfp_minimum')
				.setNotification(getLocalizedText('EngagementOpportunity.Schedule.Minimum.MinimumValueValidationText'));
			return;
		}

		if (minimum > maximum) {
			formContext
				.getControl('msnfp_maximum')
				.setNotification(getLocalizedText('EngagementOpportunity.Schedule.Maximum.MaximumValueValidationText'));
		}
	};
}

window.EngagmentOpportunityForm = new EngagmentOpportunityForm();
