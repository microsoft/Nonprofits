import { SEMANTIC_MODEL_MESSAGES } from './postDeploymentMessages';

type SemanticModelDefinitionResponse = {
	definition?: {
		parts?: any[];
		format?: string;
	};
};

const errorToSummary = (error: any): string => {
	if (!error) return 'unknown-error';
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;
	if (typeof error === 'object') {
		const keys = Object.keys(error).slice(0, 12);
		const message =
			error?.message ||
			error?.error?.message ||
			error?.errorResponse?.message ||
			error?.response?.body?.error?.message ||
			error?.response?.message;
		return `object(keys=${keys.join(',') || 'none'}${message ? `; message=${String(message)}` : ''})`;
	}
	return String(error);
};

const toSummary = (value: any): string => {
	if (value === null) return 'null';
	if (value === undefined) return 'undefined';
	if (Array.isArray(value)) return `array(len=${value.length})`;
	if (typeof value !== 'object') return typeof value;

	const keys = Object.keys(value).slice(0, 12);
	return `object(keys=${keys.join(',') || 'none'})`;
};

const isPartsArray = (value: any): value is any[] => {
	if (!Array.isArray(value)) return false;
	if (value.length === 0) return true;
	return value.some((part) => typeof part === 'object' && part !== null && ('path' in part || 'payload' in part));
};

const findPartsArrayDeep = (root: any): any[] | undefined => {
	if (!root || typeof root !== 'object') return undefined;

	const queue: any[] = [root];
	const visited = new Set<any>();

	while (queue.length > 0) {
		const current = queue.shift();
		if (!current || typeof current !== 'object' || visited.has(current)) {
			continue;
		}
		visited.add(current);

		if (isPartsArray((current as any).parts)) {
			return (current as any).parts;
		}

		for (const value of Object.values(current)) {
			if (value && typeof value === 'object') {
				queue.push(value);
			}
		}
	}

	return undefined;
};

const normalizeDefinitionResponse = (value: any): SemanticModelDefinitionResponse => {
	const parts = findPartsArrayDeep(value);
	if (parts) {
		const detectedFormat =
			(typeof value?.definition?.format === 'string' && value.definition.format) ||
			(typeof value?.format === 'string' && value.format) ||
			undefined;

		return {
			definition: {
				parts,
				format: detectedFormat,
			},
		};
	}

	return value as SemanticModelDefinitionResponse;
};

const hasParts = (value?: SemanticModelDefinitionResponse): boolean =>
	Array.isArray(value?.definition?.parts) && value!.definition!.parts!.length > 0;

export const loadSemanticModelDefinition = async (
	getDefinition: () => Promise<SemanticModelDefinitionResponse>,
	getPublicItemDefinition?: () => Promise<any>,
	getArtifactDefinition?: () => Promise<any>,
	getDefinitionViaOperation?: () => Promise<SemanticModelDefinitionResponse>,
): Promise<SemanticModelDefinitionResponse> => {
	const maxAttempts = getDefinitionViaOperation ? 1 : 10;
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	let lastResult: SemanticModelDefinitionResponse | undefined;
	let lastItemsSummary = 'no-response';
	let lastOperationSummary = 'not-called';
	let lastPublicSummary = 'not-called';
	let lastArtifactsSummary = 'not-called';

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const itemsRaw = await getDefinition();
		lastItemsSummary = `attempt=${attempt}; ${toSummary(itemsRaw)}; definition=${toSummary((itemsRaw as any)?.definition)}`;
		lastResult = normalizeDefinitionResponse(itemsRaw);
		if (hasParts(lastResult)) {
			return lastResult;
		}

		if (attempt < maxAttempts) {
			await sleep(1000);
		}
	}

	if (getDefinitionViaOperation) {
		try {
			const opResult = normalizeDefinitionResponse(await getDefinitionViaOperation());
			lastOperationSummary = `${toSummary(opResult)}; definition=${toSummary((opResult as any)?.definition)}`;
			if (hasParts(opResult)) {
				return opResult;
			}
			lastResult = opResult;
		} catch (error) {
			lastOperationSummary = `error: ${errorToSummary(error)}`;
		}
	}

	if (getPublicItemDefinition) {
		try {
			const publicRaw = await getPublicItemDefinition();
			lastPublicSummary = `${toSummary(publicRaw)}; definition=${toSummary((publicRaw as any)?.definition)}`;
			const publicResult = normalizeDefinitionResponse(publicRaw);
			if (hasParts(publicResult)) {
				return publicResult;
			}
			lastResult = publicResult;
		} catch (error) {
			lastPublicSummary = `error: ${errorToSummary(error)}`;
		}
	}

	if (getArtifactDefinition) {
		try {
			const artifactsRaw = await getArtifactDefinition();
			lastArtifactsSummary = `${toSummary(artifactsRaw)}; definition=${toSummary((artifactsRaw as any)?.definition)}`;
			const artifactResult = normalizeDefinitionResponse(artifactsRaw);
			if (hasParts(artifactResult)) {
				return artifactResult;
			}
			lastResult = artifactResult;
		} catch (error) {
			lastArtifactsSummary = `error: ${errorToSummary(error)}`;
			// Ignore fallback errors and return the best available result.
		}
	}

	throw new Error(
		`${SEMANTIC_MODEL_MESSAGES.definitionMissingParts} items=${lastItemsSummary}; operation=${lastOperationSummary}; public=${lastPublicSummary}; artifacts=${lastArtifactsSummary}`,
	);
};
