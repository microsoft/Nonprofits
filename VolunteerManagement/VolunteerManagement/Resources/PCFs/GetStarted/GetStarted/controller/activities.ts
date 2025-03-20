import { SvgXML } from '../svg/SvgXML';
import { LocalizedStrings } from '../strings';
import { TopCardProps } from '../components';

export const getActivitiesProps = (): TopCardProps[] => [
	{
		title: LocalizedStrings.activitiesManage,
		linkText: LocalizedStrings.activitiesLearnMore,
		icon: SvgXML.lookup,
		link: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/volunteer-management-use#manage-volunteers-and-groups'
	},
	{
		title: LocalizedStrings.activitiesOpportunity,
		linkText: LocalizedStrings.activitiesLearnMore,
		icon: SvgXML.opportunity,
		link: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/volunteer-management-use#create-an-engagement-opportunity'
	},
	{
		title: LocalizedStrings.activitiesOnboarding,
		linkText: LocalizedStrings.activitiesLearnMore,
		icon: SvgXML.process,
		link: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/volunteer-management-use#assign-volunteers-to-an-onboarding-process'
	}
];
