export const POST_DEPLOYMENT_LOG_PREFIX = '[PostDeploymentSetup]';

export const SEMANTIC_MODEL_MESSAGES = {
	definitionMissingParts: 'Semantic Model definition does not contain parts.',
	sqlPartDecodeFailed: 'Semantic Model SQL part payload could not be decoded.',
	readExpressionsFailed: 'Failed to read Semantic Model expressions.tmdl',
};

export const SAMPLE_DATA_MESSAGES = {
	checkPresenceFailed: 'Failed to check sample data presence',
};

export const POST_DEPLOYMENT_LOADING_STEPS = {
	readOriginalWorkspace: 'Reading original workspace details…',
	readCurrentWorkspace: 'Reading current workspace details…',
	readGoldSqlEndpoint: 'Reading Gold lakehouse SQL endpoint…',
	readSemanticModelSqlEndpoint: 'Reading Semantic Model SQL endpoint…',
	checkSampleDataPresence: 'Checking sample data presence…',
	loaded: 'Workspace data loaded.',
};

export const POST_DEPLOYMENT_RUN_MESSAGES = {
	preparing: 'Preparing post-deployment setup…',
	detectedMove: 'Detected workspace move. Preparing setup steps…',
	saveMoveMetadata: 'Saving workspace move metadata…',
	resolveItems: 'Resolving deployed items in current workspace…',
	checkSqlAlignment: 'Checking Semantic Model SQL endpoint alignment…',
	updateSqlEndpoint: 'Updating Semantic Model SQL endpoint…',
	reinstallSampleData: 'Re-installing sample data to Silver lakehouse…',
	loadSampleDataList: 'Loading sample data file list…',
	finalizing: 'Finalizing setup…',
};

export const POST_DEPLOYMENT_SUMMARY_MESSAGES = {
	moveSetupStarted: 'Detected workspace change and started post-deployment setup.',
	moveMetadataUpdated: 'Updated installer item with workspace move metadata.',
	resolvedItems: 'Resolved key items in the current workspace.',
	sqlAlreadyAligned: 'Semantic Model SQL endpoint is already aligned with Gold lakehouse. Manual SQL rewrite was skipped.',
	sqlUpdated: 'Updated Semantic Model SQL endpoint to point to the current Gold lakehouse.',
};

export const buildUnresolvedItemsWarningMessage = (items: string[]): string => {
	return `Warning: could not resolve in current workspace: ${items.join(', ')}.`;
};

export const buildSampleDataFileProgressMessage = (fileName: string, current: number, total: number): string => {
	return `Installing ${fileName} (${current}/${total})…`;
};

export const buildSqlExpressionPartNotFoundMessage = (paths: string[]): string => {
	const available = paths.filter(Boolean).join(', ');
	return `SQL expression part was not found in Semantic Model definition (available parts: ${available}).`;
};

export const toErrorMessage = (error: unknown): string => {
	if (!error) return 'Unknown error';
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;
	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
};

export const buildSampleDataInstalledMessage = (count: number): string => {
	return `Installed ${count} sample data file(s) into the Silver lakehouse.`;
};

export const buildSampleDataInstallFailedMessage = (count: number, files: string[]): string => {
	return `Warning: failed to install ${count} sample data file(s): ${files.join(', ')}.`;
};
