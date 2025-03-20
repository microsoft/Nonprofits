export class GroupForm {
	OnLoad(executionContext: Xrm.Events.EventContext) {
		const formContext = executionContext.getFormContext();

		const formType = formContext.ui.getFormType();
		switch (formType) {
			case XrmEnum.FormType.Create:
				formContext.ui.tabs.get('tab_summary').setVisible(false);
				break;
			case XrmEnum.FormType.Update:
				formContext.ui.tabs.get('tab_summary').setVisible(true);
				break;
			default:
				break;
		}
	}
}

window.GroupForm = new GroupForm();
