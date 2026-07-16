import React, { useId } from 'react';

import { Button, Card, Text, mergeClasses } from '@fluentui/react-components';

import { useExternalLink } from '@src/hooks/useExternalLink';

import { useActionCardStyles } from './ActionCard.styles';
import type { ActionCardProps } from './ActionCard.types';

export const ActionCard: React.FC<ActionCardProps> = ({ icon: Icon, title, description, buttonText, link }) => {
	const styles = useActionCardStyles();
	const descriptionId = useId();
	const hasAction = Boolean(link);
	const externalLink = useExternalLink(link ?? '');

	return (
		<Card
			className={mergeClasses(styles.card, hasAction && styles.cardActionable)}
			onClick={hasAction ? externalLink.onClick : undefined}
			onKeyDown={hasAction ? externalLink.handleKeyDown : undefined}
			tabIndex={hasAction ? 0 : -1}
			role={hasAction ? 'button' : undefined}
			aria-describedby={hasAction ? descriptionId : undefined}
		>
			<div className={styles.cardContent}>
				<div className={styles.iconWrapper}>
					<Icon className={styles.icon} aria-hidden="true" />
				</div>
				<div className={styles.textContent}>
					<Text className={styles.title}>{title}</Text>
					<Text className={styles.description} id={hasAction ? descriptionId : undefined}>
						{description}
					</Text>
					{hasAction && buttonText && (
						<Button appearance="secondary" size="small" className={styles.button}>
							{buttonText}
						</Button>
					)}
				</div>
			</div>
		</Card>
	);
};
