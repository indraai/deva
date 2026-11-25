// ::name::
// Copyright ©::year:: ::owner::; All rights reserved.  
// Owner Signature Required For Lawful Use.  
// Distributed under VLA:::vla:: LICENSE.md
// ::date::

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
	dir: __dirname,
	VLA: pkg.VLA,
};

const ::key-upper:: = new Deva({
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
	onError(err, data, reject) {
		this.prompt(this.vars.messages.error);
		return reject ? reject(err) : Promise.reject(err);
	},
});
export default ::key-upper::
