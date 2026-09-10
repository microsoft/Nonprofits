import { FC } from 'react';

import { Text } from '@fluentui/react-components';
import { DatabaseSearch20Regular, Link20Regular } from '@fluentui/react-icons';

import { useFabricLink } from '@src/components/FabricLink';
import { MessageBar } from '@src/components/feedback';
import { Dropdown } from '@src/components/form';

import { getIcon, getItemTypeIcon } from '@nds/helpers/UIHelper';

import { useDeployment } from '../../contexts/DeploymentContext';
import { useWizard } from '../../contexts/WizardContext';
import { useWorkspaceData } from '../../contexts/WorkspaceDataContext';
import { ModuleType } from '../../types/ModuleType';
import {
	additionalConfigurationLabels,
	documentationLinks,
	dynamicsTables,
	salesforceObjects,
	validationMessages,
} from './AdditionalConfiguration.model';
import { useAdditionalConfigurationStyles } from './AdditionalConfiguration.styles';
import { ConfigurationCard, IntegrationHeader, TablesPreview } from './components';

export const AdditionalConfiguration: FC = () => {
	const styles = useAdditionalConfigurationStyles();
	const wizardConfig = useWizard();
	const deploymentConfig = useDeployment();
	const workspaceData = useWorkspaceData();
	const { linkUrl: connectionsUrl, linkOnClick: connectionsOnClick } = useFabricLink({
		type: 'relative',
		path: `/groups/${workspaceData.state.currentWorkspace?.id}/gateways`,
	});

	// Direct destructuring for better memory efficiency
	const { selectedModules, selectedLakehouse, selectedConnection } = deploymentConfig.state;
	const { configurationValidation } = wizardConfig.state;
	const { lakehouses, connections } = workspaceData.state;
	const { setSelectedLakehouse, setSelectedConnection } = deploymentConfig.actions;
	const labels = additionalConfigurationLabels;

	return (
		<main className={styles.container} role="main" aria-labelledby="additional-config-title">
			{/* Introduction */}
			<header className={styles.introSection}>
				<Text as="h2" id="additional-config-title" className={styles.sectionTitle}>
					{labels.introduction.title}
				</Text>
				<Text as="p" className={styles.sectionDescription}>
					{labels.introduction.description}
				</Text>
			</header>

			{/* Dynamics 365 Sales Integration */}
			{selectedModules.has(ModuleType.Fundraising_Dynamics365) && (
				<section className={styles.integrationSection} aria-labelledby="dynamics-integration-title">
					<IntegrationHeader
						icon={<DatabaseSearch20Regular />}
						title={labels.dynamics365.title}
						titleId="dynamics-integration-title"
						subtitle={labels.dynamics365.subtitle}
						setupGuideUrl={documentationLinks.dynamics365.setupGuide}
						setupGuideLabel={labels.dynamics365.setupGuideLabel}
					/>

					<ConfigurationCard
						configLabelId="dynamics-configuration-label"
						configLabel={labels.dynamics365.configLabel}
						connectionGuideUrl={documentationLinks.dynamics365.connectionGuide}
						connectionGuideLabel={labels.dynamics365.connectionGuideLabel}
						connectionGuideText={labels.dynamics365.connectionGuideText}
					>
						<div className={styles.fieldRow}>
							<Dropdown
								required
								label={labels.dynamics365.lakehouseDropdown.label}
								options={lakehouses}
								value={selectedLakehouse}
								onChange={setSelectedLakehouse}
								icon={getItemTypeIcon('lakehouse', 20, 20)}
								placeholder={labels.dynamics365.lakehouseDropdown.placeholder}
								validationMessage={configurationValidation.selectedLakehouse}
								validationState={configurationValidation.selectedLakehouse ? 'error' : 'none'}
							/>
							<Text as="p" className={styles.fieldDescription}>
								{labels.dynamics365.lakehouseDropdown.description}
							</Text>
						</div>

						<MessageBar
							title={labels.dynamics365.beforeSelectingTitle}
							description={validationMessages.dynamics365Info}
						/>

						<TablesPreview
							tablesLabel={labels.dynamics365.tablesLabel}
							tablesLabelId="dynamics-tables-label"
							tablesAriaLabel={labels.dynamics365.tablesAriaLabel}
							tables={dynamicsTables}
						/>
					</ConfigurationCard>
				</section>
			)}

			{/* Salesforce NPSP Integration */}
			{selectedModules.has(ModuleType.Fundraising_SalesforceNPSP) && (
				<section className={styles.integrationSection} aria-labelledby="salesforce-integration-title">
					<IntegrationHeader
						icon={<Link20Regular />}
						title={labels.salesforce.title}
						titleId="salesforce-integration-title"
						subtitle={labels.salesforce.subtitle}
						setupGuideUrl={documentationLinks.salesforce.setupGuide}
						setupGuideLabel={labels.salesforce.setupGuideLabel}
					/>

					<ConfigurationCard
						configLabelId="salesforce-configuration-label"
						configLabel={labels.salesforce.configLabel}
						connectionGuideUrl={connectionsUrl}
						connectionGuideLabel={labels.salesforce.connectionGuideLabel}
						connectionGuideText={labels.salesforce.connectionGuideText}
						onLinkClick={connectionsOnClick}
					>
						<div className={styles.fieldRow}>
							<Dropdown
								required
								label={labels.salesforce.connectionDropdown.label}
								options={connections}
								value={selectedConnection}
								onChange={setSelectedConnection}
								icon={getIcon('salesforce', 20, 20)}
								placeholder={labels.salesforce.connectionDropdown.placeholder}
								validationMessage={configurationValidation.selectedConnection}
								validationState={configurationValidation.selectedConnection ? 'error' : 'none'}
							/>
							<Text as="p" className={styles.fieldDescription}>
								{labels.salesforce.connectionDropdown.description}
							</Text>
						</div>

						<MessageBar
							title={labels.salesforce.beforeSelectingTitle}
							description={validationMessages.salesforceInfo}
						/>

						<TablesPreview
							tablesLabel={labels.salesforce.objectsLabel}
							tablesLabelId="salesforce-objects-label"
							tablesAriaLabel={labels.salesforce.objectsAriaLabel}
							tables={salesforceObjects}
						/>
					</ConfigurationCard>
				</section>
			)}
		</main>
	);
};
