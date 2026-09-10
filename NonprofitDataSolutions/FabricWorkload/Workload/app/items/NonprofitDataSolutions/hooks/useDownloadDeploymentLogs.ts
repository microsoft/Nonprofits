import { useCallback } from 'react';

import { useDownloadJson } from '@src/hooks/useDownloadJson';

import { PackageDeployment } from '@originalInstaller/PackageInstallerItemModel';

export const useDownloadDeploymentLogs = () => {
	const downloadJson = useDownloadJson({ indent: 4 });

	const downloadDeploymentLogs = useCallback(
		(deployment: PackageDeployment) => {
			const fileName = `deployment-${deployment.id || 'logs'}-${new Date().toISOString().split('T')[0]}.json`;
			downloadJson(deployment, fileName);
		},
		[downloadJson],
	);

	return downloadDeploymentLogs;
};
