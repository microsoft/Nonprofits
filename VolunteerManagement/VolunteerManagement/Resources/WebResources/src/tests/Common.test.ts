import { formatDateTime } from '../Common';

describe('formatDateTime', () => {
	test('returns empty string if any of arguments does not provided', () => {
		const formattedDate = formatDateTime();

		expect(formattedDate).toEqual('');
	});

	test('returns formatted date with appropriate date and time separator', () => {
		const dateFormatting = {
			DateSeparator: '/',
			TimeSeparator: ':',
			ShortDatePattern : 'M/d/yyyy',
			ShortTimePattern : 'h:mm tt'
		} as Xrm.DateFormattingInfo;

		const formattedDate = formatDateTime(new Date('Tue, 19 Dec 2023 09:16:06 GMT'), dateFormatting);

		expect(formattedDate).toEqual('12/19/2023, 9:16:06 AM');
	});
});