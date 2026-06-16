import type { BadgeProps } from '@fluentui/react-components';

export enum StatusBadgeType {
	Participation = 'participation',
	Schedule = 'schedule',
}

export interface StatusBadgeProps {
	status: number;
	type: StatusBadgeType;
	size?: BadgeProps['size'];
}
