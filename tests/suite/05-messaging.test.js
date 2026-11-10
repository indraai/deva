"use strict";
// Deva Core Test Suite: step 5, commands, ask and answers
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import test from 'node:test';
import assert from 'node:assert/strict';
import {build, client, agent} from './_deva.js';

const TIERS = ['md5', 'sha256', 'sha512'];
const fresh = () => structuredClone(client);
const stamped = (obj, label) => { for (const t of TIERS) assert.equal(typeof obj[t], 'string', `${label} ${t}`); };

// a child Deva that answers #helper shout
const helper = () => build({
	agent: {...agent, id: 'helper', key: 'helper', profile: {...agent.profile, name: 'Helper'}},
	methods: {
		shout: packet => Promise.resolve({text: packet.q.text.toUpperCase()}),
		fail: () => Promise.reject(new Error('helper failed')),
		throws: () => { throw new Error('helper threw'); },
	},
});


// the parent Deva under test
const deva = build({
	config: {hash: {}, timeout: {ask: 200}},
	devas: {helper: helper()},
	methods: {
		greet: packet => Promise.resolve({text: `hello ${packet.q.text}`, data: {to: packet.q.text}}),
		plain: () => Promise.resolve('just text'),
	},
});

test('question() answers offline before init()', async () => {
	assert.equal(await deva.question('/greet world'), deva._messages.offline);
});

test.describe('after init', () => {
	test.before(async () => { await deva.init(fresh()); });
	test.after(async () => { await deva.stop(); });

	test('question() with no text answers the no text message', async () => {
		assert.equal(await deva.question(), deva._messages.notext);
	});

	test('a /command runs the local method and returns a stamped q and a packet', async () => {
		const packet = await deva.question('/greet world');
		assert.equal(packet.q.meta.method, 'greet');
		assert.equal(packet.q.text, 'world');
		assert.equal(packet.a.text, 'hello world');
		assert.deepEqual(packet.a.data, {to: 'world'});
		assert.equal(packet.a.meta.key, deva.agent().key);
		stamped(packet.q, 'q');
		stamped(packet.a, 'a');
	});

	test('a method that returns plain text sets a.text and leaves data false', async () => {
		const packet = await deva.question('/plain');
		assert.equal(packet.a.text, 'just text');
		assert.equal(packet.a.data, false);
	});

	test('an unknown /command answers method not found', async () => {
		const result = await deva.question('/nope here');
		assert.match(result.a.text, new RegExp(`^${deva._messages.method_not_found}`));
		assert.equal(result.a.meta.method, 'nope');
	});

	test('the question event broadcasts the packet', async () => {
		let heard = false;
		const on = packet => { heard = packet; };
		deva.events.once('devacore:question', on);
		await deva.question('/greet event');
		assert.equal(heard.q.text, 'event');
	});

	test('#helper shout asks the child Deva and returns its stamped answer', async () => {
		const packet = await deva.question('#helper shout hi there');
		assert.equal(packet.a.text, 'HI THERE');
		assert.equal(packet.a.meta.key, 'helper');
		assert.equal(packet.a.meta.method, 'shout');
		stamped(packet.a, 'a');
		stamped(packet, 'packet');
		assert.equal(deva._pending.size, 0, 'no pending asks left');
	});

	test('#helper with an unknown method answers method not found from the child', async () => {
		const result = await deva.question('#helper nope hi');
		assert.match(result.a.text, new RegExp(`^${deva._messages.method_not_found} helper nope`));
	});

	test('#helper fail rejects the asker right away with the child error', async () => {
		const started = Date.now();
		await assert.rejects(deva.question('#helper fail hi'), {message: 'helper failed'});
		assert.ok(Date.now() - started < 150, 'did not wait for the ask timeout');
		assert.equal(deva._pending.size, 0, 'the error cleans up the pending ask');
	});
	
	test('#helper throws rejects the asker right away with the child error', async () => {
		await assert.rejects(deva.question('#helper throws hi'), {message: 'helper threw'});
		assert.equal(deva._pending.size, 0, 'the error cleans up the pending ask');
	});
	
	test('#nobody resolves right away with ask target not found', async () => {
		const started = Date.now();
		assert.equal(await deva.question('#nobody shout hi'), deva._messages.noask);
		assert.ok(Date.now() - started < 150, 'fails fast, before the ask timeout');
		assert.equal(deva._pending.size, 0);
	});

	test('a silent ask target resolves with ask timeout after config.timeout.ask', async () => {
		const silent = () => {};
		deva.events.on('silent:ask', silent);
		const started = Date.now();
		assert.equal(await deva.question('#silent shout hi'), deva._messages.asktimeout);
		assert.ok(Date.now() - started >= 190, 'waited for the timeout');
		assert.equal(deva._pending.size, 0, 'timeout cleans up the pending ask');
		deva.events.removeListener('silent:ask', silent);
	});
});