export class ParticipationForm {
	OnLoad = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		const formType = formContext.ui.getFormType();
		if (formType == XrmEnum.FormType.Create) {
			const eoRef = formContext.getAttribute('msnfp_engagementopportunityid')?.getValue();

			if (!eoRef) {
				return;
			}

			Xrm.WebApi.retrieveRecord(
				'msnfp_engagementopportunity',
				eoRef[0].id.slice(1, eoRef[0].id.length - 1).toLowerCase(),
				'?$select=msnfp_automaticallyapproveallapplicants'
			).then(
				(result: boolean): void => {
					this.UpdateAutoApprovedState(formContext, result);
				},
				(error: Error): void => {
					console.log(error.message);
				}
			);
		}
	};

	UpdateAutoApprovedState = (
		formContext: Xrm.FormContext,
		autoApprovedState: boolean
	) => {
		if (autoApprovedState) {
			formContext
				.getAttribute('msnfp_status')
				.setValue(Msnfp_participationEnum.msnfp_status.Approved);
		} else {
			formContext
				.getAttribute('msnfp_status')
				.setValue(Msnfp_participationEnum.msnfp_status.NeedsReview);
		}
	};
}

window.ParticipationForm = new ParticipationForm();
