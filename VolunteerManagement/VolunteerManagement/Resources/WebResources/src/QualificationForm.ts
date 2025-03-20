import { getLocalizedText } from './Common';

export class QualificationForm {
	OnLoad = (executionContext: any): void => {
		const formContext = executionContext.getFormContext();
		formContext.getAttribute('msnfp_typeid')?.addOnChange(this.CheckQualificationType);
		const tab = formContext.ui.tabs.get('tab_2');
		if (tab != null) tab.setVisible(false);
		this.CheckQualificationType(executionContext);

		const wrControl = formContext.getControl('WebResource_nextstage');
		if (wrControl) {
			wrControl.getContentWindow().then(
				function (contentWindow: any) {
					contentWindow.setClientApiContext(Xrm, formContext, getLocalizedText);
				}
			);
		}
	};

	GetQualificationTypeType = async (formContext: Xrm.FormContext, qualId: any): Promise<boolean> => {
		return await Xrm.WebApi.retrieveRecord('msnfp_qualificationtype', qualId, '?$select=msnfp_type').then(
			function success(result: any): boolean {
				const type = result.msnfp_type;
				if (type == Msnfp_qualificationtypeEnum.msnfp_type.Onboarding) {
					return true;
				}
				else return false;
			},
			function (error: Error): boolean {
				console.log(error.message);
				return false;
			}
		);
	};

	ConfirmOnboarding = async (formContext: any): Promise<void> => {
		const confirmStrings = {
			text: getLocalizedText('Qualification.Details.Type.ConfirmOnboardingDialog.Text'),
			title: getLocalizedText('Qualification.Details.Type.ConfirmOnboardingDialog.Title')
		};

		return await Xrm.Navigation.openConfirmDialog(confirmStrings, null).then(
			function (success) {
				if (!success.confirmed) {
					const approve = formContext.getAttribute('msnfp_typeid');
					approve.setValue(null);
				}
			});
	};

	CheckQualificationType = async (executionContext: Xrm.Events.EventContext): Promise<void> => {
		const formContext: any = executionContext.getFormContext();
		const formType = formContext.ui.getFormType();
		const qualificationType = formContext.getAttribute('msnfp_typeid');
		const qualificationTypeValue = qualificationType?.getValue();

		if (qualificationTypeValue != null && formType != XrmEnum.FormType.Create && formType != XrmEnum.FormType.QuickCreate) {
			const qualId = qualificationType.getValue()[0].id.slice(1, 37);
			Xrm.WebApi.retrieveRecord('msnfp_qualificationtype', qualId, '?$select=msnfp_type').then(
				function success(result: any) {
					const type = result.msnfp_type;
					if (type == Msnfp_qualificationtypeEnum.msnfp_type.Onboarding) {
						formContext.getControl('msnfp_typeid').setDisabled(true);
						const tab = formContext.ui.tabs.get('tab_2');
						if (tab != null) tab.setVisible(true);
					}
				},
				function (error: Error) {
					console.log(error.message);
				}
			);
		} else if (qualificationTypeValue != null && (formType == XrmEnum.FormType.Create || formType == XrmEnum.FormType.QuickCreate)) {
			const qualId = qualificationType.getValue()[0].id.slice(1, 37);
			const onboarding = await this.GetQualificationTypeType(formContext, qualId);
			if (onboarding) await this.ConfirmOnboarding(formContext);
		}
	};
}

window.QualificationForm = new QualificationForm();