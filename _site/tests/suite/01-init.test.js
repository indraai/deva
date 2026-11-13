"use strict";
// Deva Core Test Suite: step 1, init and lifecycle
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import test from 'node:test';
import assert from 'node:assert/strict';
import {build, client} from './_deva.js';

const STAGES = ['start', 'enter', 'done', 'ready'];
const TIERS = ['md5', 'sha256', 'sha512'];

// fresh copy of the client so no test changes another's data
const fresh = (changes = {}) => ({...structuredClone(client), ...changes});
const wait = ms => new Promise(res => setTimeout(res, ms));
const status = (p, ms) => Promise.race([
	p.then(() => 'resolved', () => 'rejected'),
	wait(ms).then(() => 'pending'),
]);

test('init() with no hooks resolves with the ready data', async () => {
	const deva = build();
	const data = await deva.init(fresh());
	for (const k of STAGES) assert.equal(typeof data[k], 'number', `${k} timestamp`);
	assert.ok(data.start <= data.enter && data.enter <= data.done && data.done <= data.ready, 'stages in order');
	assert.equal(data.value, 'init');
	assert.equal(typeof data.id.uid, 'string');
	for (const t of TIERS) assert.equal(typeof data[t], 'string', `${t} hash`);
	await deva.stop();
});

test('init() waits for onReady to resolve', async () => {
	const order = [];
	let release;
	const deva = build({
		onReady(data, resolve) {
			order.push('onReady');
			release = () => { order.push('hook-resolve'); resolve(data); };
		},
	});
	deva.events.on('devacore:ready', () => order.push('ready-event'));
	const p = deva.init(fresh()).then(data => { order.push('await'); return data; });

	await wait(400);
	assert.equal(await status(p, 50), 'pending', 'init still pending before the hook resolves');
	assert.deepEqual(order, ['ready-event', 'onReady']);

	release();
	const data = await p;
	assert.deepEqual(order, ['ready-event', 'onReady', 'hook-resolve', 'await']);
	for (const k of STAGES) assert.equal(typeof data[k], 'number', `${k} timestamp`);
	await deva.stop();
});

test('a failing feature step rejects init() and stops the chain', async () => {
	const seen = [];
	const deva = build({ onReady(data, resolve) { seen.push('onReady'); resolve(data); } });
	for (const e of ['start', 'ready']) deva.events.on(`devacore:${e}`, () => seen.push(e));
	deva.events.on('devacore:action', p => { if (p.value === 'feature') seen.push(p.text); });

	await assert.rejects(deva.init(fresh({features: {}})));
	await wait(200);
	assert.ok(!seen.includes('start') && !seen.includes('ready') && !seen.includes('onReady'), 'no lifecycle after the failure');
	assert.ok(seen.some(t => t.includes('Feature:license')), 'license step ran');
	assert.ok(!seen.some(t => /Feature:(error|log|data|report|legal|security|support|services|systems):/.test(t)), 'no later feature steps');
});

test('onError that calls reject rejects init()', async () => {
	const deva = build({ onError(err, packet, reject) { return reject && reject(err); } });
	await assert.rejects(deva.init(fresh({features: {}})));
});

test('onError that never calls reject leaves init() pending (the hook owns the outcome)', async () => {
	const deva = build({ onError() {} });
	assert.equal(await status(deva.init(fresh({features: {}})), 500), 'pending');
});