"use strict";
// Deva Core Test Suite: step 3, the md5, sha256 and sha512 hash tiers
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {build, client} from './_deva.js';

const TIERS = ['md5', 'sha256', 'sha512'];

// independent hash, so the test does not trust deva.hash() to check itself
const digest = (data, algo) => createHash(algo).update(JSON.stringify(data)).digest('base64');

// each tier hashes the data plus every tier before it
function verifyTiers(stamped, label) {
	const base = {...stamped};
	for (const t of TIERS) delete base[t];
	const walk = {...base};
	for (const t of TIERS) {
		assert.equal(typeof stamped[t], 'string', `${label} has ${t}`);
		assert.equal(stamped[t], digest(walk, t), `${label} ${t} covers the data and the tiers before it`);
		walk[t] = stamped[t];
	}
}

const deva = build();
test.before(async () => { await deva.init(structuredClone(client)); });
test.after(async () => { await deva.stop(); });

test('hash tiers are md5, sha256, sha512 in that order', () => {
	assert.deepEqual(deva._config.hashes, TIERS);
});

test('hash() matches node:crypto in base64 for each tier', () => {
	const data = {text: 'deva', n: 108};
	for (const t of TIERS) assert.equal(deva.hash(data, t), digest(data, t), t);
	assert.equal(deva.hash(data), digest(data, 'md5'), 'md5 is the default');
});

test('manual hashing sites carry all three cumulative tiers', () => {
	verifyTiers(deva.uid(), 'uid()');
	verifyTiers(deva.client(), 'client()');
	verifyTiers(deva.agent(), 'agent()');
	verifyTiers(deva.machine(), 'machine()');
	verifyTiers(deva.state('valid', 'hash-test'), '_workflow via state()');
});

test('_stamp sites carry all three cumulative tiers', () => {
	verifyTiers(deva.core(), 'core()');
	verifyTiers(deva.info(), 'info()');
});

test('uid() fingerprint is the sha256 of license, client, agent, machine and core', () => {
	const id = deva.uid();
	const expect = digest({
		license: id.license,
		client: id.client,
		agent: id.agent,
		machine: id.machine,
		core_hash: id.core_hash,
	}, 'sha256');
	assert.equal(id.fingerprint, expect);
	assert.equal(id.core_hash, deva._core.sha256);
});

test('changing one field breaks every tier', () => {
	const stamped = deva.client();
	const tampered = {...stamped, key: `${stamped.key}x`};
	assert.throws(() => verifyTiers(tampered, 'tampered'), /md5/);
});