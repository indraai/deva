# Deva Core: An Analysis for Vibe Coders

**Snapshot:** commit `aea903c`, package `@indra.ai/deva` version `1.62.89`
**Analyzed:** 2026-11-01
**Runtime used for observations:** Node.js `v26.12.1` on Windows
**Scope:** every tracked source file, data file, test, example, documentation page, and package metadata in this repository, plus the live site at `deva.world` (`/core/` with its eight child pages, `/docs/`, and `/about/`), read on 2026-11-01.

This document explains what the code *actually does*. Where the README or website disagrees with the implementation, the implementation wins and the disagreement is recorded in [Section 19](#19-correctness-findings-and-documentation-mismatches). The existing `README.md` is useful but optimistic in a few places, and the live `/docs/` page is generated from it. The live `/core/` reference pages are more accurate. This analysis is deliberately more literal than both.

**If you are vibe coding:** read [Section 1.1](#11-the-vibe-coder-rules) first, then [Section 19](#19-correctness-findings-and-documentation-mismatches) and [Section 25](#25-a-safe-minimal-recipe). Those three sections prevent most wasted prompts. The rest is reference depth for when the generated code misbehaves.

---

## Contents

1. [The short version](#1-the-short-version)
2. [What this project is, and what it is not](#2-what-this-project-is-and-what-it-is-not)
3. [Repository map](#3-repository-map)
4. [The runtime model](#4-the-runtime-model)
5. [Constructing a Deva](#5-constructing-a-deva)
6. [The vocabulary: features, zones, actions, states, intents, beliefs](#6-the-vocabulary)
7. [Startup: `init()` in detail](#7-startup-init-in-detail)
8. [The invoke chain](#8-the-invoke-chain)
9. [Shutdown and unloading](#9-shutdown-and-unloading)
10. [Messaging: `question`, `answer`, `ask`, `talk`](#10-messaging)
11. [Packets and data shapes](#11-packets-and-data-shapes)
12. [Hashing, identity, and `uid()`](#12-hashing-identity-and-uid)
13. [The workflow API](#13-the-workflow-api)
14. [Client features and policy data](#14-client-features-and-policy-data)
15. [Child Devas](#15-child-devas)
16. [Errors and offline behavior](#16-errors-and-offline-behavior)
17. [The `lib` helper class](#17-the-lib-helper-class)
18. [Ancillary methods](#18-ancillary-methods)
19. [Correctness findings and documentation mismatches](#19-correctness-findings-and-documentation-mismatches)
20. [Security, privacy, and legal notes](#20-security-privacy-and-legal-notes)
21. [Tests, examples, and what they prove](#21-tests-examples-and-what-they-prove)
22. [The website and documentation layer](#22-the-website-and-documentation-layer)
23. [Packaging and release shape](#23-packaging-and-release-shape)
24. [Strengths, weaknesses, and fit](#24-strengths-weaknesses-and-fit)
25. [A safe minimal recipe](#25-a-safe-minimal-recipe)
26. [Glossary](#26-glossary)
27. [Appendix A: method reference](#appendix-a-method-reference)
28. [Appendix B: event reference](#appendix-b-event-reference)
29. [Appendix C: vocabulary keys](#appendix-c-vocabulary-keys)
30. [Appendix D: message catalog](#appendix-d-message-catalog)
31. [Appendix E: runtime observations](#appendix-e-runtime-observations)
32. [Appendix F: file-by-file inventory](#appendix-f-file-by-file-inventory)

---

## 1. The short version

Deva Core is a small, dependency-free JavaScript framework for building agents that run **inside one Node.js process** and communicate over **one shared `EventEmitter`**.

Each agent is one instance of the `Deva` class in `index.js`. It has:

- an identity (`agent.key`), a client record, and a package/info record;
- a dictionary of methods that take a packet and return a thenable;
- a named vocabulary of features, zones, actions, states, intents, and beliefs;
- a lifecycle that starts at `init`, walks through `start → enter → done → ready`, and shuts down through `stop → close → leave → exit → shutdown`;
- an ask/answer protocol where one Deva broadcasts a namespaced event and another Deva replies on a packet-specific event;
- a hashing convention that stamps packets with cumulative md5, sha256, and sha512 digests.

The central idea is **observability through naming**: every transition is recorded as an event and a stamped data record, so a listener can reconstruct what the Deva did. The framework is not an AI model, does not call a model, has no network transport, no database, no scheduler, no authentication layer, and no persistence. It is a coordination kernel. The "intelligence" is whatever code you put in `methods` and `listeners`.

The most important practical facts are:

1. **`await deva.init(client)` does not mean the Deva is ready.** It resolves `undefined` as soon as the `Client` step finishes. The rest of startup continues in the background. Use `onReady` or listen for `devacore:ready`.
2. **`info`, `config.hash`, and `vars.context` are effectively mandatory**, because `uid()`, `ready()`, and `context()` assume them. A missing `vars.context` can turn an ordinary error into infinite recursion and a stack overflow.
3. **The license gate is silent.** A bad client VLA returns a string and leaves the Deva inactive; it does not emit the documented `devacore:prompt` event, because `prompt()` refuses to run while inactive.
4. **The implemented feature list is 13 entries, not the 21 described in the README.** Ten client policy features are loaded: license, error, log, data, report, legal, security, support, services, systems.
5. **Methods used through `question`/`answer`/`ask` must return a thenable.** `answer()` calls `.then()` directly on the result. Strings and plain objects fail there.
6. **The hashes are integrity checks, not encryption, authentication, or signatures.** They are deterministic only for the same JSON property order and the same JSON-representable values.

### 1.1 The vibe-coder rules

These are the constraints to put in your own notes, or in the prompt you give an assistant, before asking it to build on this package.

1. **Start work in `onReady`, not after `await init()`.** `await init()` resolves before the Deva is fully up. If you must use the Promise, await readiness separately.
2. **Always supply `info`, `agent.key`, `config.hash`, and `vars.context`.** Missing any of them turns a normal mistake into a deep lifecycle failure or a stack overflow.
3. **Return `Promise.resolve(value)` from every method.** A string or plain object returned directly will break the answer path. Use `{text, html, data}` or a string inside the Promise.
4. **Use `packet.id.uid`.** `packet.id` is an object, not a string. The same is true for lifecycle data.
5. **Catch errors at the top level.** The core has no retry, no fallback, and no automatic rejection when `onError` is defined. If your `onError` does not reject, callers hang.
6. **Design for 13 features, not 21.** Ten client policy blocks are required at startup: license, error, log, data, report, legal, security, support, services, systems. The other eight names in the README are documentation, not code.
7. **Treat the VLA check as a legal notice, not security.** It runs once, is easy to satisfy, and does not authorize individual actions after startup.
8. **Treat the hashes as change detectors, not proof.** No secret, no signature, no canonical JSON, no stable core fingerprint.
9. **Assume one process and one shared bus.** There is no transport, broker, persistence, scheduler, or isolation between Devas.
10. **Do not mutate returned vocabulary maps.** `states().value` and friends are the live internal objects.
11. **Never call `stop()` from `onReady`, and never call `init()` twice on the same instance.** The first is a startup/shutdown race; the second reuses mutated shared state.
12. **Read `⭕️ OFFLINE` as a value, not an exception.** Some post-shutdown calls return strings; others throw. Guard the boundary yourself.

---

## 2. What this project is, and what it is not

### 2.1 The design in one paragraph

A Deva is an event-driven state machine. You construct it with an identity, methods, listeners, and a client policy record. You initialize it with a client whose VLA matches the package VLA. During initialization it loads a fixed sequence of "features" from the client record, binds your functions to the instance, registers listeners, and walks the lifecycle chain. At runtime your code calls `question()` to invoke a method locally or ask another Deva; the core wraps the request and response in stamped packets, runs the answer through `finish` and `complete`, and emits `devacore:*` events at every step. Shutdown reverses the process and removes the listeners and pending asks.

### 2.2 What it is not

- **Not an AI model or an inference engine.** No model weights, no prompts to an LLM, no embedding store. "Deva" here means "agent process", not a neural network.
- **Not a distributed system.** All Devas must share one `EventEmitter` in one process. There is no serialization over a socket, no broker, no service discovery. `agent.key` is only a local event-name prefix.
- **Not an authorization system.** The VLA check is a startup gate. After startup, any code with a reference to a Deva instance can call its methods or emit its events.
- **Not a durable record store.** Packets are JavaScript objects in memory. Nothing is written to disk by the core.
- **Not cryptographically secure by default.** The hashes are unkeyed digests. `sign()` is a hash-based record, not a digital signature.
- **Not a complete application framework.** There is no router, HTTP server, dependency injection container, config loader, logger backend, retry policy, or schema validator. Those are left to the surrounding application.

### 2.3 The intended mental model

Think of a room of specialists, all able to hear a shared loudspeaker:

- Each specialist has a name (`agent.key`).
- Anyone can announce a step (`talk('devacore:state', packet)`).
- To ask a named specialist a question, you shout "`<key>:ask`" with a packet. Anyone registered on that event may answer. The asker waits once for a reply on "`<key>:ask:<packet-id>`".
- Every announcement is written on a card with a timestamp and three hashes.
- The specialist also keeps a diary of named feature/zone/action/state/intent/belief entries.

That is the whole architecture. The rest is bookkeeping and edge cases.

---

## 3. Repository map

| Path | Role |
|---|---|
| `index.js` | The entire `Deva` class (2,283 lines). Construction, lifecycle, messaging, workflow, hashing, identity, errors. |
| `lib/index.js` | The `LIB` helper class (241 lines): copy, dates, currency, percent, word trimming, dedupe, encryption, OS/fs/path/process access. |
| `_data/index.js` | Core configuration: command characters, timeout, hash list, container markers, uid salt range, inherit/bind lists, ready-hash list, invoke-chain table, defaults. |
| `_data/features.json` | 13 feature labels. |
| `_data/zones.json` | 44 zone labels. |
| `_data/actions.json` | 93 action labels. |
| `_data/states.json` | 93 state labels. |
| `_data/intents.json` | 17 intent labels. |
| `_data/beliefs.json` | 3 belief labels. |
| `_data/events.json` | 25 core event names. |
| `_data/msgs.json` | 37 system messages and default legal/profile strings. |
| `tests/index.js` | A console-only smoke run. No assertions. |
| `tests/agent.json` | Test agent fixture (`key: "test"`). |
| `tests/client.json` | Test client fixture with VLA and all 10 required feature blocks. |
| `examples/hello-world.js` | A copy of the test harness with a smaller method; prints prompts. |
| `core/*.md` | Jekyll reference pages generated from the JSON data with Liquid. |
| `index.md`, `about.md`, `docs.md`, `404.md` | Jekyll site pages. `docs.md` includes `README.md`. |
| `_includes/head.html`, `header.html`, `footer.html` | Jekyll theme overrides. |
| `_config.yml` | Jekyll configuration (`minima`, dark skin, analytics, social links). |
| `assets/*.png` | Site images: banner, Deva logo, favicon, icon. |
| `CNAME`, `robots.txt` | Site deployment metadata: `deva.world`, allow all crawlers. |
| `package.json` | Package metadata, VLA object, ES module type, scripts, engines. No dependencies. |
| `LICENSE.md` | Vedic License Agreement 1.4.2, VLA `23221940810208468106`. |
| `README.md` | Main user documentation. Contains several claims that do not match the code. |
| `.gitignore`, `.npmignore` | Git and npm exclusion lists. The npm list is only `packs/` and `private/`. |
| `.nova/Configuration.json` | Editor workspace metadata (`workspace.color`, `workspace.name`). Not runtime code. |

No lockfile exists because there are no dependencies. There is no `.github` directory, CI configuration, lint script, TypeScript declaration, changelog, or exports map.

---

## 4. The runtime model

### 4.1 Language and module shape

- Node.js `>=22`, npm `>=9.5.1`, ES modules only (`"type": "module"`).
- JSON files are imported with import attributes: `import x from './x.json' with {type:'json'}`.
- The package has no runtime dependencies. It imports only Node built-ins: `node:events`, `crypto`, `path`, `fs`, `os`, `node:child_process`.
- `require('@indra.ai/deva')` will not work.

### 4.2 Shared event bus

Every Deva receives `opts.events` or creates a new `EventEmitter`. Child Devas inherit the parent's bus by reference. There is no bus per agent, no namespace isolation beyond event-name prefixes, and no serialization. A listener registered by one Deva sees events from every Deva sharing that bus.

`maxListeners` defaults to `0`, which Node interprets as unlimited. This avoids warnings but also makes listener leaks invisible.

### 4.3 Synchronous events, asynchronous methods

`EventEmitter.emit()` is synchronous. A listener runs immediately, inside the caller's stack. Consequently:

- a listener that throws breaks the emitter's operation;
- a listener can re-enter the Deva (call `stop`, ask, change state) while the current operation is halfway through;
- `talk()` returns whatever `emit()` returns: `true` if at least one listener existed, `false` otherwise.

Methods, by contrast, are expected to return Promises. The core calls `.then()` on them. This split (synchronous events, Promise-based methods) is the source of many sharp edges.

### 4.4 One process, no transport

The ask protocol is a local broadcast. If the target is in another process, it cannot hear the event. There is no bridge, queue, or network adapter in this repository. Any distributed use would require the host application to forward packets itself.

---

## 5. Constructing a Deva

### 5.1 Constructor options

The constructor accepts an options object. The documented and effective options are:

| Option | Meaning | Important behavior |
|---|---|---|
| `id` | Instance id. | Defaults to `randomUUID()`. The copy loop also exposes it as `this.id` if provided. |
| `info` | Package-style information returned by `info()`. | Must contain `VLA.uid` (used by `uid()`). `ready()` calls `info()` and destructures `VLA`. `false`/missing will break later. |
| `agent` | Agent identity and profile. | Should contain `id`, `key`, `prompt`, and `profile.name`. `key` is the event namespace. `profile` is required by `uid()`, `status()`, and `sign()`. |
| `config` | Local configuration. | Needs a `hash` object for `ready()`. Also may contain `timeout.ask`; the core overwrites `hashes` and `ready_hash`, and merges timeout values. |
| `vars` | Free-form variables. | `vars.context` must be an object for `context()` and for the lifecycle, because `_invoke()` calls `context()` at every step. |
| `utils` | User helper object. | Bound at `init`. |
| `func` | User function object. | Bound at `init`. |
| `methods` | Public command methods. | Each is called as `method(packet)` and must return a thenable. Bound at `init`. |
| `listeners` | `{eventName: handler}`. | Wrapped and registered on the bus at `init`. |
| `devas` | Child Deva instances keyed by name. | Inherited `events`, `lib`, `config`; loaded during `ready`. |
| `modules` | Third-party modules. | Stored only; the core does not use them. |
| `events` | Existing `EventEmitter`. | Allows several Devas to share one bus. |
| `maxListeners` | Passed to `events.setMaxListeners`. | `0` means unlimited. |
| Lifecycle hooks | `onInit`, `onStart`, `onEnter`, `onDone`, `onReady`, `onFinish`, `onComplete`, `onStop`, `onClose`, `onLeave`, `onExit`, `onShutdown`, `onError`. | Hooks own the continuation; if a hook does not call the next step or `resolve`, the chain stops. |

Any other top-level option is copied onto the instance if the copy-loop condition allows it.

### 5.2 Internal fields created by the constructor

- `_core`: a reference to the imported `package.json` object. **Not a copy.** Every `init()` mutates it.
- `_id`: `opts.id` or a UUID.
- `_info`: `opts.info` or `false`.
- `_config`: `opts.config` or `{}`; then `hashes`, `ready_hash`, and merged `timeout` are added.
- `_agent`: `opts.agent` or `false`.
- `_client`: `{}` until `init`.
- `_active`: `false` until a license check passes, then a timestamp (`Date.now()`), not a boolean.
- `_license`, `_error`, `_log`, `_data`, `_report`, `_legal`, `_security`, `_support`, `_services`, `_systems`: `false` until their feature step loads them.
- `events`, `lib`, `utils`, `devas`, `vars`, `listeners`, `modules`, `func`, `methods`, `maxListeners`.
- `cmdChr` (`/`), `askChr` (`#`), `container`, `box`.
- `_inherit`, `_bind`, `_uid`, `_events`, `_bound` (Map), `_pending` (Set), `_stateBound` (array).
- `_feature` / `_features`, `_zone` / `_zones`, `_action` / `_actions`, `_state` / `_states`, `_intent` / `_intents`, `_belief` / `_beliefs`, `_context`, `_messages`.

### 5.3 The generic copy loop

After setting the known fields, the constructor runs:

```js
for (const opt in opts) {
  if (!this[opt] || !this[`_${opt}`]) this[opt] = opts[opt];
}
```

This is intended to copy extra options without overwriting existing functions or variables. Its real effects are subtler:

- `opts.config` sets `this.config` because `this.config` did not previously exist. From then on, `this.config` and `this._config` point at the same object (unless something replaces one of them).
- `opts.id` sets `this.id`.
- `opts.info` and `opts.agent` do **not** overwrite the prototype methods `info()` and `agent()` because both `this.info`/`this.agent` (the methods) and `_info`/`_agent` exist.
- `opts.lib` **will replace** the freshly constructed `LIB` instance, because `this.lib` is truthy but `this._lib` is undefined. This is an undocumented escape hatch and a potential footgun.
- Passing the same `methods`, `listeners`, `func`, or `utils` object to two Devas causes `_assignBind()` to mutate that shared object. Functions are replaced with bound versions on the first Deva; the second Deva receives functions already bound to the first. Reuse copies, not the same object.

### 5.4 Shared mutable data

The constructor copies custom agent vocabulary into the imported core maps and then deletes those keys from the agent object:

```js
if (this._agent.zones) {
  for (let item in this._agent.zones) {
    if (!this._zones[item]) this._zones[item] = this._agent.zones[item];
  }
  delete this._agent.zones;
}
```

The same pattern applies to `actions`, `states`, `intents`, `beliefs`, and `messages`.

Consequences:

- Custom vocabulary is global to the process, because `_zones`, `_actions`, etc. are the imported JSON module objects. A name added by one Deva is visible to every later Deva.
- The caller's `agent` object is modified (keys deleted), so reusing that object for another Deva loses the custom vocabulary.
- Core names cannot be overridden; the `if (!this._zones[item])` check preserves the core entry.
- `_core` is also shared and mutated during `init` (see [Section 12](#12-hashing-identity-and-uid)).

This design gives convenient process-wide vocabulary extension, but it is not instance isolation.

### 5.5 The constructor does not validate

There is no check that `agent`, `info`, `config`, `vars.context`, or `profile` exist. Missing pieces fail later, often deep inside a lifecycle step and sometimes as a stack overflow. The README's "effectively required" warning is accurate; the code does not enforce it.

---

## 6. The vocabulary

### 6.1 Counts and defaults

| List | Count | Default current value | Where used |
|---|---:|---|---|
| features | 13 | `false` | `feature()`, `_getFeature()`, `Feature()` |
| zones | 44 | `false` | `zone()` |
| actions | 93 | `false` | `action()` |
| states | 93 | `offline` | `state()` |
| intents | 17 | `neutral` | `intent()` |
| beliefs | 3 | `vedic` | `belief()` |
| events | 25 | — | `_events` map |
| messages | 37 | — | `_messages` map |

The lists are **descriptive labels**, not enforced transitions. For example, `state('shutdown')` can be called at any time; the only real gate is `_active`. Nothing validates that `start` precedes `enter`, or that an answer follows a question. The "state machine" is a recording convention plus a fixed lifecycle chain, not a transition-validating FSM.

### 6.2 `_data/index.js` configuration

| Key | Value | Used for |
|---|---|---|
| `cmdChr` | `/` | Local command prefix in `question()`. |
| `askChr` | `#` | Ask prefix in `question()`. |
| `timeout.ask` | `30000` | Ask timeout in ms; `0` disables. |
| `hashes` | `['md5','sha256','sha512']` | Stamp order. |
| `container.begin` / `.end` | `::BEGIN` / `::END` | `help()` section markers. |
| `box.begin` / `.end` | `::begin` / `::end` | Present but unused. |
| `uid.end_min` / `.end_max` | `1000000` / `9999999` | Suffix salt range for default uid. |
| `inherit` | `events`, `lib`, `config` | Copied from parent to child Devas. |
| `bind` | `listeners`, `methods`, `utils`, `func`, `lib` | Function properties bound to the instance. |
| `ready_hash` | `vars`, `utils`, `listeners`, `modules`, `func`, `methods` | Objects hashed into `config.hash[agent.key]`. |
| `invoke` | lifecycle table | Next step, hook name, and clear list per step. |
| `context` | `false` | Default context. |
| `feature` / `features` | `false` / 13 labels | Current feature and list. |
| `zone` / `zones` | `false` / 44 labels | Current zone and list. |
| `action` / `actions` | `false` / 93 labels | Current action and list. |
| `state` / `states` | `offline` / 93 labels | Current state and list. |
| `intent` / `intents` | `neutral` / 17 labels | Current intent and list. |
| `belief` / `beliefs` | `vedic` / 3 labels | Current belief and list. |
| `messages` | 37 strings | System text. |

### 6.3 Features are both labels and client policy slots

`_data/features.json` contains:

```
init, agent, client,
license, error, log, data, report, legal, security, support, services, systems
```

`init`, `agent`, and `client` are markers used during startup. The other ten are **client policy features**: `License()` through `Systems()` in `index.js` each call `Feature('<name>')`, which expects the client to provide a block for that name. If the client omits one, startup fails at that step.

The README claims 21 features and lists eight that are not in the data file or the code (`communication`, `treasury`, `justice`, `authority`, `owner`, `medical`, `networks`, `veda`). It also claims getters such as `veda()`; those do not exist. See [Section 19](#19-correctness-findings-and-documentation-mismatches).

### 6.4 Labels versus keys

Each JSON file has a `DATA` object whose keys are stable machine names (`offline`, `security`, `ask`) and whose values are display labels (`😴 Offline`, `🚨 Security`, `📣 Ask`). The code uses the key for matching and the label for event `text`. Do not confuse the two. For example, `state('offline')` is valid; `state('😴 Offline')` returns `undefined` and is ignored.

---

## 7. Startup: `init()` in detail

`init(client)` returns a Promise. Internally it does the following, in order.

### 7.1 Hash the core

```js
this._core.md5 = this.hash(this._core, 'md5');
this._core.sha256 = this.hash(this._core, 'sha256');
this._core.sha512 = this.hash(this._core, 'sha512');
```

This mutates the shared imported `package.json` object. Because the object is hashed in place, the second hash includes the first, and every subsequent `init()` includes the previous hashes. The core hash is therefore **not stable across instances or repeated initialization** (see [Section 12.4](#124-the-core-hash-is-mutated-in-place)).

### 7.2 Check the license

```js
const license_check = this.license_check(client.VLA, this._core.VLA);
if (!license_check?.id) {
  this.prompt(license_check);
  return resolve(license_check);
}
```

`license_check()` hashes the entire client VLA object and the entire package VLA object with sha256 and compares the base64 digests. If either argument is missing, it returns one of the "bad VLA" message strings. If the hashes differ, it returns `❌ Invalid VLA Check`. If they match, it returns a stamped object with an `id`, a timestamp, and the two hashes.

There are several consequences:

- **The comparison is property-order sensitive.** JSON.stringify preserves insertion order, so a VLA with the same values in a different key order will fail the check. In practice, clients copy the package VLA verbatim.
- **The comparison includes the VLA's own `md5`, `sha256`, and `sha512` fields.** The entire object is hashed, not just `uid`.
- **A failure returns a string, not `false`.** The README's method table says "stamped approval or false"; the actual failure values are strings.
- **`this.prompt(license_check)` does nothing useful.** `prompt()` begins with `if (!this._active) return this._messages.offline`, and `_active` is still `false` at this point. No `devacore:prompt` event is emitted. The failure is visible only to the caller of `init()` (and in the state/action logs produced inside `license_check`).
- **The core has already been mutated** before the license gate, so a failed startup still changes the process-wide core hashes.
- **The README's failure message `❌ The Provided Client License Is Invalid` is never used.** `_messages.client_license_invalid` exists in the data file but no code references it.

After a failed check, `_active` stays `false` and `init()` resolves the failure string.

### 7.3 Mark active and create the init record

On success:

```js
this._active = Date.now();
const id = this.uid();
const agent = this.agent();
const data = {
  id, key: agent.key, value: 'init', agent, client,
  text: this._messages.init, created: Date.now(),
};
const data_stamped = this._stamp(data, 'init', data.id.uid);
```

The init data uses `text: '🟠  INIT'`. That same object is carried through every lifecycle step. `_invoke()` does not replace `text` with per-step messages, so the `devacore:start`, `devacore:enter`, `devacore:done`, and `devacore:ready` events all carry `text: '🟠  INIT'`. Only the timestamps and hashes change. This is observable in the test log.

### 7.4 Prepare the instance

```js
this.events.setMaxListeners(this.maxListeners);
this._assignInherit()
  .then(() => this._assignBind())
  .then(() => this._assignListeners())
  .then(() => { /* Client ... */ });
```

- `_assignInherit()` copies `events`, `lib`, and `config` from the parent to each entry in `devas`. It overwrites the child's public `config`, which can diverge from the child's private `_config` (discussed in [Section 15](#15-child-devas)).
- `_assignBind()` walks `listeners`, `methods`, `utils`, `func`, and `lib`, replacing every own enumerable function with `.bind(this)`. It mutates the original option objects. It does **not** bind `LIB` prototype methods; only the functions assigned in the `LIB` constructor (`exec`, `spawn`, `randomUUID`) are bound.
- `_assignListeners()` registers two groups:
  1. **Automatic state listeners.** For every key in `_states`, if `this[key]` is a function, it registers `events.on('<agent.key>:<state>', packet => this[state](packet))`. For the test agent (`key: 'test'`) this produces 22 listeners: `test:Done`, `test:answer`, `test:ask`, `test:close`, `test:complete`, `test:data`, `test:done`, `test:enter`, `test:exit`, `test:finish`, `test:help`, `test:init`, `test:leave`, `test:listen`, `test:load`, `test:question`, `test:ready`, `test:shutdown`, `test:start`, `test:stop`, `test:talk`, `test:unload`.
  2. **User listeners.** For every key in `listeners`, it wraps the handler and registers it.

The automatic listeners are a major sharp edge. Because state names overlap with public method names, emitting `test:help`, `test:talk`, `test:data`, or `test:ready` invokes a public method with a packet as its argument. Some of those calls are harmless; some throw, recurse, or mutate state unexpectedly. The names are also not namespaced beyond the agent key.

### 7.5 Load client features

`Client(client)` does the following:

1. Logs the feature/zone/action.
2. Iterates `client.features`; for each feature block with a `methods` map, binds each function into `this.methods`.
3. Copies the whole client with `lib.copy` (JSON round-trip), assigns it to `_client`.
4. Resolves with no value.

Then the chain runs ten feature steps:

```
License, Error, Log, Data, Report, Legal, Security, Support, Services, Systems
```

Each is a thin wrapper around `Feature('<name>')`.

`Feature(feature)`:

1. Rejects with `⛔️ INVALID FEATURE` if the name is not in `_features`.
2. Creates a `uid()`.
3. Logs feature/zone.
4. Calls `this.client()` to get a hashed copy of `_client`, then destructures `{id, profile, features}`.
5. Reads `data = features[feature]`.
6. Stores:

```js
this[`_${feature}`] = {
  id: _id,
  client_id: id,
  client_name: profile.name,
  concerns: data.concerns,
  global: data.global,
  personal: data.devas[this._agent.key],
  created: Date.now(),
};
```

7. Deletes `_client.features[feature]`.
8. Resolves the feature name.

Important details:

- The client must provide **all ten** feature blocks. A missing block causes `data` to be `undefined`, and the next property access throws. The catch calls `err()`, the chain rejects, and startup stops there.
- Each block must have at least `concerns`, `global`, and `devas` for `Feature()` to complete. `devas` is indexed by the agent key; if it is missing, `data.devas[...]` throws. In the test fixture every block has `devas: {}`, so `personal` is `undefined`.
- Feature-specific settings beyond `concerns`, `global`, and `personal` are **discarded**. For example, `tests/client.json` has `security.hash` and `security.cipher`, but `security()` returns only `concerns`, `global`, `personal`, and metadata. The cipher settings are not available through the feature object.
- `personal` is usually `undefined` because `devas` is empty. The client is expected to key personal data by the Deva's `agent.key`.
- `Client()` binds feature methods before `Feature()` loads the blocks, so methods from all features are available even if a later feature step fails.
- Deleting features one by one means `client()` returns a different client hash at each feature step; hashes are not stable during startup.
- A feature failure leaves `_active` truthy. The Deva is "active" in the sense that `_active` has a timestamp, but it has not finished initializing. This contradicts the README's implication that a failed startup leaves the Deva inactive (that is true only for the license gate).

### 7.6 Finish the chain and start

After the ten features, `Done()`:

```js
delete this._client.features;
this.state('Done', 'Done');
return resolve(this._client);
```

Then `init()` calls `onInit(data, resolve)` if defined; otherwise it calls `start(data_stamped, resolve)`.

### 7.7 The early-resolve bug

`Client()` calls `resolve()` with no argument. That settles the Promise returned by `init()` immediately, with `undefined`. The rest of the chain (`License` through `Ready`) runs afterward. `Done()` calls `resolve(this._client)`, but the Promise is already settled, so that value is ignored.

This was verified with a probe:

```
INIT_RESULT undefined
```

Therefore:

```js
await deva.init(client); // resolves before startup is complete
deva.question(...);      // may run while features are still loading, listeners are still being added
```

The reliable readiness points are:

- the `onReady(data, resolve)` hook;
- a listener for `devacore:ready`;
- your own Promise resolved from one of those.

A license failure is different: it resolves a string *before* `Client()`, so `init()` does return the error string in that case.

There is also a race if you call `stop()` immediately after `await init()`: the background startup chain may still be running, and stopping it can set `_config`/`_active` to `false` while the chain is still trying to use them. A probe that did this produced:

```
TypeError: this._config.hashes is not iterable
```

from `_stamp()` inside `err()`, triggered by a late startup error. In other words, early shutdown during startup is not safe.

### 7.8 Startup failure handling

The chain ends with:

```js
.catch(err => {
  this.state('catch', `init:${data.id.uid}`);
  this.intent('bad', `init:${data.id.uid}`);
  return this.err(err, client, reject);
});
```

If `onError` is not defined, `err()` calls `reject(err)`. If the failure happens before `Client()` settled the init Promise, the caller sees the rejection. If it happens after, the reject is a no-op and the caller still sees `undefined`; only the event and logs reveal the failure. If `onError` is defined and does not call `reject`, the chain resolves and the failure can be completely silent apart from `devacore:error` (which may itself fail if configuration is missing).

---

## 8. The invoke chain

### 8.1 The table

`_data/index.js` defines:

| Step | Previous | Next by default | Hook | Clear list |
|---|---|---|---|---|
| `start` | `init` | `enter` | `onStart` | — |
| `enter` | `start` | `done` | `onEnter` | — |
| `done` | `enter` | `ready` | `onDone` | — |
| `ready` | `done` | — (resolve) | `onReady` | — |
| `finish` | `answer` | `complete` | `onFinish` | — |
| `complete` | `finish` | — (resolve) | `onComplete` | — |
| `stop` | — | `close` | `onStop` | — |
| `close` | `stop` | `leave` | `onClose` | — |
| `leave` | `close` | `exit` | `onLeave` | — |
| `exit` | `stop` | `shutdown` | `onExit` | `_license`, `_error`, `_log`, `_data`, `_report`, `_legal`, `_security`, `_support`, `_services`, `_systems` |
| `shutdown` | `exit` | — (resolve) | `onShutdown` | `modules`, `listeners`, `events`, `_config`, `_active` |

### 8.2 What `_invoke()` actually does

For a given `key`, `data`, and `resolve`:

1. Rejects the operation with `⭕️ OFFLINE` if the Deva is inactive.
2. Resolves `⛔️ NO KEY PROVIDED` if there is no key.
3. Resolves `⛔️ INVALID KEY PROVIDED` if the key is not in the invoke table.
4. Resolves `⛔️ NO DATA PROVIDED` if there is no data.
5. Logs `action('invoke')`, `context(key)`, `zone(key)`, `action(key)`, `state(key)`.
6. Logs `state('data')` and sets `data[key] = Date.now()`.
7. Re-stamps the data: `this._stamp(this._unstamp(data), key, data.id.uid)`.
8. Emits `devacore:<key>` with `lib.copy(data)`.
9. If the step has a clear list, runs it. `listeners` is special: `_removeListeners()` is called, then the property is set to `false`.
10. If a hook named by `onfunc` exists, calls `hook(data, resolve)` and returns its result. The hook decides whether to continue.
11. Otherwise, if there is a `next_key`, calls `this[next_key](data, resolve)`; otherwise resolves `data`.

Because `data` is reused across the whole chain, the `text` field remains the init message, and each step adds a timestamp under its key. The final object has `init`, `start`, `enter`, `done`, `ready` (or `stop`, `close`, ...) timestamps. Every event copy has the hashes as of that step.

### 8.3 Hooks own continuation

The hooks are not observers; they are the continuation mechanism. The defaults are automatic only when the hook is absent. A hook that returns a value without calling the next step or `resolve` leaves the lifecycle (and often the caller) waiting. The README's quick start and the tests both define every hook explicitly and manually chain them.

Typical hooks:

```js
onInit(data, resolve)   { return this.start(data, resolve); }
onStart(data, resolve)  { return this.enter(data, resolve); }
onEnter(data, resolve)  { return this.done(data, resolve); }
onDone(data, resolve)   { return this.ready(data, resolve); }
onReady(data, resolve)  { /* do work */ return resolve(data); }
```

`onFinish` and `onComplete` wrap answers. If you define `onFinish` but do not call `complete`, the answer Promise never resolves.

### 8.4 `ready()` in detail

`ready()` is the only lifecycle step that does substantial work beyond the generic chain:

1. Gets the agent and `info()`; destructures `VLA` (unused).
2. Ensures `this.config.hash[agent.key]` exists.
3. For each item in `_config.ready_hash` (`vars`, `utils`, `listeners`, `modules`, `func`, `methods`), if the item is truthy, stores `sha256(item)` under `config.hash[agent.key][item]`.
4. Loads every child Deva in `devas` sequentially with `load(key, data.client)`.
5. For each child, emits a non-standard `deva:dir` event with `{id, key, dir}`.
6. After the last child's `load()` resolves, schedules `_invoke({key:'ready', data, resolve})` with `setImmediate`.
7. If there are no children, invokes `ready` immediately.

Problems in this area:

- `this.config` must exist and have `hash`. If `config` was omitted, `ready()` throws.
- `info()` must work; it requires `_info` and returns a stamped copy. `info()` itself requires `_active`.
- The ready hash of `listeners`, `methods`, `func`, and `utils` is largely meaningless as a code fingerprint: `JSON.stringify` drops function values, so an object of functions hashes as `{}`. Only data-valued properties (such as `vars`) contribute.
- A child's `init()` resolves at its own `Client` step, so `load()` resolves before the child is ready. The parent can continue and even finish `ready` while children are still starting.
- If `devas` is non-empty and a `load()` rejects or hangs, the parent's `ready` may never invoke. There is no timeout or catch around the child loop.
- The `deva:dir` event is not in `_data/events.json`. Listeners must know the literal name.
- `ready()` is `async`, but no code awaits its return in a way that surfaces all child errors; failures can become unhandled rejections.

### 8.5 Answers use `finish` and `complete`

A local method answer goes through `finish` then `complete` (unless a hook interrupts). Each adds a timestamp and re-stamps. The final packet has:

```
id, q, a, created, finish, complete, md5, sha256, sha512
```

`finish` and `complete` are numbers (milliseconds). `finish` is added first; `complete` is added after the re-stamp of `finish`, so the tiers cover both timestamps.

`_methodNotFound()` is the exception: it returns a packet with `a` and fresh top-level hashes but no `finish`/`complete`, because it bypasses the lifecycle. This makes the packet contract inconsistent between "known method" and "unknown method" results.

---

## 9. Shutdown and unloading

### 9.1 `stop()`

`stop()` is the entry point:

- If `!_active`, it returns the **string** `⭕️ OFFLINE` immediately, not a Promise.
- Otherwise it creates a stop record with `id`, `key: 'stop'`, `value: agent.key`, `agent: agent.sha256`, `client: client().sha256`, and `stop: Date.now()`.
- It calls `_invoke({key:'stop', data, resolve})`.
- The chain runs `stop → close → leave → exit → shutdown`.
- `close`, `leave`, `exit`, and `shutdown` each mutate `data.key` to their own name before invoking. The final resolved object therefore has `key: 'shutdown'`.

If no hooks are defined, `await deva.stop()` resolves with the data object. With hooks, the hooks decide.

### 9.2 What each shutdown step clears

- `exit`: clears the ten feature slots (`_license` through `_systems`) by assigning `false`.
- `shutdown`: clears `modules`, `listeners`, `events`, `_config`, and `_active`.
  - `listeners` triggers `_removeListeners()` first, which removes user listeners, automatic state listeners, and pending asks.
  - Then the properties themselves are set to `false`.

After shutdown:

- `_active` is `false`.
- `events` is `false`.
- `_config` is `false`.
- `listeners`, `modules`, and feature slots are `false`.
- `_client`, `_agent`, `_info`, and `_core` remain.
- `client()` and `agent()` return the offline string because `_active` is false.
- `talk()` will throw (`this.events` is `false`).
- `_stamp()` will throw (`this._config.hashes` is not iterable).
- `err()` can throw while trying to stamp or talk.
- `stop()` returns the offline string.
- Many methods return or resolve `⭕️ OFFLINE`, but "many" is not "all". Do not assume a stopped Deva is safe to poke.

The README says "After that, the Deva answers most calls with `⭕️ OFFLINE`." That is fair, but the exceptions matter for cleanup code.

### 9.3 `unload(key)`

`unload(key)`:

1. Resolves offline if inactive.
2. Logs zone/action/state.
3. Calls `this.devas[key].stop()` and, in a `.then`, deletes the child and emits `devacore:unload` with the raw key string.
4. Resolves `${messages.unload}:${key}` immediately, without waiting for the child's stop chain.

Bugs and hazards:

- If the child is already inactive, `stop()` returns a string, and `.then` is not a function → synchronous TypeError caught by the `try`/`catch`, which calls `err` and rejects.
- If the child's stop rejects, there is no `.catch` on the `.then`, so the rejection is unhandled; the outer `try` cannot catch it.
- The parent resolves before the child finishes stopping, so callers may proceed while the child is still alive.
- `devacore:unload` carries a plain string, unlike every other core event, which carries a stamped object.
- If `devas[key]` is missing, accessing `.stop()` throws inside the try and rejects.

### 9.4 Repeated `init()`/`stop()` and concurrency

Calling `init()` twice on the same instance is not guarded. It rehashes the core, reassigns `_client`, adds listeners again (duplicates), and re-runs the feature chain. The original options objects may already be bound. Calling `stop()` while `init()` is still running can produce the crash shown in [Section 7.7](#77-the-early-resolve-bug). There is no state machine guard against overlapping lifecycle operations.

---

## 10. Messaging

### 10.1 `question(text, data)`

`question()` is the main entry point. It requires active status and a non-empty string. It creates two uid objects: one for the packet and one for `packet.q`. It then examines the first whitespace-delimited token.

| Input form | Example | `method` | `key` | `params` | `text` |
|---|---|---|---|---|---|
| Local command | `/greet world` | `greet` | current agent key | `['/greet']` | `world` |
| Local command with params | `/greet:a:b world` | `greet` | current agent key | `['/greet','a','b']` | `world` |
| Ask | `#helper shout hi` | `shout` | `helper` | `['shout']` | `hi` |
| Ask with colon params | `#helper shout:a:b hi` | `shout` | `helper` | `['shout:a:b']` | `hi` |
| Plain text | `hi there` | `question` | current agent key | `false` | `hi there` |

Note the asymmetry: for a local command, `params` includes the command token itself (`/greet`); `sign()` later calls `shift()` to remove it. For an ask, `params` is the second token split on `:`, so it usually starts with the method and does not include the `#key` token.

`question('#key')` with no second token throws when it reads `params[0]`. The throw is caught and routed to `err()`, so the caller may see a rejected or pending Promise depending on `onError`.

### 10.2 The local path

For `/method` or plain text:

1. Build `packet.q` with `id`, `agent`, `client`, `meta {key, method, params}`, `text`, `data`, `created`.
2. Stamp `q`.
3. Emit `devacore:question` with a copy.
4. Call `answer(packet, resolve, reject)`.

`answer()`:

- Checks `this.methods[method]` is a function.
- If not, resolves `_methodNotFound(packet)` directly.
- If yes, calls `this.methods[method](packet)` and **immediately calls `.then()` on the return value**.
- On success, builds `packet.a`:
  - if the result is an object: `text = result.text`, `html = result.html`, `data = result.data`;
  - otherwise: `text = html = result`, `data = false`.
- Stamps `a`, emits `devacore:answer`, then runs `finish` → `complete`.
- On rejection, calls `err(err, packet, reject)`.

Consequences:

- **A method must return a thenable.** `return 'hello'`, `return {text:'hello'}`, and `return null` do not work through `answer()`:
  - a string/number/boolean has no `.then` → synchronous TypeError → `err`;
  - a plain object has no `.then` → same;
  - `null` reaches `.then`? No: `null.then` throws before the call, so the catch handles it;
  - a Promise resolving to `null` reaches the callback, where `typeof null === 'object'` and `result.text` throws. The `.then` chain rejects and the attached `.catch` routes to `err`.
- A Promise resolving to a string works: `a.text` and `a.html` both become the string; `a.data` is `false`.
- A Promise resolving to an object without `text`/`html`/`data` yields `undefined` values, not `false`.
- The packet’s `a.meta.key` is the answering agent’s key; `a.agent` is the answering agent copy; `a.client` is the answering client copy.
- The top-level packet is re-stamped at each lifecycle step. `q` and `a` keep their own hashes.

### 10.3 The ask path

For `#key method text`, `question()`:

1. Builds and stamps `q` exactly as above, with `meta.key = key`, `meta.method = method`.
2. Emits `devacore:question`.
3. Creates a pending record `{evt: 'key:ask:<packet.id.uid>', handler, timer}`.
4. Registers `once(evt, handler)`.
5. Starts a timeout if `_config.timeout.ask > 0`.
6. Emits `key:ask` with a copy of the packet.
7. If `emit()` returned `false` (no listeners), releases the listener and resolves `⛔️ ASK TARGET NOT FOUND`.
8. If an answer arrives, emits `devacore:ask` with a copy of the answer and calls `finish(answer, resolve)`.
9. If the timeout fires, releases the listener and resolves `⛔️ ASK TIMEOUT`.

The target side is `ask(packet)`, invoked by the automatic `key:ask` state listener:

- If inactive, returns `Promise.resolve(OFFLINE)`; no reply is emitted.
- If the method is missing, schedules a reply with `setImmediate` on `key:ask:<packet.id.uid>` carrying `_methodNotFound(packet)`.
- Otherwise calls `this.methods[method](packet).then(...)`.
- On success, builds `packet.a`, sets `packet.q.agent = agent` (overwriting the asker’s agent in `q`), re-stamps the top-level packet, emits `devacore:answer`, then emits `key:ask:<packet.id.uid>` with the stamped packet.
- On a rejected method, emits `key:ask:<method>` with `{error}` and calls `err(err, packet)`; it does **not** emit the packet-id event, so the asker usually waits until timeout.
- On a non-thenable result, the synchronous `.then` TypeError is caught by the outer try, which emits `key:ask:<method>` with `{error}` and `err`; again, no packet-id reply.

Two additional details:

- The target replaces `packet.q.agent` but does not re-stamp `packet.q`, so `q`’s hashes no longer match its contents. Only the top-level hashes are refreshed.
- The reply event is emitted without a copy (`this.talk(..., packet_stamped)`), unlike most other events. A listener can mutate the object the asker is about to process.

### 10.4 Delivery semantics

- `key:ask` is a broadcast, not a direct call. Every listener registered on that event receives the packet. If two Devas share the same `agent.key`, both may answer; the asker’s `once` listener consumes only the first reply.
- The asker does not verify that the reply came from the intended Deva beyond the event name.
- A target that is inactive, crashed, or listening on a different key is indistinguishable from a missing target until the timeout.
- There is no correlation check on the answer beyond the event name (`packet.id.uid`).
- The timeout timer is tracked in `_pending`, so shutdown can clear it. User-created `once()` listeners are not tracked.

### 10.5 `talk`, `listen`, `once`, `ignore`

- `talk(evt, packet)` calls `events.emit(evt, packet)` and returns the boolean.
- `listen(evt, callback)` logs, stores `callback` in `this.listeners[evt]`, creates a wrapper `packet => this.listeners[evt](packet)`, stores the wrapper in `_bound`, and registers it. Calling `listen` twice for the same event overwrites the map entry but leaves the first wrapper registered on the bus.
- `once(evt, callback)` registers a one-time listener directly; it is not added to `listeners` or `_bound`, and shutdown does not remove it.
- `ignore(evt, callback)` calls `events.removeListener`.
- `_removeListeners()` removes the wrappers in `_bound`, the automatic state listeners in `_stateBound`, and pending asks. It does not remove arbitrary `once` listeners or listeners registered by user code directly on the shared bus.

### 10.6 `prompt(text)`

`prompt()` creates a stamped `{id, key, value:'prompt', agent, client, text, created}` and emits `devacore:prompt`.

- It returns the offline string if inactive. This is why the license-failure prompt is silent.
- It passes the live stamped object to `talk`, not a copy. A listener can mutate the object that `prompt()` returns.
- It logs `state`, `action('talk')`, and `action('return')`.

### 10.7 Event names and quirks

The core event map is in `_data/events.json` (25 names). In practice:

- `_invoke` emits `devacore:<step>` for every lifecycle step.
- `_workflow` emits `devacore:feature`, `devacore:zone`, `devacore:action`, `devacore:state`, `devacore:intent`, and `devacore:belief`.
- `context()` emits `devacore:context`.
- `question()` emits `devacore:question`; when an ask reply arrives it emits `devacore:ask` (the name is used for "an ask was answered", not "an ask was sent").
- `answer()` and the target `ask()` emit `devacore:answer`.
- `err()` emits `devacore:error`.
- `prompt()` emits `devacore:prompt`.
- `unload()` emits `devacore:unload` with a raw key string.
- `devacore:load` is defined but never emitted.
- `ready()` emits an extra `deva:dir` event that is not in the map.
- Automatic state listeners use `<agent.key>:<state>`, not `devacore:*`.

### 10.8 The ask lifecycle visually

```
Asker                                   Target
  |  question('#helper shout hi')          |
  |  emit devacore:question                |
  |  once helper:ask:<packet-id>           |
  |  emit helper:ask (packet)  ----------> |  ask(packet)
  |                                        |  methods.shout(packet)
  |                                        |  build packet.a
  |                                        |  emit devacore:answer
  |  <----------------- helper:ask:<id>    |  emit helper:ask:<id> (stamped packet)
  |  finish -> complete                    |
  |  resolve packet                        |
```

If the target throws or returns a non-Promise, the arrow back on `helper:ask:<id>` is usually missing; the asker waits for the timeout.

---

## 11. Packets and data shapes

### 11.1 A successful question packet

Observed key order:

```
packet: id, q, a, created, finish, complete, md5, sha256, sha512
  q:    id, agent, client, meta, text, data, created, md5, sha256, sha512
  a:    id, agent, client, meta, text, html, data, created, md5, sha256, sha512
```

- `packet.id` is a uid object, not a string. Use `packet.id.uid`.
- `q.meta` is `{key, method, params}`.
- `a.meta` is `{key, method, params}` where `key` is the answering agent’s key.
- `a.text` is a string or `undefined`; `a.html` is a string or `undefined`; `a.data` is whatever the method returned as `data` (or `false` for primitive results).
- `created`, `finish`, and `complete` are `Date.now()` values.
- `q` and `a` have their own md5/sha256/sha512; the top-level hashes cover the whole packet, including `q` and `a`.

### 11.2 The method-not-found packet

Local unknown command:

```
packet: id, q, a, created, md5, sha256, sha512
  a: id, agent, client, text, meta {key, method}, created, md5, sha256, sha512
```

There is no `a.html`, no `a.data`, no `finish`, and no `complete`. `a.text` is:

```
⛔️ METHOD NOT FOUND <agent-key> <method>
```

Ask-side unknown method goes through the target’s `_methodNotFound()` and then the asker’s `finish`/`complete`, so it *does* get those timestamps after the reply. That inconsistency is easy to miss.

### 11.3 The stop packet

```js
{
  id, key: 'stop', value: '<agent-key>',
  agent: '<agent sha256>', client: '<client sha256>',
  stop: Date.now(),
  md5, sha256, sha512
}
```

As the chain proceeds, `key` becomes `'shutdown'`, and timestamps for `close`, `leave`, `exit`, and `shutdown` are added. The stop packet has no `text`.

### 11.4 Workflow records

Singular `feature()`, `zone()`, `action()`, `state()`, `intent()`, and `belief()` return:

```js
{
  id, key, value, text,
  agent, client, created,
  md5, sha256, sha512
}
```

The `text` is the display label plus any `extra` argument. The event payload is a copy.

Plural `features()`, `zones()`, `actions()`, `states()`, `intents()`, and `beliefs()` return:

```js
{
  id, key, value, agent, client, created,
  md5, sha256, sha512
}
```

`value` is the **live internal map** (for example, `states().value` is `_states`). Mutating it changes the Deva’s vocabulary. `contexts()` is separate and returns `vars.context || false`.

### 11.5 The uid object

`uid()` returns:

```js
{
  uid, time, iso, utc, date, license, fingerprint,
  client, agent, machine, core_hash,
  status, warning, notice, vectors, owner, creator, salute, copyright,
  md5, sha256, sha512
}
```

- `uid` is a random UUID if `uid(true)` was called; otherwise it is a numeric string built from a time-derived range plus a 7-digit salt.
- `client`, `agent`, `machine`, and `core_hash` are sha256 strings.
- `license` is `info.VLA.uid`.
- `fingerprint` is sha256 of `{license, client, agent, machine, core_hash}`.
- The profile strings fall back to `_messages` values when the agent profile does not define them.
- There is no signature field and no secret.

### 11.6 The `sign()` record

`sign(packet)` returns a stamped record with:

```js
{
  id, key, method, opts, text, time, date, container,
  client: {key, name, fullname, emojis, company, expires, caseid, token, hash},
  agent: {key, name, hash},
  packet: '<sha256 of packet>',
  warning, copyright,
  md5, sha256, sha512
}
```

It is a hash-based attestation record. It is **not** a cryptographic signature: there is no private key, no secret input, and anyone can recompute the values. It also assumes `packet.q.meta.params` is an array; if `params` is `false` (plain text) or a string, `copy(params).shift()` throws. The `command` variable is unused, `fingerprint` is unused, and the token includes `client.profile.id`, which is absent in the test client and therefore hashes the literal `"undefined"`.

---

## 12. Hashing, identity, and `uid()`

### 12.1 The hash function

```js
hash(data, algo = 'md5') {
  const h = createHash(algo);
  h.update(JSON.stringify(data));
  return h.digest('base64');
}
```

Properties:

- Output is **base64**, not hex.
- Input is JSON text. Property insertion order matters.
- `undefined` properties, functions, and symbols are omitted by `JSON.stringify`.
- `Date` becomes an ISO string; `Map`/`Set` become `{}`; `BigInt` throws; circular structures throw.
- Arrays with extra named properties (such as hashes added by `_stamp`) hash only their indexed elements.
- There is no salt, key, or signature. The result is a deterministic integrity digest for the exact serialized value.

### 12.2 Stamping and unstamping

`_stamp(data, label, uid)` loops over `_config.hashes` in order (`md5`, `sha256`, `sha512`) and assigns `data[algo] = hash(data, algo)`. Because the assignment happens before the next iteration, each later hash covers the earlier hashes. This is the "cumulative" behavior.

`_unstamp(data)` deletes the three hash properties. It logs a delete action using `data.id?.uid` or the `noid` message.

To restamp after a change, call `_stamp(_unstamp(data), ...)`. Calling `_stamp` twice without unstamping changes the values because the second pass hashes the first pass’s outputs.

The functions mutate the object they receive. They return the same object. There is no immutable mode and no schema.

### 12.3 What the tiers do and do not prove

- They detect accidental or deliberate changes **if** the verifier knows the exact serialization and key order.
- They do not prove who created the packet. There is no signing key.
- They do not hide the data. The packet is plain JSON; the hashes are derived from it.
- md5 is not collision-resistant; sha256/sha512 are stronger, but the surrounding design (no secret, no canonicalization) still limits what the hashes mean.
- The README's language about "civilian", "government", and "military" tiers is a narrative convention, not a cryptographic guarantee.

### 12.4 The core hash is mutated in place

`this._core` is the imported `package.json` object, shared by every Deva in the process. `init()` does:

```js
this._core.md5 = hash(this._core, 'md5');
this._core.sha256 = hash(this._core, 'sha256');
this._core.sha512 = hash(this._core, 'sha512');
```

The first `init()` hashes the package object as shipped (which already contains a `VLA` block with precomputed hashes). The second `init()` hashes the object *including the first init’s hashes*. The result is a different `core.sha256` for each init.

Verified behavior:

```
CORE_SAME_AFTER_TWO_INIT false
A 1zFhREXWv6MZ...
B gGAR/1qXHPhC...
```

`uid()` uses `this._core.sha256` as `core_hash`, and `fingerprint` includes it. Therefore:

- two Devas initialized in the same process can have different fingerprints;
- restarting the process generally yields a different fingerprint;
- the `core_hash` embedded in a packet is not a stable identifier for the package version;
- code that persists fingerprints and compares them across runs will see false differences.

If a stable package identity is needed, hash a frozen copy of the package data before any init mutation, or use the version string.

### 12.5 The default uid is not a UUID

The default `uid()`:

```js
const min = Math.floor(time - (time / Math.PI));
const max = Math.ceil(time + (time * Math.PI));
const begin_random = Math.floor(Math.random() * (max - min) + min);
const end_random = Math.ceil(Math.random() * (end_max - end_min) + end_min);
const uid = `${begin_random}${end_random}`;
```

This produces a long numeric string (roughly 16 digits at current epoch values). `Math.random()` is not cryptographically secure. There is no collision registry. It is suitable as a locally unique-ish transport id, not as a security token. `uid(true)` uses `randomUUID()` and is the better choice when unpredictability matters.

### 12.6 Cost of `uid()`

Every `uid()` call:

- formats three dates;
- copies and hashes the client;
- copies and hashes the agent;
- reads OS data (`os.arch`, `hostname`, `networkInterfaces`, `platform`, `release`, `type`, `userInfo`, `version`, `uptime`, `cpus`);
- hashes the machine data three times;
- hashes the fingerprint and the uid object.

`uid()` is called by every `_workflow` event, which means every state/action/zone/feature/intent/belief event constructs a full machine fingerprint. Startup emits dozens of them. This is expensive and privacy-heavy. It also means event emission is not a cheap logging operation.

### 12.7 Profile data in every uid

`uid()` embeds the warning, notice, vectors, owner, creator, salute, and copyright strings in every id object. Those strings then appear in every packet and every event copy. This is intentional branding/legal metadata, but it inflates packets and leaks profile metadata to every listener.

---

## 13. The workflow API

### 13.1 Singular setters

`feature(value, extra)`, `zone`, `action`, `state`, `intent`, and `belief` all delegate to `_workflow(key, value, extra)`.

Behavior:

1. If inactive, return `⛔️ OFFLINE`.
2. Create a uid.
3. If `value` is falsy or not a key in the matching map, return `undefined` (silently ignore).
4. Set the current private field (`_state = value`, etc.).
5. Look up the display label.
6. Build `{id, key, value, text, agent, client, created}`.
7. Manually add md5/sha256/sha512 (not via `_stamp`, to avoid recursion).
8. Emit `devacore:<key>` with a JSON copy.
9. Return the live data object.

Notes:

- The value is not restricted to a legal transition. `state('shutdown')` is fine at any time.
- `extra` is concatenated to the label with a space. Passing an object results in `[object Object]`; `status()` does this with a uid object.
- The event is emitted even if no one listens; only `talk()`’s return value reveals that.
- The data object is returned live, but the event payload is a copy. Mutating the return value does not change the emitted copy.

### 13.2 `context(value, extra)`

`context()` is different:

- It accepts any truthy value, not just a key in `vars.context`.
- The label is `vars.context[value] || value`.
- It sets `_context`, builds a stamped record, emits `devacore:context`, and returns the stamped object.
- With no value, it returns `undefined` (and does not emit).
- If `vars.context` is missing, the property access throws, the catch calls `err()`, and `err()` calls `context('error')`, which throws again. This recurses until the stack overflows. That is why `vars.context` is effectively required even if you never call `context()` yourself: `_invoke()` calls it at every lifecycle step.

### 13.3 Plural getters

`features()`, `zones()`, `actions()`, `states()`, `intents()`, and `beliefs()` return a stamped object whose `value` is the internal map. `contexts()` returns a similar object but with `value: vars.context || false`.

These getters:

- require active status;
- log an action named after the plural key (some of those names are not in `actions.json`, so the log call is silently ignored);
- do not copy the map in `value`;
- are not the same as the singular setters. `states()` does not return the current state; it returns the entire state dictionary. The current state is private (`_state`).

### 13.4 Feature getters

`license()`, `error()`, `log()`, `data()`, `report()`, `legal()`, `security()`, `support()`, `services()`, and `systems()` call `_getFeature(key)`, which returns a copy of the stored feature record, the `⛔️ INVALID FEATURE` string if that feature was never loaded, or `⭕️ OFFLINE` if the Deva is inactive.

There are ten policy getters. There are no getters for `init`, `agent`, `client`, or the eight README-only features.

`_getFeature` also logs feature/zone/state/action/intent activity each time it is called, so reading feature data is not a pure operation.

---

## 14. Client features and policy data

### 14.1 The client shape

`tests/client.json` shows the expected shape:

```json
{
  "DATA": {
    "id": "...",
    "key": "test",
    "VLA": { ... },
    "prompt": { ... },
    "profile": {
      "name": "Test User",
      "fullname": "Test User Client Profile",
      "company": "...",
      ...
    },
    "features": {
      "license": {"concerns": [], "global": [], "devas": {}},
      "security": {"hash": "md5", "cipher": {...}, "concerns": [], "global": [], "devas": {}},
      ...
    }
  }
}
```

### 14.2 What the core uses

- `client.VLA`: the license gate.
- `client.id`: logged in the Client feature event and stored as `client_id`.
- `client.profile.name`: stored as `client_name`; other profile fields are used by `sign()` and `status()`/`uid()` indirectly.
- `client.features`: each block’s `concerns`, `global`, `devas`, and optional `methods`.
- `client.features[x].methods`: bound into the Deva’s methods.

### 14.3 What is lost

- Feature blocks are deleted from `_client.features` after loading, and `Done()` deletes the entire `features` object. After startup, `client()` returns a client copy **without** `features`.
- Only `concerns`, `global`, and `personal` are retained per feature. Any other fields (like `security.cipher`) are dropped.
- The original client object passed to `init()` is still referenced in the init `data` and in lifecycle event copies, so it may still contain features even though `_client` does not.
- `client()` returns a hashed copy; hashes change during startup as features are deleted.

### 14.4 Failure mode

If any of the ten required feature blocks is missing, `Feature()` throws while reading properties. The startup chain rejects; `err()` emits an error; `_active` is already set. The Deva can be left half-loaded. The README says the client must carry all features, but only the test fixture demonstrates the full shape.

---

## 15. Child Devas

### 15.1 Inheritance

`_assignInherit()` runs during the parent’s `init`, before the child is necessarily initialized:

```js
for (let d in this.devas) {
  this._inherit.forEach(inherit => {
    this.devas[d][inherit] = this[inherit];
  });
}
```

`_inherit` is `events`, `lib`, `config`. This means:

- Children share the parent’s event bus (good for asking).
- Children share the parent’s `LIB` instance (same locale, package).
- Children’s public `config` is replaced by the parent’s `config`.

It does **not** inherit `methods`, `listeners`, `func`, `utils`, `vars`, `info`, or `agent`.

### 15.2 The public/private config split

A child constructed with its own `config` has both `config` and `_config` pointing at that object. `_assignInherit()` overwrites only `config`. The child’s `_config` still points at its original object. Later:

- `_stamp()` uses `_config.hashes`;
- `_invoke()` uses `_config.ready_hash` and `_config.timeout`;
- `ready()` uses public `config.hash`.

If the parent and child had different config objects, these two views can diverge. `ready()` may write hashes into the parent’s object while stamping with the child’s hash list. This is a design bug waiting to happen.

### 15.3 Loading

`ready()` calls `load(key, data.client)` for each child. `load()`:

- logs zone/action/state/intent;
- calls `this.devas[key].init(client)`;
- resolves the child value when the child’s `init()` resolves.

Because `init()` resolves early at the child’s `Client` step, `load()` resolves before the child is fully ready. The parent then reads `this.devas[key].info()` and `agent()` immediately. Those usually work because `_active` is set early, but the child may still be loading features.

`load()` does not emit `devacore:load` (the event exists but is unused). It also does not check that the parent is active.

### 15.4 Unloading

As described in [Section 9.3](#93-unloadkey), `unload()` does not await the child’s stop chain, assumes `stop()` returns a Promise, and can produce unhandled rejections.

### 15.5 Collisions

Child Devas with the same `agent.key` share the same ask namespace. Both may answer a single ask. There is no registry that enforces uniqueness. Likewise, automatic state listeners are keyed only by agent key, so two Devas with the same key both react to `<key>:ask`.

---

## 16. Errors and offline behavior

### 16.1 `err(err, packet, reject)`

`err()`:

1. Creates a uid.
2. Sets context/feature/zone/action/state to `error`.
3. Sets the `bad` intent.
4. Copies the agent and client.
5. Builds `{id, key:'error', value: agent.key, agent, client, error:{name,message,stack}, packet, created}`.
6. Stamps it.
7. Emits `devacore:error` with a copy.
8. If `onError` exists, calls `onError(err, packet, reject)` and returns its result.
9. Otherwise calls `reject(err)` or returns `Promise.reject(err)`.

The key contract: **if `onError` is defined, it owns the outcome.** If it does not call `reject`, the caller’s Promise stays pending. The test harness defines `onError` that only logs, so any error routed through it leaves the originating Promise unresolved. The README warns about this, but the API makes it easy to get wrong.

### 16.2 Recursion hazard

`err()` calls `this.context('error', id.uid)`. `context()` calls `this.vars.context[value]`. If `vars.context` is missing, that throws; the catch calls `err()` again; `err()` calls `context('error')` again; repeat until `RangeError: Maximum call stack size exceeded`.

This is the single most dangerous missing-option failure. A typo in `vars` can turn a simple error into a process-threatening crash.

### 16.3 Other `err` hazards

- `err()` calls `uid()` before its `try`; if `info`/`agent`/`profile` are missing, the error handler itself throws.
- After shutdown, `_config` is `false`, so `_stamp()` inside `err()` throws (`hashes` not iterable).
- After shutdown, `events` is `false`, so `talk()` inside `err()` throws.
- `err()` has no active-status guard. Calling it while inactive can produce a stamped error with string-valued agent/client fields, or throw if `_agent.profile` is missing.

### 16.4 Offline return types are inconsistent

| Method | Inactive behavior |
|---|---|
| `question`, `answer`, `ask` | `Promise.resolve(OFFLINE)` |
| `stop` | returns the **string** `OFFLINE` |
| `unload` | Promise resolving `OFFLINE` |
| `help` | Promise resolving `OFFLINE` |
| `prompt` | returns the **string** `OFFLINE` |
| `client`, `agent` | return the **string** `OFFLINE` |
| `core`, `info`, `status` | return the **string** `OFFLINE` |
| `context`, `contexts` | return the **string** `OFFLINE` |
| `feature`/`zone`/... setters | return the **string** `OFFLINE` |
| plural getters | return the **string** `OFFLINE` |
| feature getters | return the **string** `OFFLINE` |
| `load` | no active check |
| `uid`, `machine`, `hash`, `license_check` | no active check |

Code that does `await deva.stop()` or `deva.prompt(...).then(...)` after shutdown can fail because the value is a string, not a Promise. The core does not provide a uniform result type.

---

## 17. The `lib` helper class

`LIB` is constructed as `new lib({pkg})`. It stores `pkg`, `lang` (`en`), `locale` (`en-US`), `currency` (`USD`), and references to `os`, `fs`, `path`, `exec`, `spawn`, and `randomUUID`.

### 17.1 Methods

| Method | Behavior | Notes |
|---|---|---|
| `help(msg, help_dir)` | Splits `msg`; uses `main`, `first`, or `first_second`; reads `<help_dir>/help/<name>.feecting`. | Throws/rejects on read failure. No section parsing (that is in `Deva.help`). |
| `encrypt(str, opts)` | Derives a sha256 key from `opts.password`, creates a random 16-byte IV, encrypts with `opts.algorithm`, returns `{iv, key, encrypted}`. | Returned `key` is the derived key. Storing the whole result with the key defeats confidentiality. No authentication tag. |
| `decrypt(opts)` | Reverses `{key, iv, encrypted, algorithm}`. | Requires the key; no integrity check. |
| `copy(obj)` | `JSON.parse(JSON.stringify(obj))`. | Drops functions/undefined, converts Dates, throws on circular/BigInt. |
| `getToday(d)` | Local midnight timestamp. | Mutates a `Date` copy. |
| `formatDate(d, format, time)` | Formats with the configured locale. | Formats: `milli`, `iso`, `utc`, `long`, `long_month`, `short`, `short_month`, `numeric`, `year`, `month`, `day`, `log`. Unknown format falls through to locale defaults. |
| `formatTime(t)` | `t.toLocaleTimeString(locale)`. | Expects a Date. |
| `formatCurrency(n, cur)` | `Intl.NumberFormat` currency. | Uses `this.currency` unless overridden. |
| `formatNumber(n)` | `Intl.NumberFormat` number. | |
| `formatPercent(n, dec)` | `parseFloat(n).toFixed(dec) + '%'`. | No validation. |
| `trimWords(text, maxwords)` | Splits on spaces and slices. | The guard compares the array to a number (`splitter < maxwords`), which is always false/NaN, so it always slices. For short text the result is the same except that multiple spaces are normalized. |
| `dupes(dupers)` | Filters duplicates. | The filter returns `dupe` instead of `true`, so falsy values (`0`, `''`, `false`, `null`, `undefined`, `NaN`) are dropped even on first occurrence. |

### 17.2 Binding

`_assignBind()` binds own enumerable functions on `lib`, which at construction are `exec`, `spawn`, and `randomUUID`. Prototype methods (`copy`, `formatDate`, etc.) are **not** bound. Call them as `this.lib.method(...)`; do not destructure them or pass them as callbacks if they depend on `this` (for example `formatDate` calls `formatTime`, which uses `this.locale`).

### 17.3 Process and filesystem access

`this.lib.exec`, `this.lib.spawn`, `this.lib.fs`, and `this.lib.path` give every Deva full process/filesystem access with the host process’s permissions. The core does not sandbox them. Any code that can influence arguments to these helpers can execute commands or read/write files.

---

## 18. Ancillary methods

### 18.1 `core()`

Returns a stamped copy of `_core`, with a new uid and `created`. It unstamps the copy first, then re-stamps. Because `created` changes each call, repeated `core()` calls produce different hashes. It does not update `_core`.

### 18.2 `info()`

Returns a stamped copy of `_info` plus `created`. Requires `_info` to be a JSON-representable object; `copy(false)` returns `false`, and assigning `.created` to a primitive throws in strict mode. Requires active status.

### 18.3 `status()`

Returns a string: `<profile.name> active since <formatted active date>`. It calls `action('status', id)` with a uid object, producing `[object Object]` in the action log. It requires `_agent.profile.name`.

### 18.4 `help(msg, help_dir)`

Reads `<help_dir>/help/<file>.feecting`, where:

- `msg` is split on spaces; the first token is split on `:`;
- the part before `:` is the file name (default `main`);
- the part after `:` is the section name, uppercased (default `MAIN`);
- the file is split on `::BEGIN:<PART>` and `::END:<PART>`.

Quirks:

- It uses `fs.existsSync`/`readFileSync`; a missing file resolves `⛔️ HELP NOT FOUND`.
- If the section is missing, it calls `resolve(help_not_found)` but does not return, then tries to `.split()` `undefined`, throws, enters `catch`/`err`, and `finally` calls `resolve(helpDoc)` again. The first resolve wins; the later calls are no-ops.
- `finally` always calls `resolve(helpDoc)`, even after an error. With an `onError` that does not reject, the caller may receive `undefined` instead of an error.
- The file name comes from user input and is joined into a path. `path.join` normalizes `..`, so a caller can escape the intended `help` directory and read other `.feecting` files. The extension is fixed, which limits the impact, but it is still an unexpected file-read primitive.
- `zone(key, id)` passes a uid object where a string is expected, producing `[object Object]` in logs.

### 18.5 `license_check(personalVLA, packageVLA)`

- Missing personal VLA → `❌ Bad Personal VLA`.
- Missing package VLA → `❌ Bad Package VLA`.
- Hash mismatch → `❌ Invalid VLA Check`.
- Match → stamped `{id, time, personal, package, md5, sha256, sha512}`.

It computes a uid first, so it requires enough of the agent/info structure to make `uid()` work. It does not use a constant-time comparison; this is a startup gate, not a security-critical secret comparison.

### 18.6 `machine()`

Returns raw OS data plus hashes:

```js
{
  arch, hostname, network, platform, release, type, user, version,
  uptime, cpus, created, md5, sha256, sha512
}
```

`network` is `os.networkInterfaces()`; `user` is `os.userInfo()` (username, uid, gid, shell, home directory). This is privacy-sensitive. `uid()` calls it and stores only the hash, but `machine()` itself is public and has no active-status guard.

### 18.7 `load()` and `unload()`

See [Section 15](#15-child-devas) and [Section 9.3](#93-unloadkey).

---

## 19. Correctness findings and documentation mismatches

Severity is a judgment about impact in typical use, not a formal rating.

### 19.1 High-impact code issues

| # | Finding | Evidence / effect | Severity |
|---|---|---|---|
| 1 | `init()` resolves before startup completes | `Client()` calls `resolve()` with no value; `Done()` resolves later but the Promise is settled. Probe: `INIT_RESULT undefined`. Calling `question()` immediately can run before features/listeners are ready. | High |
| 2 | Missing `vars.context` causes stack overflow | `_invoke()` calls `context()`; `context()` catch calls `err()`; `err()` calls `context('error')`; repeat. | High |
| 3 | License failure is silent and returns a string | `prompt()` returns offline while inactive; no event. Actual strings: `❌ Bad Personal VLA`, `❌ Bad Package VLA`, `❌ Invalid VLA Check`. README claims a different message and a prompt. | High |
| 4 | Method results must be thenables | `answer()` and target `ask()` call `.then()` directly. Strings/objects/null fail or route to `err`. The test suite’s own `methods.test` returns an object and would fail if called through `answer()`. | High |
| 5 | `onError` can leave callers pending forever | `err()` returns `onError(...)` and does not reject. The tests’ `onError` only logs. | High |
| 6 | Claimed feature set does not exist | 13 features implemented; README claims 21 and getters for missing ones. `Feature()` requires only the 10 policy blocks. | High (documentation/API) |
| 7 | Feature failure leaves a half-active Deva | `_active` is set before the feature chain; a rejected `Feature()` stops startup but does not reset `_active`. | High |
| 8 | Shared mutable core/vocabulary | `_core` is the package object; custom agent vocab is written into imported maps; hashes/fingerprints change per init and leak across instances. | High |
| 9 | `unload()` assumes `stop()` is a Promise and does not await it | Inactive child → TypeError; rejected child stop → unhandled rejection; resolves before child stops. | High |
| 10 | Post-shutdown operations are not uniformly safe | `_config`/`events` become `false`; `_stamp`, `talk`, `err` can throw; `stop()` returns a string. | High |

### 19.2 Medium-impact code issues

| # | Finding | Evidence / effect |
|---|---|---|
| 11 | Automatic state listeners collide with public methods | 22 listeners of the form `test:<state>` are registered; emitting `test:talk`, `test:help`, `test:data`, etc. calls a method with a packet and can throw or recurse. |
| 12 | Ask failures often do not reply on the packet-id event | Target reject/non-thenable emits `key:ask:<method>` (and calls `err`) but not `key:ask:<packet-id>`, so the asker waits for `ASK TIMEOUT` (30 s by default). |
| 13 | `_methodNotFound` bypasses `finish`/`complete` locally | Unknown local command returns a packet without `finish`/`complete`; unknown ask goes through them after the reply. Inconsistent contract. |
| 14 | `ask()` leaves `q` hashes stale | It replaces `packet.q.agent` after `q` was stamped, then re-stamps only the top level. |
| 15 | `ready()` child loading is racy and unbounded | Child `init()` resolves early; `load()` resolves before child ready; a failing/hanging child can stall or reject the parent ready. |
| 16 | Child `config` split-brain | `_assignInherit` overwrites public `config` but not `_config`; `ready()` and `_stamp()` can use different objects. |
| 17 | `question('#key')` throws | `params` is `false`, then `params[0]` is read. |
| 18 | `_invoke` event text is always `🟠 INIT` | Per-step `msgs.start`, `msgs.enter`, etc. are not used. Test log confirms. |
| 19 | `prompt()` passes the live object | Listeners can mutate the returned packet; most other events pass copies. |
| 20 | Plural getters expose live maps | `states().value` is `_states`; mutation changes internal vocabulary. |
| 21 | `ready_hash` ignores functions | `JSON.stringify` drops functions, so `listeners`, `methods`, `func`, and `utils` hash as `{}` or only their data fields. |
| 22 | `feature()` requires all ten client blocks and drops extra config | `security.cipher` is lost; missing block aborts startup. |
| 23 | `status()` logs a uid object as text | `action('status', id)` → `[object Object]`. |
| 24 | `help()` double-resolves and can read outside `help/` | Missing section path throws after resolving; `path.join` allows `..` traversal to other `.feecting` files. |
| 25 | `sign()` is not a signature and requires array params | No secret; recomputable; `params=false` throws; `client.profile.id` may be undefined. |
| 26 | `devacore:load` is never emitted | Defined event unused. |
| 27 | `devacore:unload` carries a raw string | Inconsistent with all other event payloads. |
| 28 | Extra `deva:dir` event | Not in the event map; undocumented. |
| 29 | `box` config unused | `_data/index.js` defines it; no code uses it. |
| 30 | Unused messages | `client_license_check`, `client_license_invalid`, `nopacket`, `matchkey`, and per-step lifecycle messages are unused. |
| 31 | `_assignBind` mutates shared option objects | Reusing a `methods`/`listeners` object across Devas binds it to the first instance. |
| 32 | Constructor can replace `lib` | `opts.lib` overwrites the constructed helper because `_lib` is undefined. |
| 33 | No validation of option shapes | Missing `info`/`agent`/`profile`/`config.hash` fails deep in lifecycle, sometimes as stack overflow. |
| 34 | `copy()` and `hash()` limitations | JSON round-trip drops functions/undefined and throws on circular/BigInt; hash is property-order sensitive. |
| 35 | `trimWords` guard is wrong | Array compared to number; always slices. Result usually equivalent except whitespace normalization. |
| 36 | `dupes` drops falsy values | Filter returns the value, not `true`. |
| 37 | `machine()` exposes raw host/user/network data | Public method, no active gate. |
| 38 | `uid()` default uses `Math.random()` | Not cryptographically random; not a UUID despite the `guid` flag naming. |
| 39 | Every workflow event builds a machine fingerprint | `uid()` → `machine()` on every state/action/etc; expensive. |
| 40 | No test assertions; test method bypasses the pipeline | `tests/index.js` calls `this.methods.test(data)` directly; returns an object; `onError` swallows. |

### 19.3 README and `/docs/` mismatches

| README claim | Actual behavior |
|---|---|
| "On a mismatch it prompts and resolves with `❌ The Provided Client License Is Invalid`" | No prompt is emitted (inactive). Actual failure strings are `❌ Bad Personal VLA`, `❌ Bad Package VLA`, or `❌ Invalid VLA Check`. The `client_license_invalid` message is unused. |
| "Runs the client feature chain: Client, License, Error, Log, Data, Report, Communication, Treasury, Justice, Authority, Legal, Owner, Security, Medical, Support, Services, Systems, Networks, Veda, Done" | Actual chain: Client, License, Error, Log, Data, Report, Legal, Security, Support, Services, Systems, Done. The eight extra names are not implemented. |
| "The 21 features are ..." and "Each client feature has a getter ... (`veda()`, ...)" | 13 feature labels; only the 10 policy features have getters. |
| "`license_check(...)` returns a stamped approval or `false`" | Returns a stamped approval or a message **string**. |
| "`stop()` returns a Promise" | Returns a string when inactive. |
| "After that, the Deva answers most calls with `⭕️ OFFLINE`" | True for many, but `talk`/`_stamp`/`err` can throw; `stop` returns a string; `uid`/`machine` still run. |
| "Run it with `node examples/hello-world.js` and it prints `hello world`" | The example prints prompts (`⭐️ READY` and `Hello World`) and calls `methods.test` directly; it does not run the README quick-start code or print lowercase `hello world`. |
| "Every packet it builds is stamped" | Offline strings and some return values (e.g. `status()`, `license_check` failures) are not stamped. |
| "Methods ... return a Promise of a string or `{text, html, data}`" | Correct in effect, but the example test method violates it; strings/objects must be wrapped in a thenable. |
| README quick start says "`init()` ... resolves with `undefined` ... before `start`..." | Correct; this is one of the accurate caveats. |
| `info`, `config.hash`, `vars.context` effectively required | Correct. |
| Methods must return a Promise | Correct in effect: the answer path requires a thenable, not necessarily a native `Promise`. |

The `core/*.md` pages are more accurate than the README's feature count: `core/features.md` says ten capabilities load and lists the 13 labels via Liquid. `about.md` also correctly says the hashes are integrity checks, not encryption or signatures. The README is the outlier.

### 19.4 Live website claims that need a caveat

The live site was read on 2026-11-01. `/docs/` is rendered from this repository's `README.md`, so every mismatch in 19.3 applies there unchanged. The `/core/` pages are generated from the same `_data/*.json` files as this repository, so their counts and key lists match the code exactly. A few explanatory claims still round the behavior in the site's favor.

| Page | Claim | What the code does |
|---|---|---|
| `/docs/` | A license mismatch "prompts and resolves with `❌ The Provided Client License Is Invalid`". | No prompt is emitted while inactive. The actual return is `❌ Bad Personal VLA`, `❌ Bad Package VLA`, or `❌ Invalid VLA Check`. |
| `/docs/` | Startup runs Client, License, Error, Log, Data, Report, Communication, Treasury, Justice, Authority, Legal, Owner, Security, Medical, Support, Services, Systems, Networks, Veda, Done. | The chain contains only Client, License, Error, Log, Data, Report, Legal, Security, Support, Services, Systems, Done. The eight extra names do not exist. |
| `/docs/` | "Methods must return a Promise." | A thenable is enough. `answer()` and target `ask()` call `.then()`; an object with a `then` method works. Plain strings and objects do not. |
| `/core/features/` | "The ten capabilities from License through Systems are loaded when a Deva starts." | They load only if the client supplies all ten blocks. A missing block throws during `Feature()`, leaves `_active` true, and produces a half-loaded Deva. |
| `/core/events/` | "Listeners receive a copy of the data." | Most events use `lib.copy`, but `prompt()` emits the live stamped object, the ask reply on `<key>:ask:<uid>` is raw, and `deva:dir` is raw. |
| `/core/events/` | Shutdown "removes its listeners and any pending questions ... so a stopped Deva leaves nothing behind". | True for listeners and asks, but `shutdown` also sets `events` and `_config` to `false`. Later `talk()`, `_stamp()`, or `err()` calls can throw instead of returning offline. |
| `/core/intents/` | "Bad data is never hashed." | The failed feature getter returns an error path rather than a hashed feature copy, but `err()` does build and emit a stamped `devacore:error` packet. Nothing is unhashed on the error path. |
| `/about/` | "Today the automated test run checks that the Core starts and runs without errors." | It runs the lifecycle and exits 0 if nothing throws, but there are no assertions and `onError` swallows failures. It is a smoke test, not a check. |
| `/about/` | "It has been in development for more than ten years." | Not verifiable from this repository; the commit history and package metadata are the only evidence here. |

None of these change the vocabulary or the API. They matter when you use the site as the specification for generated code.

---

## 20. Security, privacy, and legal notes

### 20.1 Trust model

A Deva is **trusted code inside your process**. It can:

- execute commands (`lib.exec`, `lib.spawn`);
- read and write files (`lib.fs`);
- read host and user information (`machine()`);
- bind and call any method, including client-supplied method overrides;
- share and mutate process-wide vocabulary and core data.

There is no sandbox, permission system, capability token, or isolation between Devas on the same bus.

### 20.2 What the license gate does and does not do

- It compares a client-supplied VLA object to the package VLA by hash.
- It runs once at startup, before `_active` is set.
- It does not authenticate a user, issue a session, or authorize individual methods.
- It does not prevent a caller from constructing a Deva with a copied VLA.
- It does not verify the VLA’s internal hashes against a trusted source; it hashes whatever object is supplied.
- It does not run on subsequent calls.

The README and LICENSE describe legal restrictions; those are separate from the technical gate. The technical gate is a speed bump and a policy reminder, not a security boundary.

### 20.3 Hash limitations

- No keyed MAC, no signature, no nonce, no canonical JSON.
- Property order and JSON serialization affect results.
- md5 is weak.
- The core hash is mutated per init, so it is not a stable package fingerprint.
- `sign()` can be recomputed by anyone with the packet and profile data.
- Hashes do not hide data; packets contain the plaintext values and hashes.

### 20.4 Privacy

`uid()` is attached to nearly every packet and event. It includes:

- license id;
- client/agent/machine/core hashes;
- status, warning, notice, vectors, owner, creator, salute, copyright;
- times and dates.

`machine()` exposes hostname, network interfaces, user info, CPU details, and uptime. `uid()` stores only the hash, but the raw method is public. Event listeners on a shared bus receive client and agent copies, including profile data and the client VLA. If the bus is shared with untrusted listeners, assume all of that is visible.

### 20.5 Injection and path issues

- `help()` builds a filesystem path from user text; `..` can escape the intended directory (subject to the `.feecting` suffix).
- `lib.help` has a similar path construction.
- `lib.exec`/`spawn` are directly exposed; do not pass untrusted strings.
- Event names are strings; an untrusted caller that can call `talk` can emit arbitrary event names, including another Deva’s `key:ask`, and trigger its methods.
- Client feature methods are bound into `this.methods`; a client that supplies a method named like an existing method can shadow it (depending on load order and assignment).
- Shared vocabulary maps are ordinary objects; adding names like `__proto__` is mostly blocked by the truthiness check, but arbitrary names become process-wide.

### 20.6 Legal

`LICENSE.md` is the Vedic License Agreement 1.4.2, VLA `23221940810208468106`, owned by Quinn Arjuna America Michaels. It claims restrictions on modification, distribution, derivative works, reverse engineering, and official/government/commercial use without the Owner’s verified authorization, and describes Vedic fines/sanctions for unauthorized use. This document does not evaluate the enforceability or legal effect of those terms. Anyone planning commercial or government use should read the license in full and obtain advice; the README itself says to contact the Owner.

The package metadata also carries a `VLA` object and `"license": "VLA:23221940810208468106 LICENSE.md"`, which is not an SPDX identifier. Tooling that expects SPDX licenses may not understand it.

---

## 21. Tests, examples, and what they prove

### 21.1 `npm test`

`package.json` defines `"test": "node tests"`. `tests/index.js`:

- imports `tests/client.json`, `tests/agent.json`, `index.js`, and `package.json`;
- builds an `info` object (including the typo `pkg.authorurl`, which is `undefined`);
- constructs a Deva with the test agent, all required features from the client fixture, extensive console listeners, a `func.test`, a `methods.test`, and explicit lifecycle hooks;
- calls `DevaTest.init(client)`;
- does not call `stop()`;
- has **no assertions** and no exit-code logic beyond "did anything throw?".

Observed: `npm test` exits `0` and prints 249 lines of lifecycle logs. The test’s `methods.test` returns a plain object (`{text, data}`), not a Promise. It is called directly in `onReady`:

```js
const test = this.methods.test(data);
```

so it never exercises `answer()`’s `.then()` requirement. `onError` only logs, so an error routed through it would leave a caller pending rather than failing the test.

`func.test` builds a license check, uid, core, info, and a synthetic sign packet, and returns a text/data array. It is invoked as part of `methods.test`, but the result is not printed by `onReady` (the return value is ignored), so the test mainly proves that those calls do not throw.

The test does **not** cover:

- a successful ask between two Devas;
- a timed-out ask;
- a missing method through `answer()`;
- a method rejection;
- invalid/missing VLA;
- missing `vars.context`;
- `unload`;
- post-shutdown behavior;
- hash verification;
- feature-loading failures;
- multiple instances or core-hash stability.

### 21.2 `examples/hello-world.js`

This is a variant of the test harness:

- It imports the test client and agent fixtures.
- It builds a Deva with a `func.test` that returns `this.vars.hello` (`"Hello World"`).
- `methods.test` calls `func.test` and returns the string directly (again, not a Promise).
- `onReady` calls `methods.test` directly and passes the result to `prompt()`, so the output is `👔 prompt: Hello World` after the ready prompt.
- It never calls `question()`.

The README’s quick start is a different, more realistic example, but the README line “Run it with `node examples/hello-world.js` and it prints `hello world`” does not match this file’s output or method flow.

### 21.3 Implication

The repository is a working demonstration, not a verified library. Treat the test run as a smoke test. If you depend on this code, add your own tests for the behaviors you rely on, especially error paths and shutdown.

---

## 22. The website and documentation layer

The repository is also a Jekyll site published at `deva.world` (per `CNAME`).

### 22.1 Configuration

`_config.yml`:

- `url: https://deva.world`
- author identity and email;
- Google Analytics `G-JWHX0M91FE`;
- `theme: minima`, skin `dark`;
- social links for GitHub, X, YouTube, Instagram, Facebook;
- header pages: `about.md`, `docs.md`, `core/index.md`.

### 22.2 Live page inventory and coverage map

The live site is smaller than the repository might suggest. It has **two top-level reference pages** plus an About page:

- `/core/` is an index with **eight child pages** (`features`, `zones`, `actions`, `states`, `intents`, `beliefs`, `events`, `msgs`).
- `/docs/` is **one long page** with 16 in-page sections. It has no child URLs; the "subpages" are anchors.
- `/about/` is one long narrative page linked from the header, not one of the two reference sections.

The counts and key lists on `/core/` are generated with Liquid from the same `_data/*.json` files used by the code, so they are the most reliable part of the site. The table below maps every live page to this document. "Complete" means the page's substantive claims are covered here, not that the page is correct.

| Live page | What it contains | Where this document covers it | Coverage |
|---|---|---|---|
| `/core/` | Vocabulary overview, the eight counts, and the audit-trail rationale. | Sections 6, 13; Appendices B–D. | Complete. |
| `/core/features/` | The 13 feature labels, the ten loaded policy capabilities, `feature()` behavior, and getters. | Sections 6, 7, 13.4, 14; Appendix C.1. | Complete. The page omits that all ten client blocks are mandatory. |
| `/core/zones/` | The 44 zones, `zone()` behavior, record shape, and `zones()` listing. | Sections 6.2, 13.1, 13.3; Appendix C.2. | Complete. |
| `/core/actions/` | The 93 actions, `action()` behavior, and the "set at the start, return at the end" habit. | Sections 6, 13.1, 16.2; Appendix C.3. | Complete. The recursion warning is in 16.2. |
| `/core/states/` | The 93 states, `state()` behavior, and the trace left by `states()`. | Sections 6, 13.1, 13.3; Appendix C.4. | Complete, including the duplicate `done`/`Done` entries. |
| `/core/intents/` | The 17 intents and the return → good → hash pattern. | Sections 6, 13.1, 16.1; Appendix C.5. | Complete. The "bad data is never hashed" shorthand needs the caveat in 19.4. |
| `/core/beliefs/` | The 3 beliefs and `belief()` behavior. | Sections 6, 13.1; Appendix C.6. | Complete. |
| `/core/events/` | The shared bus, three event groups, listener helpers, event packet fields, per-Deva events, cleanup, and the 25 base events. | Sections 4, 8, 10, 15; Appendix B. | Complete. The "listeners receive a copy" claim has exceptions listed in 19.4. |
| `/core/msgs/` | The 37 standard messages, where each is used, merge behavior, and VLA/identity defaults. | Sections 16, 20.2; Appendix D. | Complete. |
| `/docs/` | The full README: requirements, install, quick start, constructor, lifecycle, messaging, packets, hash tiers, workflow, events, errors, config, testing, method reference, license. | Sections 5–19; Appendices A–D. | Complete, and corrected in 19.3. |
| `/about/` | Narrative explanation, capability table, fit, decision-maker notes, and FAQ. | Sections 2, 17, 20, 24, 25. | Complete, with caveats in 19.4 and 22.5. |

### 22.3 What the live site adds beyond the README

The `/core/` child pages are genuinely useful expansions, not just copied README sections. They add:

- one page per vocabulary with a plain-English definition, a usage snippet, a step-by-step description of what the call does, and a full key list;
- the practical habit of setting `action('return', ...)` before returning and not setting actions from inside the state functions (the recursion hazard);
- the note that plural getters such as `states()` leave their own `states` action and `data` state in the log;
- the event grouping into lifecycle, record, and conversation events, plus a table of record-event packet fields;
- an explanation of the per-Deva `<key>:<state>` listeners and the `<key>:ask` / `<key>:ask:<uid>` reply convention;
- a message-usage table that says which message belongs to which failure, and the reminder that custom messages never overwrite core keys;
- the About page's fit, procurement, and FAQ material (commercial licensing, no network calls, one maintainer, integrity versus signatures).

None of this adds API surface that is absent from `README.md` or `index.js`. There are no hidden endpoints, hosted services, or extra methods on the site.

### 22.4 What the live site still misses or gets wrong

The site repeats several README errors, and it contradicts itself in one place:

- `/core/features/` correctly says **13 features** and **ten loaded capabilities**, while `/docs/` still says **21 features** and lists eight that do not exist. The site therefore disagrees with itself; the code and `/core/` agree.
- `/docs/` still says a bad license "prompts" and returns `❌ The Provided Client License Is Invalid`. In practice, no prompt is emitted and the return is one of three other strings.
- `/docs/` says methods must return a Promise. A thenable is sufficient.
- `/core/features/` does not say that the ten client blocks are mandatory, or that a missing block leaves `_active` true and the Deva half-loaded.
- `/core/events/` says listeners receive a copy. `prompt()`, the packet-id ask reply, and `deva:dir` do not.
- `/core/events/` says shutdown leaves nothing behind, but does not mention that `events` and `_config` become `false`, so later calls can throw rather than return offline.
- `/about/` says the automated test run "checks" startup. It is a smoke test with no assertions, and `onError` swallows failures.

The site also leaves several implemented methods undocumented, which this document covers in Sections 17 and 18:

- `help(msg, help_dir)` and the `.feecting` section format;
- `sign(packet)` and why it is not a cryptographic signature;
- `machine()` and the host data it exposes;
- the `LIB` helpers (`exec`, `spawn`, file system, encryption, formatting);
- the extra `deva:dir` event, the `<key>:ask:<method>` error event, and the 22 automatic state listeners.

### 22.5 The About page's safety and maturity claims

`/about/` is the most careful page on the site. It correctly says:

- the package has no dependencies beyond Node.js, and the core code makes no network calls;
- the core is one main class plus JSON data, small enough to read in full;
- the hashes are integrity checks, not encryption or signatures;
- the `lib` helpers include `exec`, `spawn`, file system, and encryption, so a Deva runs with the host process's permissions;
- commercial or government use needs the Owner's written authorization under the VLA;
- the project is maintained by one author.

Two claims need care:

- **"Every client must present a VLA that matches ... Without it, the Core will not start."** Broadly true, but the failure is not a clean startup error. A missing or malformed `client` can throw before the license check produces its string, and a rejected feature block can leave `_active` true.
- **"Every packet it builds is stamped."** Offline strings, `status()`, failed `license_check()` results, and some raw events are not stamped. See 19.3 and Appendix B.

The "more than ten years in development" statement cannot be verified from this repository. It is a claim about the author's history, not something the commit history proves.

### 22.6 Includes and deployment artifacts

- `_includes/head.html` overrides the theme head: SEO tag, main stylesheet, feed metadata, favicon, and conditional Google Analytics.
- `_includes/header.html` builds a custom header with Core/Docs/About links.
- `_includes/footer.html` prints the copyright.
- `CNAME`: `deva.world`.
- `robots.txt`: allow all.
- `assets/`: banner, Deva image, favicon, icon.
- `.nova/Configuration.json`: editor metadata only.

There is no Jekyll build script in `package.json`; the site is presumably built by GitHub Pages or an external CI. The npm package is not the site, but `.npmignore` does not exclude the site, so the published tarball contains it.

The repository's page sources are `index.md` (landing page), `404.md` (not found), `core/index.md` plus the eight `core/*.md` reference pages, and `docs.md`, which includes `README.md` with `{% include_relative README.md %}`. Whatever the README says becomes the `/docs/` page.

---

## 23. Packaging and release shape

`package.json` highlights:

- name `@indra.ai/deva`, version `1.62.89`;
- description: "Deva Core a Vedic-inspired Event Based Context Aware Feature, Zone, Action, and State Machine integrated Artificial Intelligence Framework";
- `main: index.js`, `type: module`;
- license string `VLA:23221940810208468106 LICENSE.md` (not SPDX);
- a large `VLA` object with uid, timestamps, fingerprint, client/agent/machine/core hashes, legal strings, and its own hashes;
- author, funding links, copyright, repository, bugs, homepage, keywords;
- `engines`: npm `>=9.5.1`, node `>=22`;
- `scripts.test`: `node tests`;
- `eslintConfig.parserOptions.ecmaVersion: 6` — stale for a Node 22 ESM package using modern syntax;
- no `dependencies`, `devDependencies`, `exports`, `types`, `files`, `sideEffects`, or `publishConfig`.

`.npmignore` excludes only `packs/` and `private/`. Therefore the published package includes tests, examples, the Jekyll site, assets, and the license. That may be intentional (examples/docs) but it also ships a large `assets/banner.png` (~1.1 MB) and other site files.

`.gitignore` excludes `private/`, `node_modules/`, common logs/caches, build output, `.env`, etc. `.DS_Store` is listed.

There is no lockfile and no CI. Publishing is manual.

---

## 24. Strengths, weaknesses, and fit

### 24.1 Strengths

- **Small and readable.** One main class, one helper class, JSON data. No dependency tree.
- **Clear conceptual vocabulary.** Features, zones, actions, states, intents, and beliefs give logs a shared language.
- **Event-first observability.** Every step is an event; instrumentation does not require patching internals.
- **Simple local multi-agent model.** Ask/answer over a shared bus is easy to understand and demo.
- **Useful constraints.** Ask timeouts, pending-ask cleanup, and offline messages show operational awareness.
- **No mandatory infrastructure.** It runs in-process with no server or database.
- **Documentation effort.** README, site, examples, and data-driven reference pages are more than many small projects provide.

### 24.2 Weaknesses

- **Lifecycle correctness.** Early resolve, hook-owned continuation, shared mutable state, and shutdown races make the core fragile.
- **Error handling.** `onError` can swallow outcomes; missing context can recurse; offline return types are inconsistent.
- **Async contract.** Methods must be thenables, but the examples and tests violate that; failures are noisy or silent.
- **Feature model.** Claimed features exceed implemented ones; feature-specific settings are dropped; missing blocks abort startup.
- **Identity/hashing.** Core hash instability, property-order sensitivity, unkeyed hashes, and expensive uid generation.
- **Security.** Trusted-code model, exposed process/filesystem helpers, no auth, path traversal in help, shared bus leaks.
- **Tests.** No assertions and little coverage of the risky paths.
- **Documentation consistency.** The live site contradicts itself: `/core/features/` says 13, `/docs/` says 21. The license, Promise, and "every packet is stamped" claims are still optimistic.
- **API consistency.** `stop` vs Promise, `load` event unused, raw unload payload, live object references, singular/plural asymmetry.
- **Performance.** Every event builds a machine fingerprint; listeners are synchronous and unbounded.

### 24.3 When it fits

It can be a reasonable base for:

- a local prototype of a multi-agent workflow;
- an educational model of event-driven agents;
- an audit-log demo where the vocabulary matters more than cryptographic guarantees;
- a small in-process tool where the team controls all Devas and listeners.

It is a poor fit, without substantial additional engineering, for:

- regulated or security-sensitive authorization;
- untrusted plugins or multi-tenant isolation;
- distributed agents across processes/hosts;
- high-throughput event logging;
- systems that need durable, verifiable, signed records;
- teams expecting a stable, assertion-tested API.

---

## 25. A safe minimal recipe

If you use the core as-is, the following pattern avoids the most common failures.

```js
import Deva from '@indra.ai/deva';
import Client from './client.json' with {type:'json'};

const client = Client.DATA;

const deva = new Deva({
  info: {
    id: 'my-deva',
    name: 'My Deva',
    version: '0.0.1',
    VLA: client.VLA,
  },
  agent: {
    id: 'my-deva',
    key: 'my-deva',
    prompt: {emoji: '🤖', text: 'my-deva'},
    profile: {name: 'My Deva'},
  },
  config: {hash: {}},          // ready() needs this
  vars: {context: {}},         // context()/_invoke()/err() need this
  methods: {
    async greet(packet) {      // must return a thenable
      return {text: `hello ${packet.q.text}`, data: {ok: true}};
    },
  },
  listeners: {
    'devacore:error'(packet) {
      console.error(packet.error?.message || packet);
    },
  },
  onReady(data, resolve) {
    // Do initialization work here, not after await init().
    return resolve(data);
  },
  // Do not define onError unless you promise to call reject.
});

// Construct a readiness Promise before init.
const ready = new Promise(resolve => {
  deva.listen('devacore:ready', resolve);
});

deva.init(client).then(result => {
  if (typeof result === 'string') {
    // License failure or another early error.
    console.error('init returned:', result);
  }
});

await ready;
// Now the Deva is fully started.
const answer = await deva.question('/greet world');
console.log(answer.a.text);

// Shut down deliberately, and do not call other methods afterward.
await deva.stop();
```

Additional rules:

- Always wrap method results in `Promise.resolve(...)` or use `async`.
- Provide every feature block the client fixture shows, each with `concerns`, `global`, and `devas`.
- Provide `profile`, `info.VLA`, and `config.hash`.
- Do not reuse the same `methods`/`listeners` object across Devas.
- Do not call `stop()` until `ready`.
- Do not share the event bus with untrusted listeners.
- Do not treat hashes as signatures or as secrets.
- Add tests for your methods, asks, errors, and shutdown.

---

## 26. Glossary

| Term | Meaning |
|---|---|
| **Deva** | One instance of the `Deva` class; an agent on the shared bus. |
| **Agent** | The identity/profile object (`key`, `profile`, `prompt`) of a Deva. |
| **Client** | The caller-supplied record with VLA, profile, and policy features. |
| **Feature** | A named capability label; ten are client policy features loaded at startup. |
| **Zone** | A named "where" label for activity. |
| **Action** | A named "what was done" label. |
| **State** | A named condition label; also used for the automatic listener names. |
| **Intent** | A named "why/purpose" label (good, bad, neutral, etc.). |
| **Belief** | A named stance label (vedic, american, other). |
| **Context** | A free-form label with display text from `vars.context`. |
| **Invoke chain** | The fixed lifecycle sequence in `_data/index.js`. |
| **Packet** | The `{id, q, a, created, finish, complete, hashes}` request/response envelope. |
| **q / a** | Question and answer sub-packets. |
| **Stamp** | Add md5, sha256, sha512 to an object. |
| **Unstamp** | Remove the three hashes. |
| **uid** | A stamped identity object with time, hashes, profile strings, and a numeric or UUID `uid`. |
| **VLA** | Vedic License Agreement; also the license object/identifier in package metadata. |
| **Ask** | A namespaced broadcast request (`#key method`) awaiting a reply. |
| **Pending ask** | The asker's tracked `once` listener and timeout. |
| **Ready** | The lifecycle point after startup work; the reliable readiness signal. |
| **Half-active** | `_active` is set but the feature chain failed or is still running. |

---

## Appendix A: method reference

All methods are on the `Deva` prototype unless noted. "Promise" means the method returns a Promise in the normal active path; inactive paths may return strings.

### A.1 Lifecycle and construction

| Method | Signature | Returns | Notes |
|---|---|---|---|
| `constructor` | `(opts)` | instance | No validation. Mutates `agent` vocab and shared data. |
| `init` | `(client)` | Promise | Resolves early at `Client` with `undefined` on success; returns a failure string on license failure. |
| `Client` | `(client, resolve, reject)` | undefined | Copies client, binds feature methods, deletes features later. |
| `Feature` | `(feature, resolve, reject)` | feature name | Loads one policy block; throws if the block is malformed. |
| `License`...`Systems` | `(resolve, reject)` | feature name | Ten wrappers around `Feature`. |
| `Done` | `(resolve, reject)` | client copy | Deletes `_client.features`; resolves the copy (ignored by init). |
| `start` | `(data, resolve)` | Promise/value | `_invoke` start. |
| `enter` | `(data, resolve)` | Promise/value | `_invoke` enter. |
| `done` | `(data, resolve)` | Promise/value | `_invoke` done. |
| `ready` | `(data, resolve)` | Promise/value | Hashes ready items, loads children, invokes ready. |
| `finish` | `(data, resolve)` | Promise/value | `_invoke` finish. |
| `complete` | `(data, resolve)` | Promise/value | `_invoke` complete. |
| `stop` | `()` | Promise or string | Full shutdown chain; string if inactive. |
| `close` | `(data, resolve)` | Promise/value | Shutdown step. |
| `leave` | `(data, resolve)` | Promise/value | Shutdown step. |
| `exit` | `(data, resolve)` | Promise/value | Clears feature slots. |
| `shutdown` | `(data, resolve)` | Promise/value | Clears config, listeners, events, active. |
| `_assignInherit` | `()` | Promise | Copies events/lib/config to children. |
| `_assignBind` | `()` | Promise | Binds functions in place. |
| `_assignListeners` | `()` | Promise | Registers state + user listeners. |
| `_removeListeners` | `()` | undefined | Removes tracked listeners and pending asks. |
| `_clearPending` | `()` | undefined | Clears pending ask timers/listeners. |
| `_invoke` | `({key,data,resolve})` | Promise/value | Generic lifecycle step. |

### A.2 Messaging

| Method | Signature | Returns | Notes |
|---|---|---|---|
| `question` | `(text, data=false)` | Promise<packet> or Promise<string> | Local command, ask, or plain text. |
| `answer` | `(packet, resolve, reject)` | Promise/value | Local answer; calls `.then()` on the method result. |
| `ask` | `(packet)` | undefined | Target-side answer; emits a packet-id reply on success. |
| `talk` | `(evt, packet=false)` | boolean | `events.emit`. |
| `listen` | `(evt, callback)` | EventEmitter | Registers and tracks a wrapper. |
| `once` | `(evt, callback)` | EventEmitter | Untracked one-time listener. |
| `ignore` | `(evt, callback)` | EventEmitter | Remove listener. |
| `prompt` | `(text)` | stamped object or string | Emits `devacore:prompt`; live object. |
| `_methodNotFound` | `(packet)` | packet | Builds the not-found answer; bypasses finish/complete. |
| `_getFeature` | `(key)` | copy or string | Feature getter core. |

### A.3 Workflow and state

| Method | Signature | Returns | Notes |
|---|---|---|---|
| `feature` | `(value=false, extra=false)` | data or undefined/string | Sets current feature. |
| `features` | `()` | stamped list or string | Live `_features`. |
| `zone` / `zones` | `(value, extra)` / `()` | same pattern | |
| `action` / `actions` | `(value, extra)` / `()` | same pattern | |
| `state` / `states` | `(value, extra)` / `()` | same pattern | |
| `intent` / `intents` | `(value, extra)` / `()` | same pattern | |
| `belief` / `beliefs` | `(value, extra)` / `()` | same pattern | |
| `context` | `(value=false, extra=false)` | stamped object/undefined/string | Requires `vars.context`. |
| `contexts` | `()` | stamped object/string | All context mappings. |
| `_workflow` | `(key, value, extra)` | data/undefined/string | Common setter. |
| `_workflowItems` | `(key)` | stamped object/string | Common list getter. |
| `license`...`systems` | `()` | feature copy/string | Ten policy getters. |

### A.4 Identity and utility

| Method | Signature | Returns | Notes |
|---|---|---|---|
| `uid` | `(guid=false)` | uid object | Random UUID or numeric; hashes. |
| `hash` | `(data, algo='md5')` | base64 string | JSON.stringify input. |
| `_stamp` | `(data, label='', uid='')` | same object | Adds three hashes. |
| `_unstamp` | `(data)` | same object | Deletes three hashes. |
| `client` | `()` | hashed copy/string | `_client` copy. |
| `agent` | `()` | hashed copy/string | `_agent` copy. |
| `core` | `()` | stamped copy/string | `_core` copy with new id/time. |
| `info` | `()` | stamped copy/string | `_info` copy. |
| `status` | `()` | string | Active-since text. |
| `machine` | `()` | raw OS object + hashes | No active check. |
| `sign` | `(packet)` | stamped record | Not a cryptographic signature. |
| `license_check` | `(personalVLA, packageVLA)` | stamped approval/string | Hash comparison. |
| `load` | `(key, client)` | Promise | Starts a child. |
| `unload` | `(key)` | Promise<string> | Stops a child without awaiting it. |
| `help` | `(msg, help_dir)` | Promise<string> | Reads `.feecting` sections. |
| `err` | `(err, packet, reject=false)` | hook result/rejection | Central error path. |

### A.5 `LIB` methods (via `this.lib`)

`help`, `encrypt`, `decrypt`, `copy`, `getToday`, `formatDate`, `formatTime`, `formatCurrency`, `formatNumber`, `formatPercent`, `trimWords`, `dupes`, plus `os`, `fs`, `path`, `exec`, `spawn`, `randomUUID`, `pkg`, `lang`, `locale`, `currency`.

---

## Appendix B: event reference

The 25 names in `_data/events.json`:

| Key | Event | Emitted by |
|---|---|---|
| `prompt` | `devacore:prompt` | `prompt()` |
| `error` | `devacore:error` | `err()` |
| `start` | `devacore:start` | `_invoke` start |
| `enter` | `devacore:enter` | `_invoke` enter |
| `done` | `devacore:done` | `_invoke` done |
| `ready` | `devacore:ready` | `_invoke` ready |
| `finish` | `devacore:finish` | `_invoke` finish |
| `complete` | `devacore:complete` | `_invoke` complete |
| `stop` | `devacore:stop` | `_invoke` stop |
| `close` | `devacore:close` | `_invoke` close |
| `leave` | `devacore:leave` | `_invoke` leave |
| `exit` | `devacore:exit` | `_invoke` exit |
| `shutdown` | `devacore:shutdown` | `_invoke` shutdown |
| `question` | `devacore:question` | `question()` |
| `answer` | `devacore:answer` | `answer()` and target `ask()` |
| `ask` | `devacore:ask` | `question()` when an ask reply arrives |
| `context` | `devacore:context` | `context()` |
| `feature` | `devacore:feature` | `_workflow` |
| `zone` | `devacore:zone` | `_workflow` |
| `action` | `devacore:action` | `_workflow` |
| `state` | `devacore:state` | `_workflow` |
| `intent` | `devacore:intent` | `_workflow` |
| `belief` | `devacore:belief` | `_workflow` |
| `load` | `devacore:load` | **Never emitted** |
| `unload` | `devacore:unload` | `unload()` with a raw string |

Additional event names not in the map:

- `<agent.key>:<state>` for each of the 22 automatic state listeners.
- `<agent.key>:ask` for ask requests.
- `<agent.key>:ask:<packet-id>` for ask replies.
- `<agent.key>:ask:<method>` for some error reports.
- `deva:dir` emitted during `ready()`.

Payload conventions:

- Lifecycle, workflow, prompt, error, context, question, and answer events carry stamped objects.
- Most carry `lib.copy(...)`; `prompt()`, the ask reply on `<key>:ask:<id>`, and `deva:dir` carry live/raw values.
- Automatic state listeners receive the raw event payload and call the method with it.

---

## Appendix C: vocabulary keys

The live `/core/` pages were checked against these lists on 2026-11-01. The counts and keys match the repository's `_data/*.json` exactly.

### C.1 Features (13)

`init, agent, client, license, error, log, data, report, legal, security, support, services, systems`

### C.2 Zones (44)

`deva, agent, client, home, away, play, work, rest, sleep, snack, question, answer, ask, load, unload, init, start, stop, close, leave, exit, shutdown, enter, finish, complete, done, ready, license, feecting, data, error, log, report, legal, security, support, services, systems, help, emergency, danger, crisis, private, public`

### C.3 Actions (93)

`consent, client, agent, encrypt, decrypt, license, feecting, data, error, log, report, legal, security, support, services, systems, talk, listen, once, ignore, question, answer, ask, call, wait, init, start, enter, finish, stop, close, leave, exit, shutdown, method, func, actions, feature, features, contexts, zones, load, unload, states, core, info, status, help, done, ready, complete, insert, update, save, delete, parse, return, resolve, reject, invoke, sign, emergency, honest, dishonest, relay, salute, handshake, intake, handoff, transport, research, collect, alert, process, true, false, safe, unsafe, correct, incorrect, like, dislike, positive, negative, learn, unlearn, find, locate, abandon, target, mature, immature, hash`

### C.4 States (93)

`online, offline, active, inactive, idle, talk, listen, ask, question, cmd, answer, wait, pause, resume, pending, connect, disconnect, send, receive, return, resolve, reject, init, start, enter, done, ready, finish, complete, stop, close, leave, exit, shutdown, open, begin, end, load, unload, set, let, const, get, put, push, pull, while, loop, async, await, continue, break, data, search, memory, signature, invalid, valid, abort, help, authorized, unauthorized, Done, official, unofficial, approved, denied, try, catch, finally, view, emergency, ingress, egress, go, do, make, write, create, destroy, save, delete, build, true, false, safe, unsafe, correct, incorrect, clean, dirty, consent, check`

### C.5 Intents (17)

`help, good, neutral, bad, evil, abuse, harm, malicious, lawful, unlawful, honest, dishonest, fun, play, work, assist, other`

### C.6 Beliefs (3)

`vedic, american, other`

### C.7 Events (25)

See [Appendix B](#appendix-b-event-reference).

---

## Appendix D: message catalog

The 37 keys in `_data/msgs.json` match the live `/core/msgs/` page checked on 2026-11-01:

| Key | Value / role |
|---|---|
| `init` | `🟠  INIT` — used as the lifecycle data text. |
| `start` | `🟢  START` — defined, unused by `_invoke`. |
| `enter` | `🔵 ENTER` — defined, unused. |
| `done` | `☑️  DONE` — defined, unused. |
| `ready` | `⭐️ READY` — defined, unused by `_invoke` (tests use it in prompts). |
| `stop` | `🔴 STOP` — defined, unused. |
| `exit` | `🚪 EXIT` — defined, unused. |
| `offline` | `⭕️ OFFLINE` — inactive return value. |
| `noid` | `⛔️ NO ID PROVIDED` — `_unstamp` log fallback. |
| `notext` | `⛔️ NO TEXT PROVIDED` — `question()` with no text. |
| `nopacket` | `⛔️ NO PACKET PROVIDED` — unused. |
| `nodata` | `⛔️ NO DATA PROVIDED` — `_invoke` with no data. |
| `nokey` | `⛔️ NO KEY PROVIDED` — `_invoke` with no key. |
| `invalidkey` | `⛔️ INVALID KEY PROVIDED` — `_invoke` unknown key. |
| `matchkey` | `⛔️ INVALID KEY MATCH` — unused. |
| `invalidfeature` | `⛔️ INVALID FEATURE` — `Feature` and `_getFeature`. |
| `asktimeout` | `⛔️ ASK TIMEOUT` — ask timer. |
| `noask` | `⛔️ ASK TARGET NOT FOUND` — no listener. |
| `method_not_found` | `⛔️ METHOD NOT FOUND` — `_methodNotFound`. |
| `help_not_found` | `⛔️ HELP NOT FOUND` — `help()`. |
| `invalid_agent` | `⛔️ Agent Hash Invalid` — `sign()`. |
| `invalid_client` | `⛔️ Client Hash Invalid` — `sign()`. |
| `personalVLA` | `❌ Bad Personal VLA` — license check. |
| `packageVLA` | `❌ Bad Package VLA` — license check. |
| `checkVLA` | `❌ Invalid VLA Check` — license mismatch. |
| `load` | `📦 Load` — unused. |
| `unload` | `🥡 Unload` — `unload()` prefix. |
| `warning` | Long Vedic warning with `{{prompt.emoji}}` / `{{profile.name}}` placeholders. |
| `notice` | Consent/governance notice with placeholders. |
| `client_license_check` | `🪪 Check Client License` — unused. |
| `client_license_invalid` | `❌ The Provided Client License Is Invalid` — unused. |
| `status` | `vedic` — default profile status. |
| `vectors` | Hashtag vector string. |
| `owner` | `Quinn Arjuna America Michaels`. |
| `creator` | `Quinn Arjuna America Michaels`. |
| `salute` | `🤝🫡✨🕉️🇺🇸`. |
| `copyright` | Copyright string. |

The `{{...}}` placeholders are plain text; the core does not interpolate them. `uid()` uses these strings verbatim when the agent profile does not override them.

---

## Appendix E: runtime observations

These were observed with standalone probes against this repository, using the test fixtures and a minimal Deva. They are not claims about every environment.

1. `await deva.init(client)` returned `undefined` on a valid license, and the Deva continued starting in the background. `onReady` fired later.
2. A successful local question produced the key order:

   ```
   id,q,a,created,finish,complete,md5,sha256,sha512
   q: id,agent,client,meta,text,data,created,md5,sha256,sha512
   a: id,agent,client,meta,text,html,data,created,md5,sha256,sha512
   ```

3. An unknown local method resolved a packet with `a`, top-level hashes, and **no** `finish`/`complete`.
4. Asking a missing target resolved `⛔️ ASK TARGET NOT FOUND`.
5. The test Deva registered 22 automatic state listeners.
6. After full startup, `client()` had no `features` property.
7. `await deva.stop()` resolved an object with `key === 'shutdown'`; afterward `_active` was `false` and `events` was `false`.
8. A bad VLA returned `❌ Invalid VLA Check`; `_active` stayed `false`.
9. Two Devas initialized in one process ended with different `_core.sha256` values (`SAME false`).
10. `npm test` exited `0` and printed lifecycle logs; the start event text was `🟠  INIT`, not `🟢  START`.
11. A probe that called `stop()` immediately after `await init()` hit `TypeError: this._config.hashes is not iterable` from a late startup error path, demonstrating the early-resolve/shutdown race.
12. The live site's `/core/` pages, read on 2026-11-01, reported 13 features, 44 zones, 93 actions, 93 states, 17 intents, 3 beliefs, 25 events, and 37 messages, matching `_data/*.json`. Its `/docs/` page still reported 21 features, contradicting its own `/core/features/` page.

---

## Appendix F: file-by-file inventory

| File | Summary |
|---|---|
| `index.js` | `Deva` class: constructor, lifecycle, messaging, workflow, hashing, uid, sign, license, helpers. |
| `lib/index.js` | `LIB`: copy, dates, currency, number/percent, trim, dupes, AES encrypt/decrypt, OS/fs/path/process refs. |
| `_data/index.js` | Core constants and invoke table. |
| `_data/features.json` | 13 feature labels. |
| `_data/zones.json` | 44 zone labels. |
| `_data/actions.json` | 93 action labels. |
| `_data/states.json` | 93 state labels. |
| `_data/intents.json` | 17 intent labels. |
| `_data/beliefs.json` | 3 belief labels. |
| `_data/events.json` | 25 event names. |
| `_data/msgs.json` | 37 messages and default profile text. |
| `tests/index.js` | Smoke test; no assertions; direct method call; logging `onError`. |
| `tests/agent.json` | Test agent identity, profile, vars/context. |
| `tests/client.json` | Test client VLA, profile, ten feature blocks. |
| `examples/hello-world.js` | Example derived from the test harness; direct method call; prompts. |
| `README.md` | User documentation; detailed but has feature/license/example mismatches. |
| `LICENSE.md` | Vedic License Agreement 1.4.2. |
| `package.json` | Metadata, VLA, scripts, engines, no deps. |
| `_config.yml` | Jekyll site config. |
| `index.md` | Site landing page. |
| `about.md` | Narrative overview and fit. |
| `docs.md` | Includes `README.md`. |
| `404.md` | Not-found page. |
| `core/index.md` | Vocabulary index. |
| `core/features.md` | Feature reference with Liquid list. |
| `core/zones.md` | Zone reference. |
| `core/actions.md` | Action reference. |
| `core/states.md` | State reference. |
| `core/intents.md` | Intent reference. |
| `core/beliefs.md` | Belief reference. |
| `core/events.md` | Event reference. |
| `core/msgs.md` | Message reference. |
| `_includes/head.html` | Head override, SEO, analytics. |
| `_includes/header.html` | Custom nav. |
| `_includes/footer.html` | Copyright footer. |
| `assets/banner.png` | Site banner. |
| `assets/deva.png` | Logo. |
| `assets/favicon.png` | Favicon. |
| `assets/icon.png` | Icon. |
| `CNAME` | `deva.world`. |
| `robots.txt` | Allow all. |
| `.gitignore` | Standard Node ignores. |
| `.npmignore` | `packs/`, `private/` only. |
| `.nova/Configuration.json` | Editor metadata. |

---

### Final assessment

Deva Core is an interesting, compact experiment in named, event-driven agent coordination with a strong documentation instinct. Its vocabulary and event-first design are easy to explain, and the ask/answer loop is a useful demonstration. Its weaknesses are not in ambition but in execution discipline: lifecycle resolution, error ownership, shared mutable state, the gap between documented and implemented features, a test suite that does not assert, and a live site that contradicts itself on the feature count. Treat it as a readable prototype or a base for a controlled in-process system, not as a hardened multi-agent platform. If you build on it, adopt the safe recipe, add tests around every path you use, and keep the trust boundary tight.
