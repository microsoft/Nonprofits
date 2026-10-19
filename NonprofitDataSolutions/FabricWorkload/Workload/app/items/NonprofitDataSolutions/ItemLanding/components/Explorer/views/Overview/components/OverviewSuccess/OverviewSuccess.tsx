import { Text } from '@fluentui/react-components';

import { ResourcesSection } from '../shared/ResourcesSection';
import {
	overviewSuccessCommonLabels,
	quickStartData,
	quickStartSteps,
	resources,
} from './OverviewSuccess.common.model';
import { overviewSuccessLabels } from './OverviewSuccess.fundraising.model';
import { useOverviewStyles } from './OverviewSuccess.styles';
import type { OverviewSuccessProps } from './OverviewSuccess.types';
import { QuickStartSection } from './components/QuickStartSection';

/**
 * Success version of the Overview page - shown when deployment was successful
 */
export const OverviewSuccess: React.FC<OverviewSuccessProps> = () => {
	const styles = useOverviewStyles();

	return (
		<>
			{/* Welcome Text */}
			<section aria-labelledby={overviewSuccessLabels.welcomeSectionId}>
				<Text as="p" className={styles.welcomeText} id={overviewSuccessLabels.welcomeSectionId}>
					{overviewSuccessLabels.welcomeText}
				</Text>
			</section>

			{/* Quick Start Guide */}
			<QuickStartSection data={quickStartData} stepsData={quickStartSteps} />

			{/* Resources Section */}
			<ResourcesSection title={overviewSuccessCommonLabels.resourcesTitle} resources={resources} />
		</>
	);
};
