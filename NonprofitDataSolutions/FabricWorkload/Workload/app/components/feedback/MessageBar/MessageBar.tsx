import type { FC } from 'react';

import { MessageBar as FluentMessageBar, MessageBarBody, Text } from '@fluentui/react-components';
import { Info20Regular } from '@fluentui/react-icons';

import { useMessageBarStyles } from './MessageBar.styles';
import type { MessageBarProps } from './MessageBar.types';

// MessageBar component
export const MessageBar: FC<MessageBarProps> = ({ title, description, icon = <Info20Regular />, intent = 'info' }) => {
	const styles = useMessageBarStyles();

	return (
		<FluentMessageBar intent={intent} icon={icon}>
			<MessageBarBody>
				<Text weight="semibold" className={styles.title}>
					{title}
				</Text>
				{description && (
					<Text as="p" className={styles.description}>
						{description}
					</Text>
				)}
			</MessageBarBody>
		</FluentMessageBar>
	);
};
