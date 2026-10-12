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
