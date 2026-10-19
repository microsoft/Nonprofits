import type { FC } from 'react';

import { Text } from '@fluentui/react-components';

import { Input } from '@src/components/form';

import { StepSection } from '@nds/DeploymentWizard/common';
import { useDeployment } from '@nds/DeploymentWizard/contexts/DeploymentContext';
import { useWizard } from '@nds/DeploymentWizard/contexts/WizardContext';
import { useFolderPath } from '@nds/DeploymentWizard/hooks/useFolderPath';
import { getIcon } from '@nds/helpers/UIHelper';

import { configurationLabels } from '../../Configuration.model';
import { useBasicConfigurationStyles } from './BasicConfiguration.styles';

export const BasicConfiguration: FC = () => {
	const styles = useBasicConfigurationStyles();
	const wizard = useWizard();
	const deploymentConfig = useDeployment();

	// Get validation messages from wizard context
	const { configurationValidation } = wizard.state;

	// Get values from deployment context
	const { deploymentName, selectedLocation } = deploymentConfig.state;
	const { setDeploymentName } = deploymentConfig.actions;

	// Use the custom hook to build the folder path
	const displayLocation = useFolderPath(selectedLocation);
	const labels = configurationLabels.basicConfiguration;

	return (
		<StepSection title={labels.sectionTitle}>
			<div>
				{/* Deployment Name Field */}
				<Input
					label={labels.deploymentName.label}
					value={deploymentName || ''}
					onChange={setDeploymentName}
					validationMessage={configurationValidation.deploymentName}
					validationState={configurationValidation.deploymentName ? 'error' : 'none'}
					placeholder={labels.deploymentName.placeholder}
					required
					aria-describedby="name-help-text"
				/>
				<Text className={styles.helpText} id="name-help-text" role="note">
					{labels.deploymentName.helpText}
				</Text>
			</div>
			<div>
				<Input
					disabled
					label={labels.location.label}
					value={displayLocation}
					placeholder={labels.location.placeholder}
					required
					aria-describedby="location-help-text"
					icon={getIcon('group-workspace-20', 20, 20, styles.locationIcon)}
				/>
				<Text className={styles.helpText} id="location-help-text" role="note">
					{labels.location.helpText}
				</Text>
			</div>
		</StepSection>
	);
};
