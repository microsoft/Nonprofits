import { FC } from 'react';

import { Text } from '@fluentui/react-components';
import { Info20Regular } from '@fluentui/react-icons';

import { useInfoBoxStyles } from './InfoBox.styles';
import type { InfoBoxProps } from './InfoBox.types';

export const InfoBox: FC<InfoBoxProps> = ({ title, titleId, description }) => {
	const styles = useInfoBoxStyles();

	return (
		<div className={styles.infoBox} role="note" aria-labelledby={titleId}>
			<Info20Regular className={styles.infoIcon} aria-hidden="true" />
			<div className={styles.infoContent}>
				<Text as="h4" id={titleId} className={styles.infoTitle}>
					{title}
				</Text>
				<Text as="p" className={styles.infoDescription}>
					{description}
				</Text>
			</div>
		</div>
	);
};
