// Copyright (c)2023 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
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
    'prompt'(packet) {
      console.log(`p: @${packet.agent.key}:${packet.msg}`);
    },
    'state'(packet) {
      console.log(`🍪 state > ${packet.agent.key}:${packet.msg}`);
    },
    'zone'(packet) {
      console.log(`🗺️  zone > ${packet.agent.key}:${packet.msg}`);
    },
    'action'(packet) {
      console.log(`💥 action > ${packet.agent.key}:${packet.msg}`);
    },
    'feature'(packet) {
      console.log(`🍿 feature > ${packet.agent.key}:${packet.msg}`);
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
});

HelloWorld.init(client).then(done => {
  // console.log(done);
  return HelloWorld.question('/test')
});


// HelloWorld.question('/hello hello there').then(hello => {
//   console.log('hello', hello);
// });
