import { Badge, mergeClasses } from '@fluentui/react-components';
import { CheckmarkCircle20Filled, DismissCircle20Filled, Pause20Filled, Warning20Filled } from '@fluentui/react-icons';

import { DeploymentStatus } from '@originalInstaller/PackageInstallerItemModel';

import { useDeploymentStatusBadgeStyles } from './DeploymentStatusBadge.styles';
import { DeploymentStatusBadgeProps } from './DeploymentStatusBadge.types';

export const DeploymentStatusBadge: React.FC<DeploymentStatusBadgeProps> = ({ status, className }) => {
	const styles = useDeploymentStatusBadgeStyles();

	const getStatusBadge = (status: DeploymentStatus) => {
		switch (status) {
			case DeploymentStatus.Succeeded:
				return (
					<Badge
						appearance="ghost"
						icon={<CheckmarkCircle20Filled className={styles.succeededColor} />}
						className={mergeClasses(styles.statusBadge, className)}
					>
						Succeeded
					</Badge>
				);
			case DeploymentStatus.Failed:
			case DeploymentStatus.InProgress:
				return (
					<Badge
						appearance="ghost"
						icon={<DismissCircle20Filled className={styles.failedColor} />}
						className={mergeClasses(styles.statusBadge, styles.failedColor, className)}
					>
						Failed
					</Badge>
				);
			case DeploymentStatus.Pending:
				return (
					<Badge
						appearance="ghost"
						icon={<Pause20Filled className={styles.pendingColor} />}
						className={mergeClasses(styles.statusBadge, className)}
					>
						Pending
					</Badge>
				);
			case DeploymentStatus.Cancelled:
				return (
					<Badge
						appearance="ghost"
						icon={<Warning20Filled className={styles.cancelledColor} />}
						className={mergeClasses(styles.statusBadge, className)}
					>
						Cancelled
					</Badge>
				);
			default:
				return (
					<Badge appearance="ghost" className={mergeClasses(styles.statusBadge, className)}>
						Unknown
					</Badge>
				);
		}
	};

	return getStatusBadge(status);
};
