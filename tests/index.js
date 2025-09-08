"use strict"
// ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under the Vedic License Agreement LICENSE.md
/**
::begin:uid:indra:21524957441626894690
uid: 21524957441626894690
created: 1757290615444
md5: 8EHZEL6OWUT3cKAnvrBXaQ==
sha256: 6DXkbquJ6JHHThY+9eV2eFqybBRK/KiFuwXQHCxr7fw=
sha512: mkY6DDFKRf1yUMm4FzfbajM+3LcMnCAUoKwJtmlhTzNin8HUQBOWLaAU1Yb7msZZz7e24at7CL5Ry4MYzdbjGA==
::end:uid:indra:21524957441626894690
**/

import Client from './client.json' with {type:'json'};
const client = Client.DATA;
import Agent from './agent.json' with {type:'json'};
const agent = Agent.DATA;

import Deva from '../index.js';
import pkg from '../package.json' with {type:'json'};

import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';    
const __dirname = dirname(fileURLToPath(import.meta.url));

const info = {
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
  license: 'TESTING ONLY',
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
		'devacore:start'(packet) {
			console.log(`🟢    start: ${packet.text}`);
		},
		'devacore:enter'(packet) {
			console.log(`🚪   enter: ${packet.text}`);
		},
		'devacore:done'(packet) {
			console.log(`☑️     done: ${packet.text}`);
		},
		'devacore:ready'(packet) {
			console.log(`⭐️   ready: ${packet.text}`);
		},
		'devacore:finish'(packet) {
			console.log(`🏁   finish: ${packet.text}`);
		},
		'devacore:complete'(packet) {
			console.log(`✅  complete: ${packet.text}`);
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
			this.context('feature', `${packet.value}:${packet.id.uid}`);
			console.log(`🍿 feature: ${packet.text}`);
		},
		'devacore:context'(packet) {
			console.log(`\n🛹 context: ${packet.text}`);
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
			const core = this.core();
			const info = this.info();
			const data = [
				'🧪 TEST RESULTS',
				`::BEGIN:CORE:${core.id.uid}`,
				JSON.stringify(core,null,2),
				`::END:CORE:${core.id.uid}`,
				`::BEGIN:INFO:${info.id.uid}`,
				JSON.stringify(info,null,2),
				`::END:INFO:${info.id.uid}`,
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
	onStart(data, resolve) {
		this.context('start', data.id.uid);
		return this.enter(data, resolve);
	},
	onEnter(data, resolve) {
		this.context('enter', data.id.uid);
		return this.done(data, resolve);
	},
	onDone(data, resolve) {
		this.context('done', data.id.uid);
		return this.ready(data, resolve);
	},
	onReady(data, resolve) {
		this.context('ready', data.id.uid);
		const test = this.methods.test(data);		
		this.prompt(test.text);
		return resolve(data);			
	},
	onFinish(data, resolve) {
		this.context('finish', data.id.uid);
		return this.complete(data, resolve);
	},
	onComplete(data, resolve) {
		this.context('complete', data.id.uid);
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
