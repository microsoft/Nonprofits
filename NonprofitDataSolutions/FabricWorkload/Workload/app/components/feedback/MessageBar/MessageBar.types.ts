import type { ReactElement } from 'react';

import type { MessageBarIntent } from '@fluentui/react-components';

export interface MessageBarProps {
	title: string;
	description?: string;
	icon?: ReactElement;
	intent?: MessageBarIntent;
}
