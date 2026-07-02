import {
	DeploymentItemStatus,
	ModuleInstallationStatus,
	ModuleInstallationStatuses,
	PackageDeployment,
} from '@originalInstaller/PackageInstallerItemModel';

import { ModuleType } from '../../types/ModuleType';

/**
 * Data structure that maps ModuleType to corresponding artifact names
 * Used for filtering package items based on selected modules
 */
export interface ModuleArtifactMap {
	[key: string]: string[]; // ModuleType as key, array of artifact names as value
}

/**
 * Module to artifact mapping configuration
 * This maps each module type to its corresponding artifact names in the package
 */
export const MODULE_ARTIFACT_MAPPING: ModuleArtifactMap = {
	[ModuleType.Fundraising_Core]: [
		'Fundraising_SL_Lakehouse',
		'Fundraising_GD_Lakehouse',
		'Fundraising_Config_Notebook',
		'Fundraising_GD_CreateSchema_Notebook',
		'Fundraising_GD_CreateSegments_Notebook',
		'Fundraising_SL_DefaultConfig_Notebook',
		'Fundraising_SL_CreateSchema_Notebook',
		'Fundraising_SL_GD_Enrichment_Notebook',
		'Fundraising_BR_Ingestion_DataPipeline',
		'Fundraising_SL_GD_Enrichment_DataPipeline',
		'Fundraising_Orchestration_DataPipeline',
		'Fundraising_Intelligence_Report',
		'Fundraising_Intelligence_SemanticModel',
	],
	[ModuleType.Fundraising_SampleData]: ['Fundraising_SL_SampleData_Notebook'],
	[ModuleType.Fundraising_Dynamics365]: ['Fundraising_D365_Config_Notebook', 'Fundraising_D365_Transform_Notebook'],
	[ModuleType.Fundraising_SalesforceNPSP]: [
		'Fundraising_SalesforceNPSP_BR_Lakehouse',
		'Fundraising_SalesforceNPSP_BR_Merge_Notebook',
		'Fundraising_SalesforceNPSP_BR_Load_DataPipeline',
		'Fundraising_SalesforceNPSP_Transform_Notebook',
		'Fundraising_SalesforceNPSP_Config_Notebook',
	],
};

/**
 * Runtime placeholders that NonprofitDataSolutions Fundraising injects into the deployment variable map.
 * Centralizing them here documents which dynamic values the wizard supplies during deployment.
 */
export const FUNDRAISING_RUNTIME_VARIABLES = {
	/** Filled with the connection selected in the wizard before deploying pipelines */
	salesforceConnection: 'SalesforceConnectionIdPlaceholder',
	/** Dynamics module notebooks expect both the ID and display name of the selected lakehouse */
	dynamicsConnectionId: 'D365ConnectionIdPlaceholder',
	dynamicsConnectionName: 'D365ConnectionNamePlaceholder',
} as const;

/**
 * Check if an artifact belongs to any of the selected modules
 * @param artifactName Name of the artifact to check
 * @param selectedModules Set of selected ModuleType values
 * @returns true if the artifact belongs to any selected module
 */
export const isArtifactIncluded = (sourceId: string, selectedModules: Set<ModuleType>): boolean => {
	// More efficient: directly check each selected module instead of generating full artifact list
	for (const moduleType of selectedModules) {
		const moduleArtifacts = MODULE_ARTIFACT_MAPPING[moduleType];
		if (moduleArtifacts && moduleArtifacts.includes(sourceId)) {
			return true;
		}
	}
	return false;
};

/**
 * Filter package items based on selected modules
 * @param packageItems Array of package items (each should have a 'sourceId' property)
 * @param selectedModules Set of selected ModuleType values
 * @returns Filtered array of package items
 */
export const filterPackageItemsByModules = <T extends { sourceId: string }>(
	packageItems: T[],
	selectedModules: Set<ModuleType>,
): T[] => {
	if (selectedModules.size === 0) {
		return packageItems; // Return all items if no modules selected
	}

	return packageItems.filter((item) => isArtifactIncluded(item.sourceId, selectedModules));
};

/**
 * Determines the installation status of each selected module
 * @param selectedModules Set of modules that were selected for installation
 * @param updatedDeployment Deployment data containing the deployed items
 * @returns Object with module types as keys and their installation status as values
 */
export const getModuleInstallationStatus = (
	selectedModules: Set<ModuleType>,
	updatedDeployment: PackageDeployment,
): ModuleInstallationStatuses => {
	const result: ModuleInstallationStatuses = {};

	if (selectedModules.size === 0 || !updatedDeployment.deployedItems) {
		return result;
	}

	// Create sets of deployed artifact names by status for efficient lookup
	const succeededArtifacts = new Set(
		updatedDeployment.deployedItems
			.filter((item) => item.deploymentStatus === DeploymentItemStatus.Succeeded)
			.map((item) => item.sourceId),
	);

	const failedArtifacts = new Set(
		updatedDeployment.deployedItems
			.filter((item) => item.deploymentStatus === DeploymentItemStatus.Failed)
			.map((item) => item.sourceId),
	);

	// Check each selected module to determine its status
	for (const moduleType of selectedModules) {
		const requiredArtifacts = MODULE_ARTIFACT_MAPPING[moduleType];

		// Skip if module mapping doesn't exist
		if (!requiredArtifacts) {
			result[moduleType] = ModuleInstallationStatus.Skipped;
			continue;
		}

		// Count artifacts by status
		const succeededCount = requiredArtifacts.filter((artifact) => succeededArtifacts.has(artifact)).length;
		const failedCount = requiredArtifacts.filter((artifact) => failedArtifacts.has(artifact)).length;
		const totalArtifacts = requiredArtifacts.length;

		// Determine module status based on artifact deployment results
		if (succeededCount === totalArtifacts) {
			result[moduleType] = ModuleInstallationStatus.Succeeded;
		} else if (succeededCount === 0 && failedCount === 0) {
			// No artifacts were processed at all - this is truly skipped
			result[moduleType] = ModuleInstallationStatus.Skipped;
		} else {
			// Some artifacts succeeded but not all, or some failed - this is a failure
			result[moduleType] = ModuleInstallationStatus.Failed;
		}
	}

	return result;
};
