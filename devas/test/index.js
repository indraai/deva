// test
// Copyright ©2026 Quinn Michaels; All rights reserved.  
// Owner Signature Required For Lawful Use.  
// Distributed under VLA:31711622713594414221 LICENSE.md
// Monday, November 16, 2026 - 11:27:17 AM

import Deva from '@indra.ai/deva';
// make sure to correct for package location to match 
import pkg from '../../package.json' with {type:'json'};

import data from './data/index.json' with {type:'json'};
const {agent,vars} = data.DATA;

// set the __dirname
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';    
const __dirname = dirname(fileURLToPath(import.meta.url));

const info = {
	id: pkg.id,
	name: pkg.name,
	version: pkg.version,
	author: pkg.author,
	describe: pkg.description,
	dir: __dirname,
	url: pkg.homepage,
	git: pkg.repository.url,
	bugs: pkg.bugs.url,
	license: pkg.license,
	copyright: pkg.copyright,
	VLA: pkg.VLA,
};

const TEST = new Deva({
	info,
	agent,
	vars,
	utils: {
		translate(input) {return input.trim();},
		parse(input) {return input.trim();},
		process(input) {return input.trim();},
	},
	listeners: {},
	modules: {},
	devas: {},
	func: {},
	methods: {},
	onReady(data, resolve) {
		this.prompt(this.vars.messages.ready);
		return resolve(data);
	},
	onError(data, err, reject) {
		this.prompt(this.vars.messages.error);
		console.log(err);
		return reject(err);
	},
});
export default TEST
