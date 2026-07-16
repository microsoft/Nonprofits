import { FC } from 'react';

import { Text } from '@fluentui/react-components';

import { ResourceCard } from '../ResourceCard';
import { useResourcesSectionStyles } from './ResourcesSection.styles';
import type { ResourcesSectionProps } from './ResourcesSection.types';

export const ResourcesSection: FC<ResourcesSectionProps> = ({ title, resources }) => {
	const styles = useResourcesSectionStyles();

	return (
		<section className={styles.resourcesSection} aria-labelledby="resources-title">
			<Text as="h2" className={styles.sectionTitle} id="resources-title">
				{title}
			</Text>
			<div
				className={styles.resourcesGrid}
				role="list"
				aria-label={`${resources.length} resource cards available`}
			>
				{resources.map((resource) => (
					<ResourceCard key={resource.id} data={resource} />
				))}
			</div>
		</section>
	);
};
