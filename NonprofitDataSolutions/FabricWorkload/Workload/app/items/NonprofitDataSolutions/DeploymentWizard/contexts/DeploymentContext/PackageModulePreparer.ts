import { PackageItem } from '@originalInstaller/PackageInstallerItemModel';
import { ContentHelper } from '@originalInstaller/deployment/ContentHelper';

import { ModuleType } from '../../types/ModuleType';
import { applyBronzePipelineAdjustments } from './BronzePipelineAugmentor';
import { pruneSampleDataFiles } from './SampleDataPruner';

/**
 * Prepare package items for deployment based on selected modules. Non-selected modules have their pipeline activities
 * pruned before deployment so the Fabric payload matches the chosen configuration.
 */
export const preparePackageItemsForModules = (
	items: PackageItem[],
	selectedModules: Set<ModuleType>,
): PackageItem[] => {
	const clonedItems = ContentHelper.cloneJson(items);
	const bronzeAdjustedItems = applyBronzePipelineAdjustments(clonedItems, selectedModules);

	return pruneSampleDataFiles(bronzeAdjustedItems, selectedModules);
};
