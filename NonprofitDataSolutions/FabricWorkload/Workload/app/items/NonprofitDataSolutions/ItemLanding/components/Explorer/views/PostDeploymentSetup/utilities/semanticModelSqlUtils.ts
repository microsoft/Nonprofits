import type { SqlDatabaseArgs } from '../PostDeploymentSetup.types';

/** New format: `Sql.Database("server", "endpointId")` inside a DatabaseQuery expression. */
const SQL_DATABASE_REGEX = /Sql\.Database\("([^"]+)"\s*,\s*"([^"]+)"\)/;

/** Legacy format: `expression SQL_Endpoint = "value"` as a standalone parameter query. */
const LEGACY_SQL_ENDPOINT_REGEX = /expression\s+SQL_Endpoint\s*=\s*"([^"]+)"/;

const normalizePath = (path?: string) => (path ?? '').replace(/\\/g, '/').toLowerCase();

export const extractSqlDatabaseArgs = (tmdlText: string): SqlDatabaseArgs => {
	// New format: Sql.Database("server", "endpointId")
	const dbMatch = tmdlText.match(SQL_DATABASE_REGEX);
	if (dbMatch) return { server: dbMatch[1], endpointId: dbMatch[2] };

	// Legacy format: SQL_Endpoint stores the server connection string (hostname), not the GUID
	const legacyMatch = tmdlText.match(LEGACY_SQL_ENDPOINT_REGEX);
	if (legacyMatch) return { server: legacyMatch[1] };

	return {};
};

export const replaceSqlDatabaseArgs = (tmdlText: string, next: { server: string; endpointId: string }): string => {
	// New format: replace Sql.Database() arguments
	if (SQL_DATABASE_REGEX.test(tmdlText)) {
		return tmdlText.replace(
			/Sql\.Database\("([^"]+)"\s*,\s*"([^"]+)"\)/g,
			`Sql.Database("${next.server}", "${next.endpointId}")`,
		);
	}

	// Legacy format: SQL_Endpoint stores the server connection string
	if (LEGACY_SQL_ENDPOINT_REGEX.test(tmdlText)) {
		return tmdlText.replace(
			/(expression\s+SQL_Endpoint\s*=\s*)"[^"]+"/g,
			`$1"${next.server}"`,
		);
	}

	return tmdlText;
};

export const tryDecodeBase64 = (payload?: string): string | undefined => {
	if (!payload) return undefined;
	try {
		return atob(payload);
	} catch {
		return undefined;
	}
};

const hasSqlExpression = (text: string): boolean =>
	SQL_DATABASE_REGEX.test(text) || LEGACY_SQL_ENDPOINT_REGEX.test(text);

export const findSqlExpressionPart = (parts: any[]): any | undefined => {
	const byName = parts.find((p) => normalizePath(p?.path).endsWith('/expressions.tmdl'));
	if (byName) return byName;

	return parts.find((p) => {
		const path = normalizePath(p?.path);
		if (!path.endsWith('.tmdl')) return false;
		const text = tryDecodeBase64(p?.payload);
		return !!text && hasSqlExpression(text);
	});
};

export const findSqlExpressionPartIndex = (parts: any[]): number => {
	const byName = parts.findIndex((p) => normalizePath(p?.path).endsWith('/expressions.tmdl'));
	if (byName >= 0) return byName;

	return parts.findIndex((p) => {
		const path = normalizePath(p?.path);
		if (!path.endsWith('.tmdl')) return false;
		const text = tryDecodeBase64(p?.payload);
		return !!text && hasSqlExpression(text);
	});
};
