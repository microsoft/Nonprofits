import type { FC } from 'react';

import { MessageBar } from '@src/components/feedback';

import { StepSection } from '@nds/DeploymentWizard/common';

import { useFinishStepStyles } from '../../Finish.styles';
import { ActionCard } from '../shared/ActionCard';
import type { NextStepsSectionProps } from './NextStepsSection.types';

export const NextStepsSection: FC<NextStepsSectionProps> = ({ nextSteps, labels }) => {
	const styles = useFinishStepStyles();

	return (
		<StepSection title={labels?.sectionTitle ?? 'Next steps'}>
			{labels?.refreshMessage && <MessageBar title={labels.refreshMessage} />}
			<ul className={styles.nextStepsCardGrid} role="list" aria-label={labels?.ariaLabel}>
				{nextSteps.map((step, index) => (
					<li key={index} className={styles.listItem}>
						<ActionCard
							icon={step.icon}
							title={step.title}
							description={step.description}
							buttonText={step.buttonText}
							link={step.link}
						/>
					</li>
				))}
			</ul>
		</StepSection>
	);
};
