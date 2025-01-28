"use strict"
// Copyright (c)2024 Quinn Michaels
// Private License
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
import Client from './client.json' with {type:'json'};
const client = Client.DATA;
import Agent from './agent.json' with {type:'json'};
const agent = Agent.DATA;

import Deva from '../index.js';

const HelloWorld = new Deva({
	client: {
		id: 100,
		key: 'hello',
	},
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
		}
	},
	vars: agent.vars,
	listeners: {
		'devacore:prompt'(packet) {
			console.log(`👔 prompt: ${packet.text}`);
		},
		'devacore:question'(packet) {
			console.log(`🙋‍♂️️ question: ${packet.text}`);
		},
		'devacore:answer'(packet) {
			console.log(`👨‍🔬 answer: ${packet.text}`);
		},
		'devacore:ask'(packet) {
			console.log(`🤝 ask: ${packet.text}`);
		},
		'devacore:state'(packet) {
			console.log(`🍪  state: ${packet.text}`);
		},
		'devacore:zone'(packet) {
			console.log(`🗺️   zone: ${packet.text} zone`);
		},
		'devacore:action'(packet) {
			console.log(`💥 action: ${packet.text}`);
		},
		'devacore:feature'(packet) {
			console.log(`🍿 feature: ${packet.text}`);
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
			const id = this.uid();
			const uuid = this.uid(true);

			const cipher = this.cipher(JSON.stringify(packet));
			const decipher = this.decipher(cipher);

			const data = {
				id,
				uuid,
				text,
				hash: {
					md5: this.hash(JSON.stringify(packet)),
					sha256: this.hash(JSON.stringify(packet), 'sha256'),
					sha512: this.hash(JSON.stringify(packet), 'sha512'),
					created: this.formatDate(Date.now(), 'long'),
				},
				cipher,
				decipher
			}
			console.log(data)
			return Promise.resolve({
				text: packet.a.text,
				data,
			});
		}
	},
	methods: {
		test(packet) {
			return this.func.test(packet);
		}
	},
	onError(e) {
		console.log(e);
	}
});

HelloWorld.init(client);


// HelloWorld.question('/hello hello there').then(hello => {
//   console.log('hello', hello);
// });
