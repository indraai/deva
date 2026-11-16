#!/usr/bin/env node
"use strict";

// Copyright (c)2025 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
import Deva from '../index.js';
import pkg from '../package.json' with {type: 'json'};
const {version} = pkg;

import Buddy from '../_data/buddy.json' with {type: 'json'};
const buddy = Buddy.DATA;
const {agent, vars} = buddy;

import Client from '../tests/client.json' with {type: 'json'};
const client = Client.DATA;

import readline from 'node:readline/promises';

import process from 'node:process';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';    

const __dirname = dirname(fileURLToPath(import.meta.url));

const flash = `
::::::::::::::::::::::::::::::::::

██████╗ ███████╗██╗   ██╗ █████╗
██╔══██╗██╔════╝██║   ██║██╔══██╗
██║  ██║█████╗  ╚██╗ ██╔╝███████║
██║  ██║██╔══╝   ╚████╔╝ ██╔══██║
██████╔╝███████╗  ╚██╔╝  ██║  ██║
╚═════╝ ╚══════╝   ╚═╝   ╚═╝  ╚═╝

::::::::::::::::::::::::::::::::::
version: ${version}
::::::::::::::::::::::::::::::::::
`

// Creates a new DEVA Buddy.
const DevaBuddy = new Deva({
	info: {
		id: pkg.id,
		name: pkg.name,
		version: pkg.version,
		VLA: pkg.VLA,
	},
	agent,
	utils: {
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
	vars,
	devas: {},
	listeners: {
		'devacore:prompt'(packet) {
			console.log(packet.text);
		}
	},
	modules: {},
	func: {

		baseDevaDirectory() {
			const { copy_to_base } = this.vars.paths;
			const dir_exists = this.lib.fs.existsSync(copy_to_base);
			if (!dir_exists) {
				this.lib.fs.mkdirSync(copy_to_base);
			}
			return dir_exists;
		},

		queFiles(copy_from, copy_to) {
			const { answers, create } = this.vars;
			this.vars.create.directories.push(copy_to);

			return new Promise((resolve, reject) => {

				const items = this.lib.fs.readdirSync(copy_from);
				if (!items) return reject('NO ITEMS');

				items.forEach(item => {
					const copy_from_file = this.lib.path.resolve(copy_from, item);
					const copy_to_file = this.lib.path.join(copy_to, item);

					const filestat = this.lib.fs.statSync(copy_from_file);

					if (filestat.isDirectory()) this.func.queFiles(copy_from_file, copy_to_file);

					else if (this.lib.path.extname(item) === '.png') {
						this.vars.create.files.push({copy_to_file, content: this.lib.fs.readFileSync(copy_from_file)});
					}
					
					else {
						const theyear = new Date().getFullYear();
						const content = this.lib.fs.readFileSync(copy_from_file, 'utf8')
														.replace(/::id::/g, this.uid().uid)
														.replace(/::owner::/g, answers.owner)
														.replace(/::key::/g, answers.key)
														.replace(/::year::/g, theyear)
														.replace(/::key-upper::/g, answers.key.toUpperCase())
														.replace(/::name::/g, answers.name)
														.replace(/::describe::/g, answers.describe)
														.replace(/::gender::/g, answers.gender)
														.replace(/::pronouns::/g, answers.pronouns)
														.replace(/::vector::/g, answers.vector)
														.replace(/::vla::/g, this.info().VLA.uid)
														.replace(/::date::/g, this.lib.formatDate(Date.now(), 'long', true));

						// PUSH THE NEWLY CREATED FILE TO THE CREATE FILES ARRAY VARIABLE
						this.vars.create.files.push({copy_to_file, content});

						return resolve(this.vars.messages.que_complete);
					}
				});

			});
		},
		que() {
			const { copy_from, copy_to } = this.vars.paths;
			if (!copy_from) return console.log('no files to copy from');
			if (!copy_to) return console.log('no files to copy to');
			console.log(this.vars.messages.que_heading);
			console.log(`↪ fr: ${copy_from}`);
			console.log(`↪ to: ${copy_to}`);
			this.func.queFiles(copy_from, copy_to).then(filesQued => {
				this.prompt(filesQued);
				return this.func.createDeva();
			}).then(devaCreated => {
				this.prompt(devaCreated);
				const {key} = this.vars.answers;
				this.prompt(`👉 Add ${key} to your Deva loader: import ${key} from './${key}/index.js';`);
			}).catch(err => {
				console.error('🛑 ERROR', err);
			});
		},

		createDeva() {
			this.func.baseDevaDirectory();
			const {files,directories} = this.vars.create;
			directories.forEach(dir => {
				console.log(`${this.vars.messages.folder} ${dir}`);
				this.lib.fs.mkdirSync(dir);
			});
			files.forEach(file => {
					this.lib.fs.writeFileSync(file.copy_to_file, file.content)
					console.log(`${this.vars.messages.file} ${file.copy_to_file}`);
			});
			return Promise.resolve(`${this.vars.messages.deva_created} ${this.vars.answers.key} (${this.vars.answers.name}) `);
		},

	},

	methods: {
		async inquire() {	
			// this sets up a custom directory question for the user which is not in the json data
			this.vars.questions.push({                      // append directory to questions because of __dirname
				type: 'input',                                // set the input type
				name: 'directory',                            // set the name
				message: 'DIRECTORY',                         // set the MESSAGE
				default: this.lib.path.join(process.cwd(), 'devas'),    // set the default path for the question
			});
		
			// ask each question with readline and keep the default when the answer is blank
			const rl = readline.createInterface({input: process.stdin, output: process.stdout});
			const answers = {};
			for (const question of this.vars.questions) {
				const def = question.default ? ` (${question.default})` : '';
				const answer = await rl.question(`${question.message}${def}: `);
				answers[question.name] = answer.trim() || question.default || '';
			}
			rl.close();
		
			// set the options variable to load what the BUDDY was configured with.
			this.vars.paths = {
				copy_from: this.lib.path.join(__dirname, 'template'),
				copy_to: this.lib.path.join(answers.directory, answers.key),
				copy_to_base: answers.directory,
			};
	
			this.prompt('::::::::::::::::::::::::::::');
			this.prompt(this.vars.messages.heading);
	
			for (let answer in answers) {
				this.prompt(`↪ ${answer.toUpperCase()}: ${answers[answer]}`);
			}
	
			this.prompt('::::::::::::::::::::::::::::');
	
			// now this is where we take the
			this.vars.answers = answers;
			return this.func.que();
		},
	},
	onInit(data, resolve) {
		this.prompt(flash);
		return this.start(data, resolve);
	},
	onReady(data, resolve) {
		this.prompt(this._messages.ready);
		this.methods.inquire();                           // when buddy inits then run the inquire method.
		return resolve(data);
	},
});

DevaBuddy.init(client);
