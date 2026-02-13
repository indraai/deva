"use strict";
// Copyright ©2000-2026 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:67261312889761363542 LICENSE.md  
// 2026-02-13T10:41:03.746Z

const client = require('./client.json').DATA;
const agent = require('./agent.json').DATA;

const Deva = require('../index');
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
      console.log(`p: @${packet.agent.key}:${packet.text}`);
    },
    'devacore:state'(packet) {
      console.log(`🍪 state > ${packet.text}`);
    },
    'devacore:zone'(packet) {
      console.log(`🗺️  zone > ${packet.agent.profile.name} is in the ${packet.text} zone`);
    },
    'devacore:action'(packet) {
      console.log(`💥 action > ${packet.agent.profile.name} get ${packet.text}`);
    },
    'devacore:feature'(packet) {
      console.log(`🍿 feature > ${packet.agent.profile.name} ${packet.text}`);
    },
    'devacore:error'(packet) {
      console.log(`❌ error > ${packet.agent.profile.name} ${packet.text}`);
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
