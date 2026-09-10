import React from 'react';

import { ProgressBar, Text } from '@fluentui/react-components';
import { useTranslation } from 'react-i18next';

import { Announce } from '@src/components/accessibility';

import { useStyles } from './DeploymentProgressBar.styles';
import type { DeploymentProgressBarProps } from './DeploymentProgressBar.types';

export const DeploymentProgressBar: React.FC<DeploymentProgressBarProps> = ({ deploymentProgress }) => {
	const { t } = useTranslation();
	const styles = useStyles();

	const roundedProgress = Math.round(deploymentProgress.progress);
	const progressLabel = `${t('Deploying')}: ${roundedProgress}% complete. ${deploymentProgress.currentStep}`;

	return (
		<>
			{/* Live region for screen reader announcements */}
			<Announce ariaLive="polite">{progressLabel}</Announce>
			{/* Visual progress bar */}
			<div className={styles.progressBar}>
				<Text className={styles.progressTitle}>{t('Deploying')}...</Text>
				<ProgressBar
					value={roundedProgress / 100}
					max={1}
					className={styles.progressBarElement}
					aria-hidden="true"
				/>
				<Text className={styles.progressStep}>{deploymentProgress.currentStep}</Text>
			</div>
		</>
	);
};
