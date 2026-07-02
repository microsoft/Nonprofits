import React from 'react';

import { Text } from '@fluentui/react-components';
import { CheckmarkCircle20Regular } from '@fluentui/react-icons';

import { useDeploymentIncludesStyles } from './DeploymentIncludes.styles';
import type { DeploymentIncludesProps } from './DeploymentIncludes.types';

export const DeploymentIncludes: React.FC<DeploymentIncludesProps> = ({ items, ariaLabels }) => {
	const styles = useDeploymentIncludesStyles();

	return (
		<div className={styles.deploymentCard}>
			<ul className={styles.deploymentGrid} role="list" aria-label={ariaLabels?.list}>
				{items.map((item, index) => (
					<li key={index} className={styles.deploymentItem}>
						<CheckmarkCircle20Regular
							className={styles.checkIcon}
							aria-hidden="true"
							role="img"
							aria-label={ariaLabels?.includedItem}
						/>
						<Text as="span" className={styles.deploymentText}>
							{item}
						</Text>
					</li>
				))}
			</ul>
		</div>
	);
};
