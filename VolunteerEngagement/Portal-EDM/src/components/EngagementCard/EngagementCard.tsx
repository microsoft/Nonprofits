import React from 'react';

import { useNavigate } from 'react-router-dom';

import { useTranslation } from '@/i18n';
import { Badge, Button, Card, CardFooter, CardHeader, Text } from '@fluentui/react-components';
import { ArrowRight20Regular, CalendarLtr20Regular, Globe20Regular, Location20Regular } from '@fluentui/react-icons';

import { StatusBadge, StatusBadgeType } from '@/components/StatusBadge';

import { LocationType, getLocationLabel } from '@/types';

import { useEngagementCardStyles } from './EngagementCard.styles';
import type { EngagementCardProps } from './EngagementCard.types';

export const EngagementCard: React.FC<EngagementCardProps> = ({ engagement, participationStatus }) => {
	const styles = useEngagementCardStyles();
	const navigate = useNavigate();
	const { t } = useTranslation();

	const startDate = new Date(engagement.msnfp_startingdate).toLocaleDateString();
	const endDate = new Date(engagement.msnfp_endingdate).toLocaleDateString();

	const LocationIcon = engagement.msnfp_locationtype === LocationType.Virtual ? Globe20Regular : Location20Regular;

	return (
		<Card
			className={styles.card}
			onClick={() => navigate(`/engagement/${engagement.msnfp_publicengagementopportunityid}`)}
		>
			<CardHeader
				header={
					<Text size={500} weight="semibold">
						{engagement.msnfp_engagementopportunitytitle}
					</Text>
				}
				description={
					<Text size={300} className={styles.mutedText}>
						{engagement.msnfp_shortdescription}
					</Text>
				}
			/>

			<div className={styles.meta}>
				<div className={styles.metaItem}>
					<CalendarLtr20Regular />
					<Text size={300}>
						{startDate} – {endDate}
					</Text>
				</div>
				<div className={styles.metaItem}>
					<LocationIcon />
					<Badge appearance="tint" color="informative">
						{getLocationLabel(engagement.msnfp_locationtype, t)}
					</Badge>
				</div>
				{engagement.msnfp_locationname && (
					<div className={styles.metaItem}>
						<Text size={300}>{engagement.msnfp_locationname}</Text>
						{engagement.msnfp_locationcitystate && (
							<Text size={300} className={styles.mutedText}>
								• {engagement.msnfp_locationcitystate}
							</Text>
						)}
					</div>
				)}
			</div>

			<CardFooter className={styles.footer}>
				<Button appearance="primary" icon={<ArrowRight20Regular />} iconPosition="after">
					{t('MSVE_SPA/Engagement/ViewDetails')}
				</Button>
				{participationStatus !== undefined && (
					<StatusBadge status={participationStatus} type={StatusBadgeType.Participation} />
				)}
				{engagement.msnfp_maximum > 0 && (
					<Text size={300} className={styles.mutedText}>
						{t('MSVE_SPA/Common/VolunteersNeeded', { count: engagement.msnfp_maximum })}
					</Text>
				)}
			</CardFooter>
		</Card>
	);
};
