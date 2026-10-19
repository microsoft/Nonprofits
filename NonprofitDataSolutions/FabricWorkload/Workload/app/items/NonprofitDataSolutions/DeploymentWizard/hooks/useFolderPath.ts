import { useCallback, useEffect, useState } from 'react';

import { useDeployment } from '../contexts/DeploymentContext';
import { useWorkspaceData } from '../contexts/WorkspaceDataContext';

/**
 * Custom hook to build recursive folder paths with workspace name prefix
 */
export const useFolderPath = (selectedLocation?: string) => {
	const workspaceData = useWorkspaceData();
	const deployment = useDeployment();
	const [displayLocation, setDisplayLocation] = useState<string>('');

	const buildFolderPath = useCallback(
		(folderId: string, accumulatedPath: string = ''): string => {
			if (!folderId) return accumulatedPath;

			const folder = workspaceData.state.folders.find((f) => f.value === folderId);
			if (!folder) return accumulatedPath;

			const currentPath = accumulatedPath ? `${folder.label}/${accumulatedPath}` : folder.label;
			return folder.parentFolderId ? buildFolderPath(folder.parentFolderId, currentPath) : currentPath;
		},
		[workspaceData.state.folders],
	);

	useEffect(() => {
		const workspaceName = workspaceData.state.currentWorkspace?.displayName;
		const destinationFolderName = deployment.state.deploymentName;

		if (!workspaceName) {
			return;
		}

		// Build path components array for consistent formatting
		const pathComponents: string[] = [workspaceName];

		// Add folder path if location is selected and folders exist
		const hasLocation = selectedLocation && workspaceData.state.folders?.length;
		if (hasLocation) {
			const folderPath = buildFolderPath(selectedLocation);
			if (folderPath) {
				pathComponents.push(folderPath);
			}
		}

		// Always append destination folder name if available
		if (destinationFolderName) {
			pathComponents.push(destinationFolderName);
		}

		// Join all components with consistent delimiter
		const fullPath = pathComponents.join(' > ');
		setDisplayLocation(fullPath);
	}, [
		selectedLocation,
		workspaceData.state.folders,
		workspaceData.state.currentWorkspace?.displayName,
		deployment.state.deploymentName,
		buildFolderPath,
	]);

	return displayLocation;
};
