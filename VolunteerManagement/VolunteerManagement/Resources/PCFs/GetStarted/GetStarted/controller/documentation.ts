import { SvgXML } from '../svg/SvgXML';
import { LocalizedStrings } from '../strings';
import { FeatureTileProps } from '../components';

export const getDocumentationProps = (): FeatureTileProps => ({
	title: LocalizedStrings.managingSectionTitle,
	svg: SvgXML.featureTile,
	links: [
		{
			href: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/volunteer-management-use#add-a-volunteer-to-an-engagement-opportunity',
			title: LocalizedStrings.docAddVolunter
		},
		{
			href: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/volunteer-management-use#approve-volunteers-and-add-volunteers-to-a-schedule',
			title: LocalizedStrings.docApproveVolunteer
		},
		{
			href: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/volunteer-management-use#close-an-engagement-opportunity-and-record-attendance',
			title: LocalizedStrings.docCloseOpportunity
		},
		{
			href: 'https://docs.microsoft.com/dynamics365/industry/nonprofit/volunteer-engagement-use',
			title: LocalizedStrings.docLearnAboutProduct
		}
	]
});
