import React from 'react';

import { Text } from '@fluentui/react-components';
import { Shield24Regular } from '@fluentui/react-icons';

import { usePrerequisitesSectionStyles } from './PrerequisitesSection.styles';
import type { PrerequisitesSectionProps } from './PrerequisitesSection.types';

export const PrerequisitesSection: React.FC<PrerequisitesSectionProps> = ({ prerequisites, ariaLabels }) => {
	const styles = usePrerequisitesSectionStyles();

	return (
		<ul className={styles.prerequisitesSection} aria-label={ariaLabels?.list}>
			{prerequisites.map((prereq, index) => (
				<li
					key={index}
					className={styles.prerequisiteItem}
					aria-labelledby={`prereq-title-${index}`}
					aria-describedby={`prereq-description-${index}`}
				>
					<Shield24Regular
						className={styles.prerequisiteIcon}
						aria-hidden="true"
						role="img"
						aria-label={ariaLabels?.requirement}
					/>
					<div className={styles.prerequisiteContent}>
						<Text as="h4" id={`prereq-title-${index}`} className={styles.prerequisiteTitle}>
							{prereq.requirement}
						</Text>
						<Text as="p" id={`prereq-description-${index}`} className={styles.prerequisiteDescription}>
							{prereq.description}
						</Text>
					</div>
				</li>
			))}
		</ul>
	);
};
