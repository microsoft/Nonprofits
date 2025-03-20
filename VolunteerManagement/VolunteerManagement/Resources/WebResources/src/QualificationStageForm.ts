export class QualificationStageForm {
	OnLoad = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		const stageStatus = formContext.getAttribute('msnfp_stagestatus')?.getValue();

		if (stageStatus === Msnfp_qualificationstageEnum.msnfp_stagestatus.Pending) {
			formContext.getControl<Xrm.Controls.GridControl>('Subgrid_1')?.setVisible(false);
			formContext.getControl<Xrm.Controls.GridControl>('Subgrid_2')?.setVisible(true);
		}
		else {
			formContext.getControl<Xrm.Controls.GridControl>('Subgrid_1')?.setVisible(true);
			formContext.getControl<Xrm.Controls.GridControl>('Subgrid_2')?.setVisible(false);
		}
		this.CheckStatus(executionContext);
		formContext.data.entity.addOnSave(this.CheckStatus);
	};

	private CheckStatus = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		const status = formContext.getAttribute('msnfp_stagestatus')?.getValue();

		if (status === Msnfp_qualificationstageEnum.msnfp_stagestatus.Abandon || status === Msnfp_qualificationstageEnum.msnfp_stagestatus.Completed) {
			formContext.getAttribute('msnfp_stagestatus')?.controls.forEach((c) => c?.setDisabled(true));
		}
	};
}

window.QualificationStageForm = new QualificationStageForm();
