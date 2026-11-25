"use strict";
// Deva Core Test Suite: step 7, the help system
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {build, client, info} from './_deva.js';

// help() reads <help_dir>/help/<file>.feecting, so the suite folder is the help_dir.
const DIR = info.dir;
const read = file => readFileSync(join(DIR, 'help', `${file}.feecting`), 'utf8');
// the exact text between ::BEGIN:<PART> and ::END:<PART>
const section = (file, part) => read(file).split(`::BEGIN:${part}`)[1].split(`::END:${part}`)[0];

// collect the error events and the help state and intent records during one help() call.
async function watch(deva, run) {
	const seen = {error: 0, valid: 0, good: 0, invalid: [], bad: []};
	const onError = () => seen.error++;
	const onState = d => {
		if (!d.text.includes('help:')) return;
		if (d.value === 'valid') seen.valid++;
		if (d.value === 'invalid') seen.invalid.push(d.text.split('help:')[1].split(':').slice(0, 2).join(':'));
	};
	const onIntent = d => {
		if (!d.text.includes('help:')) return;
		if (d.value === 'good') seen.good++;
		if (d.value === 'bad') seen.bad.push(d.text.split('help:')[1].split(':').slice(0, 2).join(':'));
	};
	deva.events.on(deva._events.error, onError);
	deva.events.on(deva._events.state, onState);
	deva.events.on(deva._events.intent, onIntent);
	try { seen.result = await run(); }
	finally {
		deva.events.removeListener(deva._events.error, onError);
		deva.events.removeListener(deva._events.state, onState);
		deva.events.removeListener(deva._events.intent, onIntent);
	}
	return seen;
}

test('help() answers offline before init()', async () => {
	const deva = build();
	assert.equal(await deva.help('main', DIR), deva._messages.offline);
});

test.describe('after init', () => {
	const deva = build();
	test.before(async () => { await deva.init(structuredClone(client)); });
	test.after(async () => { await deva.stop(); });

	test('an empty message returns the MAIN section of main.feecting', async () => {
		assert.equal(await deva.help('', DIR), section('main', 'MAIN'));
	});

	test('main returns the MAIN section of main.feecting', async () => {
		assert.equal(await deva.help('main', DIR), section('main', 'MAIN'));
	});

	test('file:part returns that part, matched in upper case', async () => {
		assert.equal(await deva.help('main:ask', DIR), section('main', 'ASK'));
	});

	test('the file name picks the help file', async () => {
		assert.equal(await deva.help('suite', DIR), section('suite', 'MAIN'));
	});

	test('only the first word of the message is used', async () => {
		assert.equal(await deva.help('main:ask and more words', DIR), section('main', 'ASK'));
	});

	test('a found section records valid and good with no error', async () => {
		const seen = await watch(deva, () => deva.help('main', DIR));
		assert.equal(seen.result, section('main', 'MAIN'));
		assert.deepEqual([seen.error, seen.valid, seen.good], [0, 1, 1]);
		assert.deepEqual([seen.invalid, seen.bad], [[], []]);
	});

	test('a missing file answers help not found as invalid and bad, with no error and no valid or good', async () => {
		const seen = await watch(deva, () => deva.help('nofile', DIR));
		assert.equal(seen.result, deva._messages.help_not_found);
		assert.deepEqual([seen.error, seen.valid, seen.good], [0, 0, 0]);
		assert.deepEqual([seen.invalid, seen.bad], [['not:exists'], ['not:exists']]);
	});

	test('a missing section answers help not found as invalid and bad, with no error and no valid or good', async () => {
		const seen = await watch(deva, () => deva.help('main:nopart', DIR));
		assert.equal(seen.result, deva._messages.help_not_found);
		assert.deepEqual([seen.error, seen.valid, seen.good], [0, 0, 0]);
		assert.deepEqual([seen.invalid, seen.bad], [['not:found'], ['not:found']]);
	});
});

test('help() answers offline after stop()', async () => {
	const deva = build();
	await deva.init(structuredClone(client));
	await deva.stop();
	assert.equal(await deva.help('main', DIR), deva._messages.offline);
});