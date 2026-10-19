import { Text } from '@fluentui/react-components';

import { useWorkloadItemContext } from '@nds/ItemLanding/context/WorkloadItemContext';

import { ResourcesSection } from '../shared/ResourcesSection';
import { helpResources, overviewFailureLabels } from './OverviewFailure.model';
import { useOverviewStyles } from './OverviewFailure.styles';
import type { OverviewFailureProps } from './OverviewFailure.types';
import { TroubleshootingSection } from './components/TroubleshootingSection';

/**
 * Failure version of the Overview page - shown when deployment failed
 */
export const OverviewFailure: React.FC<OverviewFailureProps> = ({ deployment }) => {
	const styles = useOverviewStyles();
	const { config } = useWorkloadItemContext();

	return (
		<>
			{/* Welcome Text */}
			<section aria-labelledby={overviewFailureLabels.welcomeSectionId}>
				<Text as="p" className={styles.welcomeText} id={overviewFailureLabels.welcomeSectionId}>
					{overviewFailureLabels.getWelcomeText(config.displayName)}
				</Text>
			</section>

			{/* Troubleshooting Section */}
			<TroubleshootingSection />

			{/* Help and Support Section */}
			<ResourcesSection title={overviewFailureLabels.helpAndSupportTitle} resources={helpResources} />
		</>
	);
};
