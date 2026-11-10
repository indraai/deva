"use strict";
// Deva Core Test Suite: shared builder
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.
// Owner Signature Required For Lawful Use.
// Distributed under VLA:31711622713594414221 LICENSE.md

import Client from '../client.json' with {type:'json'};
import Agent from '../agent.json' with {type:'json'};
import Deva from '../../index.js';
import pkg from '../../package.json' with {type:'json'};

import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

export const client = Client.DATA;
export const agent = Agent.DATA;
export {pkg};

export const info = {
	id: pkg.id,
	name: pkg.name,
	describe: pkg.description,
	version: pkg.version,
	author: pkg.author.name,
	email: pkg.author.email,
	url: pkg.authorurl,
	copyright: pkg.copyright,
	dir: __dirname,
	git: pkg.repository.url,
	bugs: pkg.bugs.url,
	VLA: pkg.VLA,
	license: 'TESTING ONLY',
};

// build a fresh test Deva; each test passes only what it changes
export function build(opts = {}) {
	return new Deva({
		info,
		agent: {
			id: agent.id,
			key: agent.key,
			prompt: agent.prompt,
			voice: agent.voice,
			profile: agent.profile,
			features: agent.features,
			translate(input) { return input.trim(); },
			parse(input) { return input.trim(); },
			process(input) { return input.trim(); },
		},
		config: {hash: {}},
		vars: agent.vars,
		listeners: {},
		devas: {},
		modules: {},
		func: {},
		methods: {},
		...opts,
	});
}