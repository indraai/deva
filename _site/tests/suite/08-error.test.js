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

// a child Deva whose method rejects, for the ask error test.
const failing = () => build({
	agent: {...agent, id: 'helper', key: 'helper', profile: {...agent.profile, name: 'Helper'}},
	vars: vars(),
	methods: {fail: () => Promise.reject(new Error('helper failed'))},
});
test('a local /command that rejects rejects question() with one error packet', async () => {
	const deva = build({vars: vars(), methods: {rej: () => Promise.reject(new Error('local rej'))}});
	await deva.init(fresh());
	const heard = [];
	deva.events.on(deva._events.error, packet => heard.push(packet));
	await assert.rejects(deva.question('/rej hi'), {message: 'local rej'});
	assert.equal(heard.length, 1, 'one error packet');
	assert.equal(heard[0].error.message, 'local rej');
	assert.equal(heard[0].packet.q.meta.method, 'rej', 'the error carries the question packet');
	assert.equal(deva._pending.size, 0);
	await deva.stop();
});
test('a local /command that throws rejects question() the same way', async () => {
	const deva = build({vars: vars(), methods: {thr: () => { throw new Error('local thr'); }}});
	await deva.init(fresh());
	const heard = [];
	deva.events.on(deva._events.error, packet => heard.push(packet));
	await assert.rejects(deva.question('/thr hi'), {message: 'local thr'});
	assert.equal(heard.length, 1, 'one error packet');
	assert.equal(heard[0].error.message, 'local thr');
	await deva.stop();
});
test('a child ask error is logged by both the child and the asker', async () => {
	const deva = build({vars: vars(), config: {hash: {}, timeout: {ask: 200}}, devas: {helper: failing()}});
	await deva.init(fresh());
	const heard = [];
	deva.events.on(deva._events.error, packet => heard.push(packet));
	await assert.rejects(deva.question('#helper fail hi'), {message: 'helper failed'});
	assert.equal(heard.length, 2, 'two error packets');
	assert.deepEqual(heard.map(p => p.value).sort(), [deva.agent().key, 'helper'].sort(), 'one from each Deva');
	for (const p of heard) assert.equal(p.error.message, 'helper failed');
	await deva.stop();
});
test('Feature() with an unknown feature rejects with invalid feature', async () => {
	const deva = build({vars: vars()});
	await deva.init(fresh());
	await assert.rejects(new Promise((resolve, reject) => deva.Feature('nope', resolve, reject)), e => e === deva._messages.invalidfeature);
	await deva.stop();
});
