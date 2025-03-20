import { formatDateTime, getLocalizedText } from './Common';

export class EngagementOpportunityScheduleForm {
	opportunityStartDate: Date = undefined;
	opportunityEndDate: Date = undefined;
	opportunityShiftsEnabled: boolean = undefined;

	OnLoad = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		formContext.data.entity.addOnPostSave(this.onPostSave);

		const engOppAttribute: Xrm.Attributes.LookupAttribute = formContext.getAttribute('msnfp_engagementopportunity');
		engOppAttribute?.addOnChange(this.onOpportunityChange);
		engOppAttribute?.fireOnChange();

		formContext.getAttribute('msnfp_effectivefrom')?.addOnChange(this.onScheduleDateChange);
		formContext.getAttribute('msnfp_effectiveto')?.addOnChange(this.onScheduleDateChange);

		this.setVisibilityBasedOnFormType(executionContext);
	};

	setVisibilityBasedOnFormType = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();

		const isCreateForm = (
			[XrmEnum.FormType.Create, XrmEnum.FormType.QuickCreate].includes(formContext.ui.getFormType())
		);
		const isUpdateForm = (formContext.ui.getFormType() === XrmEnum.FormType.Update);

		['msnfp_hours', 'msnfp_number'].forEach(attributeName => {
			formContext.getAttribute(attributeName)?.controls.forEach(
				(c: Xrm.Controls.StandardControl) => c.setVisible(!isCreateForm)
			);
		});

		formContext.getAttribute('msnfp_engagementopportunity')?.controls.forEach(
			(c: Xrm.Controls.StandardControl) => c.setDisabled(isUpdateForm)
		);

		const opportunityAttribute = formContext.getAttribute('msnfp_engagementopportunity');
		if (isCreateForm && opportunityAttribute && !opportunityAttribute.getValue()) {
			opportunityAttribute.controls.forEach(
				(c: Xrm.Controls.StandardControl) => c.setVisible(true)
			);
		}
	};

	onPostSave = (executionContext: Xrm.Events.EventContext) => {
		this.setVisibilityBasedOnFormType(executionContext);
	}

	onOpportunityChange = async (executionContext: Xrm.Events.EventContext): Promise<void> => {
		const formContext = executionContext.getFormContext();

		const engagementOppValue: Xrm.LookupValue[] = formContext.getAttribute('msnfp_engagementopportunity')?.getValue();
		await this.reloadOpportunityDetailsAsync(engagementOppValue);

		this.setMinMaxEnablement(executionContext);
		this.onScheduleDateChange(executionContext);
	};

	reloadOpportunityDetailsAsync = async (engagementOppValue: undefined | null | Xrm.LookupValue[]): Promise<void> => {
		try {
			if (!engagementOppValue || engagementOppValue.length === 0) {
				this.opportunityShiftsEnabled = undefined;
				this.opportunityStartDate = undefined;
				this.opportunityEndDate = undefined;
				return;
			}

			const { msnfp_shifts, msnfp_startingdate, msnfp_endingdate } = await Xrm.WebApi.retrieveRecord(
				engagementOppValue[0].entityType,
				engagementOppValue[0].id,
				'?$select=msnfp_shifts,msnfp_startingdate,msnfp_endingdate'
			);

			this.opportunityShiftsEnabled = msnfp_shifts as boolean;
			this.opportunityStartDate = msnfp_startingdate && new Date(msnfp_startingdate);
			this.opportunityEndDate = msnfp_endingdate && new Date(msnfp_endingdate);
		}
		catch (err) {
			await Xrm.Navigation.openErrorDialog({
				message: getLocalizedText('EngagementOpportunitySchedule.General.EngagementOpportunity.RelatedOpportunityLoadErrorText'),
				details: err
			});
		}
	};

	setMinMaxEnablement = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		if (this.opportunityShiftsEnabled === undefined) {
			this.opportunityShiftsEnabled = false;
			formContext.getAttribute('msnfp_minimum')?.setValue(null);
			formContext.getAttribute('msnfp_maximum')?.setValue(null);
		}

		formContext
			.getAttribute('msnfp_minimum')
			?.controls.forEach((c: Xrm.Controls.StandardControl) =>
				c.setDisabled(!this.opportunityShiftsEnabled)
			);

		formContext
			.getAttribute('msnfp_maximum')
			?.controls.forEach((c: Xrm.Controls.StandardControl) =>
				c.setDisabled(!this.opportunityShiftsEnabled)
			);
	};

	onScheduleDateChange = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		const startDateAttribute: Xrm.Attributes.DateAttribute = formContext.getAttribute('msnfp_effectivefrom');
		const endDateAttribute: Xrm.Attributes.DateAttribute = formContext.getAttribute('msnfp_effectiveto');
		if (!startDateAttribute || !endDateAttribute) return;

		this.setScheduleEndDateIfNull(startDateAttribute, endDateAttribute);
		if (!this.validateShiftIsWithInEoDateRange(startDateAttribute, endDateAttribute)) return;
		if (!this.validateScheduleEndIsNotGreaterThanStart(startDateAttribute, endDateAttribute)) return;
	};

	setScheduleEndDateIfNull = (
		startDateAttribute: null | Xrm.Attributes.DateAttribute,
		endDateAttribute: null | Xrm.Attributes.DateAttribute
	) => {
		const startDate: null | Date = startDateAttribute?.getValue() ?? null;
		const endDate: null | Date = endDateAttribute?.getValue() ?? null;

		if (startDate && !endDate) {
			endDateAttribute?.setValue(startDate);
		}
	}

	validateScheduleEndIsNotGreaterThanStart = (
		startDateAttribute: null | Xrm.Attributes.DateAttribute, endDateAttribute: null | Xrm.Attributes.DateAttribute
	): boolean => {
		const startDate: null | Date = startDateAttribute?.getValue() ?? null;
		const endDate: null | Date = endDateAttribute?.getValue() ?? null;
		if (startDate && endDate && (startDate > endDate)) {
			endDateAttribute.controls.forEach(
				(c: Xrm.Controls.StandardControl) => c.setNotification(
					getLocalizedText('EngagementOpportunitySchedule.General.EndDate.EndDateValidationText'), ''
				)
			);
			return false;
		}
		else {
			endDateAttribute?.controls.forEach((c: Xrm.Controls.StandardControl) => c.clearNotification());
			return true;
		}
	};

	validateShiftIsWithInEoDateRange = (
		startDateAttribute: null | Xrm.Attributes.DateAttribute, endDateAttribute: null | Xrm.Attributes.DateAttribute
	): boolean => {
		const startDate = startDateAttribute?.getValue();
		const endDate = endDateAttribute?.getValue();

		const formatting = Xrm.Utility.getGlobalContext().userSettings.dateFormattingInfo;

		const error = getLocalizedText(
			'EngagementOpportunitySchedule.General.EffectiveDateRangeValidationText',
			formatDateTime(this.opportunityStartDate, formatting),
			formatDateTime(this.opportunityEndDate, formatting)
		);

		const isStartDateWithinRange = this.isScheduleWithinEoDateRange(startDate);
		const startDateError = (startDate && this.opportunityStartDate && !isStartDateWithinRange) ? error : undefined;
		startDateAttribute?.controls.forEach(
			(c: Xrm.Controls.DateControl) => {
				if (startDateError) {
					c.setNotification(startDateError, '');
				}
				else {
					c.clearNotification();
				}
			}
		);

		const isEndDateWithinRange = this.isScheduleWithinEoDateRange(endDate);
		const endDateError = (endDate && this.opportunityEndDate && !isEndDateWithinRange) ? error : undefined;
		endDateAttribute?.controls.forEach(
			(c: Xrm.Controls.DateControl) => {
				if (endDateError) {
					c.setNotification(endDateError, '');
				}
				else {
					c.clearNotification();
				}
			}
		);

		return (!startDateError && !endDateError);
	};

	isScheduleWithinEoDateRange = (scheduleDate: Date): boolean => {
		return (scheduleDate >= this.opportunityStartDate && scheduleDate <= this.opportunityEndDate);
	};
}

window.EngagementOpportunityScheduleForm = new EngagementOpportunityScheduleForm();
