import { ItemWithDefinition } from '@controller/ItemCRUDController';

import {
	DeploymentType,
	Package,
	PackageDeployment,
	PackageInstallerItemDefinition,
} from '../PackageInstallerItemModel';
import { PackageInstallerContext } from '../package/PackageInstallerContext';
import { DeploymentStrategy } from './BaseDeploymentStrategy';
import { DeploymentEventHandler } from './DeploymentEventHandler';
import { UXDeploymentStrategy } from './UXDeploymentStrategy';

// Deployment Factory
export class DeploymentStrategyFactory {
	static createStrategy(
		context: PackageInstallerContext,
		item: ItemWithDefinition<PackageInstallerItemDefinition>,
		pack: Package,
		deployment: PackageDeployment,
		eventHandler?: DeploymentEventHandler,
	): DeploymentStrategy {
		logger.debug(
			`Creating deployment strategy for type: ${pack.deploymentConfig.type}, package: ${pack.id}, deployment: ${deployment.id}`,
		);
		switch (pack.deploymentConfig.type) {
			case DeploymentType.UX:
				return new UXDeploymentStrategy(context, item, pack, deployment, eventHandler);
			default:
				throw new Error(`Unsupported deployment type: ${pack.deploymentConfig.type}`);
		}
	}
}
