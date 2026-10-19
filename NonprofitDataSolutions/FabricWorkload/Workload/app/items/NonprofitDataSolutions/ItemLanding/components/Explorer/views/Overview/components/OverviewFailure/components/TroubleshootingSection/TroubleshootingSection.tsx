import { FC } from 'react';

import { Link, Text } from '@fluentui/react-components';

import { useExternalLink } from '@src/hooks/useExternalLink';
import { useWorkloadItemContext } from '@src/items/NonprofitDataSolutions/ItemLanding/context/WorkloadItemContext';

import { getTroubleshootingData } from './TroubleshootingSection.model';
import { useTroubleshootingSectionStyles } from './TroubleshootingSection.styles';

const TROUBLESHOOTING_GUIDE_URL = 'https://aka.ms/nds/docs/tsg';

const TroubleshootingLink: FC = () => {
	const { onClick, handleKeyDown, url } = useExternalLink(TROUBLESHOOTING_GUIDE_URL);

	return (
		<Link href={url} onClick={onClick} onKeyDown={handleKeyDown}>
			troubleshooting guide
		</Link>
	);
};

export const TroubleshootingSection: FC = () => {
	const styles = useTroubleshootingSectionStyles();
	const { config } = useWorkloadItemContext();

	const TROUBLESHOOTING_DATA = getTroubleshootingData(<TroubleshootingLink />, config.displayName);

	return (
		<section className={styles.troubleshootingSection} aria-labelledby="troubleshooting-title">
			<Text as="h2" className={styles.sectionTitle} id="troubleshooting-title">
				{TROUBLESHOOTING_DATA.title}
			</Text>

			<div className={styles.stepsContainer}>
				{TROUBLESHOOTING_DATA.steps.map((step, index) => (
					<div key={step.id} className={styles.stepItem}>
						<div className={styles.stepItemNumber}>{step.number}</div>
						<Text as="h3" className={styles.stepTitle}>
							{step.title}
						</Text>
					</div>
				))}
			</div>
		</section>
	);
};
