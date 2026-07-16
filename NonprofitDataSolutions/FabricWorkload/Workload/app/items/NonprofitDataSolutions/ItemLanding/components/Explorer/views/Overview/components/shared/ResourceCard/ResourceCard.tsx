import { FC } from 'react';

import { Card, Link, Text } from '@fluentui/react-components';

import { useExternalLink } from '@src/hooks/useExternalLink';

import { useResourceCardStyles } from './ResourceCard.styles';
import type { ResourceCardProps } from './ResourceCard.types';

export const ResourceCard: FC<ResourceCardProps> = ({ data }) => {
	const styles = useResourceCardStyles();
	const { onClick, handleKeyDown, url } = useExternalLink(data.link);

	return (
		<div role="listitem">
			<Link
				href={url}
				onClick={onClick}
				onKeyDown={handleKeyDown}
				className={styles.resourceCardLink}
				appearance="subtle"
				aria-label={`Open ${data.title}: ${data.description} (opens in new tab)`}
			>
				<Card className={styles.resourceCard}>
					<div
						className={styles.cardImageContainer}
						style={{
							backgroundImage: `url("${data.imagePath}")`,
						}}
						role="img"
						aria-label={`${data.title} illustration`}
					/>
					<div className={styles.cardContent}>
						<Text as="h3" className={styles.cardTitle}>
							{data.title}
						</Text>
						<Text className={styles.cardDescription}>{data.description}</Text>
					</div>
				</Card>
			</Link>
		</div>
	);
};
