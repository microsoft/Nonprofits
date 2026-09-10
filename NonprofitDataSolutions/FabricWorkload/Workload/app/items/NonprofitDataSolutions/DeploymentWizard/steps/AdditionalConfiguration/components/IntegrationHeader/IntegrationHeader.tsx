import { FC } from 'react';

import { Badge, Link, Text } from '@fluentui/react-components';
import { Open20Regular } from '@fluentui/react-icons';

import { useExternalLink } from '@src/hooks/useExternalLink';

import { useIntegrationHeaderStyles } from './IntegrationHeader.styles';
import type { IntegrationHeaderProps } from './IntegrationHeader.types';

export const IntegrationHeader: FC<IntegrationHeaderProps> = ({
	icon,
	title,
	titleId,
	subtitle,
	setupGuideUrl,
	setupGuideLabel,
}) => {
	const styles = useIntegrationHeaderStyles();
	const { onClick, handleKeyDown } = useExternalLink(setupGuideUrl);

	return (
		<div className={styles.integrationHeader}>
			<div className={styles.integrationInfo}>
				<div className={styles.iconContainer} aria-hidden="true">
					{icon}
				</div>
				<div className={styles.integrationDetails}>
					<div className={styles.integrationTitleRow}>
						<Text as="h3" id={titleId} className={styles.integrationTitle}>
							{title}
						</Text>
						<Badge appearance="filled" color="severe" size="medium" role="status">
							Required
						</Badge>
					</div>
					<Text as="p" className={styles.integrationSubtitle}>
						{subtitle}
					</Text>
				</div>
			</div>
			<Link
				href={setupGuideUrl}
				className={styles.setupLink}
				onClick={onClick}
				onKeyDown={handleKeyDown}
				aria-label={setupGuideLabel}
			>
				<Text as="span">Setup guide</Text>
				<Open20Regular aria-hidden="true" />
			</Link>
		</div>
	);
};
