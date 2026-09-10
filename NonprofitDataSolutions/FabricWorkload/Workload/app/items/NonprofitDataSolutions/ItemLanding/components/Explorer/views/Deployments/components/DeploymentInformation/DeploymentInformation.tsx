import { Text } from '@fluentui/react-components';
import { Calendar16Regular, Person16Regular } from '@fluentui/react-icons';

import { DeploymentStatusBadge } from '@src/items/NonprofitDataSolutions/common/DeploymentStatusBadge';

import { SectionContainer } from '../SectionContainer';
import { deploymentInformationLabels } from './DeploymentInformation.model';
import { useDeploymentInformationStyles } from './DeploymentInformation.styles';
import { DeploymentInformationProps } from './DeploymentInformation.types';

export const DeploymentInformation: React.FC<DeploymentInformationProps> = ({ data }) => {
	const styles = useDeploymentInformationStyles();

	return (
		<SectionContainer title={deploymentInformationLabels.title} titleId="deployment-info-title">
			<div className={styles.infoGrid}>
				<div className={styles.infoItem}>
					<div className={styles.infoHeader}>
						<Person16Regular className={styles.icon} aria-hidden="true" />
						<Text className={styles.infoLabel}>{deploymentInformationLabels.deployedByLabel}</Text>
					</div>
					<Text className={styles.infoValue}>{data.deployedBy}</Text>
				</div>

				<div className={styles.infoItem}>
					<div className={styles.infoHeader}>
						<Calendar16Regular className={styles.icon} aria-hidden="true" />
						<Text className={styles.infoLabel}>{deploymentInformationLabels.deployedOnLabel}</Text>
					</div>
					<Text className={styles.infoValue}>{data.deployedOn}</Text>
				</div>

				<div className={styles.infoItem}>
					<div className={styles.infoHeader}>
						<Text className={styles.infoLabel}>{deploymentInformationLabels.statusLabel}</Text>
					</div>
					<DeploymentStatusBadge status={data.status} />
				</div>
			</div>
		</SectionContainer>
	);
};
