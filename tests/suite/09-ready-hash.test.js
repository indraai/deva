"use strict";
// Deva Core Test Suite: step 9, the _binding ready hash
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import test from 'node:test';
import assert from 'node:assert/strict';
import {build, client, agent} from './_deva.js';

const fresh = () => structuredClone(client);
const vars = () => structuredClone(agent.vars);

// identical source on every call, so two Devas hash the same _binding strings
const same = () => ({
	config: {hash: {}},
	vars: vars(),
	func: { ping() { return 'pong'; } },
	methods: { greet() { return 'hi'; } },
	utils: { clip(s) { return s.trim(); } },
	listeners: { 'suite:ready'(packet) { return packet; } },
});

const readyHash = deva => deva.config.hash[deva.agent().key];

test('the ready hash is stable across two Devas with identical functions', async () => {
	const a = build(same());
	const b = build(same());
	await a.init(fresh());
	await b.init(fresh());
	assert.deepEqual(readyHash(a), readyHash(b));
	for (const item of ['func', 'methods', 'utils', 'listeners']) {
		assert.equal(typeof readyHash(a)[item], 'string', item);
	}
	await a.stop();
	await b.stop();
});

test('changing a func or method source before ready changes the hash', async () => {
	const a = build(same());
	const b = build({
		...same(),
		func: { ping() { return 'pong-changed'; } },
		methods: { greet() { return 'hi-changed'; } },
	});
	await a.init(fresh());
	await b.init(fresh());
	assert.notEqual(readyHash(a).func, readyHash(b).func, 'func source change');
	assert.notEqual(readyHash(a).methods, readyHash(b).methods, 'method source change');
	assert.equal(readyHash(a).utils, readyHash(b).utils, 'unchanged utils stay the same');
	assert.equal(readyHash(a).listeners, readyHash(b).listeners, 'unchanged listeners stay the same');
	await a.stop();
	await b.stop();
});

test('a listener added after ready with listen() does not change the stored ready hash', async () => {
	const deva = build(same());
	await deva.init(fresh());
	const before = structuredClone(readyHash(deva));
	deva.listen('suite:after', () => {});
	assert.deepEqual(readyHash(deva), before, 'stored ready hash is unchanged');
	assert.equal('suite:after' in deva.listeners, true, 'listen() still registers the listener');
	assert.equal('suite:after' in (deva._binding.get('listeners') || {}), false, 'the new listener is not folded into _binding');
	await deva.stop();
});