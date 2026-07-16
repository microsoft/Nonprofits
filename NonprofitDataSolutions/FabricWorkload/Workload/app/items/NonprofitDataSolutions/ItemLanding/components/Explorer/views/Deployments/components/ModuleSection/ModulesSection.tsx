import { Text } from '@fluentui/react-components';

import { ModuleStatusBadge } from '@src/items/NonprofitDataSolutions/common/ModuleStatusBadge';

import { SectionContainer } from '../SectionContainer';
import { useModulesSectionStyles } from './ModulesSection.styles';
import { ModulesSectionProps } from './ModulesSection.types';

export const ModulesSection: React.FC<ModulesSectionProps> = ({ modules }) => {
	const styles = useModulesSectionStyles();

	return (
		<SectionContainer title="Packages" titleId="packages-title">
			<div className={styles.modulesList}>
				{modules.map((module) => {
					const Icon = module.icon;
					return (
						<div key={module.id} className={styles.moduleItem}>
							<div className={styles.moduleInfo}>
								<div className={styles.moduleHeader}>
									<Icon className={styles.moduleIcon} aria-hidden="true" />
									<div className={styles.moduleDetails}>
										<Text className={styles.moduleName}>{module.name}</Text>
										<Text className={styles.moduleType}>{module.type}</Text>
									</div>
								</div>
							</div>
							<div className={styles.moduleStatus}>
								<ModuleStatusBadge status={module.status} />
							</div>
						</div>
					);
				})}
			</div>
		</SectionContainer>
	);
};
