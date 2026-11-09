"use strict";
// Deva Core Test Suite: step 6, stop and the shutdown chain
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import test from 'node:test';
import assert from 'node:assert/strict';
import {build, client, agent} from './_deva.js';

const TIERS = ['md5', 'sha256', 'sha512'];
const CHAIN = ['stop', 'close', 'leave', 'exit', 'shutdown'];
const fresh = () => structuredClone(client);

test('stop() answers offline before init()', async () => {
	const deva = build();
	const stopped = deva.stop();
	assert.ok(stopped instanceof Promise, 'offline stop still returns a Promise');
	assert.equal(await stopped, deva._messages.offline);
});

test('stop() runs the full chain and resolves the stamped stop data', async () => {
	const deva = build();
	await deva.init(fresh());
	const agent = deva.agent();
	const clientHash = deva.client().sha256;
	const data = await deva.stop();

	assert.equal(data.key, 'shutdown', 'the last step sets the key');
	assert.equal(data.value, agent.key);
	assert.equal(data.agent, agent.sha256);
	assert.equal(data.client, clientHash);
	for (const t of TIERS) assert.equal(typeof data[t], 'string', `stop data ${t}`);
	// every step stamps its time, in chain order.
	for (let i = 0; i < CHAIN.length; i++) {
		assert.equal(typeof data[CHAIN[i]], 'number', `${CHAIN[i]} time`);
		if (i) assert.ok(data[CHAIN[i]] >= data[CHAIN[i - 1]], `${CHAIN[i]} after ${CHAIN[i - 1]}`);
	}
});

test('each step talks its devacore event in chain order', async () => {
	const deva = build();
	await deva.init(fresh());
	const heard = [];
	for (const key of CHAIN) deva.events.on(deva._events[key], packet => heard.push(packet.key));
	await deva.stop();
	assert.deepEqual(heard, CHAIN);
});

test('the on hooks run in chain order and the Deva is cleared by onShutdown', async () => {
	const order = [];
	const next = {onStop: 'close', onClose: 'leave', onLeave: 'exit', onExit: 'shutdown'};
	const hooks = {};
	for (const name of [...Object.keys(next), 'onShutdown']) {
		hooks[name] = function (data, resolve) {
			order.push([name, Boolean(this._active)]);
			return next[name] ? this[next[name]](data, resolve) : resolve(data);
		};
	}
	const deva = build(hooks);
	await deva.init(fresh());
	await deva.stop();
	assert.deepEqual(order, [
		['onStop', true], ['onClose', true], ['onLeave', true], ['onExit', true],
		['onShutdown', false], // shutdown clears _active before its hook runs.
	]);
});

test('after stop the Deva is offline and its cleared features are false', async () => {
	const deva = build();
	await deva.init(fresh());
	await deva.stop();
	assert.equal(deva._active, false);
	for (const item of ['_license', '_security', '_support', '_services', '_systems', '_config', 'events']) {
		assert.equal(deva[item], false, `${item} cleared`);
	}
	assert.equal(await deva.question('/hello'), deva._messages.offline);
	assert.equal(await deva.stop(), deva._messages.offline, 'a second stop is offline');
});

test('stop removes every listener this Deva put on the event bus', async () => {
	const deva = build();
	await deva.init(fresh());
	const bus = deva.events;
	assert.ok(bus.eventNames().length > 0, 'init added listeners');
	await deva.stop();
	assert.deepEqual(bus.eventNames(), [], 'nothing left on the bus');
});

test('a pending ask at shutdown answers offline and leaves nothing behind', async () => {
	const deva = build({config: {hash: {}, timeout: {ask: 0}}}); // no timeout, so only shutdown can end it.
	await deva.init(fresh());
	const bus = deva.events;
	const silent = () => {};
	bus.on('silent:ask', silent);
	const asked = deva.question('#silent shout hi');
	await new Promise(r => setImmediate(r)); // let the ask get on the bus.
	assert.equal(deva._pending.size, 1, 'the ask is waiting');
	await deva.stop();
	assert.equal(await asked, deva._messages.offline, 'the waiting caller is answered');
	assert.equal(deva._pending.size, 0);
	bus.removeListener('silent:ask', silent);
	assert.deepEqual(bus.eventNames(), []);
});

test('stop() stops the child Devas first and leaves nothing on the bus', async () => {
	const order = [];
	const helper = build({
		agent: {...agent, id: 'helper', key: 'helper', profile: {...agent.profile, name: 'Helper'}},
		onShutdown(data, resolve) { order.push('helper:shutdown'); return resolve(data); },
	});
	const deva = build({devas: {helper}});
	await deva.init(fresh());
	assert.ok(helper._active, 'the child is running after init');
	const bus = deva.events;
	const heard = packet => order.push(`${packet.value}:stop`);
	bus.on(deva._events.stop, heard);
	await deva.stop();
	bus.removeListener(deva._events.stop, heard);
	assert.equal(helper._active, false, 'the child is offline');
	assert.deepEqual(order, ['helper:stop', 'helper:shutdown', 'test:stop'], 'the child finishes before the parent starts');
	assert.deepEqual(bus.eventNames(), [], 'nothing left on the bus');
});