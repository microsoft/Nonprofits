import React, { createContext, useContext } from 'react';

import { callNavigationOpenInNewBrowserTab } from '@controller/NavigationController';

import type { FabricContextValue, FabricProviderProps } from './FabricContext.types';

// Create context
const FabricContext = createContext<FabricContextValue | undefined>(undefined);

// Provider component
export const FabricProvider: React.FC<FabricProviderProps> = ({ children, workloadClient }) => {
	const hostExperience = React.useMemo(() => {
		const urlParams = new URLSearchParams(window.location.search);
		return urlParams.get('experience');
	}, []);

	const hostOrigin = React.useMemo(() => {
		const extendedClient = workloadClient as unknown as {
			broker?: {
				broker?: {
					getTargetOrigin?: () => string;
				};
			};
		};
		const hostFromClient = extendedClient.broker?.broker?.getTargetOrigin?.();
		if (hostFromClient) {
			return hostFromClient;
		}

		return 'https://app.fabric.microsoft.com';
	}, [workloadClient]);

	const openExternalLink = React.useCallback(
		async (url: string): Promise<void> => {
			return callNavigationOpenInNewBrowserTab(workloadClient, url);
		},
		[workloadClient],
	);

	const getFabricRelativeLink = React.useCallback(
		(path: string): string => {
			return `${hostOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
		},
		[hostOrigin],
	);

	const openFabricRelativeLink = React.useCallback(
		async (path: string): Promise<void> => {
			const url = getFabricRelativeLink(path);
			return callNavigationOpenInNewBrowserTab(workloadClient, url);
		},
		[workloadClient, getFabricRelativeLink],
	);

	const contextValue: FabricContextValue = {
		workloadClient,
		openExternalLink,
		openFabricRelativeLink,
		getFabricRelativeLink,
		hostOrigin,
		hostExperience,
	};

	return <FabricContext.Provider value={contextValue}>{children}</FabricContext.Provider>;
};

// Hook to use the context
export const useFabricContext = (): FabricContextValue => {
	const context = useContext(FabricContext);

	if (!context) {
		throw new Error('useFabricContext hook must be used within a FabricProvider');
	}
	return context;
};

export default FabricContext;
