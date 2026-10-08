import assert from 'node:assert/strict';
import test from 'node:test';
import { DiscoverySchema, type Discovery } from '../src/contracts.js';
import { collectSolutions, validateEnvironmentUrl, type CollectionOptions } from '../src/discovery.js';

const ORIGIN = 'https://synthetic-assessment.crm.dynamics.com';
const PATH = '/api/data/v9.2/solutions';
const SELECT = 'solutionid,uniquename,version,ismanaged';
const EXPAND = 'publisherid($select=uniquename,customizationprefix)';
const TOKEN = 'SYNTHETIC_TOKEN_CANARY';
const CANARY = 'SYNTHETIC_FORBIDDEN_PAYLOAD_CANARY';
const DATE = '2026-09-29T12:00:00.000Z';
const row = (name = 'SyntheticSolution') => ({
	solutionid: '11111111-1111-4111-8111-111111111111',
	uniquename: name,
	version: '1.2.3.4',
	ismanaged: true,
	publisherid: { uniquename: 'SyntheticPublisher', customizationprefix: 'syn' },
});
const link = (token = 'next-page') => {
	const url = new URL(PATH, ORIGIN);
	url.searchParams.set('$select', SELECT);
	url.searchParams.set('$expand', EXPAND);
	url.searchParams.set('$skiptoken', token);
	return url.href;
};
const page = (value: unknown[] = [], next?: string) => Response.json({
	value,
	...(next === undefined ? {} : { '@odata.nextLink': next }),
});
const evidence = (result: Discovery) => {
	const item = result.evidence.find(item => item.id === 'solutions');
	assert.ok(item);
	return item;
};
const assertSanitized = (value: unknown) => {
	const text = JSON.stringify(value);
	assert.ok(!text.includes(CANARY));
	assert.ok(!text.includes(TOKEN));
	assert.doesNotMatch(text, /https:\/\/synthetic-assessment\.crm\.dynamics\.com(?:[/"\s]|$)/);
};
function options(fetch: typeof globalThis.fetch, extra: Partial<CollectionOptions> = {}): CollectionOptions {
	return {
		environmentUrl: ORIGIN,
		consent: true,
		getToken: async () => TOKEN,
		now: () => new Date(DATE),
		fetch,
		...extra,
	};
}

test('only public commercial Dataverse HTTPS origins are normalized', () => {
	assert.equal(validateEnvironmentUrl('HTTPS://Synthetic.crm4.dynamics.com/'), 'https://synthetic.crm4.dynamics.com');
	assert.equal(validateEnvironmentUrl('https://synthetic.crm11.dynamics.com'), 'https://synthetic.crm11.dynamics.com');
	for (const url of [
		'http://synthetic.crm.dynamics.com',
		'https://synthetic.crm.dynamics.com:443',
		'https://synthetic.crm.dynamics.com:8443',
		'https://user:password@synthetic.crm.dynamics.com',
		'https://synthetic.crm.dynamics.com/path',
		'https://synthetic.crm.dynamics.com/.',
		'https://synthetic.crm.dynamics.com/%2e',
		'https://synthetic.crm.dynamics.com/?q=1',
		'https://synthetic.crm.dynamics.com/#fragment',
		'https://synthetic.crm.dynamics.com?',
		'https://synthetic.crm.dynamics.com#',
		'https://synthetic.crm.dynamics.com\\',
		'https://synthetic.crm.dynamics.com.attacker.example',
		'https://synthetic.crm.dynamics.com.',
		'https://127.0.0.1',
		'https://[::1]',
		'https://localhost',
		'https://synthetic.example',
		'https://crm.dynamics.com',
		'https://synthetic.crm.microsoftdynamics.us',
		'https://synthetic.crm.dynamics.cn',
		'https://-synthetic.crm.dynamics.com',
		'https://synthetic.crm.dynamics.com\n',
	]) {
		assert.throws(() => validateEnvironmentUrl(url), /^Error: Invalid public Dataverse environment origin\.$/);
	}
});

test('consent and configuration validation happen before credentials or transport', async () => {
	let calls = 0;
	const opts = options(async () => { calls++; return page(); }, {
		getToken: async () => { calls++; return TOKEN; },
	});
	await assert.rejects(collectSolutions({ ...opts, consent: false }), /consent is required/);
	await assert.rejects(collectSolutions({ ...opts, environmentUrl: `https://${CANARY}.example` }), /Invalid public/);
	for (const limits of [
		{ maxPages: 0 }, { maxPages: 101 }, { maxPages: 1.5 },
		{ maxRetries: -1 }, { maxRetries: 6 }, { maxRetries: NaN },
		{ timeoutMs: 0 }, { timeoutMs: Infinity }, { timeoutMs: 900_001 },
	]) {
		await assert.rejects(collectSolutions({ ...opts, ...limits }), /Invalid discovery limits/);
	}
	await assert.rejects(collectSolutions({ ...opts, now: () => new Date(NaN) }), /Invalid discovery clock/);
	assert.equal(calls, 0);
});

test('approved GET projection, credential isolation, and unknown evidence are exact', async () => {
	let calls = 0;
	const result = await collectSolutions(options(async (input, init) => {
		calls++;
		const url = new URL(String(input));
		assert.equal(url.origin, ORIGIN);
		assert.equal(url.pathname, PATH);
		assert.deepEqual([...url.searchParams], [['$select', SELECT], ['$expand', EXPAND]]);
		assert.equal(init?.method, 'GET');
		assert.equal(init?.redirect, 'manual');
		assert.equal(init?.credentials, 'omit');
		assert.equal(init?.referrerPolicy, 'no-referrer');
		assert.equal(init?.body, undefined);
		assert.ok(init?.signal instanceof AbortSignal);
		const headers = new Headers(init?.headers);
		assert.equal(headers.get('authorization'), `Bearer ${TOKEN}`);
		assert.equal(headers.get('accept'), 'application/json');
		return Response.json({
			value: [{
				...row(),
				description: CANARY,
				secret: CANARY,
				businessContents: { value: CANARY },
				publisherid: { ...row().publisherid, description: CANARY },
			}],
			'@odata.context': `${ORIGIN}/${CANARY}`,
			debug: TOKEN,
		});
	}));
	assert.equal(calls, 1);
	assert.equal(result.collectedAt, DATE);
	assert.deepEqual(result.solutions, [{
		solutionId: '11111111-1111-4111-8111-111111111111',
		uniqueName: 'SyntheticSolution',
		version: '1.2.3.4',
		managed: true,
		publisher: 'SyntheticPublisher',
		publisherPrefix: 'syn',
	}]);
	assert.deepEqual(evidence(result), {
		id: 'solutions', source: 'observed', status: 'observed', collectedAt: DATE,
		collector: 'dataverse-solutions', scope: 'environment', inputs: [],
		reason: 'The approved solution metadata query completed.',
	});
	assert.deepEqual(result.evidence.slice(1).map(item => [item.id, item.source, item.status, item.collectedAt]), [
		['environment', 'not-collected', 'unknown', null],
		['components', 'not-collected', 'unknown', null],
		['dependencies', 'not-collected', 'unknown', null],
		['integrations', 'not-collected', 'unknown', null],
		['counts', 'not-collected', 'unknown', null],
		['sites', 'not-collected', 'unknown', null],
	]);
	assert.ok(result.evidence.slice(1).every(item => item.reason === 'This category was not collected.'));
	assert.ok(DiscoverySchema.safeParse(result).success);
});

test('platform solution versions and empty current publisher prefixes remain valid observations', async () => {
	const result = await collectSolutions(options(async () => page([
		{ ...row('System'), version: '5.0', publisherid: { uniquename: 'MicrosoftCorporation', customizationprefix: '' } },
		{ ...row('LongVersion'), version: '9.1.2024084.240815018' },
		{ ...row('TrimmedVersion'), version: '9.0.2404.3002 ' },
	])));
	assert.equal(evidence(result).status, 'observed');
	assert.deepEqual(result.solutions.map(item => [item.uniqueName, item.version, item.publisherPrefix]), [
		['System', '5.0', ''],
		['LongVersion', '9.1.2024084.240815018', 'syn'],
		['TrimmedVersion', '9.0.2404.3002', 'syn'],
	]);
	assertSanitized(result);
});

test('complete empty inventory is observed, not fabricated evidence of dependencies', async () => {
	const result = await collectSolutions(options(async () => page()));
	assert.deepEqual(result.solutions, []);
	assert.equal(evidence(result).status, 'observed');
	assert.equal(result.evidence.find(item => item.id === 'dependencies')?.status, 'unknown');
});

test('trusted pagination is rebuilt, deduplicated, and uses one credential acquisition', async () => {
	let calls = 0;
	let tokens = 0;
	const result = await collectSolutions(options(async input => {
		calls++;
		if (calls === 1) {
			return page([row()], link('synthetic & $select=description'));
		}
		const url = new URL(String(input));
		assert.equal(url.searchParams.get('$select'), SELECT);
		assert.equal(url.searchParams.get('$skiptoken'), 'synthetic & $select=description');
		assert.equal([...url.searchParams].length, 3);
		return page([row(), row('OtherSolution')]);
	}, { getToken: async () => { tokens++; return TOKEN; } }));
	assert.equal(calls, 2);
	assert.equal(tokens, 1);
	assert.equal(result.solutions.length, 2);
	assert.equal(evidence(result).status, 'observed');
});

test('same-path relative pagination with page is allowed', async () => {
	let calls = 0;
	const next = new URL(link());
	next.searchParams.delete('$skiptoken');
	next.searchParams.set('page', '2');
	const result = await collectSolutions(options(async input => {
		calls++;
		if (calls === 1) {
			return page([row()], next.pathname + next.search);
		}
		assert.equal(new URL(String(input)).searchParams.get('page'), '2');
		return page();
	}));
	assert.equal(calls, 2);
	assert.equal(evidence(result).status, 'observed');
});

test('untrusted pagination origin, path, credentials, fragments, and queries fail closed', async () => {
	const unsafe = [
		link().replace(ORIGIN, 'https://attacker.example'),
		link().replace(ORIGIN, 'https://other.crm.dynamics.com'),
		link().replace('https://', 'http://'),
		link().replace('https://', `https://${CANARY}@`),
		link().replace(ORIGIN, `${ORIGIN}:443`),
		link().replace('/solutions?', '/accounts?'),
		link().replace('/solutions?', '/%73olutions?'),
		link().replace('/solutions?', '/other/../solutions?'),
		link().replace(ORIGIN, '//synthetic-assessment.crm.dynamics.com'),
		`${link()}#${CANARY}`,
		`${link()}&$select=description`,
		`${link()}&$expand=publisherid`,
		`${link()}&$filter=ismanaged%20eq%20true`,
		`${link()}&$top=1`,
		`${link()}&$count=true`,
		`${link()}&$skiptoken=duplicate`,
		`${link()}&page=0`,
		`${link()}&page=2&$page=3`,
		`${link()}&fetchXml=${CANARY}`,
		`${ORIGIN}${PATH}?$skiptoken=missing-original-query`,
		link().replace(encodeURIComponent(SELECT), 'description'),
		link(''),
		link('\n'),
	];
	for (const next of unsafe) {
		let calls = 0;
		const result = await collectSolutions(options(async () => {
			calls++;
			return page([row()], next);
		}));
		assert.equal(calls, 1);
		assert.equal(result.solutions.length, 1);
		assert.equal(evidence(result).status, 'partial');
		assert.match(evidence(result).reason, /Pagination/);
		assertSanitized(result);
	}
});

test('redirect responses are rejected without requesting the location or reading their bodies', async () => {
	for (const code of [301, 302, 303, 307, 308]) {
		let calls = 0;
		const result = await collectSolutions(options(async () => {
			calls++;
			return new Response(CANARY, { status: code, headers: { location: `https://attacker.example/${TOKEN}` } });
		}));
		assert.equal(calls, 1);
		assert.equal(evidence(result).status, 'error');
		assert.match(evidence(result).reason, /redirects/);
		assertSanitized(result);
	}
	const redirected = page([row()]);
	Object.defineProperty(redirected, 'redirected', { value: true });
	const result = await collectSolutions(options(async () => redirected));
	assert.equal(evidence(result).status, 'error');
	assert.deepEqual(result.solutions, []);
});

test('malformed pagination metadata retains validated entries but never reports completion', async () => {
	for (const next of [null, {}, ['invalid'], '', 'x'.repeat(16_385)]) {
		let calls = 0;
		const result = await collectSolutions(options(async () => {
			calls++;
			return Response.json({ value: [row()], '@odata.nextLink': next });
		}));
		assert.equal(calls, 1);
		assert.equal(result.solutions.length, 1);
		assert.equal(evidence(result).status, 'partial');
		assert.match(evidence(result).reason, /Pagination/);
	}
});

test('denial after a successful page retains validated data and reports access-denied', async () => {
	for (const status of [401, 403]) {
		let calls = 0;
		const result = await collectSolutions(options(async () => {
			calls++;
			return calls === 1 ? page([row()], link()) : new Response(`${CANARY} ${TOKEN} ${ORIGIN}`, { status });
		}));
		assert.equal(calls, 2);
		assert.equal(result.solutions.length, 1);
		assert.equal(evidence(result).status, 'access-denied');
		assertSanitized(result);
	}
});

test('credential failures and invalid tokens never enter errors, inventory, or requests', async () => {
	let calls = 0;
	for (const getToken of [
		async () => { throw new Error(`${CANARY} ${TOKEN} ${ORIGIN}`); },
		async () => '',
		async () => `${TOKEN}\r\nX-Secret: ${CANARY}`,
	]) {
		const result = await collectSolutions(options(async () => { calls++; return page(); }, { getToken }));
		assert.equal(evidence(result).status, 'error');
		assert.match(evidence(result).reason, /Authentication/);
		assertSanitized(result);
	}
	assert.equal(calls, 0);
});

test('untrusted transport errors and failed server bodies remain sanitized', async () => {
	const cases: Array<typeof globalThis.fetch> = [
		async () => { throw new Error(`${CANARY} ${TOKEN} ${ORIGIN}`); },
		async () => new Response(`${CANARY} ${TOKEN} ${ORIGIN}`, { status: 400 }),
		async () => new Response(`${CANARY} ${TOKEN} ${ORIGIN}`, { headers: { 'content-type': 'application/json' } }),
		async () => new Response(CANARY, { headers: { 'content-type': 'text/html' } }),
		async () => Response.json({ value: CANARY }),
	];
	for (const fetch of cases) {
		const result = await collectSolutions(options(fetch, { maxRetries: 0 }));
		assert.equal(evidence(result).status, 'error');
		assertSanitized(result);
	}
});

test('missing, null, coerced, or malformed identities remain unknown rather than false or zero', async () => {
	const result = await collectSolutions(options(async () => page([
		row(),
		{ ...row('MissingManaged'), ismanaged: undefined },
		{ ...row('NullManaged'), ismanaged: null },
		{ ...row('NumericManaged'), ismanaged: 0 },
		{ ...row('StringManaged'), ismanaged: 'false' },
		{ ...row('MissingVersion'), version: undefined },
		{ ...row('MalformedVersion'), version: '' },
		{ ...row('MissingPublisher'), publisherid: null },
		{ ...row('MissingPrefix'), publisherid: { uniquename: 'SyntheticPublisher' } },
		{ ...row(), uniquename: `<script>${CANARY}</script>` },
		null,
	])));
	assert.equal(result.solutions.length, 1);
	assert.equal(evidence(result).status, 'partial');
	assert.match(evidence(result).reason, /unknown/);
	assertSanitized(result);
	const allMissing = await collectSolutions(options(async () => page([{}])));
	assert.equal(evidence(allMissing).status, 'error');
	assert.deepEqual(allMissing.solutions, []);
	const unmanaged = await collectSolutions(options(async () => page([{ ...row(), ismanaged: false }])));
	assert.equal(unmanaged.solutions[0]?.managed, false);
	assert.equal(evidence(unmanaged).status, 'observed');
});

test('conflicting duplicates are omitted, and unrelated validated entries are retained', async () => {
	const result = await collectSolutions(options(async () => page([
		row('Unrelated'), row(), { ...row(), version: '9.9.9.9' },
	])));
	assert.deepEqual(result.solutions.map(item => item.uniqueName), ['Unrelated']);
	assert.equal(evidence(result).status, 'partial');
	assert.match(evidence(result).reason, /Conflicting duplicate/);
});

test('pre-cancellation prevents authentication and network access', async () => {
	let calls = 0;
	const controller = new AbortController();
	controller.abort(new Error(CANARY));
	const result = await collectSolutions(options(async () => { calls++; return page(); }, {
		signal: controller.signal,
		getToken: async () => { calls++; return TOKEN; },
	}));
	assert.equal(calls, 0);
	assert.equal(evidence(result).status, 'error');
	assert.match(evidence(result).reason, /canceled/);
	assertSanitized(result);
});

test('canceling an uncooperative credential provider resolves without network access', async () => {
	let calls = 0;
	const controller = new AbortController();
	const result = await collectSolutions(options(async () => { calls++; return page(); }, {
		signal: controller.signal,
		getToken: () => {
			setTimeout(() => controller.abort(CANARY), 5);
			return new Promise<string>(() => undefined);
		},
	}));
	assert.equal(calls, 0);
	assert.equal(evidence(result).status, 'error');
	assert.match(evidence(result).reason, /canceled/);
	assertSanitized(result);
});

test('cancellation after a page keeps partial data and prevents retries', async () => {
	let calls = 0;
	const controller = new AbortController();
	const result = await collectSolutions(options(async () => {
		calls++;
		if (calls === 1) {
			return page([row()], link());
		}
		controller.abort(CANARY);
		throw new Error(TOKEN);
	}, { signal: controller.signal }));
	assert.equal(calls, 2);
	assert.equal(evidence(result).status, 'partial');
	assert.equal(result.solutions.length, 1);
	assert.match(evidence(result).reason, /canceled/);
	assertSanitized(result);
});

test('total deadline bounds uncooperative credentials, fetch, and body reads', async () => {
	let canceled = false;
	const cases = [
		options(async () => page(), { getToken: () => new Promise<string>(() => undefined) }),
		options(() => new Promise<Response>(() => undefined)),
		options(async () => new Response(new ReadableStream<Uint8Array>({
			pull: () => new Promise<void>(() => undefined),
			cancel: () => { canceled = true; },
		}), { headers: { 'content-type': 'application/json' } })),
	];
	for (const item of cases) {
		const result = await collectSolutions({ ...item, timeoutMs: 20 });
		assert.equal(evidence(result).status, 'error');
		assert.match(evidence(result).reason, /time budget/);
		assertSanitized(result);
	}
	assert.equal(canceled, true);
});

test('throttled and transient requests retry only within the configured budget', async () => {
	for (const code of [429, 500, 502, 503, 504]) {
		let calls = 0;
		const result = await collectSolutions(options(async () => {
			calls++;
			return calls === 1
				? new Response(CANARY, { status: code, headers: { 'retry-after': '0' } })
				: page([row()]);
		}, { maxRetries: 1 }));
		assert.equal(calls, 2);
		assert.equal(evidence(result).status, 'observed');
		assertSanitized(result);
	}
	let calls = 0;
	const result = await collectSolutions(options(async () => {
		calls++;
		return new Response(CANARY, { status: 429, headers: { 'retry-after': '0' } });
	}, { maxRetries: 2 }));
	assert.equal(calls, 3);
	assert.equal(evidence(result).status, 'error');
	assert.match(evidence(result).reason, /bounded retries/);
	assertSanitized(result);
});

test('transient network failure is retried, without exposing its diagnostics', async () => {
	let calls = 0;
	const result = await collectSolutions(options(async () => {
		if (++calls === 1) {
			throw new Error(CANARY);
		}
		return page([row()]);
	}, { maxRetries: 1 }));
	assert.equal(calls, 2);
	assert.equal(evidence(result).status, 'observed');
	assertSanitized(result);
});

test('server-controlled retry delays cannot exceed the budget or escape cancellation', async () => {
	for (const retryAfter of ['99999999999999', CANARY]) {
		let calls = 0;
		const result = await collectSolutions(options(async () => {
			calls++;
			return new Response(CANARY, { status: 429, headers: { 'retry-after': retryAfter } });
		}));
		assert.equal(calls, 1);
		assert.equal(evidence(result).status, 'error');
		assert.match(evidence(result).reason, /retry delay/);
		assertSanitized(result);
	}
	let calls = 0;
	const result = await collectSolutions(options(async () => {
		calls++;
		return new Response(CANARY, { status: 429, headers: { 'retry-after': '1' } });
	}, { timeoutMs: 20 }));
	assert.equal(calls, 1);
	assert.match(evidence(result).reason, /time budget/);
});

test('page budget and repeated pagination preserve incomplete status and partial records', async () => {
	let calls = 0;
	const limited = await collectSolutions(options(async () => {
		calls++;
		return page([row()], link());
	}, { maxPages: 1 }));
	assert.equal(calls, 1);
	assert.equal(limited.solutions.length, 1);
	assert.equal(evidence(limited).status, 'partial');
	assert.match(evidence(limited).reason, /page budget/);
	calls = 0;
	const repeated = await collectSolutions(options(async () => {
		calls++;
		return page([row()], link());
	}));
	assert.equal(calls, 2);
	assert.equal(evidence(repeated).status, 'partial');
	assert.match(evidence(repeated).reason, /repeated/);
});

test('per-response byte budget applies to declared sizes and streamed bytes', async () => {
	for (const declared of [true, false]) {
		let calls = 0;
		const result = await collectSolutions(options(async () => {
			calls++;
			return new Response(JSON.stringify({ value: [row()], padding: 'x'.repeat(1024 * 1024) }), {
				headers: {
					'content-type': 'application/json',
					...(declared ? { 'content-length': String(2 * 1024 * 1024) } : {}),
				},
			});
		}));
		assert.equal(calls, 1);
		assert.deepEqual(result.solutions, []);
		assert.equal(evidence(result).status, 'error');
		assert.match(evidence(result).reason, /byte budget/);
	}
});

test('aggregate byte budget bounds multiple individually valid pages', async () => {
	let calls = 0;
	const result = await collectSolutions(options(async () => {
		calls++;
		return Response.json({
			value: [row(`Synthetic${calls}`)],
			'@odata.nextLink': link(String(calls)),
			padding: 'x'.repeat(900_000),
		});
	}));
	assert.equal(calls, 5);
	assert.equal(result.solutions.length, 4);
	assert.equal(evidence(result).status, 'partial');
	assert.match(evidence(result).reason, /byte budget/);
});
