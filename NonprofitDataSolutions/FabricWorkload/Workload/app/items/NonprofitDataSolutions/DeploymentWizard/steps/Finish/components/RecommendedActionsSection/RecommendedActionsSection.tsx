import React from 'react';

import { StepSection } from '@nds/DeploymentWizard/common';

import { useFinishStepStyles } from '../../Finish.styles';
import { ActionCard } from '../shared/ActionCard';
import type { RecommendedActionsSectionProps } from './RecommendedActionsSection.types';

export const RecommendedActionsSection: React.FC<RecommendedActionsSectionProps> = ({ actions, labels }) => {
	const styles = useFinishStepStyles();

	return (
		<StepSection title={labels?.sectionTitle ?? 'Recommended actions'}>
			<ul className={styles.nextStepsCardGrid} role="list" aria-label={labels?.ariaLabel}>
				{actions.map((action, index) => (
					<li key={index} className={styles.listItem}>
						<ActionCard
							icon={action.icon}
							title={action.title}
							description={action.description}
							buttonText={action.buttonText}
						/>
					</li>
				))}
			</ul>
		</StepSection>
	);
};
