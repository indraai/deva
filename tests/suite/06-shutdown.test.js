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

test('after stop the Deva is offline and its cleared features are reset', async () => {
	const deva = build();
	await deva.init(fresh());
	await deva.stop();
	assert.equal(deva._active, false);
	for (const item of ['_license', '_security', '_support', '_services', '_systems', 'events']) {
		assert.equal(deva[item], false, `${item} cleared`);
	}
	assert.deepEqual(deva._config, {}, '_config reset to its default');	
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

test('a stopped Deva starts again with its listeners and config', async () => {
	let heard = 0;
	const deva = build({listeners: {'restart:ping'() { heard++; }}});
	await deva.init(fresh());
	await deva.stop();
	const data = await deva.init(fresh());
	assert.equal(typeof data.ready, 'number', 'the second init walks to ready');
	assert.deepEqual(deva._config.hashes, ['md5', 'sha256', 'sha512'], '_config.hashes is rebuilt');
	assert.equal(deva.events.listenerCount('restart:ping'), 1, 'the listener is back once');
	deva.talk('restart:ping', {});
	assert.equal(heard, 1, 'the listener hears the new bus');
	await deva.stop();
});

test('stop clears vars and init restores them from the base without touching the source', async () => {
	const source = {job: {count: 0}, list: []}; // stands in for a cached agent.json import
	const deva = build({vars: source});
	const other = build({vars: source});
	await deva.init(fresh());
	deva.vars.job.count = 9;
	deva.vars.list.push('a');
	assert.deepEqual(source, {job: {count: 0}, list: []}, 'the source object is untouched');
	assert.deepEqual(other.vars, {job: {count: 0}, list: []}, 'two Devas from one source do not share vars');
	await deva.stop();
	assert.deepEqual(deva.vars, {}, 'stop clears vars');
	await deva.init(fresh());
	assert.deepEqual(deva.vars, {job: {count: 0}, list: []}, 'init restores vars from the base');
	await deva.stop();
});

test('stop removes every listener this Deva put on the event bus', async () => {
	const deva = build({listeners: {'single:ping'() {}}});
	await deva.init(fresh());
	deva.listen('single:extra', () => {});
	const bus = deva.events;
	assert.equal(bus.listenerCount('single:ping'), 1, 'init added the listeners option');
	assert.equal(bus.listenerCount('single:extra'), 1, 'listen added its handler');
	await deva.stop();
	assert.deepEqual(bus.eventNames(), [], 'nothing left on the bus');
	await deva.init(fresh());
	const again = deva.events;
	assert.equal(again.listenerCount('single:ping'), 1, 'a restart puts each listener back once');
	await deva.stop();
	assert.deepEqual(again.eventNames(), [], 'nothing left after the restart either');
});

test('after stop the Deva answers offline', async () => {
	const deva = build();
	await deva.init(fresh());
	await deva.stop();
	assert.equal(await deva.question('/hello'), deva._messages.offline);
	assert.equal(await deva.stop(), deva._messages.offline, 'a second stop is offline');
});