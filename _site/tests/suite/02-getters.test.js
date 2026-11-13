"use strict";
// Deva Core Test Suite: step 2, feature getters
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import test from 'node:test';
import assert from 'node:assert/strict';
import {build, client} from './_deva.js';

const GETTERS = ['license', 'error', 'log', 'data', 'report', 'legal', 'security', 'support', 'services', 'systems'];

const deva = build();
test.before(async () => { await deva.init(structuredClone(client)); });

for (const key of GETTERS) {
	test(`${key}() returns exactly its own _${key} data`, () => {
		const got = deva[key]();
		// the getter returns a JSON copy, so compare against the same form
		assert.deepEqual(got, JSON.parse(JSON.stringify(deva[`_${key}`])));
	});

	test(`${key}() returns a copy, so changing it leaves _${key} alone`, () => {
		const got = deva[key]();
		assert.notEqual(got, deva[`_${key}`]);
		got.client_id = 'changed';
		assert.notEqual(deva[`_${key}`].client_id, 'changed');
	});

	test(`${key}() carries the client and its concerns`, () => {
		const got = deva[key]();
		assert.equal(got.client_id, client.id);
		assert.equal(got.client_name, client.profile.name);
		assert.deepEqual(got.concerns, client.features[key].concerns);
	});
}

test('getters answer offline after stop()', async () => {
	await deva.stop();
	for (const key of GETTERS) assert.equal(deva[key](), deva._messages.offline, key);
});