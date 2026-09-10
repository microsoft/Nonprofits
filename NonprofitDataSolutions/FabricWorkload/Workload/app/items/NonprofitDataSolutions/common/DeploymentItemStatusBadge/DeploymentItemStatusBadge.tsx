import { Badge, mergeClasses } from '@fluentui/react-components';
import { CheckmarkCircle20Filled, CircleOff20Filled, DismissCircle20Filled } from '@fluentui/react-icons';

import { DeploymentItemStatus } from '@originalInstaller/PackageInstallerItemModel';

import { useDeploymentItemStatusBadgeStyles } from './DeploymentItemStatusBadge.styles';
import { DeploymentItemStatusBadgeProps } from './DeploymentItemStatusBadge.types';

export const DeploymentItemStatusBadge: React.FC<DeploymentItemStatusBadgeProps> = ({ status, className }) => {
	const styles = useDeploymentItemStatusBadgeStyles();

	const getStatusBadge = (status: DeploymentItemStatus) => {
		switch (status) {
			case DeploymentItemStatus.Succeeded:
				return (
					<Badge
						appearance="ghost"
						icon={<CheckmarkCircle20Filled className={styles.succeededColor} />}
						className={mergeClasses(styles.statusBadge, className)}
					>
						Created
					</Badge>
				);
			case DeploymentItemStatus.Failed:
				return (
					<Badge
						appearance="ghost"
						icon={<DismissCircle20Filled className={styles.failedColor} />}
						className={mergeClasses(styles.statusBadge, styles.failedColor, className)}
					>
						Failed
					</Badge>
				);
			case DeploymentItemStatus.Skipped:
				return (
					<Badge
						appearance="ghost"
						icon={<CircleOff20Filled className={styles.skippedColor} />}
						className={mergeClasses(styles.statusBadge, className)}
					>
						Skipped
					</Badge>
				);
			default:
				return (
					<Badge appearance="ghost" className={mergeClasses(styles.statusBadge, className)}>
						{status}
					</Badge>
				);
		}
	};

	return getStatusBadge(status);
};
