"use strict";
// Deva Core Test Suite: step 0, the builder works
import test from 'node:test';
import assert from 'node:assert/strict';
import {build, client} from './_deva.js';

test('build() makes a Deva that reaches ready', async () => {
	const deva = build();
	const data = await deva.init(client);
	for (const k of ['start', 'enter', 'done', 'ready']) {
		assert.equal(typeof data[k], 'number', `${k} timestamp`);
	}
	await deva.stop();
});