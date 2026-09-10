import baseBronzeIngestionPipeline from '@src/assets/items/PackageInstallerItem/Fundraising/definitions/DataPipelines/Fundraising_BR_Ingestion.DataPipeline/pipeline-content.json';

import { PackageItem, PackageItemPayloadType } from '@originalInstaller/PackageInstallerItemModel';
import { ContentHelper } from '@originalInstaller/deployment/ContentHelper';

import { ModuleType } from '../../types/ModuleType';
import { MODULE_ACTIVITY_MAP } from './BronzeModuleActivityConfig';
import { BronzePipelineActivity, BronzePipelineContent } from './BronzePipelineActivityTypes';

const PIPELINE_PART_PATH = 'pipeline-content.json';
const BRONZE_INGESTION_PIPELINE_SOURCE_ID = 'Fundraising_BR_Ingestion_DataPipeline';

const isBronzeIngestionItem = (item: PackageItem): boolean => {
	return item.sourceId === BRONZE_INGESTION_PIPELINE_SOURCE_ID;
};

const OPTIONAL_MODULE_ACTIVITY_NAMES: Array<{
	module: ModuleType;
	activityNames: Set<string>;
}> = Object.entries(MODULE_ACTIVITY_MAP).map(([module, activityNames]) => ({
	module: module as ModuleType,
	activityNames: new Set(activityNames as readonly string[]),
}));

const normalizeActivityDependencies = (activities: BronzePipelineActivity[]): BronzePipelineActivity[] => {
	let previousActivityName: string | undefined;

	return activities.map((activity) => {
		const normalizedActivity: BronzePipelineActivity = { ...activity } as BronzePipelineActivity;

		if (!normalizedActivity.name) {
			return normalizedActivity;
		}

		if (!previousActivityName) {
			normalizedActivity.dependsOn = [];
		} else {
			normalizedActivity.dependsOn = [
				{
					activity: previousActivityName,
					dependencyConditions: ['Succeeded'],
				},
			];
		}

		previousActivityName = normalizedActivity.name;
		return normalizedActivity;
	});
};

const removeInactiveModuleActivities = (
	activities: BronzePipelineActivity[],
	selectedModules: Set<ModuleType>,
): BronzePipelineActivity[] => {
	if (!Array.isArray(activities) || activities.length === 0) {
		return activities;
	}

	const activitiesToRemove = new Set<string>();

	for (const { module, activityNames } of OPTIONAL_MODULE_ACTIVITY_NAMES) {
		if (!selectedModules.has(module)) {
			activityNames.forEach((name) => activitiesToRemove.add(name));
		}
	}

	const filteredActivities = activities.filter((activity) => {
		const activityName = typeof activity.name === 'string' ? activity.name : undefined;
		return !activityName || !activitiesToRemove.has(activityName);
	});

	return normalizeActivityDependencies(filteredActivities);
};

const buildBronzeIngestionForModules = (item: PackageItem, selectedModules: Set<ModuleType>): PackageItem => {
	const definition = item.definition;
	if (!definition?.parts?.length) {
		return item;
	}

	const pipelineTemplate = ContentHelper.cloneJson(baseBronzeIngestionPipeline) as BronzePipelineContent;
	const baseActivities = pipelineTemplate?.properties?.activities;

	if (!Array.isArray(baseActivities) || baseActivities.length === 0) {
		return item;
	}

	const normalizedActivities = removeInactiveModuleActivities(baseActivities, selectedModules);

	const properties = pipelineTemplate.properties ?? {};
	pipelineTemplate.properties = {
		...properties,
		activities: normalizedActivities,
	};

	const serializedPipeline = ContentHelper.toInlineBase64(pipelineTemplate);
	const updatedParts = definition.parts.map((part) => {
		const isPipelineAsset = part.path?.endsWith(PIPELINE_PART_PATH);
		return isPipelineAsset
			? {
					...part,
					payloadType: PackageItemPayloadType.InlineBase64,
					payload: serializedPipeline,
				}
			: { ...part };
	});

	return {
		...item,
		definition: {
			...definition,
			parts: updatedParts,
		},
	};
};

export const applyBronzePipelineAdjustments = (
	items: PackageItem[],
	selectedModules: Set<ModuleType>,
): PackageItem[] => {
	const updatedItems = ContentHelper.cloneJson(items);
	const bronzeItemIndex = updatedItems.findIndex(isBronzeIngestionItem);

	if (bronzeItemIndex === -1) {
		return updatedItems;
	}

	updatedItems[bronzeItemIndex] = buildBronzeIngestionForModules(updatedItems[bronzeItemIndex], selectedModules);

	return updatedItems;
};
