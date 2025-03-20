import { LocalizedStrings } from '../strings';
import { PageHeaderProps } from '../components';

export const getPageHeaderProps = (): PageHeaderProps => ({
	pageTitle: LocalizedStrings.pageTitle,
	pageSubTitle: LocalizedStrings.pageSubTitle
});
