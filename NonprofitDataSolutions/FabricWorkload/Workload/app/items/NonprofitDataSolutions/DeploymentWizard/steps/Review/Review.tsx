import type { FC } from 'react';

import { Body1, Caption1, Title1 } from '@fluentui/react-components';

import { useDeployment } from '../../contexts/DeploymentContext';
import { useFolderPath } from '../../hooks/useFolderPath';
import { reviewLabels } from './Review.model';
import { useStyles } from './Review.styles';
import type { ReviewProps } from './Review.types';
import { PackageItemsTable } from './components/PackageItemsTable';

export const Review: FC<ReviewProps> = () => {
	const styles = useStyles();
	const deployment = useDeployment();
	const { modifiedPackage, itemStatuses, selectedLocation, deploymentName, duplicateNames } = deployment.state;
	const { items = [] } = modifiedPackage || {};
	const displayLocation = useFolderPath(selectedLocation);

	return (
		<div className="deployment-items">
			<Title1 as="h2" className={styles.heading}>
				{reviewLabels.heading}
			</Title1>
			<Caption1>{reviewLabels.solutionComponents}</Caption1>
			<div className={styles.summary}>
				<Body1 block>
					<span className={styles.summaryLabel}>{reviewLabels.location}:</span>
					<span className={styles.summaryValue}>{displayLocation || reviewLabels.notSet}</span>
				</Body1>
			</div>
			{items && items.length > 0 ? (
				<PackageItemsTable
					items={items}
					itemStatuses={itemStatuses}
					namePrefix={deploymentName}
					duplicateNames={duplicateNames}
				/>
			) : (
				<Body1 italic>{reviewLabels.noItems}</Body1>
			)}
		</div>
	);
};
