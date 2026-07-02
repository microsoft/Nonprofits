import React from 'react';

import { Text } from '@fluentui/react-components';
import { CheckmarkCircle24Regular, DismissCircle24Regular } from '@fluentui/react-icons';

import { useFinalMessageStyles } from './FinalMessage.styles';
import type { FinalMessageProps } from './FinalMessage.types';

export const FinalMessage: React.FC<FinalMessageProps> = ({ type, title, description }) => {
	const styles = useFinalMessageStyles();
	const isSuccess = type === 'success';

	const Icon = isSuccess ? CheckmarkCircle24Regular : DismissCircle24Regular;
	const containerClass = isSuccess ? styles.successContainer : styles.errorContainer;
	const iconClass = isSuccess ? styles.successIcon : styles.errorIcon;

	return (
		<div
			className={containerClass}
			role={isSuccess ? 'status' : 'alert'}
			aria-live={isSuccess ? 'polite' : 'assertive'}
		>
			<Icon className={iconClass} aria-hidden="true" />
			<div className={styles.content}>
				<Text as="h2" className={styles.title}>
					{title}
				</Text>
				<Text className={styles.description}>{description}</Text>
			</div>
		</div>
	);
};
