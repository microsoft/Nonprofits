import type { SqlDatabaseArgs } from '../../PostDeploymentSetup.types';

export interface SqlEndpointCardProps {
	isLoading: boolean;
	currentSql?: SqlDatabaseArgs;
	targetSql?: SqlDatabaseArgs;
}
