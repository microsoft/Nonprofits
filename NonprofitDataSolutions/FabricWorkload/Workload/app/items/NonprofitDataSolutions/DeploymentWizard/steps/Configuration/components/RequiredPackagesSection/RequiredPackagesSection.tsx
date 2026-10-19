import type { FC } from 'react';

import { StepSection } from '@nds/DeploymentWizard/common';

import { requiredPackages } from '../../Configuration.model';
import { PackageCard } from '../PackageCard';
import { SectionBadge } from '../SectionBadge';

export const RequiredPackagesSection: FC = () => {
	return (
		<StepSection
			title="Required packages"
			titleBadge={
				<SectionBadge ariaLabel="Required packages status: Always included">Always included</SectionBadge>
			}
		>
			<div role="list" aria-label="Required packages list">
				{requiredPackages.map((pkg) => (
					<div key={pkg.id} role="listitem">
						<PackageCard
							id={pkg.id}
							name={pkg.name}
							description={pkg.description}
							items={pkg.items}
							isSelected={true}
							isRequired={true}
						/>
					</div>
				))}
			</div>
		</StepSection>
	);
};
