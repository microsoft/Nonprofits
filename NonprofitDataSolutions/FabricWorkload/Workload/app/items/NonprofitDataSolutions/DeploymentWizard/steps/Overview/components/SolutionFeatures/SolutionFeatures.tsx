import React from 'react';

import { Text } from '@fluentui/react-components';

import { useSolutionFeaturesStyles } from './SolutionFeatures.styles';
import type { SolutionFeaturesProps } from './SolutionFeatures.types';

export const SolutionFeatures: React.FC<SolutionFeaturesProps> = ({ features, ariaLabel }) => {
	const styles = useSolutionFeaturesStyles();

	return (
		<ul className={styles.featuresGrid} aria-label={ariaLabel}>
			{features.map((feature, index) => {
				const Icon = feature.icon;
				return (
					<li
						key={index}
						className={styles.featureCard}
						aria-labelledby={`feature-title-${index}`}
						aria-describedby={`feature-description-${index}`}
					>
						<div className={styles.featureIcon} aria-hidden="true">
							<Icon />
						</div>
						<div className={styles.featureContent}>
							<Text as="h3" id={`feature-title-${index}`} className={styles.featureTitle}>
								{feature.title}
							</Text>
							<Text as="p" id={`feature-description-${index}`} className={styles.featureDescription}>
								{feature.description}
							</Text>
						</div>
					</li>
				);
			})}
		</ul>
	);
};
