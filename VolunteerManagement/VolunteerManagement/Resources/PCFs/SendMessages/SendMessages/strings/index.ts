const initLocalizedStrings = <T extends {[key: string]: string}>(strings: T) => {
	const LocalizedStrings = {} as T;

	const loadLocalizedStrings = (resources: ComponentFramework.Resources, prefix = 'MSEMR') => {
		/**
		 * Takes all localized resources and overwrites the Constants default values with
		 * the localized values.
		 * @param resources PCF context resources.
		 */
		if (resources) {
			Object.keys(strings).forEach((key: keyof T) => {
				const resxKey = prefix ? `${prefix}_${String(key)}` : String(key);
				const locString = resources.getString(resxKey);
				if (resxKey !== locString) {
					(LocalizedStrings as any)[key] = locString || '';
				}
			});
		}
	};

	return {
		loadLocalizedStrings,
		LocalizedStrings
	};
};

const LocalizedStringsTemplate = {
	messageGroup: '',
	messageParticipants: '',
	titleSendMessagePanelGroupTitle: '',
	titleSendMessagePanelNonGroupTitle: '',
	closeButtonAriaLabel: '',
	processing: '',
	completeRequiredFieldsMessage: '',
	fromFieldLabel: '',
	toFieldLabel: '',
	subjectFieldLabel: '',
	messageFieldLabel: '',
	toFieldAllGroupMembersOption: '',
	toFieldAllParticipantsOption: '',
	saveButtonText: '',
	cancelButtonText: '',
};

export const { loadLocalizedStrings, LocalizedStrings } = initLocalizedStrings(LocalizedStringsTemplate);
