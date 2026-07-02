import type React from 'react';

import type { WorkloadClientAPI } from '@ms-fabric/workload-client';

export interface FabricContextValue {
	workloadClient: WorkloadClientAPI;
	openExternalLink: (url: string) => Promise<void>;
	openFabricRelativeLink: (path: string) => Promise<void>;
	getFabricRelativeLink: (path: string) => string;
	hostOrigin: string;
	hostExperience: string | null;
}

export interface FabricProviderProps {
	children: React.ReactNode;
	workloadClient: WorkloadClientAPI;
}
