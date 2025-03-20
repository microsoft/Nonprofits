import { LocalizedStrings } from '../strings';
import { LinksBlockProps } from '../components';

export const getLearnProps = (): LinksBlockProps  => ({
	title: LocalizedStrings.learnSectionTitle,
	links: [
		{
			href: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/volunteer-management-use#create-an-onboarding-qualifications-template',
			title: LocalizedStrings.learnCreateOnboardingTemplate
		},
		{
			href: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/volunteer-management-use#manage-engagement-opportunity-schedule',
			title: LocalizedStrings.learnManageOpportunitySchedule
		},
		{
			href: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/volunteer-management-use#integration-options',
			title: LocalizedStrings.learnIntegrationWithOther
		}
	]
});
