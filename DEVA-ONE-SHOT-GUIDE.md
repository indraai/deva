# Deva One-Shot Usage, Integration, and Porting Guide

This guide describes the current source in `C:\Users\Admin\deva` as of package version `1.67.26`. Use `index.js`, `tests\suite\*.test.js`, `_data\*.json`, and `package.json` as the source of truth. Treat older prose in `ANALYSIS-FOR-VIBE-CODERS.md` and some README statements as historical unless the current tests confirm them.

## 1. Quick facts

- Package: `@indra.ai/deva`, version `1.67.26`.
- Entry point: `index.js`; export: `export default Deva` at `index.js:2351`.
- Runtime: Node.js `>=22`, npm `>=9.5.1`.
- Module system: ESM only (`"type": "module"`); use `import`, not `require()`.
- JSON imports use import attributes: `import data from './file.json' with { type: 'json' }`.
- Test command: `npm test` → `node --test "tests/suite/*.test.js"`.
- Test baseline: 11 suite files, 101 tests. Observed on this checkout: 100 pass, 1 fail.
- CI: `.github\workflows\test.yml`, Node matrix `[22, 24]`, command `npm test`.
- License: `VLA:31711622713594414221 LICENSE.md`; owner/creator `Quinn Michaels`.
- Deva is in-process trusted code. There is no sandbox, capability token, or process isolation between Devas.

## 2. Install and import

```powershell
npm install @indra.ai/deva
```

```js
import Deva from '@indra.ai/deva';
```

If importing from this repository directly:

```js
import Deva from './index.js';
```

Do not use CommonJS:

```js
const Deva = require('@indra.ai/deva');
```

That will fail because the package is ESM only.

## 3. Five-minute quick start

The shortest working example in this repository uses the test fixtures. It prints a startup message, answers `/hello world`, then shuts down cleanly.

```js
import Client from './tests/client.json' with { type: 'json' };
import Agent from './tests/agent.json' with { type: 'json' };
import pkg from './package.json' with { type: 'json' };
import Deva from './index.js';

const client = Client.DATA;
const agent = Agent.DATA;

const info = {
  id: pkg.id,
  name: pkg.name,
  describe: pkg.description,
  version: pkg.version,
  author: pkg.author.name,
  email: pkg.author.email,
  url: pkg.authorurl,
  copyright: pkg.copyright,
  dir: process.cwd(),
  git: pkg.repository.url,
  bugs: pkg.bugs.url,
  VLA: pkg.VLA,
  license: 'YOUR LICENSE IDENTIFIER'
};

const deva = new Deva({
  info,
  agent: {
    id: agent.id,
    key: agent.key,
    prompt: agent.prompt,
    voice: agent.voice,
    profile: agent.profile,
    features: agent.features,
    translate(input) { return input.trim(); },
    parse(input) { return input.trim(); },
    process(input) { return input.trim(); }
  },
  config: { hash: {} },
  vars: agent.vars,
  listeners: {
    'devacore:prompt'(packet) {
      console.log(packet.text);
    }
  },
  devas: {},
  modules: {},
  func: {},
  methods: {
    async hello(packet) {
      this.context('hello');
      return { text: `hello ${packet.params.join(' ')}` };
    }
  },
  onReady(data, resolve) {
    console.log(data.text);
    return resolve(data);
  },
  onError(error) {
    console.error(error);
  }
});

await deva.init(client);
const answer = await deva.question('/hello world');
console.log(answer.text);
await deva.stop();
```

Important contract: custom `methods` must return a thenable. `async` methods satisfy this. A plain string, object, or `null` does not, because the answer path calls `.then()` directly.

## 4. Mental model

A Deva is an event-driven agent object with:

- a startup chain: `start → enter → done → ready → complete`;
- a policy feature chain: `Client → License → Error → Log → Data → Report → Legal → Security → Support → Services → Systems → Done`;
- an in-process `EventEmitter` bus;
- a data-driven vocabulary loaded from `_data/*.json`;
- cumulative integrity hashes (`md5`, `sha256`, `sha512`);
- packets that carry ids, context, hashes, and lifecycle timestamps;
- optional child Devas bound through a shared bus;
- human-supplied hooks (`onInit`, `onStart`, `onEnter`, `onDone`, `onReady`, `onComplete`, `onError`) that can defer each lifecycle step.

`init(client)` now waits for the lifecycle hooks to resolve. You may do work in `onReady`, after `await deva.init(client)`, or both. Older documentation saying `init()` always resolves early is stale.

## 5. Constructor options

`new Deva(opts)` accepts the following practical shape:

| Option | Purpose | Notes |
|---|---|---|
| `info` | Package/deployment metadata | Should include `id`, `name`, `describe`, `version`, `author`, `email`, `url`, `copyright`, `dir`, `git`, `bugs`, `VLA`, `license`. `dir` is used by `help(file, section)`. |
| `agent` | Identity and local hooks | Common fields: `id`, `key`, `prompt`, `voice`, `profile`, `features`, `translate`, `parse`, `process`. |
| `client` | Optional client object | Usually passed later via `init(client)`. |
| `config` | Runtime configuration | Must include `hash: {}` in tests. Defaults are loaded from `_data/index.js`. |
| `vars` | Agent variables | `vars.context` is effectively required by lifecycle/context calls. |
| `listeners` | Event handlers | Keys are event names; functions are bound to the Deva instance. |
| `devas` | Child Devas | Empty object is fine; children are added with `load(opts)`. |
| `modules` | Arbitrary modules | Reserved for host-supplied modules. |
| `func` | Internal helper functions | Bound to the Deva instance. |
| `methods` | Public command methods | Bound to the Deva instance; must return thenables when called through commands. |
| `onInit` / `onStart` / `onEnter` / `onDone` / `onReady` / `onComplete` | Lifecycle hooks | First arg is stamped data, second is `resolve`; returning a Promise is optional but must call or return `resolve(data)`. |
| `onError` | Error hook | Called by internal `err()` path. |

Internal constructor state includes `_core`, `_id`, `_info`, `_agent`, `_client`, `_config`, `_vars`, `_events`, `_listeners`, `_devas`, `_modules`, `_func`, `_methods`, the vocabulary maps, `_pending`, `_context`, `_messages`, `_active`, `_initialized`, `_started`, and `_stopped`.

Do not reuse the same mutable `methods`, `listeners`, `config`, or vocabulary objects across multiple Devas without cloning. Binding helpers mutate the objects they receive.

## 6. Lifecycle

### 6.1 Startup

```text
init(client)
  → start()
  → enter()
  → done()
  → ready()
  → complete()
```

Each step is stamped and emits its corresponding event:

- `devacore:start`
- `devacore:enter`
- `devacore:done`
- `devacore:ready`

`init(client)` runs the policy feature chain before the public readiness event. A valid client VLA is required for full activation.

### 6.2 Hooks

Default behavior resolves each hook immediately. Custom hooks receive `(data, resolve)`:

```js
onReady(data, resolve) {
  this.prompt(this._messages.ready);
  return resolve(data);
}
```

If a hook never calls `resolve`, `init()` stays pending. This is useful for gating startup on external work.

### 6.3 Policy feature chain

Internal uppercase methods run in this order:

| Step | Purpose |
|---|---|
| `Client()` | Stores client identity/data and initializes feature blocks. |
| `License()` | Checks client/package VLA. |
| `Error()` | Loads error policy block. |
| `Log()` | Loads log policy block. |
| `Data()` | Loads data policy block. |
| `Report()` | Loads report policy block. |
| `Legal()` | Loads legal policy block. |
| `Security()` | Loads security policy block, including hash config and cipher settings. |
| `Support()` | Loads support policy block. |
| `Services()` | Loads services policy block. |
| `Systems()` | Loads systems policy block. |
| `Done()` | Finalizes the chain. |

`Feature(key)` expects ten policy blocks: `license`, `error`, `log`, `data`, `report`, `legal`, `security`, `support`, `services`, `systems`. Missing blocks reject the startup chain. Extra client config is dropped by the existing implementation.

### 6.4 Shutdown

`stop()` runs:

```text
stop → close → leave → exit → shutdown
```

Tests expect:

- ordered chain timestamps;
- `key === 'shutdown'`;
- `value === agent.key`;
- `agent === agent.sha256`;
- client hash and tier strings;
- one `devacore` event per step.

Before initialization, `stop()` resolves with `deva._messages.offline`. After shutdown, many calls return offline text; some internal methods such as `_stamp`, `talk`, and `err` can throw if called after `shutdown` because internal caches are cleared.

## 7. Public API reference

### 7.1 Core lifecycle

| Method | Signature | Behavior |
|---|---|---|
| `init` | `init(client)` | Starts startup chain; resolves only after all hooks resolve. |
| `license_check` | `license_check()` | Returns a stamped approval packet for a matching VLA, otherwise a message string such as `❌ Bad Personal VLA`, `❌ Bad Package VLA`, or `❌ Invalid VLA Check`. It is not a boolean. |
| `status` | `status(id)` | Returns stamped status information for an id. |
| `stop` | `stop()` | Runs the shutdown chain; offline-safe before init in current tests. |
| `help` | `help(file, section)` | Reads `<info.dir>/help/<file>.feecting` and returns the text between `::BEGIN:<PART>` and `::END:<PART>`. |

### 7.2 Getters

Each getter returns a JSON deep copy of its private store:

- `license()`
- `error()`
- `log()`
- `data()`
- `report()`
- `legal()`
- `security()`
- `support()`
- `services()`
- `systems()`

Mutating the returned copy does not mutate internal state.

### 7.3 Vocabulary getters

- `actions()`
- `beliefs()`
- `events()`
- `features()`
- `intents()`
- `messages()`
- `states()`
- `zones()`

These return the configured vocabulary maps. Treat them as read-only; current behavior exposes live maps for some plural getters.

### 7.4 Messaging and workflow

| Method | Signature | Behavior |
|---|---|---|
| `question` | `question(text)` | Parses text. `/method args` calls a local method; `#method args` asks a child Deva. No text returns `_messages.notext`. Offline returns `_messages.offline`. |
| `ask` | `ask(key, text, method, params, ask)` | Sends an ask to a child and listens on `<key>:ask:<packet-id>`. |
| `answer` | `answer(packet)` | Calls the target method and finishes the packet. The method must be thenable. |
| `prompt` | `prompt(packet)` | Emits `devacore:prompt` with the live stamped packet. |
| `talk` | `talk(event, data, emit = true)` | Stamps and emits an event; returns a copy of the data. |
| `context` | `context(key)` | Sets `_context` from `vars.context[key]` and emits a context/talk event. |
| `state` | `state(key, value)` | Emits a stamped state packet. |
| `action` | `action(key, value)` | Emits a stamped action packet. |
| `belief` | `belief(key, value)` | Emits a stamped belief packet. |
| `intent` | `intent(key, value)` | Emits a stamped intent packet. |
| `zone` | `zone(key, value)` | Emits a stamped zone packet. |
| `message` | `message(key, value)` | Emits a stamped message packet. |

### 7.5 Crypto, ids, and host data

| Method | Signature | Behavior |
|---|---|---|
| `hash` | `hash(data, tier = 'md5')` | `createHash(tier).update(JSON.stringify(data)).digest('base64')`. |
| `uid` | `uid(opts)` | Creates packet identity metadata and hashes host data from `machine()`. |
| `machine` | `machine()` | Returns host/user/network data plus md5/sha256/sha512. Public and privacy-sensitive. |
| `sign` | `sign(key, params)` | Creates a recomputable stamped sign packet; it is not a cryptographic signature. |

Identity objects created by `uid()` contain:

```text
uid, time, iso, utc, date, license, fingerprint, client, agent,
machine, core_hash, status, warning, notice, vectors, owner,
creator, salute, copyright, md5, sha256, sha512
```

`_stamp()` adds or refreshes:

```text
d, id, key, value, context, data, text, html, error, packet,
status, md5, sha256, sha512
```

Tier order is cumulative: `md5`, then `sha256`, then `sha512`.

### 7.6 Child Devas

| Method | Signature | Behavior |
|---|---|---|
| `load` | `load(opts)` | Loads child Devas into `_devas`, binds them to the shared bus, and can defer until child readiness. |
| `unload` | `unload(key)` | Stops a child, removes its listeners, and removes it from `_devas`. |

`devas\index.js` exports an empty `DEVAS` registry; the core does not ship ready-made child Devas.

### 7.7 Internal binding helpers

These are not ordinary public commands but are relevant when porting or extending:

- `_binding()` binds public functions and methods to the owning Deva instance.
- `_assignBind(obj)` mutates a passed object so its functions are bound to that Deva.
- `_clearPending(obj)` removes pending ask listeners.
- `_assignListeners(listeners)` normalizes and binds listener maps.
- Internal lifecycle wrappers: `start()`, `enter()`, `done()`, `ready()`, `complete()`.

## 8. Events and packets

### 8.1 Event map

Core events are loaded from `_data/events.json`:

- `devacore:start`
- `devacore:enter`
- `devacore:done`
- `devacore:ready`
- `devacore:error`
- `devacore:talk`
- `devacore:prompt`
- `devacore:help`
- `devacore:state`
- `devacore:action`
- `devacore:belief`
- `devacore:intent`
- `devacore:zone`
- `devacore:message`
- `devacore:load`
- `devacore:unload`
- `devacore:shutdown`

Dynamic ask events use `<key>:ask:<packet-id>`.

`devacore:load` is defined but not emitted by current core code. `deva:dir` is emitted as an extra event and is not in the standard map. `devacore:unload` carries a raw string rather than a stamped packet.

### 8.2 Listener behavior

Most events pass a JSON copy of the packet. Exceptions:

- `devacore:prompt` passes the live stamped object;
- ask replies on `<key>:ask:<uid>` are raw;
- `deva:dir` is raw.

Example listener:

```js
listeners: {
  'devacore:ready'(packet) {
    console.log(packet.value, packet.ready);
  },
  'devacore:error'(packet) {
    console.error(packet.error.message);
  }
}
```

### 8.3 Method-not-found

Unknown local commands return text of the form:

```text
⛔️ METHOD NOT FOUND <agent-key> <method>
```

Ask failures can emit `<key>:ask:<method>` and call the error path without replying on `<key>:ask:<packet-id>`, which may cause the asker to wait until timeout.

## 9. Commands and asks

`question(text)` uses the configured command characters:

- `/` means local method call.
- `#` means ask a child Deva.

Examples:

```js
await deva.question('/hello world');
await deva.question('#helper greet world');
```

For a local command `/hello world`:

- `packet.q.method` is `hello`;
- `packet.q.params` is `['world']`;
- the `hello` method is called with the packet;
- its resolved value becomes the answer;
- `finish` and `complete` timestamps are added.

Method contract:

```js
methods: {
  async hello(packet) {
    this.context('hello');
    return {
      text: `hello ${packet.params.join(' ')}`,
      html: `<p>hello ${packet.params.join(' ')}</p>`,
      data: { params: packet.params }
    };
  }
}
```

A thenable is enough; it does not have to be a native `Promise`.

## 10. Configuration and data

### 10.1 Default config

`_data\index.js` supplies defaults including:

| Key | Default/meaning |
|---|---|
| `cmdChr` | `'/'` local command prefix |
| `askChr` | `'#'` ask prefix |
| `timeout.ask` | `30000` ms |
| `hashes` | `['md5', 'sha256', 'sha512']` |
| `container.begin` / `container.end` | `'::BEGIN'` / `'::END'` |
| `box.begin` / `box.end` | `'::begin'` / `'::end'` |
| `inherit` | Child inheritance settings |
| `bind` | Binding settings |
| `ready_hash` | Readiness hash settings |
| `invoke.start/enter/done/ready` | Invocation messages |

### 10.2 Catalog counts

Current catalog sizes:

| Catalog | Count |
|---|---:|
| features | 13 |
| zones | 44 |
| actions | 93 |
| states | 96 |
| intents | 17 |
| beliefs | 3 |
| events | 25 |
| messages | 41 |

### 10.3 Catalog shapes

Most catalog files (`actions.json`, `beliefs.json`, `events.json`, `features.json`, `intents.json`, `states.json`, `zones.json`, `msgs.json`) use:

```json
{
  "id": "...",
  "title": "...",
  "copyright": "...",
  "VLA": "31711622713594414221",
  "DATA": {
    "key": "emoji Label"
  }
}
```

Exceptions:

- `states.json` has case-colliding keys `done` and `Done`. Python JSON accepts this; PowerShell `ConvertFrom-Json` rejects it with `duplicated keys 'done' and 'Done'`.
- `msgs.json` has extra `DATA` keys: `status`, `vectors`, `owner`, `creator`, `salute`, `copyright`.
- `buddy.json` uses a numeric id, `name`, `describe`, `copyright`, no `title`/`VLA`, and nested `agent`/`vars` objects.
- `guide.json` has structured metadata in `DATA`.

For ports, load these JSON files verbatim instead of transliterating strings by hand.

## 11. Help system

`help(file, section)` reads:

```text
<info.dir>/help/<file>.feecting
```

Sections are delimited by:

```text
::BEGIN:<PART>
...
::END:<PART>
```

The test suite uses:

- `tests\suite\help\main.feecting`
- `tests\suite\help\suite.feecting`

The test helper watches:

- `_events.error`
- `_events.state`
- `_events.intent`

with state values `valid`/`invalid` and intent values `good`/`bad`.

## 12. Buddy generator

`buddy\index.js` is a shebang CLI that:

- imports `Deva`, `pkg`, `_data\buddy.json`, `tests\client.json`, and `readline/promises`;
- prints an ASCII `BUDDY` banner;
- creates a `DevaBuddy` with `info`, `agent`, trimmed utility functions, `vars`, empty `devas`, a `devacore:prompt` listener, empty `modules`, and `func.baseDevaDirectory()`.

Template placeholders in `buddy\template\index.js`:

```text
::name::
::year::
::owner::
::vla::
::date::
::key-upper::
```

Generated Devas import `@indra.ai/deva`, `../../package.json`, and `./data/index.json`, and use `onReady`/`onError` prompts from `vars.messages`.

Note: `buddy\index.js` has an MIT header while the package and runtime use VLA. Treat the package metadata as authoritative.

## 13. Porting checklist

When porting Deva to another runtime or language:

1. Load and freeze the JSON catalogs from `_data`; preserve exact keys, including case-colliding `done`/`Done`.
2. Implement an event emitter with Node semantics, especially `emit()` returning whether listeners existed.
3. Implement `copy()` as JSON round-trip and accept its limits: functions/undefined disappear; circular structures and BigInt throw.
4. Implement hashing as base64 of `JSON.stringify(data)` in cumulative order `md5 → sha256 → sha512`.
5. Implement callback-style lifecycle hooks with explicit `resolve(data)`.
6. Make `init(client)` await all lifecycle hooks before resolving.
7. Build stamped packets with identity metadata and lifecycle timestamps.
8. Implement local commands (`/`) and child asks (`#`) with dynamic packet-id reply events.
9. Require thenables for public method results.
10. Preserve dynamic binding: helper functions/methods execute with the Deva instance as `this`.
11. Implement child Deva load/unload through the shared event bus.
12. Preserve offline behavior after init failure/shutdown without throwing from common paths.
13. Keep `machine()` behind a privacy/consent boundary; it exposes host, user, and network data.
14. Do not clone stale README claims; use current tests as executable spec.

## 14. Verification

Run:

```powershell
npm test
```

Equivalent direct command:

```powershell
node --test "tests/suite/*.test.js"
```

Observed result on this checkout: 101 tests, 100 pass, 1 fail. The failing test is `tests\suite\05-messaging.test.js:94`, `#helper fail rejects the asker right away with the child error`; the rejection arrives with the expected message but takes longer than the test's 150 ms fast-fail assertion. Treat this as a known pre-existing timing/behavior failure when validating changes.

Run the bundled demo:

```powershell
node examples/hello-world.js
```

`examples\hello-world.js` prints prompts and `Hello World`; it does not print lowercase `hello world`, despite older README wording.

## 15. Documentation drift and mismatch register

Use current code/tests over older prose.

| Source | Claim or behavior | Current status |
|---|---|---|
| `README.md` license mismatch text | `❌ The Provided Client License Is Invalid` | Stale. Current strings are `❌ Bad Personal VLA`, `❌ Bad Package VLA`, `❌ Invalid VLA Check`. |
| `README.md` method table | `license_check()` returns `false` on failure | Stale. Failure is a string. |
| `README.md` quick start | Work must be done in `onReady`, not after `await init()` | Stale. Current `init()` waits for hooks. |
| `ANALYSIS-FOR-VIBE-CODERS.md` | Snapshot of v1.62.89, commit `aea903c`, Node `v26.12.1` | Historical only. Many findings fixed in current code. |
| `ANALYSIS-FOR-VIBE-CODERS.md` | `init()` resolves early, missing `vars.context` stack overflow, ready hash ignores functions, `stop()` returns string when inactive | Fixed or contradicted by current tests; do not apply blindly. |
| `ANALYSIS-FOR-VIBE-CODERS.md` | Host/machine privacy, license gate limits, EventEmitter/data dependence | Still useful conceptual context. |
| `buddy\index.js` header | MIT license | Conflicts with package VLA; package metadata wins. |
| `tests\suite\05-messaging.test.js` | `#helper fail` must reject in under 150 ms | Current checkout fails this timing assertion consistently; document it as a known pre-existing failure, not a guide error. |
| Jekyll `/docs/` | Generated from README | Inherits README drift. |
| Jekyll `/core/` pages | Generated from `_data/*.json` | Counts and key lists match current data. |

## 16. Security, privacy, and legal notes

- A Deva is trusted code inside your process.
- It can execute commands, read/write files through `lib`, inspect host/user/network data, bind arbitrary methods, and mutate process-wide vocabulary/core data.
- There is no sandbox or per-tool permission system.
- The VLA gate compares client-supplied VLA data to package VLA data by hash. It is an integrity/license check, not user authentication, encryption, or a signature.
- `machine()` exposes raw host data; only call it with informed operator consent.
- `sign()` is recomputable and should not be treated as cryptographic proof.
- Avoid reusing mutable config/method/listener objects across Devas; binding mutates them.

## 17. File map

| Path | Role |
|---|---|
| `index.js` | Core `Deva` class and public API. |
| `lib\index.js` | `Node`, `LIB`, `help`, `encrypt`, FS/OS/crypto helpers. |
| `_data\index.js` | Default runtime config and JSON imports. |
| `_data\*.json` | Live action/belief/event/feature/intent/state/zone/message catalogs. |
| `package.json` | Identity, scripts, exports, engines, metadata, VLA. |
| `tests\suite\*.test.js` | Executable behavior spec; 101 tests. |
| `tests\suite\_deva.js` | Shared test Deva builder. |
| `tests\client.json`, `tests\agent.json` | VLA/client/agent fixtures. |
| `examples\hello-world.js` | Repo-local demo. |
| `buddy\index.js` | Generator CLI. |
| `buddy\template\` | Generated Deva scaffold. |
| `devas\index.js` | Empty child registry. |
| `README.md` | Public docs; partially stale. |
| `ANALYSIS-FOR-VIBE-CODERS.md` | Historical deep analysis; stale snapshot. |
| `guide\`, `core\`, `vibe\`, `vla\`, `about\` | Jekyll site/docs. |
| `.github\workflows\test.yml` | CI matrix and test command. |
