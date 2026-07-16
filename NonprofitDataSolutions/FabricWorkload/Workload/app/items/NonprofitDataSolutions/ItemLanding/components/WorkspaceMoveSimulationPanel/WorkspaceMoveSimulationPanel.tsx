/**
 * @fileoverview Test/Development-only workspace move simulation panel component.
 *
 * This component provides a UI for simulating various workspace move scenarios during testing.
 * It includes controls for toggling simulation states and utilities for metadata inspection.
 * Only rendered when the workspace is in the allowlist and simulation is enabled.
 *
 * **For testing/development purposes only.**
 */

import { type FC, useEffect, useState } from 'react';

import { Button, Checkbox, MessageBar, Text } from '@fluentui/react-components';

import { useFabricContext } from '@src/context/FabricContext';
import { saveItemDefinition } from '@src/controller/ItemCRUDController';
import { useWorkloadItemContext } from '@src/items/NonprofitDataSolutions/ItemLanding/context/WorkloadItemContext';
import { useWorkspaceMoveSimulation } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveSimulation';

import { useWorkspaceMoveSimulationPanelStyles } from './WorkspaceMoveSimulationPanel.styles';

export const WorkspaceMoveSimulationPanel: FC = () => {
	const styles = useWorkspaceMoveSimulationPanelStyles();
	const { workloadClient } = useFabricContext();
	const { state, navigation, actions } = useWorkloadItemContext();
	const workspaceId = state.workloadItem?.workspaceId;
	const itemId = state.workloadItem?.id;
	const workloadDefinition = state.workloadItem?.definition;
	const { isAllowed, state: simulation, hasOverrides, updateSimulation, resetSimulation } =
		useWorkspaceMoveSimulation(workspaceId);
	const [definitionPreview, setDefinitionPreview] = useState<string | undefined>(undefined);
	const [previewMessage, setPreviewMessage] = useState<string | undefined>(undefined);

	const prettyPrintJson = (value: unknown) => JSON.stringify(value, null, 2);

	const onShowCurrentDefinition = () => {
		if (!workloadDefinition) {
			setPreviewMessage('Current definition.json is not available for this item.');
			setDefinitionPreview(undefined);
			return;
		}

		setDefinitionPreview(prettyPrintJson(workloadDefinition));
		setPreviewMessage(undefined);
	};

	const onRestoreMetadata = async () => {
		if (!itemId || !workloadDefinition) {
			return;
		}

		const { workspaceMove, ...definitionToRestore } = workloadDefinition;

		await saveItemDefinition(workloadClient, itemId, definitionToRestore);
		await actions.reloadData();
	};

	useEffect(() => {
		if (process.env.DEBUG_MODE_ENABLED !== 'true') {
			return;
		}

		console.info('[WorkspaceMoveSimulationPanel] visibility', {
			workspaceId,
			isAllowed,
			hasOverrides,
			simulation,
		});
	}, [workspaceId, isAllowed, hasOverrides, simulation]);

	if (!isAllowed) {
		return null;
	}

	return (
		<MessageBar intent="info" layout="multiline">
			<div className={styles.content}>
				<Text className={styles.label}>Workspace move simulation (test-only)</Text>
				{previewMessage && <Text>{previewMessage}</Text>}
				<div className={styles.grid}>
					<Checkbox
						label="Simulate moved workspace"
						checked={simulation.simulateMoved}
						onChange={(_, data) => updateSimulation({ simulateMoved: !!data.checked })}
					/>
					<Checkbox
						label="Simulate move acknowledged"
						checked={simulation.simulateAcknowledged}
						onChange={(_, data) => updateSimulation({
							simulateAcknowledged: !!data.checked,
							simulateRemediated: data.checked ? simulation.simulateRemediated : false,
						})}
					/>
					<Checkbox
						label="Simulate remediation completed"
						checked={simulation.simulateRemediated}
						onChange={(_, data) => updateSimulation({
							simulateRemediated: !!data.checked,
							simulateAcknowledged: !!data.checked || simulation.simulateAcknowledged,
						})}
					/>
					<Checkbox
						label="Simulate missing report"
						checked={simulation.simulateMissingReport}
						onChange={(_, data) => updateSimulation({ simulateMissingReport: !!data.checked })}
					/>
					<Checkbox
						label="Simulate missing orchestration pipeline"
						checked={simulation.simulateMissingOrchestrationPipeline}
						onChange={(_, data) => updateSimulation({ simulateMissingOrchestrationPipeline: !!data.checked })}
					/>
					<Checkbox
						label="Simulate missing semantic model"
						checked={simulation.simulateMissingSemanticModel}
						onChange={(_, data) => updateSimulation({ simulateMissingSemanticModel: !!data.checked })}
					/>
					<Checkbox
						label="Simulate missing Gold lakehouse"
						checked={simulation.simulateMissingGoldLakehouse}
						onChange={(_, data) => updateSimulation({ simulateMissingGoldLakehouse: !!data.checked })}
					/>
					<Checkbox
						label="Simulate missing Silver lakehouse"
						checked={simulation.simulateMissingSilverLakehouse}
						onChange={(_, data) => updateSimulation({ simulateMissingSilverLakehouse: !!data.checked })}
					/>
					<Checkbox
						label="Simulate missing sample data"
						checked={simulation.simulateSampleDataMissing}
						onChange={(_, data) => updateSimulation({ simulateSampleDataMissing: !!data.checked })}
					/>
					<Checkbox
						label="Simulate SQL endpoint mismatch"
						checked={simulation.simulateSqlMismatch}
						onChange={(_, data) => updateSimulation({ simulateSqlMismatch: !!data.checked })}
					/>
					<Checkbox
						label="Simulate setup error"
						checked={simulation.simulateSetupError}
						onChange={(_, data) => updateSimulation({ simulateSetupError: !!data.checked })}
					/>
				</div>
				<div className={styles.actions}>
					<Button appearance="secondary" onClick={navigation.goToPostDeploymentSetup}>
						Open post-deployment setup
					</Button>
					<Button appearance="secondary" onClick={onShowCurrentDefinition} disabled={!workloadDefinition}>
						Show current definition.json
					</Button>
					<Button appearance="secondary" onClick={onRestoreMetadata} disabled={!workloadDefinition}>
						Restore original metadata
					</Button>
					<Button appearance="outline" onClick={resetSimulation} disabled={!hasOverrides}>
						Reset simulation
					</Button>
				</div>
				{definitionPreview && (
					<div className={styles.previewSection}>
						<Text className={styles.label}>Current definition.json</Text>
						<pre className={styles.preview}>{definitionPreview}</pre>
					</div>
				)}
			</div>
		</MessageBar>
	);
};
