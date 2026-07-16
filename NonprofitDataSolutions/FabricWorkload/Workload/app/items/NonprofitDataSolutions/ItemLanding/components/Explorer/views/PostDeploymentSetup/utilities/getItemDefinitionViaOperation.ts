type OperationResponse = {
	body?: unknown;
	headers?: Record<string, string | null>;
};

type DefinitionEnvelope = {
	definition?: unknown;
	result?: { definition?: unknown };
	payload?: { definition?: unknown };
	state?: string;
	status?: string;
	operationState?: string;
};

const extractDefinition = (body: unknown): unknown | undefined => {
	const typedBody = body as DefinitionEnvelope | undefined;
	return typedBody?.definition || typedBody?.result?.definition || typedBody?.payload?.definition;
};

const isTerminalSuccess = (state: string): boolean => {
	const normalized = state.toLowerCase();
	return (
		normalized.includes('success') ||
		normalized.includes('succeed') ||
		normalized.includes('complete') ||
		normalized.includes('done')
	);
};

const isTerminalFailure = (state: string): boolean => {
	const normalized = state.toLowerCase();
	return normalized.includes('fail') || normalized.includes('error') || normalized.includes('cancel');
};

const tryExtractOperationId = (value?: string | null): string | undefined => {
	if (!value) return undefined;
	const match = value.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
	return match?.[0];
};

const toResultUrl = (operationStateUrl: string): string => {
	const trimmed = operationStateUrl.endsWith('/') ? operationStateUrl.slice(0, -1) : operationStateUrl;
	return trimmed.endsWith('/result') ? trimmed : `${trimmed}/result`;
};

export const getItemDefinitionViaOperation = async (
	workspaceId: string,
	itemId: string,
	postWithResponse: (endpoint: string) => Promise<OperationResponse>,
	getOperationWithResponse: (operationUrl: string) => Promise<OperationResponse>,
): Promise<unknown> => {
	const endpoint = `/workspaces/${encodeURIComponent(workspaceId)}/items/${encodeURIComponent(itemId)}/getDefinition`;
	const initial = await postWithResponse(endpoint);
	if (extractDefinition(initial?.body)) {
		return initial.body;
	}

	const operationUrl = initial?.headers?.['operation-location'] || initial?.headers?.location;
	if (!operationUrl) {
		return initial?.body;
	}

	const initialOperationId =
		initial?.headers?.['x-ms-operation-id'] ||
		tryExtractOperationId(initial?.headers?.location) ||
		tryExtractOperationId(initial?.headers?.['operation-location']) ||
		tryExtractOperationId(operationUrl);

	const operationStateUrl = initialOperationId ? `/operations/${initialOperationId}` : operationUrl;
	const operationResultUrl = initialOperationId ? `/operations/${initialOperationId}/result` : toResultUrl(operationStateUrl);

	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	for (let attempt = 1; attempt <= 12; attempt++) {
		const operation = await getOperationWithResponse(operationStateUrl);
		const operationDefinition = extractDefinition(operation?.body);
		if (operationDefinition) {
			return { definition: operationDefinition };
		}

		const operationBody = operation?.body as DefinitionEnvelope | undefined;
		const state = String(operationBody?.state || operationBody?.status || operationBody?.operationState || '');
		if (isTerminalFailure(state)) {
			throw new Error(`getDefinition operation failed: ${state.toLowerCase()}`);
		}

		if (isTerminalSuccess(state)) {
			const result = await getOperationWithResponse(operationResultUrl);
			const resultDefinition = extractDefinition(result?.body);
			if (resultDefinition) {
				return { definition: resultDefinition };
			}

			const locationResultUrl = operation?.headers?.location || initial?.headers?.location;
			if (locationResultUrl && locationResultUrl !== operationResultUrl) {
				const locationResult = await getOperationWithResponse(locationResultUrl);
				const locationDefinition = extractDefinition(locationResult?.body);
				if (locationDefinition) {
					return { definition: locationDefinition };
				}
			}

			return result?.body ?? operation?.body;
		}

		const retryAfterSeconds = Number(operation?.headers?.['retry-after']);
		const delayMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 1000;
		if (attempt < 12) {
			await sleep(delayMs);
		}
	}

	throw new Error('getDefinition operation polling timed out');
};
