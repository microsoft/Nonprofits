import { FC } from 'react';

import { Badge, mergeClasses } from '@fluentui/react-components';
import { CheckmarkCircle20Filled, CircleOff20Filled, DismissCircle20Filled } from '@fluentui/react-icons';

import { ModuleInstallationStatus } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

import { useModuleStatusBadgeStyles } from './ModuleStatusBadge.styles';
import type { ModuleStatusBadgeProps } from './ModuleStatusBadge.types';

export const ModuleStatusBadge: FC<ModuleStatusBadgeProps> = ({ status, className }) => {
	const styles = useModuleStatusBadgeStyles();

	const getStatusBadge = (status?: ModuleInstallationStatus) => {
		switch (status) {
			case ModuleInstallationStatus.Succeeded:
				return (
					<Badge
						appearance="ghost"
						icon={<CheckmarkCircle20Filled className={styles.succeededColor} />}
						className={mergeClasses(styles.statusBadge, className)}
					>
						Succeeded
					</Badge>
				);
			case ModuleInstallationStatus.Failed:
				return (
					<Badge
						appearance="ghost"
						icon={<DismissCircle20Filled className={styles.failedColor} />}
						className={mergeClasses(styles.statusBadge, styles.failedColor, className)}
					>
						Failed
					</Badge>
				);
			case ModuleInstallationStatus.Skipped:
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
				return null;
		}
	};

	return getStatusBadge(status);
};
