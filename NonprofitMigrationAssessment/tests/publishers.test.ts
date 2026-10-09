import assert from 'node:assert/strict';
import test from 'node:test';
import { isMicrosoftFirstPartyPublisher } from '../src/publishers.js';

test('first-party publisher filtering keeps customer and partner solutions visible', () => {
	for (const publisher of [
		'MicrosoftCorporation',
		'microsoftdynamics365nonprofitaccelerator',
		'microsofttechforsocialimpact',
		'dynamics365customerengagement',
		'DynamicsMKT',
		'adxstudio',
		'QMSAnchor',
	]) {
		assert.equal(isMicrosoftFirstPartyPublisher(publisher), true, publisher);
	}
	assert.equal(isMicrosoftFirstPartyPublisher('migrationtestpartner'), false);
	assert.equal(isMicrosoftFirstPartyPublisher('CustomerPublisher'), false);
});
