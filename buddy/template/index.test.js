// ::name:: Test File
// Copyright ©::year:: ::owner::; All rights reserved.  
// Owner Signature Required For Lawful Use.  
// Distributed under VLA:::vla:: LICENSE.md
// ::date::

// run these right after Deva Buddy builds ::name:: to make sure it is clean before you start building
import test from 'node:test';
import assert from 'node:assert/strict';
import Deva from '@indra.ai/deva';
import ::key-upper:: from './index.js';
import Client from './data/client.json' with {type:'json'};
import Data from './data/index.json' with {type:'json'};

const STAGES = ['start', 'enter', 'done', 'ready'];
const TIERS = ['md5', 'sha256', 'sha512'];
const PLACEHOLDER = /::[a-z-]+::/;
const client = () => structuredClone(Client.DATA);

test('::key:: builds as a Deva and waits offline before init', async () => {
	assert.ok(::key-upper:: instanceof Deva, 'the export is a Deva');
	assert.equal(await ::key-upper::.stop(), ::key-upper::._messages.offline, 'stop before init answers offline');
});

test('::key:: data has no placeholders left from the build', () => {
	assert.doesNotMatch(JSON.stringify(Data), PLACEHOLDER, 'data/index.json');
	assert.doesNotMatch(JSON.stringify(Client), PLACEHOLDER, 'data/client.json');
});

test('::key:: comes online and walks to ready', async () => {
	const prompts = [];
	::key-upper::.listen('devacore:prompt', packet => prompts.push(packet.text));
	const data = await ::key-upper::.init(client());
	for (const k of STAGES) assert.equal(typeof data[k], 'number', `${k} timestamp`);
	assert.ok(data.start <= data.enter && data.enter <= data.done && data.done <= data.ready, 'stages in order');
	assert.equal(typeof data.id.uid, 'string', 'uid');
	for (const t of TIERS) assert.equal(typeof data[t], 'string', `${t} hash`);
	assert.ok(prompts.includes(::key-upper::.vars.messages.ready), 'onReady prompts the ready message');
});

test('::key:: agent matches the build', () => {
	const agent = ::key-upper::.agent();
	assert.equal(agent.key, '::key::');
	assert.equal(agent.profile.name, '::name::');
	assert.equal(agent.profile.owner, '::owner::');
});

test('::key:: utils answer with trimmed text', () => {
	const {translate, parse, process} = ::key-upper::.utils;
	for (const util of [translate, parse, process]) assert.equal(util('  hello  '), 'hello');
});

test('::key:: stops through the full chain', async () => {
	const data = await ::key-upper::.stop();
	assert.equal(data.key, 'shutdown', 'the chain ends on shutdown');
	assert.equal(data.value, '::key::');
});