export class ParticipationScheduleForm {
	private engagementOpportunityId: string | null = null;
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

	loadEngagementOpportunityIdAsync = async (formContext: Xrm.FormContext): Promise<void> => {
		const requestId = ++this.engagementOpportunityRequestId;
		this.engagementOpportunityId = null;

		const participation = formContext.getAttribute<Xrm.Attributes.LookupAttribute>('msnfp_participationid')?.getValue();
		if (!participation || participation.length === 0) {
			return;
		}

		try {
			const record = await Xrm.WebApi.retrieveRecord(
				'msnfp_participation',
				participation[0].id.replace(/[{}]/g, ''),
				'?$select=_msnfp_engagementopportunityid_value'
			);
			if (requestId === this.engagementOpportunityRequestId) {
				this.engagementOpportunityId = record?._msnfp_engagementopportunityid_value ?? null;
			}
		}
		catch (err) {
			if (requestId === this.engagementOpportunityRequestId) {
				this.engagementOpportunityId = null;
			}
		}
	};

	OnPreSearchAddFilterSync = (executionContext: Xrm.Events.EventContext): void => {
		if (!this.engagementOpportunityId) {
			return;
		}

		const formContext = executionContext.getFormContext();
		const opportunityId = this.engagementOpportunityId.replace(/[{}]/g, '');
		const filterXml = '<filter type=\'and\'><condition attribute=\'msnfp_engagementopportunity\' operator=\'eq\' value=\'{' + opportunityId + '}\'/></filter>';
		formContext.getControl<Xrm.Controls.LookupControl>('msnfp_engagementopportunityscheduleid')?.addCustomFilter(filterXml);
	};
}

window.ParticipationScheduleForm = new ParticipationScheduleForm();
