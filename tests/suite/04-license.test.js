"use strict";
// Deva Core Test Suite: step 4, the VLA license check
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build, client, pkg} from './_deva.js';

const TIERS = ['md5', 'sha256', 'sha512'];
const digest = (data, algo) => createHash(algo).update(JSON.stringify(data)).digest('base64');
const fresh = (changes = {}) => ({...structuredClone(client), ...changes});
const wait = ms => new Promise(res => setTimeout(res, ms));

test('the test client carries the same VLA as the package', () => {
	assert.deepEqual(client.VLA, pkg.VLA);
	assert.equal(pkg.VLA.uid, '31711622713594414221');
});

test('a good VLA activates the Deva and init() reaches ready', async () => {
	const deva = build();
	const data = await deva.init(fresh());
	assert.ok(deva._active, 'Deva is active');
	assert.equal(typeof data.ready, 'number');
	await deva.stop();
});

test('license_check() approves a matching VLA with stamped hashes', async () => {
	const deva = build();
	await deva.init(fresh());
	const approved = deva.license_check(client.VLA, deva._core.VLA);
	const vla_hash = digest(pkg.VLA, 'sha256');
	assert.equal(typeof approved.id.uid, 'string');
	assert.equal(approved.personal, vla_hash, 'personal is the sha256 of the client VLA');
	assert.equal(approved.package, vla_hash, 'package is the sha256 of the package VLA');

	// each tier covers the approval plus the tiers before it
	const walk = {...approved};
	for (const t of TIERS) delete walk[t];
	for (const t of TIERS) {
		assert.equal(approved[t], digest(walk, t), t);
		walk[t] = approved[t];
	}
	await deva.stop();
});

test('a changed VLA resolves with the invalid check message and stays inactive', async () => {
	const deva = build();
	const seen = [];
	deva.events.on('devacore:ready', () => seen.push('ready'));
	const VLA = {...structuredClone(client.VLA), uid: '00000000000000000000'};
	const result = await deva.init(fresh({VLA}));
	await wait(100);
	assert.equal(result, deva._messages.checkVLA);
	assert.equal(deva._active, false);
	assert.deepEqual(seen, [], 'no ready event');
	assert.equal(deva.license(), deva._messages.offline, 'getters stay offline');
});

test('a missing client VLA resolves with the personal VLA message and stays inactive', async () => {
	const deva = build();
	const c = fresh();
	delete c.VLA;
	const result = await deva.init(c);
	assert.equal(result, deva._messages.personalVLA);
	assert.equal(deva._active, false);
});

test('license_check() with no package VLA returns the package VLA message', () => {
	const deva = build();
	assert.equal(deva.license_check(client.VLA), deva._messages.packageVLA);
});