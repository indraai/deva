---
layout: page
title: Vibe Coding with Deva
description: A plain-English guide to building with the Deva Core when you work with an AI assistant and don't read every line yourself.
image: /assets/banner.png
permalink: /vibe/
---

[![npm](https://img.shields.io/npm/v/@indra.ai/deva)](https://www.npmjs.com/package/@indra.ai/deva)

**{{page.description}}**

"Vibe coding" means building software by describing what you want to an AI assistant, accepting most of what it writes, and checking the results rather than every line. That's a real way to work, and the **Deva Core** (`@indra.ai/deva`) suits it well in one way: it writes down everything it does. If you can read its records, you can see what your code actually did, even if you didn't write that code yourself.

This page explains the Core in plain English, using one picture the whole way through.

## The picture: a small office

Imagine a small office.

- **The specialists.** Each **Deva** is a specialist who sits at a desk and is good at a few jobs. One greets people, one translates, one does sums. A Deva's jobs are its **methods**.
- **The intercom.** The office has one shared intercom. Anyone can make an announcement, and anyone who's tuned in hears it. Specialists also use it to ask each other for help. In code this is the **event bus** (`this.events`), and the Core's own announcements all start with `devacore:`.
- **The logbook.** Every specialist writes down each step as they do it: which part of the business it's for, where they are, what they're doing, what condition the work is in, and why. These are the **diary labels**: feature, zone, action, state and intent.
- **The wax seals.** Every record and every message gets sealed with three wax seals, one on top of the other. If anyone changes the paper afterwards, the seals no longer match. These are the **hashes** (md5, sha256, sha512).

Keep this picture in mind. Every section below goes back to it.

## Intent and principles first

Before the mechanics, it helps to know what the Core is *for*.

The Deva Core is meant to be a **deterministic, auditable agent core**. "Deterministic" means the same steps happen in the same order every time. "Auditable" means someone can come along later and check what happened. That's why the logbook and the seals aren't optional extras. They're built into almost every function. In the Core, each action leaves a labeled, sealed record.

A few principles follow from that:

- **A fixed vocabulary.** The logbook uses a fixed list of words, kept in the Core's `_data` files. A `valid` state means the same thing in every Deva, so records can be searched and compared without guessing.
- **Every record is sealed.** Packets and records carry three cumulative hashes. Each seal is pressed over the paper *and the seals beneath it*, so sha256 covers md5, and sha512 covers both. This tiering is deliberate. The README describes md5 as fast everyday verification, sha256 as government and authority verification, and sha512 as military, agency and legal high-security use.
- **Licensed use.** The Core is distributed under the **Vedic License Agreement (VLA)**, owned by Quinn Michaels. A Deva will not start unless the client it serves carries a VLA that matches the one in the Core's `package.json`.
- **A stated legal order.** `LICENSE.md` says use of the software "is subject to a threefold hierarchy of law": first Vedic Law, "as the supreme spiritual and religious authority"; second the Constitution of the United States, as "the secular legal framework"; and third Owner Authority, resting with Quinn Michaels, "whose signature and consent are required for any valid license." It adds: "All three levels must be satisfied; violation of any one constitutes unlawful use."

**Read [LICENSE.md](https://github.com/indraai/deva/blob/master/LICENSE.md) in full before you build anything with the Core.** Among other things, it restricts modification, distribution, derivative works, and commercial or government use without the Owner's verified authorization, and it limits use to the United States. This page is not a substitute for it, and your AI assistant can't decide for you whether your use is allowed.

## What a Deva is

A Deva is one instance of the single `Deva` class in the Core's `index.js`. You create it with `new Deva({...})` and give it:

- an **agent**: who this specialist is (`key`, `profile.name`, and so on). The `key` is its name on the intercom.
- **methods**: the jobs it can do. Each one takes a packet and **must return a Promise**.
- **listeners**: what it does when it hears a particular announcement.
- optional **hooks** such as `onReady`, which run at points in its lifecycle.
- optional **child Devas**: specialists who work inside this one's office.

Then you call `init(client)` with a **client** object. The client is who the office is working for. It carries the VLA and the settings for each client feature.

The Core runs on **Node.js 22 or later** and is **ES modules only** (`import`, not `require`). It has no runtime dependencies.

## The logbook: diary labels

{% assign n_features = site.data.features.DATA | size %}{% capture u_features %}{{ "/core/features/" | relative_url }}{% endcapture %}
{% assign n_zones = site.data.zones.DATA | size %}{% capture u_zones %}{{ "/core/zones/" | relative_url }}{% endcapture %}
{% assign n_actions = site.data.actions.DATA | size %}{% capture u_actions %}{{ "/core/actions/" | relative_url }}{% endcapture %}
{% assign n_states = site.data.states.DATA | size %}{% capture u_states %}{{ "/core/states/" | relative_url }}{% endcapture %}
{% assign n_intents = site.data.intents.DATA | size %}{% capture u_intents %}{{ "/core/intents/" | relative_url }}{% endcapture %}
{% assign n_beliefs = site.data.beliefs.DATA | size %}{% capture u_beliefs %}{{ "/core/beliefs/" | relative_url }}{% endcapture %}

Every step a Deva takes goes into the logbook with up to six kinds of label. Each label comes from a fixed list in `_data`:

| Label | Plain meaning | In the office | List |
|---|---|---|---|
| **feature** | which part of the business | "this is Security work" | [{{ n_features }} features]({{ u_features }}) |
| **zone** | where it's happening | "I'm at the answer desk" | [{{ n_zones }} zones]({{ u_zones }}) |
| **action** | what was done | "I hashed it", "I returned it" | [{{ n_actions }} actions]({{ u_actions }}) |
| **state** | what condition it's in | "valid", "try", "catch" | [{{ n_states }} states]({{ u_states }}) |
| **intent** | why, or how it turned out | "good", "bad", "lawful" | [{{ n_intents }} intents]({{ u_intents }}) |
| **belief** | the stance the work is recorded under | "vedic" | [{{ n_beliefs }} beliefs]({{ u_beliefs }}) |

There's also a free-form **context** (`this.context(value, extra)`), whose display text comes from your own `vars.context`.

Writing a line is one call:

```javascript
this.state('valid', 'greet:42');
```

That call sets the Deva's current state to `valid`, builds a small record (`id`, `key`, `value`, `text`, `agent`, `client`, `created`), seals it with all three hashes, announces it on the intercom as `devacore:state`, and returns the record. The `text` is the label from the list plus whatever you passed as the second argument. When we ran it, the record's text was `✏️ Valid greet:42` (with our id in place of `42`).

Each list also has a plural reader, such as `this.states()`, `this.actions()` and `this.zones()`. It returns a sealed packet with the whole list under `value`.

One rule matters a lot: **if you use a word that isn't on the list, nothing happens.** `this.state('not_a_state')` returns `undefined`, writes nothing and announces nothing. There's no error. See the honest section below.

## Wax seals: hashing and fingerprints

**Hashing.** `this.hash(data, algo)` turns any object into a short base64 string using md5, sha256 or sha512. Change one character of the data and the hash changes completely. `_stamp(data)` presses all three seals onto an object, in order, each one over the object including the seals before it. `_unstamp(data)` removes them so the object can be resealed after a change. Most Core functions seal their record just before returning it.

**Fingerprints.** Every record gets an `id` made by `this.uid()`. That's not just a number. It's an object with the id value itself (`id.uid`, a 20-digit number by default, or a random UUID with `uid(true)`), several forms of the date, the license uid, and the sha256 seals of the client, the agent, the machine and the Core itself. Those are combined into a single **fingerprint**. So each record says, in effect, *who* it was for, *which* specialist made it, *on which machine*, *with which version of the Core*, and *when*. The id also carries its own three seals.

When you want the id value, use `packet.id.uid`, not `packet.id`.

## Starting up: the lifecycle

Opening the office for the day goes like this when you call `deva.init(client)`:

1. **Seal the Core.** The Core seals its own package data.
2. **Check the license.** `license_check(client.VLA, core.VLA)` compares sha256 seals of the two VLA objects. If the client has no VLA, `init` resolves with `❌ Bad Personal VLA`. If they don't match, it resolves with `❌ Invalid VLA Check`. Either way the Deva stays inactive and nothing else runs.
3. **Open the doors.** The Deva marks itself active, passes the intercom and shared tools to its child Devas, binds your methods and listeners, and tunes in to its own announcements.
4. **Learn the client.** It runs the **client feature chain**: `Client`, then `License`, `Error`, `Log`, `Data`, `Report`, `Legal`, `Security`, `Support`, `Services`, `Systems`, then `Done`. Each step copies that feature's settings from `client.features` into the Deva.
5. **The invoke chain.** It then calls `onInit` if you wrote one, otherwise `start`.

### The invoke chain

After `init`, the Deva walks through named steps. Each step does the same things: writes its own logbook lines, puts a timestamp on the data under its name (`data.start`, `data.ready`, ...), reseals the data, and announces `devacore:<step>` on the intercom. Then:

- if you wrote a hook for that step (`onStart`, `onReady`, ...), **your hook decides what happens next**. It must either call the next step or call `resolve(data)`;
- if you didn't, the Core moves on to the next step by itself.

| Step | Goes on to | Your hook |
|---|---|---|
| start | enter | `onStart` |
| enter | done | `onEnter` |
| done | ready | `onDone` |
| ready | (finished) | `onReady` |
| finish | complete | `onFinish` |
| complete | (finished) | `onComplete` |
| stop | close | `onStop` |
| close | leave | `onClose` |
| leave | exit | `onLeave` |
| exit | shutdown | `onExit` |
| shutdown | (finished) | `onShutdown` |

`ready` also seals your `vars`, `utils`, `listeners`, `modules`, `func` and `methods` into `config.hash[agent.key]` (a snapshot of how the office was set up) and starts each child Deva.

**`onReady` is the moment the office is open.** Do your work from there, or after hearing `devacore:ready`. Don't do it right after `await init()`. The section on limits explains why.

## Talking on the intercom: messaging

### Asking a specialist a question

`this.question(text)` is the front desk. It returns a Promise and looks at the first word:

| You say | Example | What happens |
|---|---|---|
| `/name ...` | `/greet world` | Runs this Deva's own `methods.greet`. `packet.q.text` is `world`. |
| `#key name ...` | `#helper shout hi there` | Asks the Deva whose key is `helper` to run its `shout` method, and waits for the reply. |
| plain words | `hello there` | Runs `methods.question` if you wrote one. |

A method can return a plain string or `{text, html, data}`. That becomes the answer.

If the method doesn't exist, you still get a packet back, and its answer text is `⛔️ METHOD NOT FOUND <agent> <method>`. If you `#ask` a key nobody's listening for, you get `⛔️ ASK TARGET NOT FOUND` straight away. If the other Deva hears but never replies, you get `⛔️ ASK TIMEOUT` after `config.timeout.ask` milliseconds (30000 by default, `0` turns the timeout off).

### Announcing and listening

- `this.talk(evt, packet)` makes an announcement. It returns `true` if anyone was listening and `false` if no one was.
- `this.listen(evt, fn)`, `this.once(evt, fn)` and `this.ignore(evt, fn)` tune in, tune in for one message, and tune out. You can also list listeners in the `listeners` option.
- `this.prompt(text)` makes a sealed `devacore:prompt` announcement. This is handy for showing messages in a command line or UI.

Every logbook line is also announced (`devacore:state`, `devacore:action`, and so on), so one listener can watch everything an office does. The full list of {{ site.data.events.DATA | size }} Core events is on the [Events]({{ "/core/events/" | relative_url }}) page.

## What a packet looks like

The answer to a `question()` is a **packet**, which is like a sealed envelope holding the question and the answer:

```text
packet: id, q, a, created, finish, complete, md5, sha256, sha512
	q:    id, agent, client, meta{key, method, params}, text, data, created, md5, sha256, sha512
	a:    id, agent, client, meta{key, method, params}, text, html, data, created, md5, sha256, sha512
```

- `q` is the question and `a` is the answer. Each half has its own seals, and so does the envelope as a whole.
- `a.text` is usually what you want. `a.meta.key` tells you which specialist answered.
- `agent` and `client` inside are sealed copies, so you can tell who was involved.

## Client features

The **client** is who the office works for. Its `features` object holds settings for each client feature: `license`, `error`, `log`, `data`, `report`, `legal`, `security`, `support`, `services`, `systems`. During `init`, each feature's settings are copied into the Deva and removed from the client copy.

Afterwards, each feature has a getter with the same name, such as `this.security()` or `this.support()`. It returns a copy of `{id, client_id, client_name, concerns, global, personal, created}`. Here `personal` holds the settings the client gave for this particular Deva (looked up by its agent key). Calling the shared helper with a name that isn't a feature returns `⛔️ INVALID FEATURE`.

The full list of {{ site.data.features.DATA | size }} features (including `init`, `agent` and `client`, which label Core work rather than having getters) is on the [Features]({{ "/core/features/" | relative_url }}) page.

**For vibe coders:** the client object has to have an entry for every one of those ten features. The easiest way is to start from the Core's own `tests/client.json` and change it carefully.

## Child Devas: specialists inside the office

Pass other Devas in `devas: {helper}` and they become children. At `init`, each child receives the parent's `events` (the same intercom), `lib` and `config`. At `ready`, the parent starts each child with the same client. Because they share one intercom, the parent can reach a child with `#helper method text`, and anyone can hear both of them.

You can also start or stop a child yourself with `this.load(key, client)` and `this.unload(key)`.

## When things go wrong: errors

All errors go through one door: `this.err(err, packet, reject)`. It writes `error` logbook lines and a `bad` intent, then announces a sealed `devacore:error` packet holding `error: {name, message, stack}` and the related data. Then:

- if you wrote `onError(err, packet, reject)`, the Core hands over to you, and **you own the outcome**. Call `reject(err)` if the caller should see a failure, or their promise may wait forever.
- if you didn't, it calls `reject(err)` itself.

Most calls on an office that's closed (not started, failed its license check, or shut down) return `⭕️ OFFLINE` instead of throwing.

The standard messages, such as `⭕️ OFFLINE` and `⛔️ ASK TIMEOUT`, are listed on the [Messages]({{ "/core/msgs/" | relative_url }}) page.

## Helpers

- `this.agent()` and `this.client()` return sealed copies of who the specialist is and who it's working for.
- `this.info()` and `this.core()` return sealed copies of your package info and the Core's.
- `this.status()` returns a sentence like `Hello Deva active since Sunday, November 1, 2026 - 7:14:42 PM`.
- `this.uid()` makes a new fingerprinted id. `this.hash(data, algo)` makes one seal.
- `this.lib` has small utilities, such as `copy` (a deep copy), `formatDate`, `formatCurrency`, `formatNumber` and `trimWords`.
- `this.help(msg, dir)` reads sections from `.feecting` help files. Feecting is Quinn's own language.

## Closing up: shutdown

`await deva.stop()` closes the office. It walks `stop`, `close`, `leave`, `exit` and `shutdown`, announcing each one. `exit` clears the client feature data. `shutdown` tunes out the listeners, cancels any pending asks, and clears `modules`, `listeners`, `events`, `_config` and the active flag. With no hooks, `stop()` resolves with a data object whose `key` is `'shutdown'`. After that, `status()` and most other calls return `⭕️ OFFLINE`.

## A safe minimal recipe

This is a complete, working two-Deva office. A parent (`office`) has one child (`helper`). We ran it against Core 1.62.92 from inside the Core's repo folder, so the paths point to the repo's own files. In your own project, import `@indra.ai/deva` and your own client file.

```javascript
import Deva from './index.js';                       // '@indra.ai/deva' in your project
import Client from './tests/client.json' with {type: 'json'};
import pkg from './package.json' with {type: 'json'};

const client = Client.DATA; // carries the VLA and an entry for every client feature

const helper = new Deva({
	info: {id: 'helper', name: 'Helper Deva', version: '0.0.1', dir: '.', VLA: pkg.VLA},
	agent: {id: 'helper', key: 'helper', prompt: {emoji: '🛠', text: 'helper'}, profile: {name: 'Helper Deva'}},
	config: {hash: {}},     // needed: ready() writes config.hash[agent.key]
	vars: {context: {}},    // needed: context() looks things up here
	methods: {
		shout(packet) {
			return Promise.resolve({text: packet.q.text.toUpperCase()});
		},
	},
});

const office = new Deva({
	info: {id: 'office', name: 'Office Deva', version: '0.0.1', dir: '.', VLA: pkg.VLA},
	agent: {id: 'office', key: 'office', prompt: {emoji: '🏢', text: 'office'}, profile: {name: 'Office Deva'}},
	config: {hash: {}},
	vars: {context: {}},
	devas: {helper},        // the child shares this office's intercom
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
	async onReady(data, resolve) {          // the office is open: do the work here
		const local = await this.question('/greet world');
		console.log('local:', local.a.text);

		const asked = await this.question('#helper shout hi there');
		console.log('asked:', asked.a.text, 'from', asked.a.meta.key);

		const missing = await this.question('/nope');
		console.log('missing:', missing.a.text);

		const done = await this.stop();
		console.log('stopped:', done.key, '| after:', this.status());
		return resolve(data);
	},
});

office.init(client);
```

What it printed:

```text
local: hello world
asked: HI THERE from helper
missing: ⛔️ METHOD NOT FOUND office nope
stopped: shutdown | after: ⭕️ OFFLINE
```

Why it's "safe":

- the work happens inside `onReady`, not after `await init()`;
- every method returns a Promise;
- `info`, `config: {hash: {}}` and `vars: {context: {}}` are all present;
- there's a `devacore:error` listener, so errors are visible;
- the client is the Core's tested client file, with a matching VLA and every feature filled in.

## Practical rules for vibe coding

1. **Do the work in `onReady`.** Treat that hook, or the `devacore:ready` event, as "the office is open."
2. **Every method returns a Promise.** If your AI assistant writes `return 'hi'`, change it to `return Promise.resolve('hi')` or make the method `async`.
3. **If you write a hook, finish it.** Every `on<Step>` hook must call the next step or `resolve(data)`. A hook that does neither leaves the chain hanging.
4. **Only use words from the lists.** Before calling `this.state('x')`, check that `x` is on the [States]({{ "/core/states/" | relative_url }}) page (likewise for actions, zones, intents and the rest). A misspelling writes nothing and raises no error.
5. **Always listen for `devacore:error`.** If you write `onError`, call `reject(err)` in it unless you really mean to swallow the error.
6. **Start from `tests/client.json`.** Don't let your assistant invent a client object from scratch.
7. **Use `packet.id.uid` for ids** and `packet.a.text` for answers.
8. **Watch the logbook while you build.** A listener on `devacore:state` or `devacore:action` that prints `packet.text` shows you what your code is really doing.
9. **Don't strip out the seals or the logbook calls** to make code "simpler." They're the point of the Core.
10. **Don't edit the Core's `_data` files or `index.js`.** Add your own zones, actions, states, intents, beliefs or messages through the `agent` option instead. They're merged in without overwriting Core names. And remember the license terms on modification.
11. **Call `stop()` when you're done**, so listeners and pending asks are cleaned up.

## Honest section: real strengths and current limits

### Genuine strengths (we checked these)

- **Everything leaves a trail.** In our runs, every question, answer, lifecycle step and logbook line was announced on the bus as a sealed record.
- **Tiered, cumulative seals.** Every packet, half-packet and record we inspected carried md5, sha256 and sha512, and each tier covers the ones before it.
- **Rich ids.** Each id ties the record to the license, client, agent, machine and Core version.
- **Clean asking between Devas.** `#key method` worked between parent and child. Asking a missing Deva failed fast with a clear message, and there's a timeout for silent ones.
- **Tidy shutdown.** `stop()` ran the whole chain and left the Deva answering `⭕️ OFFLINE`.
- **Small and self-contained.** One class, no runtime dependencies.

### Current limits (true at version 1.62.92)

- **`init()` resolves too early. A fix is planned for 1.63.** Right now the `init()` promise resolves with `undefined` as soon as the client step finishes, before `start`, `enter`, `done` and `ready` have run. In our recipe, `init resolved with: undefined` printed before `onReady` had done any work. Until the fix ships, wait for `onReady` or `devacore:ready`, and don't trust the `init` promise as a "ready" signal.
- **Errors during the client feature chain don't stop start-up.** Because of the same early resolve, if the client object is missing feature settings, each feature step announces a `devacore:error` (in our test: `Cannot read properties of undefined (reading 'license')`, and the same for the others), but `init` has already resolved and the Deva still reaches `onReady`. Listen for `devacore:error` so you notice.
- **Unknown names are silent.** A name that isn't in `_data` (or your agent's additions) makes `feature`, `zone`, `action`, `state`, `intent` and `belief` do nothing at all. That keeps the vocabulary strict, but a typo, or a name removed from `_data` in a later version, can quietly drop logbook lines. Check the lists after upgrading.
- **`npm test` has no assertions yet.** It runs a Deva through its lifecycle and passes as long as nothing throws. Assertion tests are planned. Until then, "tests pass" means "it didn't crash," not "it did the right thing."
- **The license-failure prompt isn't heard.** `init` calls `prompt()` with the license failure message, but the Deva isn't active yet, so no `devacore:prompt` is announced (we counted zero). Check the value `init` resolves with instead.

### Where documentation says more than the code does

At 1.62.92, these places in the docs don't match what the code does:

- The README's start-up section says a license mismatch resolves with `❌ The Provided Client License Is Invalid`. The code resolves with `❌ Invalid VLA Check` (or `❌ Bad Personal VLA` when there's no VLA).
- The README's method table says `license_check` returns "stamped approval or `false`." On failure it actually returns one of the message strings above, never `false`.
- The README says the feature chain stores settings "for each one that the client's `features` object defines." In fact every feature is expected, and a missing one raises an error (see above).
- The Events page says `devacore:finish` and `devacore:complete` close out a question asked of *another* Deva. They also fire for local `/command` answers.

## Questions to ask before relying on it

Ask these yourself, or paste them to your AI assistant:

- [ ] Have I read `LICENSE.md`, and is my use allowed under it (location, commercial use, modification)?
- [ ] Does my client object carry the VLA that matches the Core's `package.json`, and an entry for every client feature?
- [ ] Is all my real work inside `onReady` (or after `devacore:ready`), not after `await init()`?
- [ ] Does every method return a Promise, and does every hook call the next step or `resolve`?
- [ ] Is every feature, zone, action, state, intent and belief name I use actually on its list?
- [ ] Do I have a `devacore:error` listener, and does my `onError` (if any) call `reject`?
- [ ] Do I use `packet.id.uid` for ids?
- [ ] Have I checked the logbook output once by eye, to see it's recording what I expect?
- [ ] Do I have my own checks of the results, since `npm test` doesn't assert anything yet?
- [ ] After upgrading the Core, have I rechecked the lists and the changelog for renamed or removed names?
- [ ] Do I call `stop()` when finished?

## Glossary

- **Deva**: one specialist in the office. An instance of the `Deva` class with its own agent, methods and listeners.
- **Deva Core**: the `@indra.ai/deva` package. The single class every Deva is built from.
- **Agent**: who the Deva is: its `key` (name on the intercom), profile and prompt. `this.agent()` returns a sealed copy.
- **Client**: who the Deva works for. Carries the VLA and the client feature settings. `this.client()` returns a sealed copy.
- **Method**: a job a Deva can do, reached with `/name` or `#key name`. Returns a Promise.
- **Listener**: a function that runs when a certain announcement is heard.
- **Event bus**: the shared intercom (`this.events`, a Node.js EventEmitter). Core announcements start with `devacore:`.
- **talk / listen / ask**: make an announcement, tune in, and ask another Deva for an answer.
- **Packet**: the sealed envelope returned by `question()`, holding `q` (question) and `a` (answer).
- **Feature**: which part of the business a step belongs to, such as security or support. Client features also have getters.
- **Zone**: where in the office a step happens.
- **Action**: what was done.
- **State**: the condition the work is in.
- **Intent**: the purpose or outcome, such as good or bad.
- **Belief**: the stance the work is recorded under: vedic, american or other.
- **Context**: a free-form note about what's going on, labeled from your `vars.context`.
- **Diary labels / logbook**: the feature, zone, action, state, intent and belief lines every step writes and announces.
- **Hash / seal**: a short code computed from data. It changes completely if the data changes.
- **Hash tiers**: the three cumulative seals, md5, sha256 and sha512, each covering the ones before it.
- **Fingerprint**: a sha256 seal inside every id that combines the license, client, agent, machine and Core.
- **uid**: the id object made by `this.uid()`. Its `uid` field is the id value.
- **VLA**: the Vedic License Agreement. Also the license object a client must carry for a Deva to start.
- **license_check**: the start-up check that the client's VLA matches the Core's.
- **Invoke chain**: the named steps (start, enter, done, ready, and so on) a Deva walks through, each with an optional `on<Step>` hook.
- **Hook**: your own function for a step, such as `onReady`, which decides what happens next.
- **Child Deva**: a Deva listed in another's `devas`. It shares the parent's intercom, `lib` and `config` and starts at the parent's `ready`.
- **OFFLINE**: the `⭕️ OFFLINE` answer from a Deva that isn't running.

---

Copyright ©2000-2026 Quinn Michaels; All rights reserved.
