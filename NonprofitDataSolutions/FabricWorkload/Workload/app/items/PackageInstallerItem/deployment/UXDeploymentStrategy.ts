import { DeploymentStatus, PackageDeployment } from '../PackageInstallerItemModel';
import { DeploymentStrategy } from './BaseDeploymentStrategy';
import { DeploymentContext } from './DeploymentContext';

// UX Deployment Strategy
export class UXDeploymentStrategy extends DeploymentStrategy {
	async deployInternal(depContext: DeploymentContext): Promise<PackageDeployment> {
		logger.info(`UX deploy: ${this.item.id} (${this.deployment.id})`);
		try {
			depContext.deployment.job = {
				id: '',
				startTime: new Date(),
				item: {
					id: this.item.id,
					workspaceId: depContext.deployment.workspace.id,
				},
			};

			await this.createItems(depContext.pack, depContext);

			await this.startOnFinishJobs(depContext);
			depContext.deployment.job.endTime = new Date();
			this.deployment = {
				...depContext.deployment,
			};
			return await this.updateDeploymentStatus();
		} catch (error) {
			logger.error('Error in UX deployment:', error);
			depContext.deployment.status = DeploymentStatus.Failed;
			depContext.deployment.job.endTime = new Date();
			depContext.deployment.job.failureReason =
				JSON.stringify(error) === '{}' ? undefined : JSON.stringify(error);
			throw error;
		}
	}

	async updateDeploymentStatus(): Promise<PackageDeployment> {
		return this.checkDeployementState();
	}
}
