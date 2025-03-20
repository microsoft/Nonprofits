export class ParticipationScheduleForm {
	OnLoad = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		formContext.getControl<Xrm.Controls.LookupControl>('msnfp_engagementopportunityscheduleid').addPreSearch(this.OnPreSearchAddFilterSync);
	};

	OnPreSearchAddFilterSync = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		if (formContext.getAttribute('msnfp_participationid') != null) {
			const participation = formContext.getAttribute('msnfp_participationid').getValue();

			if (participation != null && participation.length > 0) {
				const req = new XMLHttpRequest();
				req.open('GET', Xrm.Utility.getGlobalContext().getClientUrl() + '/api/data/v9.2/msnfp_participations(' + participation[0].id.slice(1, participation[0].id.length - 1) + ')?$select=_msnfp_engagementopportunityid_value', false);
				req.send();

				if (req.status == 200) {
					const filterXml = '<filter type=\'and\'><condition attribute=\'msnfp_engagementopportunity\' operator=\'eq\' value=\'{' + JSON.parse(req.responseText)._msnfp_engagementopportunityid_value + '}\'/></filter>';
					formContext.getControl<Xrm.Controls.LookupControl>('msnfp_engagementopportunityscheduleid').addCustomFilter(filterXml);
				}
			}
		}
	};
}

window.ParticipationScheduleForm = new ParticipationScheduleForm();
