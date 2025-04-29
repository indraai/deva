"use strict"
// Copyright (c)2025 Quinn Michaels; All rights reserved.
// Private License
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
import Client from './client.json' with {type:'json'};
const client = Client.DATA;
import Agent from './agent.json' with {type:'json'};
const agent = Agent.DATA;

import Deva from '../index.js';

import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';    
const __dirname = dirname(fileURLToPath(import.meta.url));

const info = {
  id: '00000',
  name: 'Deva Core Test',
  describe: 'Deva Core Test Package',
  version: '0.0.0',
  dir: __dirname,
  url: 'https://deva.world/test',
  git: 'git+https://github.com/indraai/deva.git',
  bugs: 'git+https://github.com/indraai/deva.git#bugs',
  author: 'Quinn Michaels',
  license: 'TESTING ONLY',
  copyright: 2025,
};

const DevaTest = new Deva({
	info,
	agent: {
		id: agent.id,
		key: agent.key,
		prompt: agent.prompt,
		voice: agent.voice,
		profile: agent.profile,
		features: agent.features,
		translate(input) {
			return input.trim();
		},
		parse(input) {
			return input.trim();
		},
		process(input) {
			return input.trim();
		}
	},
	vars: agent.vars,
	listeners: {
		'devacore:prompt'(packet) {
			this.context('prompt');
			console.log(`👔  prompt: ${packet.text}`);
		},
		'devacore:question'(packet) {
			console.log(`🙋‍♂️️  question: ${packet.text}`);
		},
		'devacore:answer'(packet) {
			console.log(`👨‍🔬  answer: ${packet.text}`);
		},
		'devacore:ask'(packet) {
			console.log(`🤝  ask: ${packet.text}`);
		},
		'devacore:state'(packet) {
			console.log(`🍪   state: ${packet.text}`);
		},
		'devacore:zone'(packet) {
			console.log(`🗺️    zone: ${packet.text}`);
		},
		'devacore:action'(packet) {
			console.log(`💥  action: ${packet.text}`);
		},
		'devacore:feature'(packet) {
			console.log(`---`);
			this.context('feature');
			console.log(`🍿 feature: ${packet.text}`);
		},
		'devacore:context'(packet) {
			console.log(`🛹 context: ${packet.text}`);
		},
		'devacore:error'(packet) {
			console.log(`❌ error: ${packet.text}`);
		},
	},
	devas: {},
	modules: {},
	func: {
		test(packet) {
			const text = this._state
			const id = this.lib.uid();
			const uid = this.lib.uid(true);
			const core = this.core();
			const info = this.info();
			const date = Date.now();
			const hashstr = `${id}${uid}${date}`;
			const signature = this.signature(hashstr);
			const data = [
				'🧪 TEST RESULTS',
				`::BEGIN:CORE:${core.id}`,
				JSON.stringify(core,null,2),
				`::END:CORE:${core.hash}`,
				`::BEGIN:INFO:${info.id}`,
				JSON.stringify(info,null,2),
				`::END:INFO:${info.hash}`,
				`::BEGIN:SIGNATURE:${signature.id}`,
				JSON.stringify(signature, null, 2),
				`::END:SIGNATURE:${signature.md5}`,
			];
			return {
				text: data.join('\n'),
				data,
			};
		}
	},
	methods: {
		test(packet) {
			this.context('test');
			return this.func.test(packet);
		}
	},
	onReady(data, resolve) {
		this.context('ready');
		this.prompt(this.methods.test(data).text);
		return resolve(data);
	},
	onError(e) {
		console.log(e);
	}
});

DevaTest.init(client);


// HelloWorld.question('/hello hello there').then(hello => {
//   console.log('hello', hello);
// });
