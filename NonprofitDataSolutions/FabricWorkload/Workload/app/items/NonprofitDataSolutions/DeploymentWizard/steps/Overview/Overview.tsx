import { FC } from 'react';

// Components
import { InfoCard } from '@src/components/feedback';

import { StepSection } from '../../common';
// Helpers
import { deploymentItems, features, headerData, overviewLabels, prerequisites } from './Overview.model';
// Styles
import { useOverviewStyles } from './Overview.styles';
import { DeploymentIncludes, OverviewHeader, PrerequisitesSection, SolutionFeatures } from './components';

export const Overview: FC = () => {
	const styles = useOverviewStyles();

	return (
		<main className={styles.container} role="main" aria-labelledby="overview-title">
			<OverviewHeader data={headerData} />

			<StepSection title={overviewLabels.solutionFeatures.sectionTitle}>
				<SolutionFeatures features={features} ariaLabel={overviewLabels.solutionFeatures.ariaLabel} />
			</StepSection>

			<StepSection title={overviewLabels.deploymentIncludes.sectionTitle}>
				<DeploymentIncludes
					items={deploymentItems}
					ariaLabels={{
						list: overviewLabels.deploymentIncludes.ariaLabel,
						includedItem: overviewLabels.deploymentIncludes.includedItemLabel,
					}}
				/>
			</StepSection>

			<StepSection title={overviewLabels.prerequisites.sectionTitle}>
				<PrerequisitesSection
					prerequisites={prerequisites}
					ariaLabels={{
						list: overviewLabels.prerequisites.ariaLabel,
						requirement: overviewLabels.prerequisites.requirementLabel,
					}}
				/>
			</StepSection>

			<InfoCard
				title={overviewLabels.estimatedTime.title}
				description={overviewLabels.estimatedTime.description}
			/>
		</main>
	);
};

export default Overview;
