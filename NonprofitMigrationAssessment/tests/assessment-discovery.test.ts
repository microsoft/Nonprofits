import assert from 'node:assert/strict';
import test from 'node:test';
import { collectAssessmentDetails } from '../src/assessment-discovery.js';
import { DiscoverySchema, type DiscoveryCategory } from '../src/contracts.js';

const ORIGIN = 'https://synthetic-assessment.crm.dynamics.com';
const DATE = '2026-09-29T12:00:00.000Z';
const TOKEN = 'SYNTHETIC_TOKEN_CANARY';
const RELEVANT_ID = '11111111-1111-4111-8111-111111111111';
const CUSTOM_ID = '22222222-2222-4222-8222-222222222222';
const PARTNER_ID = '55555555-5555-4555-8555-555555555555';
const TABLE_ID = '33333333-3333-f333-8333-333333333333';
const WEBRESOURCE_ID = '44444444-4444-4444-8444-444444444444';
const WORKFLOW_ID = '66666666-6666-4666-8666-666666666666';
const CONNECTION_REFERENCE_ID = '77777777-7777-4777-8777-777777777777';
const PLUGIN_ASSEMBLY_ID = '88888888-8888-4888-8888-888888888888';
const PLUGIN_STEP_ID = '99999999-9999-4999-8999-999999999999';
const CUSTOM_PLUGIN_STEP_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const DEPENDENT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function baseDiscovery() {
	return DiscoverySchema.parse({
		collectedAt: DATE,
		solutions: [
			{
				solutionId: RELEVANT_ID,
				uniqueName: 'NonprofitCore',
				version: '3.1.3.4',
				managed: true,
				publisher: 'microsoftdynamics365nonprofitaccelerator',
				publisherPrefix: 'msnfp',
			},
			{
				solutionId: CUSTOM_ID,
				uniqueName: 'CustomerCustom',
				version: '1.0.0.0',
				managed: false,
				publisher: 'Customer',
				publisherPrefix: 'cus',
			},
			{
				solutionId: PARTNER_ID,
				uniqueName: 'PartnerManaged',
				version: '1.0.0.0',
				managed: true,
				publisher: 'PartnerPublisher',
				publisherPrefix: 'partner',
			},
		],
		evidence: [{
			id: 'solutions',
			source: 'observed',
			status: 'observed',
			collectedAt: DATE,
			collector: 'dataverse-solutions',
			scope: 'environment',
			inputs: [],
			reason: 'Synthetic solution evidence.',
		}],
	});
}

function allCategories(): DiscoveryCategory[] {
	return ['environment', 'solutions', 'components', 'dependencies', 'integrations', 'counts', 'sites'];
}

test('detailed discovery summarizes approved environment metadata without record contents', async () => {
	const calls: string[] = [];
	const result = await collectAssessmentDetails(baseDiscovery(), {
		environmentUrl: ORIGIN,
		consent: true,
		categories: allCategories(),
		relevantSolutionNames: ['NonprofitCore'],
		getToken: async () => TOKEN,
		fetch: async (input, init) => {
			assert.equal(init?.method, 'GET');
			assert.equal(init?.body, undefined);
			assert.equal(new Headers(init?.headers).get('authorization'), `Bearer ${TOKEN}`);
			const url = new URL(String(input));
			assert.equal(url.origin, ORIGIN);
			calls.push(`${url.pathname}${url.search}`);
			if (url.pathname.endsWith('/RetrieveVersion()')) {
				return Response.json({ Version: '9.2.26091.152', forbiddenRecordContent: 'ignored' });
			}
			if (url.pathname.endsWith('/organizations')) {
				assert.equal(url.searchParams.get('$select'), 'name');
				return Response.json({ value: [{ name: 'Synthetic Nonprofit Environment' }] });
			}
			if (url.pathname.endsWith('/solutioncomponents')) {
				const filter = url.searchParams.get('$filter') ?? '';
				return Response.json({
					value: filter.includes(RELEVANT_ID)
						? [
							{ componenttype: 1, objectid: TABLE_ID, forbiddenContent: 'ignored' },
							{ componenttype: 61, objectid: WEBRESOURCE_ID },
							{ componenttype: 29, objectid: WORKFLOW_ID },
							{ componenttype: 371, objectid: CONNECTION_REFERENCE_ID },
							{ componenttype: 91, objectid: PLUGIN_ASSEMBLY_ID },
							{ componenttype: 92, objectid: PLUGIN_STEP_ID },
						]
						: filter.includes(CUSTOM_ID)
							? [
								{ componenttype: 61, objectid: WEBRESOURCE_ID },
								{ componenttype: 29, objectid: WORKFLOW_ID },
								{ componenttype: 92, objectid: CUSTOM_PLUGIN_STEP_ID },
							]
							: [
								{ componenttype: 1, objectid: TABLE_ID },
								{ componenttype: 91, objectid: PLUGIN_ASSEMBLY_ID },
							],
				});
			}
			if (url.pathname.includes('RetrieveDependentComponents')) {
				const objectId = url.pathname.match(/ObjectId=([^,)]+)/)?.[1];
				const componentType = Number(url.pathname.match(/ComponentType=(\d+)/)?.[1]);
				return Response.json({ value: [{
					requiredcomponentobjectid: objectId,
					requiredcomponenttype: componentType,
					dependentcomponentobjectid: DEPENDENT_ID,
					dependentcomponenttype: 10,
					dependencytype: 2,
					forbiddenName: 'ignored',
				}] });
			}
			if (url.pathname.includes('EntityDefinitions')) {
				return Response.json({ LogicalName: 'msnfp_synthetictable', DisplayName: 'ignored' });
			}
			if (url.pathname.endsWith('/msdyn_solutioncomponentsummaries')) {
				return Response.json({ value: [] });
			}
			if (url.pathname.includes('RetrieveTotalRecordCount')) {
				return Response.json({
					EntityRecordCountCollection: {
						Keys: ['msnfp_synthetictable'],
						Values: ['42'],
					},
				});
			}
			const counts: Record<string, number> = {
				adx_websites: 1,
				mspp_websites: 0,
			};
			const entitySet = url.pathname.split('/').at(-1)!;
			if (entitySet in counts) {
				assert.equal(url.searchParams.get('$top'), '1');
				return Response.json({ '@odata.count': counts[entitySet], value: [] });
			}
			return Response.json({}, { status: 404 });
		},
	});

	assert.deepEqual(result.environment, {
		dataverseVersion: '9.2.26091.152',
		name: 'Synthetic Nonprofit Environment',
	});
	assert.deepEqual(result.components, {
		relevantSolutions: 1,
		relevantComponents: 6,
		componentTypes: [
			{ type: 1, count: 1 },
			{ type: 29, count: 1 },
			{ type: 61, count: 1 },
			{ type: 91, count: 1 },
			{ type: 92, count: 1 },
			{ type: 371, count: 1 },
		],
		unmanagedSolutions: 1,
		analyzedUnmanagedSolutions: 1,
		overlappingUnmanagedComponents: 2,
		productSummaries: [{
			uniqueName: 'NonprofitCore',
			componentCount: 6,
			overlappingCustomizationComponents: 4,
			customizationSolutions: ['CustomerCustom', 'PartnerManaged'],
		}],
		customizationCandidates: [{
			uniqueName: 'CustomerCustom',
			managed: false,
			publisher: 'Customer',
			componentCount: 3,
			componentTypes: [
				{ type: 29, count: 1 },
				{ type: 61, count: 1 },
				{ type: 92, count: 1 },
			],
			overlaps: [{ productUniqueName: 'NonprofitCore', componentCount: 2 }],
		}, {
			uniqueName: 'PartnerManaged',
			managed: true,
			publisher: 'PartnerPublisher',
			componentCount: 2,
			componentTypes: [{ type: 1, count: 1 }, { type: 91, count: 1 }],
			overlaps: [{ productUniqueName: 'NonprofitCore', componentCount: 2 }],
		}],
		customizationComponents: [{
			type: 1,
			objectId: TABLE_ID,
			name: 'msnfp_synthetictable',
			nameSource: 'observed',
			customizationSolutions: ['PartnerManaged'],
			productUniqueNames: ['NonprofitCore'],
		}, {
			type: 29,
			objectId: WORKFLOW_ID,
			name: 'Component type 29 (66666666)',
			nameSource: 'identifier',
			customizationSolutions: ['CustomerCustom'],
			productUniqueNames: ['NonprofitCore'],
		}, {
			type: 61,
			objectId: WEBRESOURCE_ID,
			name: 'Component type 61 (44444444)',
			nameSource: 'identifier',
			customizationSolutions: ['CustomerCustom'],
			productUniqueNames: ['NonprofitCore'],
		}, {
			type: 91,
			objectId: PLUGIN_ASSEMBLY_ID,
			name: 'Component type 91 (88888888)',
			nameSource: 'identifier',
			customizationSolutions: ['PartnerManaged'],
			productUniqueNames: ['NonprofitCore'],
		}],
		layerCustomizations: [{
			productUniqueNames: ['NonprofitCore'],
			table: null,
			tableDisplayName: null,
			type: 91,
			objectId: PLUGIN_ASSEMBLY_ID,
			name: 'Component type 91 (88888888)',
			displayName: null,
			change: 'modified',
			layer: 'managed-solution',
			solutions: ['PartnerManaged'],
			relatedTable: null,
		}, {
			productUniqueNames: ['NonprofitCore'],
			table: 'msnfp_synthetictable',
			tableDisplayName: null,
			type: 1,
			objectId: TABLE_ID,
			name: 'msnfp_synthetictable',
			displayName: null,
			change: 'modified',
			layer: 'managed-solution',
			solutions: ['PartnerManaged'],
			relatedTable: null,
		}],
		layerScan: {
			status: 'complete',
			productTables: 0,
			checkedTables: 0,
			solutionTables: 0,
			checkedSolutionTables: 0,
		},
		truncated: false,
	});
	assert.deepEqual(result.dependencies, {
		checkedComponents: 4,
		dependentReferences: 4,
		scope: 'direct-customization-overlaps',
		candidateComponents: 4,
		edges: [{
			requiredComponent: {
				type: 1,
				objectId: TABLE_ID,
				name: 'msnfp_synthetictable',
			},
			dependentComponent: {
				type: 10,
				objectId: DEPENDENT_ID,
				name: null,
			},
			dependencyType: 2,
		}, {
			requiredComponent: {
				type: 29,
				objectId: WORKFLOW_ID,
				name: 'Component type 29 (66666666)',
			},
			dependentComponent: {
				type: 10,
				objectId: DEPENDENT_ID,
				name: null,
			},
			dependencyType: 2,
		}, {
			requiredComponent: {
				type: 61,
				objectId: WEBRESOURCE_ID,
				name: 'Component type 61 (44444444)',
			},
			dependentComponent: {
				type: 10,
				objectId: DEPENDENT_ID,
				name: null,
			},
			dependencyType: 2,
		}, {
			requiredComponent: {
				type: 91,
				objectId: PLUGIN_ASSEMBLY_ID,
				name: 'Component type 91 (88888888)',
			},
			dependentComponent: {
				type: 10,
				objectId: DEPENDENT_ID,
				name: null,
			},
			dependencyType: 2,
		}],
		truncated: false,
	});
	assert.deepEqual(result.integrations, {
		workflows: 1,
		connectionReferences: 1,
		pluginAssemblies: 1,
		pluginSteps: 2,
		scope: 'selected-products-and-overlapping-customizations',
		scopedSolutions: 3,
		automations: [],
		automationScan: { status: 'complete', tables: 0, cloudFlows: 0, checkedCloudFlows: 0 },
		truncated: false,
	});
	assert.deepEqual(result.counts, {
		tables: [{
			logicalName: 'msnfp_synthetictable',
			count: 42,
			accuracy: 'snapshot-within-24-hours',
			products: ['NonprofitCore'],
		}],
		truncated: false,
	});
	assert.deepEqual(result.sites, { legacySites: 1, enhancedSites: 0, truncated: false });
	assert.ok(allCategories().every(category =>
		result.evidence.find(item => item.id === category)?.status === 'observed'));
	assert.ok(!JSON.stringify(result).includes('forbidden'));
	assert.ok(calls.length >= 13);
	assert.equal(calls.some(call => /\/(workflows|connectionreferences|pluginassemblies|sdkmessageprocessingsteps)\?/.test(call)), false);
});

test('unconsented detail categories remain explicitly not collected', async () => {
	let tokens = 0;
	const result = await collectAssessmentDetails(baseDiscovery(), {
		environmentUrl: ORIGIN,
		consent: true,
		categories: ['solutions'],
		relevantSolutionNames: ['NonprofitCore'],
		getToken: async () => {
			tokens++;
			return TOKEN;
		},
	});
	assert.equal(tokens, 0);
	assert.equal(result.environment, undefined);
	assert.equal(result.evidence.length, 1);
});

test('detail access denial is recorded without exposing response content', async () => {
	const result = await collectAssessmentDetails(baseDiscovery(), {
		environmentUrl: ORIGIN,
		consent: true,
		categories: ['solutions', 'environment'],
		relevantSolutionNames: ['NonprofitCore'],
		getToken: async () => TOKEN,
		fetch: async () => new Response('SYNTHETIC_SECRET_CANARY', { status: 403 }),
	});
	const item = result.evidence.find(entry => entry.id === 'environment');
	assert.equal(item?.status, 'access-denied');
	assert.ok(!JSON.stringify(result).includes('SYNTHETIC_SECRET_CANARY'));
});

test('scoped integration evidence inherits component collection limits', async () => {
	const result = await collectAssessmentDetails(baseDiscovery(), {
		environmentUrl: ORIGIN,
		consent: true,
		categories: ['solutions', 'components', 'integrations'],
		relevantSolutionNames: ['NonprofitCore'],
		getToken: async () => TOKEN,
		fetch: async () => Response.json({
			value: [],
			'@odata.nextLink': `${ORIGIN}/api/data/v9.2/solutioncomponents?$skiptoken=synthetic`,
		}),
	});
	assert.equal(result.integrations?.truncated, true);
	assert.equal(result.integrations?.scope, 'selected-products-and-overlapping-customizations');
	assert.equal(result.evidence.find(item => item.id === 'integrations')?.status, 'partial');
});

const FORM_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const ACTIVE_COLUMN_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const PLATFORM_COLUMN_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const HELPER_COLUMN_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const RELATIONSHIP_ID = '12121212-1212-4212-8212-121212121212';
const PARTNER_COLUMN_ID = '13131313-1313-4313-8313-131313131313';
const PARTNER_CHANGED_COLUMN_ID = '14141414-1414-4414-8414-141414141414';
const UNLISTED_COLUMN_ID = '15151515-1515-4515-8515-151515151515';
const DEFAULT_SOLUTION_ID = 'fd140aaf-4df4-11dd-bd17-0019b9312238';

function summaryRow(
	type: number,
	objectId: string,
	name: string,
	displayName: string | null,
	flags: { custom?: boolean | string | null; managed?: boolean | string; active?: boolean | string; related?: string },
) {
	return {
		msdyn_componenttype: type,
		msdyn_objectid: objectId,
		msdyn_name: name,
		msdyn_displayname: displayName,
		msdyn_iscustom: flags.custom ?? null,
		msdyn_ismanaged: flags.managed ?? true,
		msdyn_hasactivecustomization: flags.active ?? false,
		msdyn_relatedentity: flags.related ?? '',
		msdyn_componentjson: 'SYNTHETIC_DEFINITION_CANARY',
	};
}

const CONTACT_ID = '16161616-1616-4616-8616-161616161616';
const CONTACT_FORM_ID = '17171717-1717-4717-8717-171717171717';
const CONTACT_COLUMN_ID = '18181818-1818-4818-8818-181818181818';
const UNCHANGED_COLUMN_ID = '19191919-1919-4919-8919-191919191919';

function layerFetch(calls: string[], oversizedForm: boolean, partnerTableBehavior = 2): typeof globalThis.fetch {
	return async input => {
		const url = new URL(String(input));
		const filter = url.searchParams.get('$filter') ?? '';
		calls.push(`${url.pathname.split('/').at(-1)} ${filter}`);
		if (url.pathname.endsWith('/solutioncomponents')) {
			return Response.json({
				value: filter.includes(RELEVANT_ID)
					? [
						{ componenttype: 1, objectid: TABLE_ID, rootcomponentbehavior: 0 },
						{ componenttype: 1, objectid: CONTACT_ID, rootcomponentbehavior: 2 },
						{ componenttype: 2, objectid: UNCHANGED_COLUMN_ID },
					]
					: filter.includes(PARTNER_ID)
						? [
							{ componenttype: 1, objectid: TABLE_ID, rootcomponentbehavior: partnerTableBehavior },
							{ componenttype: 2, objectid: PARTNER_COLUMN_ID },
							{ componenttype: 2, objectid: PARTNER_CHANGED_COLUMN_ID },
							{ componenttype: 60, objectid: FORM_ID.toUpperCase() },
						]
						: [
							{ componenttype: 1, objectid: TABLE_ID, rootcomponentbehavior: 2 },
							{ componenttype: 2, objectid: ACTIVE_COLUMN_ID },
							{ componenttype: 2, objectid: UNCHANGED_COLUMN_ID },
						],
			});
		}
		if (url.pathname.includes('EntityDefinitions')) {
			return Response.json({ LogicalName: 'msnfp_synthetictable' });
		}
		if (url.pathname.endsWith('/msdyn_solutioncomponentsummaries')) {
			if (filter === `msdyn_solutionid eq ${RELEVANT_ID}`) {
				return Response.json({ value: [
					summaryRow(1, TABLE_ID, 'msnfp_synthetictable', 'Synthetic Table', { custom: true }),
					summaryRow(1, CONTACT_ID, 'contact', 'Contact', { custom: false }),
					summaryRow(61, WEBRESOURCE_ID, 'msnfp_/main.js', 'Main script', { active: true }),
				] });
			}
			if (filter.includes(DEFAULT_SOLUTION_ID) && filter.includes('\'contact\'')) {
				assert.match(filter, /msdyn_ismanaged eq 'true'/);
				assert.doesNotMatch(filter, /msdyn_componenttype eq 10/);
				return Response.json({ value: [
					summaryRow(60, CONTACT_FORM_ID, 'Donor', 'Donor', { active: true }),
					summaryRow(2, CONTACT_COLUMN_ID, 'cus_unrelated', 'Unrelated', { custom: true, managed: false, active: true }),
				] });
			}
			if (filter.includes(DEFAULT_SOLUTION_ID)) {
				assert.match(filter, /msdyn_primaryentityname eq 'msnfp_synthetictable'/);
				assert.match(filter, /msdyn_hasactivecustomization eq 'true'/);
				return Response.json({ value: [
					summaryRow(2, ACTIVE_COLUMN_ID, 'cus_extra', 'Extra', { custom: 'True', managed: 'False', active: 'True' }),
					summaryRow(2, PLATFORM_COLUMN_ID, 'createdby', 'Created By', { custom: false, managed: false, active: true }),
					summaryRow(2, HELPER_COLUMN_ID, 'entityimageid', null, { custom: true, managed: false, active: true }),
					summaryRow(10, RELATIONSHIP_ID, 'cus_table_msnfp', 'cus_table_msnfp', {
						custom: true, managed: false, active: true, related: 'Customer Table',
					}),
					summaryRow(60, FORM_ID, 'Main', 'Main', { active: true }),
				] });
			}
			if (filter.includes(PARTNER_ID)) {
				return Response.json({ value: [
					summaryRow(2, PARTNER_COLUMN_ID, 'partner_score', 'Score', { custom: true }),
					summaryRow(2, PARTNER_CHANGED_COLUMN_ID, 'msnfp_amount', 'Amount', { custom: true }),
					summaryRow(2, UNLISTED_COLUMN_ID, 'msnfp_unlisted', 'Unlisted', { custom: true }),
					summaryRow(60, FORM_ID, 'Main', 'Main', {}),
				] });
			}
		}
		if (url.pathname.endsWith('/msdyn_componentlayers')) {
			const layers = (...names: string[]) => Response.json({
				value: names.map((name, index) => ({ msdyn_solutionname: name, msdyn_order: index + 1 })).reverse(),
			});
			if (filter.includes(FORM_ID)) {
				assert.match(filter, /msdyn_solutioncomponentname eq 'SystemForm'/);
				return oversizedForm
					? Response.json({ value: [], padding: 'x'.repeat(600 * 1024) })
					: layers('NonprofitCore', 'PartnerManaged', 'Active');
			}
			if (filter.includes(CONTACT_FORM_ID)) {
				return layers('System', 'NonprofitCore', 'Active');
			}
			assert.match(filter, /msdyn_solutioncomponentname eq 'Attribute'/);
			return filter.includes(PARTNER_CHANGED_COLUMN_ID)
				? layers('NonprofitCore', 'PartnerManaged', 'Active')
				: layers('PartnerManaged');
		}
		return Response.json({}, { status: 404 });
	};
}

function layerRows(result: Awaited<ReturnType<typeof collectAssessmentDetails>>) {
	return result.components?.layerCustomizations?.map(item =>
		[item.table, item.type, item.name, item.change, item.layer, item.solutions.join(','), item.relatedTable]);
}

test('layer discovery names Active-layer and partner customizations per nonprofit table', async () => {
	const calls: string[] = [];
	const result = await collectAssessmentDetails(baseDiscovery(), {
		environmentUrl: ORIGIN,
		consent: true,
		categories: ['solutions', 'components'],
		relevantSolutionNames: ['NonprofitCore'],
		getToken: async () => TOKEN,
		fetch: layerFetch(calls, false),
	});

	assert.deepEqual(result.components?.layerScan, {
		status: 'complete',
		productTables: 2,
		checkedTables: 2,
		solutionTables: 1,
		checkedSolutionTables: 1,
	});
	assert.deepEqual(layerRows(result), [
		[null, 61, 'msnfp_/main.js', 'modified', 'active', '', null],
		['contact', 60, 'Donor', 'modified', 'active', '', null],
		['msnfp_synthetictable', 2, 'cus_extra', 'added', 'active', 'CustomerCustom', null],
		['msnfp_synthetictable', 2, 'msnfp_amount', 'modified', 'managed-solution', 'PartnerManaged', null],
		['msnfp_synthetictable', 2, 'partner_score', 'added', 'managed-solution', 'PartnerManaged', null],
		['msnfp_synthetictable', 10, 'cus_table_msnfp', 'added', 'active', '', 'Customer Table'],
		['msnfp_synthetictable', 60, 'Main', 'modified', 'active', '', null],
		['msnfp_synthetictable', 60, 'Main', 'modified', 'managed-solution', 'PartnerManaged', null],
	]);
	assert.ok(result.components?.layerCustomizations?.every(item => item.productUniqueNames.join() === 'NonprofitCore'));
	assert.equal(result.components?.layerCustomizations?.find(item => item.name === 'cus_extra')?.tableDisplayName, 'Synthetic Table');
	assert.equal(calls.filter(call => call.startsWith('msdyn_componentlayers')).length, 4);
	assert.equal(result.evidence.find(item => item.id === 'components')?.status, 'observed');
	assert.ok(!JSON.stringify(result).includes('SYNTHETIC_DEFINITION_CANARY'));
	assert.ok(!JSON.stringify(result).includes('cus_unrelated'));
	// An unchanged product column that only sits in the customer's unmanaged solution isn't a customization.
	assert.ok(!result.components?.layerCustomizations?.some(item => item.objectId === UNCHANGED_COLUMN_ID));
	assert.ok(result.components?.customizationComponents?.some(item => item.objectId === UNCHANGED_COLUMN_ID));
});

test('layer discovery keeps partner forms unresolved when their layer stack exceeds the response cap', async () => {
	const calls: string[] = [];
	const result = await collectAssessmentDetails(baseDiscovery(), {
		environmentUrl: ORIGIN,
		consent: true,
		categories: ['solutions', 'components'],
		relevantSolutionNames: ['NonprofitCore'],
		getToken: async () => TOKEN,
		fetch: layerFetch(calls, true),
	});
	assert.equal(result.components?.layerScan?.status, 'complete');
	const partner = result.components?.layerCustomizations?.filter(item => item.layer === 'managed-solution')
		.map(item => [item.name, item.change, item.productUniqueNames.join()]);
	assert.deepEqual(partner, [
		['msnfp_amount', 'modified', 'NonprofitCore'],
		['partner_score', 'added', 'NonprofitCore'],
		['Main', 'unknown', 'NonprofitCore'],
	]);
	assert.equal(calls.filter(call => call.startsWith('msdyn_componentlayers')).length, 4);
	assert.equal(result.evidence.find(item => item.id === 'components')?.status, 'observed');
});
test('partner solutions that layer a nonprofit table definition keep a table-level row', async () => {
	const result = await collectAssessmentDetails(baseDiscovery(), {
		environmentUrl: ORIGIN,
		consent: true,
		categories: ['solutions', 'components'],
		relevantSolutionNames: ['NonprofitCore'],
		getToken: async () => TOKEN,
		fetch: layerFetch([], false, 1),
	});
	const tableRows = result.components?.layerCustomizations?.filter(item => item.type === 1)
		.map(item => [item.table, item.layer, item.solutions.join(), item.change]);
	assert.deepEqual(tableRows, [['msnfp_synthetictable', 'managed-solution', 'PartnerManaged', 'modified']]);
});

test('unavailable layer details keep overlap evidence and mark components partial', async () => {
	const result = await collectAssessmentDetails(baseDiscovery(), {
		environmentUrl: ORIGIN,
		consent: true,
		categories: ['solutions', 'components'],
		relevantSolutionNames: ['NonprofitCore'],
		getToken: async () => TOKEN,
		fetch: async input => {
			const url = new URL(String(input));
			return url.pathname.endsWith('/solutioncomponents')
				? Response.json({ value: [] })
				: Response.json({}, { status: 404 });
		},
	});
	assert.equal(result.components?.layerScan?.status, 'unavailable');
	assert.deepEqual(result.components?.layerCustomizations, []);
	const components = result.evidence.find(item => item.id === 'components');
	assert.equal(components?.status, 'partial');
	assert.match(components?.reason ?? '', /changes made directly in the environment couldn't be listed/);
});

const ACTIVE_SOLUTION_ID = 'fd140aae-4df4-11dd-bd17-0019b9312238';
const BASIC_SOLUTION_ID = '26262626-2626-4626-8626-262626262626';
const FLOW_ON_TABLE_ID = '27272727-2727-4727-8727-272727272727';
const FLOW_ELSEWHERE_ID = '28282828-2828-4828-8828-282828282828';
const PLATFORM_FLOW_ID = '29292929-2929-4929-8929-292929292929';
const RULE_ID = '30303030-3030-4030-8030-303030303030';
const PRODUCT_PROCESS_ID = '31313131-3131-4131-8131-313131313131';
const PRODUCT_STEP_ID = '35353535-3535-4535-8535-353535353535';

test('automation discovery names customer plug-in steps, processes, and cloud flows on nonprofit tables', async () => {
	const discovery = baseDiscovery();
	discovery.solutions.push({
		solutionId: ACTIVE_SOLUTION_ID,
		uniqueName: 'Active',
		version: '1.0',
		managed: false,
		publisher: 'DefaultPublisher',
		publisherPrefix: 'new',
	}, {
		solutionId: BASIC_SOLUTION_ID,
		uniqueName: 'Basic',
		version: '1.0',
		managed: true,
		publisher: 'MicrosoftCorporation',
		publisherPrefix: 'none',
	});
	const step = (name: string, solutionid: string, table: string, extra: Record<string, unknown> = {}) => ({
		name, stage: 20, mode: 0, statecode: 0, solutionid,
		sdkmessagefilterid: { primaryobjecttypecode: table },
		sdkmessageid: { name: 'Create' },
		...extra,
	});
	const result = await collectAssessmentDetails(discovery, {
		environmentUrl: ORIGIN,
		consent: true,
		categories: ['solutions', 'components', 'integrations'],
		relevantSolutionNames: ['NonprofitCore'],
		getToken: async () => TOKEN,
		fetch: async input => {
			const url = new URL(String(input));
			const filter = url.searchParams.get('$filter') ?? '';
			if (url.pathname.endsWith('/solutioncomponents')) {
				return Response.json({ value: filter.includes(RELEVANT_ID)
					? [
						{ componenttype: 1, objectid: TABLE_ID, rootcomponentbehavior: 0 },
						{ componenttype: 92, objectid: PRODUCT_STEP_ID },
						{ componenttype: 29, objectid: PRODUCT_PROCESS_ID },
					]
					: [] });
			}
			if (url.pathname.endsWith('/msdyn_solutioncomponentsummaries')) {
				return Response.json({ value: filter === `msdyn_solutionid eq ${RELEVANT_ID}`
					? [summaryRow(1, TABLE_ID, 'msnfp_synthetictable', 'Synthetic Table', { custom: true })]
					: [] });
			}
			if (url.pathname.endsWith('/sdkmessageprocessingsteps')) {
				assert.match(filter, /^ishidden\/Value eq false and \(sdkmessagefilterid\/primaryobjecttypecode eq 'msnfp_synthetictable'\)$/);
				return Response.json({ value: [
					step('Customer: default campaign', ACTIVE_SOLUTION_ID, 'msnfp_synthetictable'),
					step('Product step', RELEVANT_ID, 'msnfp_synthetictable'),
					step('Edited product step', ACTIVE_SOLUTION_ID, 'msnfp_synthetictable', { sdkmessageprocessingstepid: PRODUCT_STEP_ID }),
					step('Partner audit', PARTNER_ID, 'msnfp_synthetictable', { stage: 40, mode: 1, statecode: 1 }),
					step('Contact step', ACTIVE_SOLUTION_ID, 'contact'),
				] });
			}
			if (url.pathname.endsWith('/workflows')) {
				if (filter.includes('category eq 5')) {
					return Response.json({ value: [
						{ workflowid: FLOW_ON_TABLE_ID, name: 'Thank donor', category: 5, primaryentity: 'none', statecode: 1, solutionid: ACTIVE_SOLUTION_ID },
						{ workflowid: PLATFORM_FLOW_ID, name: 'Platform flow', category: 5, primaryentity: 'none', statecode: 1, solutionid: BASIC_SOLUTION_ID },
						{ workflowid: FLOW_ELSEWHERE_ID, name: 'Unrelated flow', category: 5, primaryentity: 'none', statecode: 0, solutionid: ACTIVE_SOLUTION_ID },
					] });
				}
				assert.match(filter, /category ne 5 and category ne 6 and \(primaryentity eq 'msnfp_synthetictable'\)/);
				return Response.json({ value: [
					{ workflowid: RULE_ID, name: 'Require amount', category: 2, primaryentity: 'msnfp_synthetictable', statecode: 1, solutionid: ACTIVE_SOLUTION_ID },
					{ workflowid: PRODUCT_PROCESS_ID, name: 'Edited product workflow', category: 0, primaryentity: 'msnfp_synthetictable', statecode: 1, solutionid: ACTIVE_SOLUTION_ID },
				] });
			}
			if (url.pathname.includes('RetrieveRequiredComponents')) {
				assert.ok(!url.pathname.includes(PLATFORM_FLOW_ID));
				const objectId = url.pathname.match(/ObjectId=([^,)]+)/)?.[1];
				return Response.json({ value: [{
					requiredcomponentobjectid: objectId === FLOW_ON_TABLE_ID ? TABLE_ID : DEPENDENT_ID,
					requiredcomponenttype: 1,
					dependentcomponentobjectid: objectId,
					dependentcomponenttype: 29,
					dependencytype: 2,
				}] });
			}
			return Response.json({}, { status: 404 });
		},
	});
	assert.deepEqual(result.integrations?.automationScan, { status: 'complete', tables: 1, cloudFlows: 2, checkedCloudFlows: 2 });
	assert.deepEqual(result.integrations?.automations?.map(item =>
		[item.kind, item.name, item.detail, item.tables.join(), item.tableDisplayNames.join(), item.productUniqueNames.join(), item.layer, item.solution, item.enabled]), [
		['cloud-flow', 'Thank donor', 'Cloud flow', 'msnfp_synthetictable', 'Synthetic Table', 'NonprofitCore', 'active', null, true],
		['plugin-step', 'Customer: default campaign', 'Create, pre-operation, synchronous', 'msnfp_synthetictable', 'Synthetic Table', 'NonprofitCore', 'active', null, true],
		['plugin-step', 'Partner audit', 'Create, post-operation, asynchronous', 'msnfp_synthetictable', 'Synthetic Table', 'NonprofitCore', 'managed-solution', 'PartnerManaged', false],
		['process', 'Require amount', 'Business rule', 'msnfp_synthetictable', 'Synthetic Table', 'NonprofitCore', 'active', null, true],
	]);
	assert.equal(result.evidence.find(item => item.id === 'integrations')?.status, 'observed');
});
