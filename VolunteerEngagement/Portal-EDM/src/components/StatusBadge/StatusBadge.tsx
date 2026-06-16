import React from 'react';

import { useTranslation } from '@/i18n';
import { Badge } from '@fluentui/react-components';
import {
	ArrowClockwise20Regular,
	CheckmarkCircle20Regular,
	Clock20Regular,
	DismissCircle20Regular,
} from '@fluentui/react-icons';

import { ParticipationStatus, ScheduleStatus } from '@/types';

import { type StatusBadgeProps, StatusBadgeType } from './StatusBadge.types';

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type, size }) => {
	if (type === StatusBadgeType.Participation) {
		return <ParticipationStatusBadge status={status} size={size} />;
	}
	return <ScheduleStatusBadge status={status} size={size} />;
};

const ParticipationStatusBadge: React.FC<{ status: number; size?: StatusBadgeProps['size'] }> = ({ status, size }) => {
	const { t } = useTranslation();
	switch (status) {
		case ParticipationStatus.Applied:
			return (
				<Badge appearance="tint" color="warning" size={size} icon={<Clock20Regular />}>
					{t('MSVE_SPA/Status/Applied')}
				</Badge>
			);
		case ParticipationStatus.Accepted:
			return (
				<Badge appearance="tint" color="success" size={size} icon={<CheckmarkCircle20Regular />}>
					{t('MSVE_SPA/Status/Accepted')}
				</Badge>
			);
		case ParticipationStatus.Dismissed:
			return (
				<Badge appearance="tint" color="danger" size={size} icon={<DismissCircle20Regular />}>
					{t('MSVE_SPA/Status/Dismissed')}
				</Badge>
			);
		case ParticipationStatus.Canceled:
			return (
				<Badge appearance="tint" color="danger" size={size} icon={<DismissCircle20Regular />}>
					{t('MSVE_SPA/Status/Canceled')}
				</Badge>
			);
		default:
			return (
				<Badge appearance="tint" color="informative" size={size} icon={<ArrowClockwise20Regular />}>
					{t('MSVE_SPA/Status/Unknown')}
				</Badge>
			);
	}
};

const ScheduleStatusBadge: React.FC<{ status: number; size?: StatusBadgeProps['size'] }> = ({ status, size }) => {
	const { t } = useTranslation();
	switch (status) {
		case ScheduleStatus.Registered:
			return (
				<Badge appearance="tint" color="success" size={size} icon={<CheckmarkCircle20Regular />}>
					{t('MSVE_SPA/Status/Registered')}
				</Badge>
			);
		case ScheduleStatus.Completed:
			return (
				<Badge appearance="tint" color="brand" size={size} icon={<CheckmarkCircle20Regular />}>
					{t('MSVE_SPA/Status/Completed')}
				</Badge>
			);
		case ScheduleStatus.Missed:
			return (
				<Badge appearance="tint" color="warning" size={size} icon={<DismissCircle20Regular />}>
					{t('MSVE_SPA/Status/Missed')}
				</Badge>
			);
		case ScheduleStatus.Canceled:
			return (
				<Badge appearance="tint" color="danger" size={size} icon={<DismissCircle20Regular />}>
					{t('MSVE_SPA/Status/Canceled')}
				</Badge>
			);
		default:
			return (
				<Badge appearance="tint" color="informative" size={size}>
					{t('MSVE_SPA/Status/Unknown')}
				</Badge>
			);
	}
};
