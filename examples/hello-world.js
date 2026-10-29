"use strict";
// Deva Core Hello World
// Copyright ©2000-2026 Quinn Arjuna America Michaels; All rights reserved. 
// Owner Signature Required For Lawful Use.
// Distributed under VLA:23221940810208468106 LICENSE.md  
// Friday, October 9, 2026 - 7:47:02 AM PST

import Client from '../tests/client.json' with {type:'json'};
const client = Client.DATA;
import Agent from '../tests/agent.json' with {type:'json'};
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
  VLA: pkg.VLA,
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
  config: {
    hash: {}
  },
  vars: agent.vars,
  listeners: {
    'devacore:prompt'(packet) {
      this.context('prompt');
      console.log(`👔  prompt: ${packet.text}`);
    },
  },
  devas: {},
  modules: {},
  func: {
    test(packet) {
      return this.vars.hello;
    }
  },
  methods: {
    test(packet) {
      this.context('hello');
      const test = this.func.test(packet)
      return test;			
    },
  },
  onInit(data, resolve) {
    return this.start(data, resolve);
  },
  onStart(data, resolve) {
    return this.enter(data, resolve);
  },
  onEnter(data, resolve) {
    return this.done(data, resolve);
  },
  onDone(data, resolve) {
    return this.ready(data, resolve);
  },
  onReady(data, resolve) {
    this.prompt(this._messages.ready);

    const test = this.methods.test(data);		
    this.prompt(test);

    this.intent('good', `tests:ready`);		
    return resolve(data);			
  },
  onComplete(data, resolve) {
    return resolve(data);
  },
  onError(err) {
    console.log(err);
  }
});

DevaTest.init(client);


// HelloWorld.question('/hello hello there').then(hello => {
//   console.log('hello', hello);
// });
