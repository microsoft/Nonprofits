import { describe, expect, it } from 'vitest';

import { ParticipationStatus, canReapplyStatus, getParticipationStatusLabel, isPendingApprovalStatus } from '../index';

describe('participation status helpers', () => {
	it('maps the In Review option set value', () => {
		expect(ParticipationStatus.InReview).toBe(844060001);
		expect(getParticipationStatusLabel(ParticipationStatus.InReview)).toBe('In Review');
		expect(getParticipationStatusLabel(ParticipationStatus.InReview, (key) => `t:${key}`)).toBe(
			't:MSVE_SPA/Status/InReview',
		);
	});

	it('treats Applied and In Review as pending approval', () => {
		expect(isPendingApprovalStatus(ParticipationStatus.Applied)).toBe(true);
		expect(isPendingApprovalStatus(ParticipationStatus.InReview)).toBe(true);
		expect(isPendingApprovalStatus(ParticipationStatus.Accepted)).toBe(false);
		expect(isPendingApprovalStatus(ParticipationStatus.Dismissed)).toBe(false);
		expect(isPendingApprovalStatus(ParticipationStatus.Canceled)).toBe(false);
		expect(isPendingApprovalStatus(undefined)).toBe(false);
	});

	it('allows re-applying only after the volunteer canceled', () => {
		expect(canReapplyStatus(ParticipationStatus.Canceled)).toBe(true);
		expect(canReapplyStatus(ParticipationStatus.Dismissed)).toBe(false);
		expect(canReapplyStatus(ParticipationStatus.Applied)).toBe(false);
		expect(canReapplyStatus(ParticipationStatus.InReview)).toBe(false);
		expect(canReapplyStatus(ParticipationStatus.Accepted)).toBe(false);
		expect(canReapplyStatus(undefined)).toBe(false);
	});
});
