import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { ItemReference } from '@controller/ItemCRUDController';

import { FabricPlatformAPIClient } from '@clients/FabricPlatformAPIClient';
import { OneLakeClientItemWrapper } from '@clients/OneLakeClientItemWrapper';

import { Package } from '../PackageInstallerItemModel';
import { InterceptorFactory } from './InterceptorFactory';
import { PackageRegistry } from './PackageRegistry';

export class PackageInstallerContext {
	workloadClientAPI: WorkloadClientAPI;
	packageRegistry: PackageRegistry;
	fabricPlatformAPIClient: FabricPlatformAPIClient;
	interceptorFactory: InterceptorFactory;

	constructor(workloadClientAPI: WorkloadClientAPI) {
		this.workloadClientAPI = workloadClientAPI;
		this.packageRegistry = new PackageRegistry();
		this.fabricPlatformAPIClient = new FabricPlatformAPIClient(workloadClientAPI);
	}

	getPackage(typeId: string): Package | undefined {
		return this.packageRegistry.getPackage(typeId);
	}

	getOneLakeClientItemWrapper(item: ItemReference): OneLakeClientItemWrapper {
		return this.fabricPlatformAPIClient.oneLake.createItemWrapper(item);
	}
}
