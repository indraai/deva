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
    name: 'Hello World',
    description: 'The most over complex Hello World in the Universe',
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
      const ret = `${this._state} ${this.uid(true)} ${this.uid()} ${this.hash(JSON.stringify(packet), 'sha256')}`;
      return Promise.resolve(ret);
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
  console.log('THE ANSWER: ', answer.a.text);
});


// HelloWorld.question('/hello hello there').then(hello => {
//   console.log('hello', hello);
// });
