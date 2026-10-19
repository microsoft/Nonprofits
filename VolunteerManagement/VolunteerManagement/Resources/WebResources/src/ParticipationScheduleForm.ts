const NO_SHIFTS_FILTER = '<filter type=\'and\'><condition attribute=\'msnfp_engagementopportunityscheduleid\' operator=\'null\'/></filter>';

const normalizeId = (id: string): string => id.replace(/[{}]/g, '').toLowerCase();

export class ParticipationScheduleForm {
	private engagementOpportunityId: string | null = null;
	private loadedParticipationId: string | null = null;
	private isLoading = false;
	private engagementOpportunityRequestId = 0;
	private registeredScheduleControl: Xrm.Controls.LookupControl | null = null;
	private registeredParticipationAttribute: Xrm.Attributes.LookupAttribute | null = null;

	OnLoad = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();

		const scheduleControl = formContext.getControl<Xrm.Controls.LookupControl>('msnfp_engagementopportunityscheduleid');
		if (scheduleControl && scheduleControl !== this.registeredScheduleControl) {
			scheduleControl.addPreSearch(this.OnPreSearchAddFilterSync);
			this.registeredScheduleControl = scheduleControl;
		}

		const participationAttribute = formContext.getAttribute<Xrm.Attributes.LookupAttribute>('msnfp_participationid');
		if (participationAttribute && participationAttribute !== this.registeredParticipationAttribute) {
			participationAttribute.addOnChange(this.OnParticipationChange);
			this.registeredParticipationAttribute = participationAttribute;
		}

		this.loadEngagementOpportunityIdAsync(formContext);
	};

	OnParticipationChange = (executionContext: Xrm.Events.EventContext): void => {
		this.loadEngagementOpportunityIdAsync(executionContext.getFormContext());
	};

	getParticipationId = (formContext: Xrm.FormContext): string | null => {
		const participation = formContext.getAttribute<Xrm.Attributes.LookupAttribute>('msnfp_participationid')?.getValue();
		return (participation && participation.length > 0) ? normalizeId(participation[0].id) : null;
	};

	loadEngagementOpportunityIdAsync = async (formContext: Xrm.FormContext): Promise<void> => {
		const requestId = ++this.engagementOpportunityRequestId;
		this.engagementOpportunityId = null;
		this.loadedParticipationId = null;

		const participationId = this.getParticipationId(formContext);
		if (!participationId) {
			this.isLoading = false;
			return;
		}

		this.isLoading = true;
		try {
			const record = await Xrm.WebApi.retrieveRecord(
				'msnfp_participation',
				participationId,
				'?$select=_msnfp_engagementopportunityid_value'
			);
			if (requestId === this.engagementOpportunityRequestId) {
				this.engagementOpportunityId = record?._msnfp_engagementopportunityid_value ?? null;
				this.loadedParticipationId = participationId;
			}
		}
		catch (err) {
			// Left empty: the next lookup search shows no shifts and retries the load.
		}
		finally {
			if (requestId === this.engagementOpportunityRequestId) {
				this.isLoading = false;
			}
		}
	};

	OnPreSearchAddFilterSync = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		const participationId = this.getParticipationId(formContext);
		if (!participationId) {
			return;
		}

		let filterXml: string;
		if (this.engagementOpportunityId && this.loadedParticipationId === participationId) {
			const opportunityId = normalizeId(this.engagementOpportunityId);
			filterXml = '<filter type=\'and\'><condition attribute=\'msnfp_engagementopportunity\' operator=\'eq\' value=\'{' + opportunityId + '}\'/></filter>';
		}
		else {
			// The opportunity isn't known yet (still loading, or the load failed): list no shifts rather than shifts of every opportunity.
			filterXml = NO_SHIFTS_FILTER;
			if (!this.isLoading) {
				this.loadEngagementOpportunityIdAsync(formContext);
			}
		}
		formContext.getControl<Xrm.Controls.LookupControl>('msnfp_engagementopportunityscheduleid')?.addCustomFilter(filterXml);
	};
}

window.ParticipationScheduleForm = new ParticipationScheduleForm();
