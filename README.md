# Deva Core

**`@indra.ai/deva` · v1.60.2**

Deva Core is a Vedic-inspired, event-based, context-aware Feature, Zone, Action and State machine framework for building integrated artificial intelligence agents ("Devas") in Node.js. Every Deva is one `Deva` class instance on a shared event bus. As it works, it moves through named features, zones, actions, states, intents, beliefs and contexts, and it broadcasts each step as an event. Every packet it builds is stamped with cumulative md5, sha256 and sha512 hashes.

> Deva Core is distributed under the **Vedic License Agreement (VLA)**. Read [License](#license) before you use it.

## Contents

1. [Requirements](#requirements)
2. [Install](#install)
3. [Quick start](#quick-start)
4. [Constructor options](#constructor-options)
5. [Lifecycle](#lifecycle)
6. [Messaging: question, answer, ask, talk, listen](#messaging)
7. [The packet](#the-packet)
8. [Stamping and the hash tiers](#stamping-and-the-hash-tiers)
9. [The workflow: features, zones, actions, states, intents, beliefs, contexts](#the-workflow)
10. [Events](#events)
11. [Error handling](#error-handling)
12. [Configuration files](#configuration-files)
13. [Testing](#testing)
14. [Method reference](#method-reference)
15. [License](#license)
16. [Links and author](#links-and-author)

## Requirements

- Node.js **22 or later** (`engines.node: ">=22"`), npm 9.5.1 or later.
- ES modules only. The package is `"type": "module"` and uses JSON import attributes (`import x from './x.json' with {type: 'json'}`). `require()` won't work.
- A **client object that carries a VLA** matching the one in Deva Core's `package.json`. `init()` refuses to start without it (see [Lifecycle](#lifecycle)).

## Install

```bash
npm install @indra.ai/deva
```

## Quick start

This is a minimal working Deva with one method. `client.json` is a client file shaped like [`tests/client.json`](tests/client.json). Its `DATA.VLA` must match the `VLA` block in Deva Core's `package.json`.

```javascript
import Deva from '@indra.ai/deva';
import Client from './client.json' with {type: 'json'};

const client = Client.DATA; // must carry a VLA matching the Deva Core package VLA

const hello = new Deva({
  info: {id: 'hello', name: 'Hello Deva', version: '0.0.1', VLA: client.VLA},
  agent: {
    id: 'hello',
    key: 'hello',
    prompt: {emoji: '👋', text: 'hello'},
    profile: {name: 'Hello Deva'},
  },
  config: {hash: {}},     // required: ready() writes this.config.hash[agent.key]
  vars: {context: {}},    // required: context() looks up this.vars.context
  listeners: {
    'devacore:error'(packet) {
      console.log('error:', packet.error.message);
    },
  },
  methods: {
    greet(packet) {
      return Promise.resolve({text: `hello ${packet.q.text}`});
    },
  },
  async onReady(data, resolve) {
    const packet = await this.question('/greet world');
    console.log(packet.a.text); // hello world
    return resolve(data);
  },
});

hello.init(client);
```

Run it with `node hello.mjs` and it prints `hello world`. This sample was run against v1.60.2.

Three things to know from this example:

- **Do your work from `onReady`, not after `await init()`.** The `init()` promise currently resolves with `undefined` as soon as the client step finishes, before `start`, `enter`, `done` and `ready` have run. `onReady` is the reliable point where the Deva is fully up.
- **`info`, `config: {hash: {}}` and `vars.context` are effectively required.** Without them `ready()` or `context()` throws. The error handler then calls `context()` again, and the process ends in a stack overflow.
- **Methods must return a Promise.** `answer()` calls `this.methods[method](packet).then(...)`.

## Constructor options

`new Deva(opts)` accepts:

| Option | What it is |
|---|---|
| `id` | Instance id. Defaults to `randomUUID()`. |
| `info` | Package-style info object (`id`, `name`, `version`, `dir`, `VLA`, ...). Returned by `info()`. `info.VLA.uid` goes into every `uid()`. |
| `agent` | The agent profile: `id`, `key` (the Deva's name on the bus), `prompt`, `profile` (`name`, and optional `warning`, `notice`, `copyright`, `status`, `vectors`, `owner`, `creator`, `salute`). It can also carry custom `zones`, `actions`, `intents`, `beliefs` and `messages`, which are merged in without overwriting the core ones. |
| `config` | Local config. Needs a `hash` object. Can set `timeout.ask` in ms (default `30000`, `0` disables it). |
| `vars` | Free-form variables on `this.vars`. `vars.context` maps context keys to display text. |
| `utils`, `func` | Your helper functions. Bound to the Deva at `init`. |
| `methods` | Public commands, reachable by `question('/name ...')` or by another Deva's `#key name ...`. Bound at `init`. Each takes a packet and returns a Promise of a string or `{text, html, data}`. |
| `listeners` | `{eventName: handler}`. Bound and registered on the event bus at `init`. |
| `devas` | Child Deva instances. They inherit `events`, `lib` and `config` and are `init`'d during `ready`. |
| `modules` | Third-party modules for your own use. |
| `events` | An existing `EventEmitter` to share. Defaults to a new one. |
| `maxListeners` | Passed to `events.setMaxListeners`. Default `0` (unlimited). |
| Lifecycle hooks | `onInit`, `onStart`, `onEnter`, `onDone`, `onReady`, `onFinish`, `onComplete`, `onStop`, `onClose`, `onLeave`, `onExit`, `onShutdown`, `onError`. |

Any other top-level option is copied onto the instance, as long as it doesn't clash with an existing property.

## Lifecycle

### Start-up: `init(client)`

1. Hashes the core package data (md5, sha256, sha512).
2. Runs `license_check(client.VLA, core.VLA)`, comparing sha256 hashes of the two VLA objects. On a mismatch it prompts and resolves with `❌ The Provided Client License Is Invalid`, and the Deva stays inactive.
3. Marks the Deva active, then inherits into child devas, binds `listeners`/`methods`/`utils`/`func`/`lib`, and registers listeners.
4. Runs the client feature chain: `Client`, then `License`, `Error`, `Log`, `Data`, `Report`, `Communication`, `Treasury`, `Justice`, `Authority`, `Legal`, `Owner`, `Security`, `Medical`, `Support`, `Services`, `Systems`, `Networks`, `Veda`, then `Done`. For each one that the client's `features` object defines, the Deva stores `this._<feature>` = `{client_id, client_name, concerns, global, personal}`, where `personal` is the entry under `devas[agent.key]`. Methods found in `client.features[x].methods` are bound into `this.methods`.
5. Calls `onInit(data, resolve)` if you defined it, otherwise `start`.

### The invoke chain

`start`, `enter`, `done`, `ready`, `finish`, `complete`, `stop`, `close`, `leave`, `exit` and `shutdown` all run through `_invoke`. Each step sets the context, zone, action and state to its key, writes a timestamp under that key on the data (`data.start = Date.now()` and so on), re-stamps the data, and emits its `devacore:<key>` event. Then:

- if an `on<Key>` hook exists, it calls `on<Key>(data, resolve)`, and **the hook decides what happens next**: call the next step (`this.enter(data, resolve)`) or `resolve(data)`;
- otherwise it moves on to the next step itself.

| Step | Next by default | Hook |
|---|---|---|
| start | enter | onStart |
| enter | done | onEnter |
| done | ready | onDone |
| ready | (resolve) | onReady |
| finish | complete | onFinish |
| complete | (resolve) | onComplete |
| stop | close | onStop |
| close | leave | onClose |
| leave | exit | onLeave |
| exit | shutdown | onExit |
| shutdown | (resolve) | onShutdown |

`ready` also stores sha256 hashes of `vars`, `utils`, `listeners`, `modules`, `func` and `methods` in `config.hash[agent.key]`, and `init`s each child Deva in `devas`.

`finish` and `complete` wrap every answer (see [Messaging](#messaging)).

### Shutdown: `stop()`

`stop()` returns a Promise and runs `stop`, `close`, `leave`, `exit` and `shutdown`. `exit` clears the inherited feature data (`_license`, `_security`, and so on). `shutdown` removes listeners and pending asks, and clears `modules`, `listeners`, `events`, `_config` and `_active`. After that, the Deva answers most calls with `⭕️ OFFLINE`. With no hooks defined, `await deva.stop()` resolves with the data object, whose `key` is `'shutdown'`.

## Messaging

### `question(text, data=false)`

`question` is the entry point. It returns a Promise and reads the first word of `text`:

| Form | Example | What happens |
|---|---|---|
| Command (`/`) | `/greet world` | Calls local `methods.greet` through `answer()`. `packet.q.text` is `world`. A `/method:a:b` form puts `['method','a','b']` in `meta.params`. |
| Ask (`#`) | `#helper shout hi` | Sends the packet to the Deva whose agent key is `helper` and waits for its reply. |
| Plain text | `hi there` | Calls `methods.question`, if you defined one. |

Unknown methods resolve to a packet whose `a.text` is `⛔️ METHOD NOT FOUND <agent> <method>`.

### Ask between Devas

For `#key method text`, the asking Deva emits `key:ask` and waits once on `key:ask:<packet uid>`. The target's `ask(packet)` runs `methods[method]`, builds `packet.a`, and replies on that event. The asker then runs `finish`/`complete` and resolves. Each Deva listens on `<its key>:ask` automatically, as part of the state listeners registered at `init`.

- If nobody is listening on `key:ask`, it resolves right away with `⛔️ ASK TARGET NOT FOUND`.
- If no reply comes within `config.timeout.ask` (default 30 s), it resolves with `⛔️ ASK TIMEOUT`.

Tested: a parent Deva with `devas: {helper}` asked `#helper shout hi there` and got `HI THERE` back, with `a.meta.key === 'helper'`.

### Events directly

- `talk(evt, packet)` emits on the bus and returns `true` if anyone was listening.
- `listen(evt, callback)`, `once(evt, callback)` and `ignore(evt, callback)` add, add-once and remove listeners.
- `prompt(text)` emits a stamped `devacore:prompt` packet.

## The packet

A packet resolved from `question()` looks like this (keys in order, verified):

```text
packet: id, q, a, created, finish, complete, md5, sha256, sha512
  q:    id, agent, client, meta{key, method, params}, text, data, created, md5, sha256, sha512
  a:    id, agent, client, meta{key, method, params}, text, html, data, created, md5, sha256, sha512
```

- `id` is a `uid()` object, not a string: `uid, time, iso, utc, date, license, fingerprint, client, agent, machine, core_hash, status, warning, notice, vectors, owner, creator, salute, copyright, md5, sha256, sha512`. Use `packet.id.uid` for the id value. `uid(true)` uses a random UUID for `uid`. The default is a time-based numeric id.
- `agent` and `client` are copies with their own hashes.
- `finish` and `complete` are timestamps added by those steps.
- A method's result becomes `a.text`, `a.html` and `a.data`. A plain string result fills `text`.

## Stamping and the hash tiers

Deva Core hashes in three tiers, in the order `config.hashes = ['md5', 'sha256', 'sha512']`:

| Tier | Intended use |
|---|---|
| md5 | Fast, everyday (civilian) verification |
| sha256 | Government and authority verification |
| sha512 | Military, agency and legal high-security use |

The tiers are **cumulative by design**. Each hash is taken over the object *including the hashes before it*, so sha256 covers md5, and sha512 covers both. Hashes are base64 digests of `JSON.stringify(data)` (see `hash(data, algo)`).

- `_stamp(data, label='', uid='')` adds the three hashes in order and returns the same object. When a label is given, it logs a `hash` action per tier (`<label>:<algo>:<uid>`).
- `_unstamp(data)` removes them, logging a `delete` action per tier with `data.id.uid`, or `⛔️ NO ID PROVIDED` if there is none.
- To re-stamp after a change, `_stamp(_unstamp(data), label, uid)`. Since the tiers are cumulative, stamping twice without unstamping would change the values.

The return path in Core methods is: the `return` action, then the `good` intent, then `_stamp`.

A few spots (`init`, `_workflow`, `client()`, `agent()`, `machine()`, `uid()`) hash manually on purpose and are commented as such. Calling `_stamp` there would log a state change from inside the state machinery and overflow the stack.

## The workflow

Each call to `feature()`, `zone()`, `action()`, `state()`, `intent()` or `belief()` takes `(value, extra)`. If `value` exists in the matching list, it sets the current value, emits a hashed `devacore:<key>` event with `text` = the list's label plus `extra`, and returns that data. Unknown values are ignored silently. `context(value, extra)` does the same, using `vars.context` for the label, and accepts any value.

The plural methods return a stamped object whose `value` is the full list. Counts at v1.60.2, with no agent additions:

| List | Method | Default | Count | Source |
|---|---|---|---|---|
| features | `features()` | — | 21 | `config/features.json` |
| zones | `zones()` | — | 95 | `config/zones.json` |
| actions | `actions()` | — | 116 | `config/actions.json` |
| states | `states()` | `offline` | 134 | `config/states.json` |
| intents | `intents()` | `neutral` | 78 | `config/intents.json` |
| beliefs | `beliefs()` | `vedic` | 64 | `config/beliefs.json` |
| contexts | `contexts()` | — | from your `vars.context` | your agent |

The 21 features are `init, agent, client, license, error, log, data, report, communication, treasury, justice, authority, security, medical, legal, owner, support, services, systems, networks, veda`. Each client feature has a getter of the same name (`security()`, `veda()`, ...) that returns a copy of what the client supplied for it.

## Events

All core events are listed in `config/events.json` (25). The ones you'll usually listen to:

`devacore:prompt`, `devacore:error`, `devacore:question`, `devacore:answer`, `devacore:ask`, `devacore:start`, `devacore:enter`, `devacore:done`, `devacore:ready`, `devacore:finish`, `devacore:complete`, `devacore:stop`, `devacore:exit`, `devacore:shutdown`, `devacore:context`, `devacore:feature`, `devacore:zone`, `devacore:action`, `devacore:state`, `devacore:intent`, `devacore:belief`, `devacore:load`, `devacore:unload`.

Note: at v1.60.2 `close` is mapped to `devacore:leave`, so the close step emits `devacore:leave` too.

## Error handling

`err(err, packet, reject)` is the single error path. It sets the `bad` intent and the `error` context, feature, zone, action and state. It emits a stamped `devacore:error` packet carrying `error: {name, message, stack}` and the related packet. Then:

- if you defined `onError(err, packet, reject)`, it returns that, and **you own the outcome**. Call `reject` to fail the caller's promise, or the promise stays pending;
- otherwise it calls `reject(err)`, or returns `Promise.reject(err)`.

A method that rejects or throws ends up here. Most calls made while the Deva is inactive return or resolve `⭕️ OFFLINE` instead of throwing.

## Configuration files

| File | Contents |
|---|---|
| `config/index.js` | Command char `/`, ask char `#`, `timeout.ask: 30000`, `hashes`, container markers (`::BEGIN`/`::END`), uid salt range, inherit/bind lists, the invoke chain table, defaults |
| `config/events.json` | Event names |
| `config/features.json` | Feature labels |
| `config/zones.json`, `actions.json`, `states.json`, `intents.json`, `beliefs.json` | Workflow labels |
| `config/msgs.json` | System messages such as `offline`, `noid`, `asktimeout`, `noask`, `method_not_found`, plus default `warning`, `notice` and `copyright` text |

Each JSON file has `id`, `title`, `copyright`, `VLA` and `DATA`, and the values are in `DATA`.

## Testing

```bash
npm test
```

This runs `node tests` (`tests/index.js`), which builds a Deva from `tests/agent.json` and `tests/client.json`, runs it through the lifecycle and a self-test method, and prints the log. **It passes as long as nothing throws. There are no assertions yet.** Real assertion tests are planned.

`examples/hello-world.js` is out of date at v1.60.2. It uses `require()`, so it fails under `"type": "module"`.

## Method reference

These are the public methods whose behavior was checked against v1.60.2.

| Method | Returns | Notes |
|---|---|---|
| `init(client)` | Promise | Starts the Deva. See the `onReady` caveat above. |
| `question(text, data?)` | Promise&lt;packet&gt; | `/cmd`, `#key method`, or plain text. |
| `ask(packet)` | — | Answer side of `#` asks. Usually called for you. |
| `stop()` | Promise | Runs the shutdown chain. |
| `talk(evt, packet)` | boolean | Emit on the bus. |
| `listen` / `once` / `ignore` | — | Manage listeners. |
| `prompt(text)` | stamped data | Emits `devacore:prompt`. |
| `feature`/`zone`/`action`/`state`/`intent`/`belief(value, extra?)` | data or `undefined` | Set and broadcast. |
| `context(value, extra?)` | stamped data | Needs `vars.context`. |
| `features`/`zones`/`actions`/`states`/`intents`/`beliefs`/`contexts()` | stamped `{id, key, value, agent, client, created}` | Full lists. |
| `agent()` / `client()` | hashed copy | |
| `info()` / `core()` | stamped copy | |
| `status()` | string | `<profile.name> active since <date>` |
| `uid(guid=false)` | uid object | See [The packet](#the-packet). |
| `hash(data, algo='md5')` | base64 string | `md5`, `sha256`, `sha512` |
| `_stamp(data, label?, uid?)` / `_unstamp(data)` | same object | See [Stamping](#stamping-and-the-hash-tiers). |
| `license_check(personalVLA, packageVLA)` | stamped approval or `false` | |
| `load(key, client)` / `unload(key)` | Promise | Init or stop a child Deva in `devas`. |
| `err(err, packet, reject?)` | — | See [Error handling](#error-handling). |

Not covered here because they weren't exercised for this README: `help(msg, help_dir)` (reads `<help_dir>/help/<file>.feecting` sections between `::BEGIN:<PART>` and `::END:<PART>`; feecting is Quinn Michaels' own language), `sign(packet)`, `machine()`, and the `lib` helpers (`this.lib.copy`, `formatDate`, and others).

## License

Deva Core is distributed under the **Vedic License Agreement**, version 1.4.2, VLA `23221940810208468106`, owned by Quinn Arjuna America Michaels, through License Deva. The full text is in [LICENSE.md](LICENSE.md). It states, among other things, that:

- by accessing or using the Software, you agree to its terms;
- the Software is the sole proprietary property of the Owner;
- use is subject to a threefold hierarchy: Vedic Law, the Constitution of the United States, and Owner Authority;
- modification, distribution, sub-licensing, derivative works, reverse engineering, and official, government or commercial use without the Owner's verified authorization are prohibited;
- unauthorized use is subject to Vedic fines and sanctions.

Read LICENSE.md in full before you use the Software. This summary isn't a substitute for it.

Copyright ©2000-2026 Quinn Arjuna America Michaels; All rights reserved.

## Links and author

- Repository: https://github.com/indraai/deva
- Issues: https://github.com/indraai/deva/issues
- npm: https://www.npmjs.com/package/@indra.ai/deva
- Homepage: https://indra.ai

**Author:** Quinn Arjuna Michaels, Inside The Net, Inc. (quinn@indra.ai)
