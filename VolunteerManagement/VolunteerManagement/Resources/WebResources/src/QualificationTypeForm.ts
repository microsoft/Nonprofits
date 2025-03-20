import { getLocalizedText } from './Common';

export class QualificationTypeForm {
	OnLoad = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		formContext.getAttribute('msnfp_type').addOnChange(this.CheckType);
		this.CheckType(executionContext);
		if (formContext.ui.getFormType() == XrmEnum.FormType.Create) {
			formContext.ui.setFormNotification(getLocalizedText('QualificationType.OnFormLoadNotificationText'), 'INFO', 'SaveToContinue');
		}
		else formContext.ui.clearFormNotification('SaveToContinue');
	};

	CheckType = (executionContext: Xrm.Events.EventContext): void => {
		const formContext = executionContext.getFormContext();
		const qualificationType = formContext.getAttribute('msnfp_type');
		const tab = formContext.ui.tabs.get('tab_general');
		const section = tab.sections.get('section_stages');

		const isOnboarding = qualificationType != null && qualificationType.getValue() == Msnfp_qualificationtypeEnum.msnfp_type.Onboarding;
		if (isOnboarding && formContext.ui.getFormType() == XrmEnum.FormType.Create) {
			const confirmStrings = {
				text: (getLocalizedText('QualificationType.Details.Type.ConfirmOnboardingDialog.Text') as any).replaceAll('\\n', '\n'),
				title: getLocalizedText('QualificationType.Details.Type.ConfirmOnboardingDialog.Title')
			};

			Xrm.Navigation.openConfirmDialog(confirmStrings, null).then(
				function (success: Xrm.Navigation.ConfirmResult) {
					if (!success.confirmed) {
						const approve = formContext.getAttribute('msnfp_type');
						approve?.setValue(null);
					}
				});
		}

		if (isOnboarding && formContext.ui.getFormType() != XrmEnum.FormType.Create) {
			section.setVisible(true);
		}
		else {
			section.setVisible(false);
		}
	};

	OpenQuickCreateFromSubgridRibbon = (formContext: Xrm.FormContext, selectedItems: any): void => {
		const selectedItem = selectedItems[0];
		Xrm.Navigation.openForm({ entityName: 'msnfp_onboardingprocessstep', createFromEntity: { entityType: 'msnfp_onboardingprocessstage', id: selectedItem.Id }, useQuickCreateForm: true });
	};
}

window.QualificationTypeForm = new QualificationTypeForm();
