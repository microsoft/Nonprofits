const FIRST_PARTY_PUBLISHERS = new Set([
	'adxstudio',
	'dynamics365customerengagement',
	'dynamicsmkt',
	'microsoftcorporation',
	'microsoftdynamics',
	'microsoftdynamics365nonprofitaccelerator',
	'microsoftfirstparty',
	'microsofttechforsocialimpact',
	'qmsanchor',
]);

export function isMicrosoftFirstPartyPublisher(publisher: string): boolean {
	const normalized = publisher.toLowerCase();
	return FIRST_PARTY_PUBLISHERS.has(normalized)
		|| /^(microsoft|msdyn|dynamicsmkt|powerplatform)/.test(normalized);
}
