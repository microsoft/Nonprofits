import { PackageItem, PackageItemPart } from '@originalInstaller/PackageInstallerItemModel';

import { ModuleType } from '../../types/ModuleType';

const SAMPLE_DATA_PATH_TOKEN = 'nds-silver-sampledata';

const isSampleDataFile = (part: PackageItemPart): boolean => {
	const path = typeof part.path === 'string' ? part.path : '';
	return path.toLowerCase().includes(SAMPLE_DATA_PATH_TOKEN);
};

/**
 * Remove bundled sample CSV files from package items when the SampleData module is not selected.
 */
export const pruneSampleDataFiles = (items: PackageItem[], selectedModules: Set<ModuleType>): PackageItem[] => {
	if (selectedModules.has(ModuleType.Fundraising_SampleData)) {
		return items;
	}

	return items.map((item) => {
		const fileParts = item.data?.files;
		if (!Array.isArray(fileParts) || fileParts.length === 0) {
			return item;
		}

		const filteredFiles = fileParts.filter((part) => !isSampleDataFile(part));
		if (filteredFiles.length === fileParts.length) {
			return item;
		}

		return {
			...item,
			data: {
				...(item.data ?? {}),
				files: filteredFiles,
			},
		};
	});
};
