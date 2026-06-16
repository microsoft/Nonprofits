import type { Engagement, Participation } from '@/types';

export enum MyEngagementsTab {
	Upcoming = 'upcoming',
	Past = 'past',
}

export interface EnrichedParticipation extends Participation {
	engagement?: Engagement;
}
