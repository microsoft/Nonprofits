import { z } from 'zod';
import {
	AssessmentSchema, DurationRangeSchema, RangeSchema, TimestampSchema,
} from './contracts.js';

const ObservedEffortSchema = z.strictObject({
	value: z.number().finite().nonnegative(),
	unit: z.literal('person-hours'),
});
const ObservedDurationSchema = z.strictObject({
	value: z.number().finite().nonnegative(),
	unit: z.literal('hours'),
});
export const RehearsalObservationSchema = z.strictObject({
	assessmentId: z.string().min(1).max(100),
	scenario: z.string().min(1).max(100),
	observedAt: TimestampSchema,
	effort: ObservedEffortSchema,
	elapsed: ObservedDurationSchema.nullable(),
	execution: ObservedDurationSchema.nullable(),
	downtime: ObservedDurationSchema.nullable(),
	notes: z.string().max(500),
});
export type RehearsalObservation = z.infer<typeof RehearsalObservationSchema>;

const ComparisonSchema = z.strictObject({
	status: z.enum(['within', 'below', 'above', 'not-comparable', 'not-observed']),
	estimated: z.union([RangeSchema, DurationRangeSchema]).nullable(),
	observed: z.number().nonnegative().nullable(),
});
export const CalibrationResultSchema = z.strictObject({
	assessmentId: z.string(),
	scenario: z.string(),
	observedAt: TimestampSchema,
	rulesVersion: z.string(),
	comparisons: z.strictObject({
		effort: ComparisonSchema,
		elapsed: ComparisonSchema,
		execution: ComparisonSchema,
		downtime: ComparisonSchema,
	}),
	notes: z.string(),
});
export type CalibrationResult = z.infer<typeof CalibrationResultSchema>;

function text(value: string): string {
	return value.replace(/[&<>|`\\[\]*_]/g, character => `&#${character.charCodeAt(0)};`)
		.replace(/[\r\n\u0000-\u001f]/g, ' ');
}

function compare(
	range: { min: number; max: number; unit: 'person-hours' | 'hours' } | null,
	observed: number | null,
): z.infer<typeof ComparisonSchema> {
	if (observed === null) {
		return { status: 'not-observed', estimated: range, observed };
	}
	if (!range) {
		return { status: 'not-comparable', estimated: null, observed };
	}
	return {
		status: observed < range.min ? 'below' : observed > range.max ? 'above' : 'within',
		estimated: range,
		observed,
	};
}

export function calibrateAssessment(
	assessmentInput: unknown,
	observationInput: unknown,
): CalibrationResult {
	const assessment = AssessmentSchema.parse(assessmentInput);
	const observation = RehearsalObservationSchema.parse(observationInput);
	if (assessment.assessmentId !== observation.assessmentId) {
		throw new Error('Rehearsal assessment identifier does not match.');
	}
	const scenario = assessment.combined.find(item => item.id === observation.scenario);
	if (!scenario) {
		throw new Error('Rehearsal scenario does not exist in the assessment.');
	}
	return CalibrationResultSchema.parse({
		assessmentId: assessment.assessmentId,
		scenario: observation.scenario,
		observedAt: observation.observedAt,
		rulesVersion: assessment.rulesVersion,
		comparisons: {
			effort: compare(scenario.total, observation.effort.value),
			elapsed: compare(scenario.elapsed, observation.elapsed?.value ?? null),
			execution: compare(scenario.execution, observation.execution?.value ?? null),
			downtime: compare(scenario.downtime, observation.downtime?.value ?? null),
		},
		notes: observation.notes,
	});
}

export function renderCalibrationMarkdown(result: CalibrationResult): string {
	const rows = Object.entries(result.comparisons).map(([metric, item]) => {
		const estimated = item.estimated
			? `${item.estimated.min}-${item.estimated.max} ${item.estimated.unit}`
			: 'Not available';
		return `| ${metric} | ${estimated} | ${item.observed ?? 'Not observed'} | ${item.status} |`;
	});
	return [
		'# Migration assessment calibration',
		'',
		`- Assessment: ${text(result.assessmentId)}`,
		`- Scenario: ${text(result.scenario)}`,
		`- Rules: ${text(result.rulesVersion)}`,
		`- Observed at: ${text(result.observedAt)}`,
		'',
		'| Metric | Estimated range | Observed | Result |',
		'| --- | --- | --- | --- |',
		...rows,
		'',
		`Notes: ${result.notes ? text(result.notes) : 'None.'}`,
		'',
	].join('\n');
}
