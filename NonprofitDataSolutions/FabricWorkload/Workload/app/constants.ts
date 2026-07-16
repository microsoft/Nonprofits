export const EnvironmentConstants = Object.freeze({
	FabricApiBaseUrl:
		process.env.FABRIC_API_BASE_URL && process.env.FABRIC_API_BASE_URL.trim() !== ''
			? process.env.FABRIC_API_BASE_URL
			: 'https://api.fabric.microsoft.com',
	OneLakeDFSBaseUrl:
		process.env.ONE_LAKE_DFS_BASE_URL && process.env.ONE_LAKE_DFS_BASE_URL.trim() !== ''
			? process.env.ONE_LAKE_DFS_BASE_URL
			: 'https://onelake.dfs.fabric.microsoft.com',
});
