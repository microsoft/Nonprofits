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
	pageTitle: '',
	pageSubTitle: '',
	activitiesManage: '',
	activitiesOpportunity: '',
	activitiesOnboarding: '',
	activitiesLearnMore: '',
	managingSectionTitle: '',
	docAddVolunter: '',
	docApproveVolunteer: '',
	docCloseOpportunity: '',
	docLearnAboutProduct: '',
	learnSectionTitle: '',
	learnCreateOnboardingTemplate: '',
	learnManageOpportunitySchedule: '',
	learnIntegrationWithOther: '',
	outLearn: '',
	outLearnAriaLabel: '',
	outLearnLink: '',
	outLearnDescription: '',
	outCommunityTraining: '',
	outCommunityTrainingDescription: '',
	outCommunityTrainingLink: '',
	outCommunityTrainingAriaLabel: '',
	outFindPartner: '',
	outFindPartnerDescription: '',
	outFindPartnerLink: '',
	outFindPartnerAriaLabel: '',
	outCommunity: '',
	outCommunityDescription: '',
	outCommunityLink: '',
	outCommunityAriaLabel: '',
	outSupport: '',
	outSupportDescription: '',
	outSupportLink: '',
	outSupportArialLabel: ''
};

export const { loadLocalizedStrings, LocalizedStrings } = initLocalizedStrings(LocalizedStringsTemplate);
