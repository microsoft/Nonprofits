import type { DurationRange, Family, ScenarioEstimate, WorkItem } from './contracts.js';

export class PlanError extends Error {
	constructor() {
		super('Plan contains duplicate, conflicting, missing, cyclic, or cross-scenario work references.');
	}
}

export function normalizePlan(items: WorkItem[]): WorkItem[] {
	const ids = new Set<string>();
	const byKey = new Map<string, WorkItem>();
	const aliases = new Map<string, string>();
	for (const original of items) {
		if (ids.has(original.id)) {
			throw new PlanError();
		}
		ids.add(original.id);
		const item = structuredClone(original);
		const key = JSON.stringify([item.environment, item.phase, item.activity, item.component, item.occurrenceId]);
		const existing = byKey.get(key);
		if (existing) {
			if (existing.scenario !== item.scenario || existing.ruleId !== item.ruleId
				|| existing.appliedRateId !== item.appliedRateId
				|| JSON.stringify(existing.effort) !== JSON.stringify(item.effort)
				|| JSON.stringify(existing.elapsed) !== JSON.stringify(item.elapsed)
				|| JSON.stringify(existing.execution) !== JSON.stringify(item.execution)
				|| JSON.stringify(existing.downtime) !== JSON.stringify(item.downtime)
				|| existing.unknownReason !== item.unknownReason) {
				throw new PlanError();
			}
			existing.families = [...new Set([...existing.families, ...item.families])].sort();
			existing.dependsOn = [...new Set([...existing.dependsOn, ...item.dependsOn])].sort();
			existing.evidenceIds = [...new Set([...existing.evidenceIds, ...item.evidenceIds])].sort();
			aliases.set(item.id, existing.id);
		} else {
			byKey.set(key, item);
			aliases.set(item.id, item.id);
		}
	}
	const result = [...byKey.values()];
	const byId = new Map(result.map(item => [item.id, item]));
	for (const item of result) {
		item.dependsOn = [...new Set(item.dependsOn.map(id => {
			const resolved = aliases.get(id);
			if (!resolved) {
				throw new PlanError();
			}
			return resolved;
		}))].sort();
		for (const id of item.dependsOn) {
			const dependency = byId.get(id)!;
			const allowed = dependency.scenario === 'baseline'
				|| dependency.scenario === 'assessed'
				|| dependency.scenario === item.scenario;
			if (!allowed || id === item.id) {
				throw new PlanError();
			}
		}
	}
	const ordered: WorkItem[] = [];
	const complete = new Set<string>();
	const visiting = new Set<string>();
	const visit = (item: WorkItem): void => {
		if (visiting.has(item.id)) {
			throw new PlanError();
		}
		if (complete.has(item.id)) {
			return;
		}
		visiting.add(item.id);
		for (const dependency of item.dependsOn) {
			visit(byId.get(dependency)!);
		}
		visiting.delete(item.id);
		complete.add(item.id);
		ordered.push(item);
	};
	for (const item of [...result].sort((a, b) => a.id.localeCompare(b.id, 'en'))) {
		visit(item);
	}
	return ordered;
}

function sumDurations(items: WorkItem[], field: 'execution' | 'downtime'): DurationRange | null {
	if (items.length === 0 || items.some(item => item[field] === null)) {
		return null;
	}
	return items.reduce<DurationRange>((total, item) => ({
		min: total.min + item[field]!.min,
		max: total.max + item[field]!.max,
		unit: 'hours',
	}), { min: 0, max: 0, unit: 'hours' });
}

function criticalPath(items: WorkItem[]): DurationRange | null {
	if (items.length === 0 || items.some(item => item.elapsed === null)) {
		return null;
	}
	const selected = new Set(items.map(item => item.id));
	const completion = new Map<string, { min: number; max: number }>();
	for (const item of items) {
		const dependencies = item.dependsOn.filter(id => selected.has(id))
			.map(id => completion.get(id))
			.filter(value => value !== undefined);
		const startMin = dependencies.length ? Math.max(...dependencies.map(value => value.min)) : 0;
		const startMax = dependencies.length ? Math.max(...dependencies.map(value => value.max)) : 0;
		completion.set(item.id, {
			min: startMin + item.elapsed!.min,
			max: startMax + item.elapsed!.max,
		});
	}
	const values = [...completion.values()];
	return {
		min: Math.max(...values.map(value => value.min)),
		max: Math.max(...values.map(value => value.max)),
		unit: 'hours',
	};
}

export function summarizeScenario(
	items: WorkItem[],
	scenario: string,
	blockers: string[],
	family?: Family,
): ScenarioEstimate {
	const selected = items.filter(item => (!family || item.families.includes(family))
		&& (item.scenario === 'baseline' || (scenario !== 'baseline'
			&& (item.scenario === 'assessed' || item.scenario === scenario))));
	const knownSubtotal = { min: 0, max: 0, unit: 'person-hours' as const };
	const unknown: string[] = [];
	for (const item of selected) {
		if (item.effort) {
			knownSubtotal.min += item.effort.min;
			knownSubtotal.max += item.effort.max;
			if (!Number.isFinite(knownSubtotal.max)) {
				throw new PlanError();
			}
		} else {
			unknown.push(item.id);
		}
	}
	const reasons = [...new Set([
		...blockers,
		...selected.filter(item => !item.effort).map(item => item.unknownReason ?? 'Work is not estimated.'),
	])];
	const timingBlocked = reasons.length > 0;
	const production = selected.filter(item => item.phase === 'production');
	const missingElapsed = selected.filter(item => item.elapsed === null).map(item => item.id);
	const missingExecution = production.filter(item => item.execution === null).map(item => item.id);
	const missingDowntime = production.filter(item => item.downtime === null).map(item => item.id);
	const elapsed = timingBlocked ? null : criticalPath(selected);
	const execution = timingBlocked ? null : sumDurations(production, 'execution');
	const downtime = timingBlocked ? null : sumDurations(production, 'downtime');
	const timingReason = timingBlocked
		? 'Timing is withheld while route or effort blockers remain.'
		: missingElapsed.length || missingExecution.length || missingDowntime.length
			? `Reviewed timing inputs are missing for elapsed (${missingElapsed.length}), production execution (${missingExecution.length}), or downtime (${missingDowntime.length}) work items.`
			: 'Elapsed time is the dependency critical path of reviewed provisional typical durations; execution and downtime sum reviewed production ranges. Calendars and change windows still require local confirmation.';
	return {
		id: scenario,
		workItemIds: selected.map(item => item.id),
		knownSubtotal,
		total: reasons.length === 0 ? { ...knownSubtotal } : null,
		excludedWorkItemIds: unknown,
		reasons,
		elapsed,
		execution,
		downtime,
		timingReason,
	};
}
