"use strict";
// Deva Core Test Suite: step 10, vocabulary isolation
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import test from 'node:test';
import assert from 'node:assert/strict';
import {build, client, agent} from './_deva.js';
import coreConfig from '../../_data/index.js';

const fresh = () => structuredClone(client);
const vars = () => structuredClone(agent.vars);

// the six config zones the constructor shallow-copies for each Deva
const KINDS = ['zones', 'actions', 'states', 'intents', 'beliefs', 'messages'];

function withVocab(key, label) {
	const extra = {};
	for (const kind of KINDS) {
		const singular = kind === 'messages' ? 'message' : kind.slice(0, -1);
		extra[kind] = {[`${key}_${singular}`]: `${label} ${singular}`};
	}
	return build({
		config: {hash: {}},
		vars: vars(),
		agent: {
			...agent,
			id: key,
			key,
			profile: {...agent.profile, name: label},
			...extra,
		},
	});
}

test('two Devas keep their own agent vocabulary and leave the shared base alone', async () => {
	const before = Object.fromEntries(KINDS.map(kind => [kind, Object.keys(coreConfig[kind]).sort()]));
	const a = withVocab('alpha', 'Alpha');
	const b = withVocab('beta', 'Beta');
	await a.init(fresh());
	await b.init(fresh());

	for (const kind of KINDS) {
		const singular = kind === 'messages' ? 'message' : kind.slice(0, -1);
		const aKey = `alpha_${singular}`;
		const bKey = `beta_${singular}`;
		const aMap = a[`_${kind}`];
		const bMap = b[`_${kind}`];
		assert.equal(aMap[aKey], `Alpha ${singular}`, `${kind}: alpha keeps its own`);
		assert.equal(bMap[bKey], `Beta ${singular}`, `${kind}: beta keeps its own`);
		assert.equal(aMap[bKey], undefined, `${kind}: alpha does not see beta`);
		assert.equal(bMap[aKey], undefined, `${kind}: beta does not see alpha`);
		assert.equal(coreConfig[kind][aKey], undefined, `${kind}: shared base has no alpha entry`);
		assert.equal(coreConfig[kind][bKey], undefined, `${kind}: shared base has no beta entry`);
		assert.deepEqual(Object.keys(coreConfig[kind]).sort(), before[kind], `${kind}: shared base keys are unchanged`);
	}

	await a.stop();
	await b.stop();
});