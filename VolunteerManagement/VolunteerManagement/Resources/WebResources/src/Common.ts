import { VolunteerManagementResxKeys } from './types/Localization';

const formatString = (format: string, ...args: any[]): string => {
	return format.replace(/{(\d+)}/g, (match: string, index: any) => {
		const argIndex = parseInt(index);
		return args[argIndex] === undefined ? match : args[argIndex];
	});
};

const initTextRetriever = <T extends string>(webresourceName?: string) => {
	return (key: T, ...args: any[]) => {
		const value = Xrm.Utility.getResourceString(webresourceName, key);
		return value ? formatString(value, ...args) : key;
	};
};

export const formatDateTime = (date?: Date, dateFormattingInfo?: Xrm.DateFormattingInfo): string => {
	if (!date || !dateFormattingInfo || !(date as any).localeFormat) {
		return date?.toLocaleString() ?? '';
	}

	const dateFormat = dateFormattingInfo.ShortDatePattern.replace(/\//ig, dateFormattingInfo.DateSeparator);
	const timeFormat = dateFormattingInfo.ShortTimePattern.replace(/:/ig, dateFormattingInfo.TimeSeparator);

	return `${(date as any).localeFormat(dateFormat)} ${(date as any).localeFormat(timeFormat)}`;
};

export const getLocalizedText = initTextRetriever<VolunteerManagementResxKeys>('msnfp_/strings/VolunteerManagement.Webresources');