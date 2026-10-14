import assert from 'node:assert/strict';
import test from 'node:test';
import { formatEnvironmentList, listEnvironments } from '../src/environments.js';

const TOKEN = 'SYNTHETIC_DISCOVERY_TOKEN';

function instance(name: string, url: string, overrides: Record<string, unknown> = {}) {
	return {
		FriendlyName: name,
		UrlName: name.toLowerCase(),
		Url: url,
		State: 0,
		Region: 'GBR',
		IsUserSysAdmin: true,
		TenantId: 'ignored',
		...overrides,
	};
}

test('environment list keeps commercial Dataverse environments, sorted, with access hints', async () => {
	let requested = '';
	const listings = await listEnvironments({
		getToken: async () => TOKEN,
		fetch: async (input, init) => {
			requested = String(input);
			assert.equal(init?.method, 'GET');
			assert.equal(init?.redirect, 'manual');
			assert.equal(new Headers(init?.headers).get('authorization'), `Bearer ${TOKEN}`);
			return Response.json({ value: [
				instance('Zeta Production', 'https://zeta.crm.dynamics.com', { IsUserSysAdmin: false }),
				instance('Alpha Sandbox', 'https://alpha.crm11.dynamics.com', { State: 1, Region: null }),
				instance('Government', 'https://gov.crm.microsoftdynamics.us'),
				instance('Lookalike', 'https://contoso.crm.dynamics.com.evil.example'),
			] });
		},
	});
	assert.equal(requested, 'https://globaldisco.crm.dynamics.com/api/discovery/v2.0/Instances');
	assert.deepEqual(listings, [
		{ name: 'Alpha Sandbox', url: 'https://alpha.crm11.dynamics.com', region: null, enabled: false, systemAdministrator: true },
		{ name: 'Zeta Production', url: 'https://zeta.crm.dynamics.com', region: 'GBR', enabled: true, systemAdministrator: false },
	]);
	assert.equal(formatEnvironmentList(listings), [
		'Dataverse environments you can access:',
		'1. Alpha Sandbox — https://alpha.crm11.dynamics.com (System Administrator; disabled)',
		'2. Zeta Production — https://zeta.crm.dynamics.com (GBR; not System Administrator)',
	].join('\n'));
	assert.equal(formatEnvironmentList([]), 'No commercial Dataverse environments were found for the signed-in account.');
});

test('environment list failures give fixed guidance without server content', async () => {
	const cases: Array<[typeof globalThis.fetch | undefined, () => Promise<string>, RegExp]> = [
		[undefined, async () => { throw new Error('SECRET_AUTH_DETAIL'); }, /az login/],
		[async () => new Response('SECRET_BODY', { status: 403 }), async () => TOKEN, /denied/],
		[async () => new Response(null, { status: 302, headers: { location: 'https://evil.example' } }), async () => TOKEN, /unsuccessful/],
		[async () => Response.json({ value: 'SECRET_SHAPE' }), async () => TOKEN, /invalid/],
		[async () => Response.json({ value: [], padding: 'x'.repeat(1024 * 1024) }), async () => TOKEN, /could not be read/],
	];
	for (const [fetch, getToken, expected] of cases) {
		await assert.rejects(() => listEnvironments({ getToken, ...(fetch ? { fetch } : {}) }), (error: Error) => {
			assert.match(error.message, expected);
			assert.ok(!error.message.includes('SECRET'));
			return true;
		});
	}
});
