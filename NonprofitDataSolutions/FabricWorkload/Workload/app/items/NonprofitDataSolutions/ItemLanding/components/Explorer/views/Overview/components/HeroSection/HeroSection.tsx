import { FC } from 'react';

import { Text } from '@fluentui/react-components';

import { getIcon } from '@nds/helpers/UIHelper';
import { useWorkloadItemContext } from '@nds/ItemLanding/context/WorkloadItemContext';
import { resolvePackageVersion } from '@originalInstaller/package/PackageRegistry';

import { heroSectionData } from './HeroSection.fundraising.model';
import { useHeroSectionStyles } from './HeroSection.styles';

export const HeroSection: FC = () => {
	const styles = useHeroSectionStyles();
	const { state } = useWorkloadItemContext();
	const version = resolvePackageVersion(state.latestDeployment?.version);

	return (
		<header className={styles.heroSection} role="banner">
			<div className={styles.heroContent}>
				<div className={styles.heroIcon} aria-hidden="true">
					{getIcon(heroSectionData.iconName, 32, 32)}
				</div>
				<div className={styles.heroText}>
					<Text as="h1" className={styles.heroTitle}>
						{heroSectionData.title}
					</Text>
					<Text as="p" className={styles.heroSubtitle}>
						{heroSectionData.subtitle}
					</Text>
					{version && (
						<Text as="p" className={styles.heroVersion}>
							Version {version}
						</Text>
					)}
				</div>
			</div>
		</header>
	);
};
