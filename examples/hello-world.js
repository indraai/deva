// Copyright (c)2023 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
const client = require('./client.json');

const Deva = require('../index');
const HelloWorld = new Deva({
  client: {
    id: 100,
    key: 'hello',
  },
  agent: {
    id: 101,
    key: 'hello',
    prompt: {
      emoji: '🐶',
      text: 'hello',
      color: 'white',
    },
    voice: {
      speech: 'Alex',
      speed: 1
    },
    profile: {
      name: 'Hello World',
      description: 'The most over complex Hello World in the Universe',
      avatar: '',
      background: '',
      describe: 'Hello World Deva',
      gender: 'N',
    },
    translate(input) {
      return input.trim();
    },
    parse(input) {
      return input.trim();
    }
  },
  vars: {
    hello: 'Hello World'
  },
  listeners: {
    'hello:state'(packet) {
      // console.log(packet.state);
    },
    'prompt'(packet) {
      console.log(packet.text);
    }
  },
  deva: {},
  modules: {},
  func: {
    getclient(packet) {
      return Promise.resolve(this._client);
    },
    state(packet) {
      const text = this._state
      const id = this.uid();
      const uuid = this.uid(true);

      const created = this.formatDate(Date.now(), 'long', true)
      const md5 = this.hash(JSON.stringify(packet));
      const sha256 = this.hash(JSON.stringify(packet), 'sha256');
      const sha512 = this.hash(JSON.stringify(packet), 'sha512');
      const cipher = this.cipher(JSON.stringify(packet));
      const decipher = this.decipher(cipher);

      const data = {
        id,
        uuid,
        hash: {
          md5,
          sha256,
          sha512,
          created,
        },
        cipher,
        decipher
      }
      return Promise.resolve({
        text: 'state return see data',
        data,
      });
    }
  },
  methods: {
    getclient(packet) {
      return this._client;
    },
    state(packet) {
      return this.func.state(packet);
    }
  },
  onError(e, packet) {
    console.log('ERROR\n\n', e);
  }
});

HelloWorld.init(client.DATA).then(done => {
  // console.log(done);
  return HelloWorld.question('/state')
}).then(answer => {
  console.log(answer.a.text);
  console.log(answer.a.data);
});


// HelloWorld.question('/hello hello there').then(hello => {
//   console.log('hello', hello);
// });
