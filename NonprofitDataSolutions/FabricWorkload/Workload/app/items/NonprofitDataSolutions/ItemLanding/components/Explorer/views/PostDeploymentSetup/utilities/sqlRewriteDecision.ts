import type { SqlDatabaseArgs } from '../PostDeploymentSetup.types';

export const isSqlAligned = (currentSql?: SqlDatabaseArgs, targetSql?: SqlDatabaseArgs): boolean => {
	if (!currentSql || !targetSql) return false;

	// If a field is present in currentSql it must match the target
	if (currentSql.server && currentSql.server !== targetSql.server) return false;
	if (currentSql.endpointId && currentSql.endpointId !== targetSql.endpointId) return false;

	// At least one field must be present and matching
	return !!(currentSql.server || currentSql.endpointId);
};

export const shouldRewriteSqlEndpoint = (options: {
	currentSql?: SqlDatabaseArgs;
	targetSql?: SqlDatabaseArgs;
	forceRewrite: boolean;
}): boolean => {
	if (options.forceRewrite) {
		return true;
	}

	return !isSqlAligned(options.currentSql, options.targetSql);
};
