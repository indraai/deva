"use strict";
// Deva Core Test Suite: step 8, err() and the context lookups
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import test from 'node:test';
import assert from 'node:assert/strict';
import {build, client, agent} from './_deva.js';

const TIERS = ['md5', 'sha256', 'sha512'];
const fresh = () => structuredClone(client);
// each test gets its own vars so a delete never reaches the shared agent.json data.
const vars = () => structuredClone(agent.vars);

test('err() rejects with the same error and never calls context()', async () => {
	const deva = build({vars: vars()});
	await deva.init(fresh());
	let calls = 0;
	const context = deva.context;
	deva.context = (...args) => { calls++; return context.apply(deva, args); };
	const before = deva._context;
	const boom = new Error('boom');

	await assert.rejects(deva.err(boom, {test: true}), e => e === boom);
	assert.equal(calls, 0, 'err() does not call context()');
	assert.equal(deva._context, before, 'err() leaves _context alone');
});

test('err() talks one stamped error packet on the error event', async () => {
	const deva = build({vars: vars()});
	await deva.init(fresh());
	const heard = [];
	deva.events.on(deva._events.error, packet => heard.push(packet));
	const boom = new Error('boom');

	await deva.err(boom, {test: true}).catch(() => {});
	assert.equal(heard.length, 1, 'one error packet');
	const data = heard[0];
	assert.equal(data.key, 'error');
	assert.equal(data.error.message, 'boom');
	assert.deepEqual(data.packet, {test: true});
	for (const t of TIERS) assert.equal(typeof data[t], 'string', `error data ${t}`);
});

test('err() hands err, packet and reject to onError and returns its result', async () => {
	let seen;
	const deva = build({
		vars: vars(),
		onError(err, packet, reject) {
			seen = {err, packet, reject};
			return 'handled';
		},
	});
	await deva.init(fresh());
	const boom = new Error('boom');
	const reject = () => {};

	assert.equal(await deva.err(boom, {test: true}, reject), 'handled');
	assert.equal(seen.err, boom);
	assert.deepEqual(seen.packet, {test: true});
	assert.equal(seen.reject, reject);
});

test('context() without vars.context returns a stamped packet instead of overflowing', async () => {
	const deva = build({vars: vars()});
	await deva.init(fresh());
	delete deva.vars.context;

	const data = deva.context('hello', 'world');
	assert.equal(data.key, 'context');
	assert.equal(data.value, 'hello');
	assert.equal(data.text, 'hello world', 'falls back to the raw value');
	for (const t of TIERS) assert.equal(typeof data[t], 'string', `context data ${t}`);
});

test('context() looks the value up in this Deva\'s own vars.context', async () => {
	const deva = build({vars: vars()});
	await deva.init(fresh());
	const [key, text] = Object.entries(agent.vars.context)[0];

	const data = deva.context(key);
	assert.equal(data.value, key);
	assert.equal(data.text, text);
});

test('contexts() returns this Deva\'s vars.context, or false when it has none', async () => {
	const deva = build({vars: vars()});
	await deva.init(fresh());

	const data = deva.contexts();
	assert.equal(data.key, 'contexts');
	assert.deepEqual(data.value, deva.vars.context);
	for (const t of TIERS) assert.equal(typeof data[t], 'string', `contexts data ${t}`);

	delete deva.vars.context;
	assert.equal(deva.contexts().value, false);
});
