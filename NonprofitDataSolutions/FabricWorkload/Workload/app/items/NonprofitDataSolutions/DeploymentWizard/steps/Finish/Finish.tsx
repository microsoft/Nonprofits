import { type FC, useMemo } from 'react';

import { DeploymentStatus } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

import { CreatedItemsTable } from '../../../common/CreatedItemsTable';
import { useDeployment } from '../../contexts/DeploymentContext';
import { documentationLinks, errorMessage, finishLabels, nextSteps, recommendedActions, successMessage } from './Finish.model';
import { useFinishStepStyles } from './Finish.styles';
import { DocumentationSection } from './components/DocumentationSection/DocumentationSection';
import { ErrorDetailsCard } from './components/ErrorDetailsCard/ErrorDetailsCard';
import { FinalMessage } from './components/FinalMessage/FinalMessage';
import { NextStepsSection } from './components/NextStepsSection/NextStepsSection';
import { RecommendedActionsSection } from './components/RecommendedActionsSection/RecommendedActionsSection';

export const Finish: FC = () => {
	const styles = useFinishStepStyles();
	const { state } = useDeployment();

	const isDeploymentFailed = state.packageDeployment?.status === DeploymentStatus.Failed;
	const finalMessage = isDeploymentFailed ? errorMessage : successMessage;
	const createdItems = useMemo(
		() => state.packageDeployment?.deployedItems || [],
		[state.packageDeployment?.deployedItems],
	);

	return (
		<div className={styles.finishStepContainer}>
			<FinalMessage {...finalMessage} />

			{isDeploymentFailed ? (
				<>
					<ErrorDetailsCard errorDetails={state.packageDeployment?.errorDetails} />
					<RecommendedActionsSection
						actions={recommendedActions}
						labels={finishLabels.recommendedActions}
					/>
				</>
			) : (
				<>
					<NextStepsSection nextSteps={nextSteps} labels={finishLabels.nextSteps} />
					<DocumentationSection links={documentationLinks} labels={finishLabels.documentation} />
				</>
			)}

			<CreatedItemsTable items={createdItems} initiallyExpanded={isDeploymentFailed} openLinksInNewTab />
		</div>
	);
};
