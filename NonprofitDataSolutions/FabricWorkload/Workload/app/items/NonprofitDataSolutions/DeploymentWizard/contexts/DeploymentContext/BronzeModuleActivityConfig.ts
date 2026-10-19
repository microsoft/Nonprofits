import { ModuleType } from '../../types/ModuleType';

/**
 * Defines which Bronze pipeline activities belong to each optional module.
 */
export const MODULE_ACTIVITY_MAP: Record<ModuleType, readonly string[]> = {
	[ModuleType.Fundraising_Core]: [],
	[ModuleType.Fundraising_SampleData]: ['Import sample data'],
	[ModuleType.Fundraising_Dynamics365]: ['Transform Dynamics 365 bronze data to silver'],
	[ModuleType.Fundraising_SalesforceNPSP]: [
		'Import SalesforceNPSP data to Bronze',
		'Transform SalesforceNPSP bronze data to silver',
	],
};
