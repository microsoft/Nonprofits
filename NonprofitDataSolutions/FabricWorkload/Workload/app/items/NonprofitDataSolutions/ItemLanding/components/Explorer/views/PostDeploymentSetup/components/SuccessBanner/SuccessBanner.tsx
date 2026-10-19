import type { FC } from 'react';

import { Text } from '@fluentui/react-components';
import { CheckmarkCircle20Filled } from '@fluentui/react-icons';

import { useSuccessBannerStyles } from './SuccessBanner.styles';

export const SuccessBanner: FC = () => {
	const styles = useSuccessBannerStyles();

	return (
		<div className={styles.root} role="status">
			<CheckmarkCircle20Filled className={styles.icon} aria-hidden="true" />
			<div>
				<Text weight="semibold" size={300} className={styles.title}>
					Post-deployment setup completed successfully
				</Text>
				<Text size={200} className={styles.subtitle}>
					All artifact connections have been restored in the new workspace.
				</Text>
			</div>
		</div>
	);
};
