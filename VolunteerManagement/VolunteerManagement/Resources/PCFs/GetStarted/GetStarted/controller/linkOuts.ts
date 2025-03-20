import { LinkOutBaseProps } from '../components';
import { LocalizedStrings } from '../strings';

export const getLinkOuts = (): LinkOutBaseProps[] => [
	{
		title: LocalizedStrings.outLearn,
		description: LocalizedStrings.outLearnDescription,
		linkTitle: LocalizedStrings.outLearnLink,
		linkAriaLabel: LocalizedStrings.outLearnAriaLabel,
		link: 'https://docs.microsoft.com/learn/modules/get-started-volunteer-management-engagement/'
	},
	{
		title: LocalizedStrings.outCommunityTraining,
		description: LocalizedStrings.outCommunityTrainingDescription,
		linkTitle: LocalizedStrings.outCommunityTrainingLink,
		linkAriaLabel:  LocalizedStrings.outCommunityTrainingAriaLabel,
		link: 'https://www.microsoft.com/nonprofits/resources'
	},
	{
		title: LocalizedStrings.outFindPartner,
		description: LocalizedStrings.outFindPartnerDescription,
		linkTitle: LocalizedStrings.outFindPartnerLink,
		linkAriaLabel: LocalizedStrings.outFindPartnerAriaLabel,
		link: 'https://www.microsoft.com/nonprofits/partners'
	},
	{
		title: LocalizedStrings.outCommunity,
		description: LocalizedStrings.outCommunityDescription,
		linkTitle: LocalizedStrings.outCommunityLink,
		linkAriaLabel: LocalizedStrings.outCommunityAriaLabel,
		link: 'https://www.nonprofitcdm.org/join'
	},
	{
		title: LocalizedStrings.outSupport,
		description: LocalizedStrings.outSupportDescription,
		linkTitle: LocalizedStrings.outSupportLink,
		linkAriaLabel: LocalizedStrings.outSupportArialLabel,
		link: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/support'
	}
];
