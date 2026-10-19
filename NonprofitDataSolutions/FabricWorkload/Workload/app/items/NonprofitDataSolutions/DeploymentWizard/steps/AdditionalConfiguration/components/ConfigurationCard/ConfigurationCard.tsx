import { FC } from 'react';

import { Link, Text } from '@fluentui/react-components';
import { Open20Regular } from '@fluentui/react-icons';

import { useExternalLink } from '@src/hooks/useExternalLink';

import { useConfigurationCardStyles } from './ConfigurationCard.styles';
import type { ConfigurationCardProps } from './ConfigurationCard.types';

export const ConfigurationCard: FC<ConfigurationCardProps> = ({
	configLabelId,
	configLabel,
	connectionGuideUrl,
	connectionGuideLabel,
	connectionGuideText,
	children,
	onLinkClick,
	onLinkKeyDown,
}) => {
	const styles = useConfigurationCardStyles();
	const externalLink = useExternalLink(connectionGuideUrl);

	const handleClick = onLinkClick || externalLink.onClick;
	const handleKeyDown = onLinkKeyDown || externalLink.handleKeyDown;

	return (
		<div className={styles.configurationCard} role="group" aria-labelledby={configLabelId}>
			<Text as="h4" id={configLabelId} className={styles['sr-only']}>
				{configLabel}
			</Text>
			<Link
				href={connectionGuideUrl}
				className={styles.cardPositionedLink}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				aria-label={connectionGuideLabel}
			>
				<Text as="span">{connectionGuideText}</Text>
				<Open20Regular aria-hidden="true" />
			</Link>
			{children}
		</div>
	);
};
