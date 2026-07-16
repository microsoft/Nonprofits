import React from 'react';

import { ToolbarButton } from '@fluentui/react-components';
import { Add24Regular, Settings24Regular } from '@fluentui/react-icons';
import { Toolbar, ToolbarDivider } from '@fluentui/react-toolbar';

import { useWorkloadItemContext } from '@nds/ItemLanding/context/WorkloadItemContext';

import { getRibbonLabels } from './Ribbon.model';
import { useRibbonStyles } from './Ribbon.styles';

export const Ribbon: React.FC = () => {
	const { actions, state, config } = useWorkloadItemContext();
	const styles = useRibbonStyles();
	const labels = getRibbonLabels(config.displayName);

	return (
		<Toolbar className={styles.toolbar} aria-label={labels.toolbarAriaLabel}>
			<ToolbarButton
				aria-label={labels.settingsButtonAriaLabel}
				icon={<Settings24Regular />}
				onClick={() => actions?.openItemSettings()}
				appearance="subtle"
			/>
			{state.enableNewDeployment && (
				<>
					<ToolbarDivider className={styles.divider} />
					<ToolbarButton
						aria-label={labels.deploymentButtonAriaLabel}
						icon={<Add24Regular />}
						onClick={() => actions?.openDeploymentWizard()}
						appearance="subtle"
						disabled={!state.enableNewDeployment}
					>
						{labels.deploymentButtonText}
					</ToolbarButton>
				</>
			)}
		</Toolbar>
	);
};
