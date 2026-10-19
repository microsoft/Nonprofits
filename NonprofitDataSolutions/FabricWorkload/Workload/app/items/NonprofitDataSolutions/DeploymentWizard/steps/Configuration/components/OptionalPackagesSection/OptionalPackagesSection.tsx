import type { FC } from 'react';

import { MessageBar } from '@src/components/feedback';

import { StepSection } from '@nds/DeploymentWizard/common';
import { useDeployment } from '@nds/DeploymentWizard/contexts/DeploymentContext';
import { ModuleType } from '@nds/DeploymentWizard/types/ModuleType';

import { configurationLabels, optionalPackages } from '../../Configuration.model';
import { PackageCard } from '../PackageCard';
import { SectionBadge } from '../SectionBadge';
import { useOptionalPackagesSectionStyles } from './OptionalPackagesSection.styles';

export const OptionalPackagesSection: FC = () => {
	const styles = useOptionalPackagesSectionStyles();
	const deploymentConfig = useDeployment();
	const labels = configurationLabels.optionalPackages;

	// Get values from deployment context
	const { selectedModules } = deploymentConfig.state;
	const { addModule, removeModule } = deploymentConfig.actions;

	const toggleOptionalPackage = (packageId: ModuleType) => {
		if (selectedModules.has(packageId)) {
			removeModule(packageId);
		} else {
			addModule(packageId);
		}
	};

	const selectedCount = optionalPackages.filter((pkg) => selectedModules.has(pkg.id)).length;
	const totalCount = optionalPackages.length;

	return (
		<StepSection
			title={labels.sectionTitle}
			titleBadge={
				<SectionBadge ariaLabel={labels.badgeAriaLabel(selectedCount, totalCount)}>
					{labels.badgeLabel(selectedCount)}
				</SectionBadge>
			}
			subtitle={<MessageBar title={labels.importantNote.title} description={labels.importantNote.description} />}
		>
			<div
				role="list"
				aria-label={labels.listAriaLabel(selectedCount, totalCount)}
				className={styles.packagesGroup}
			>
				{optionalPackages.map((pkg) => {
					const isSelected = selectedModules.has(pkg.id);
					return (
						<div key={pkg.id} role="listitem">
							<PackageCard
								id={pkg.id}
								name={pkg.name}
								description={pkg.description}
								items={pkg.items}
								isSelected={isSelected}
								isRequired={false}
								onClick={() => toggleOptionalPackage(pkg.id)}
							/>
						</div>
					);
				})}
			</div>
		</StepSection>
	);
};
