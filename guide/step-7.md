---
layout: page
title: "Step 7: Shut it down"
permalink: /guide/step-7/
description: Stop the Deva cleanly with stop() and see what it answers once it is offline.
image: /assets/banner.png
---

{% assign guide = site.data.guide.DATA %}
{% assign step = guide.steps | where: "step", 7 | first %}
{% assign life = guide.steps | where: "step", 6 | first %}

{{ step.describe }}

In Step {{ life.step }} your Deva started, answered `/hello Quinn`, and handed back a stamped packet. A Deva that starts cleanly should also stop cleanly. In this step you'll stop {{ guide.deva }} with `stop()`, add a hook that runs as it stops, and check three things afterward: it reports offline, its listeners are off the event bus, and it answers questions with `⭕️ OFFLINE`.

Like Step {{ life.step }}, this step needs `{{ guide.package }}` version 1.64.70 or newer.

## 1. What stop() does

`stop()` takes no arguments and returns a Promise. It runs five shutdown steps, one after another:

1. **stop** collects the agent and client hashes into a stop record.
2. **close** comes next.
3. **leave** comes after that.
4. **exit** clears the client's feature data, which the Deva read from your client file's `features` block when it started.
5. **shutdown** takes every listener this Deva put on the event bus off the bus, answers any question still waiting for another Deva with `⭕️ OFFLINE`, and marks the Deva inactive. It also clears its `modules`, `listeners`, `events` and config.

Each step writes its own time into the stop record, re-stamps the record with md5, sha256 and sha512, and sends its own event, from `devacore:stop` through `devacore:shutdown`. When the last step is done, `stop()` resolves with the record. The record's `key` is `shutdown`, the name of the last step.

If any child Devas are loaded, `stop()` stops them first, so none are left running. {{ guide.deva }} has none.

## 2. Add an onStop hook

Each shutdown step has a hook, just like `onReady` at start-up: `onStop`, `onClose`, `onLeave`, `onExit` and `onShutdown`. A hook is optional. If you add one, the core calls it with `(data, resolve)` and the hook decides what happens next.

Add `onStop` to `new Deva()`, right after `onReady`:

```javascript
onStop(data, resolve) {
	console.log('stopping:', this.status());
	return this.close(data, resolve);
},
```

`onStop` runs at the very start of the shutdown, while the Deva is still active, so `this.status()` still says it's active. This is the place for your own clean-up, such as closing a database connection.

`return this.close(data, resolve);` hands the shutdown on to the next step. This line matters. A hook replaces the core's own move to the next step, so if `onStop` doesn't call `this.close(data, resolve)`, the shutdown stops there and the Deva stays active. The other hooks work the same way: `onClose` calls `this.leave(data, resolve)`, `onLeave` calls `this.exit(data, resolve)`, `onExit` calls `this.shutdown(data, resolve)`, and `onShutdown` ends with `resolve(data)`. By the time `onShutdown` runs, the Deva is already inactive.

## 3. Stop the Deva and check it

Add these lines at the bottom of the file, after the last `console.log(hello.status());`:

```javascript
const bus = hello.events;
console.log('on the bus:', bus.eventNames().length);
console.log('question listeners:', bus.listenerCount('devacore:question'));

const stopped = await hello.stop();
console.log('stopped:', stopped.key);
console.log(hello.status());
console.log('on the bus:', bus.eventNames().length);
console.log('question listeners:', bus.listenerCount('devacore:question'));
console.log('talk:', hello.talk('devacore:question'));
console.log('answer:', await hello.question('/hello Quinn'));
```

Here's what each part does:

- **`const bus = hello.events;`** keeps a reference to the Deva's event bus. Shutdown sets `hello.events` to `false`, so you need this reference to look at the bus afterward.
- **`bus.eventNames().length`** counts the events that have a listener on the bus. Before the stop, that's your `devacore:question` listener plus the listeners the core added for the Deva's own states when it started.
- **`bus.listenerCount('devacore:question')`** counts the listeners on the event you added in Step 5. It's `1` while the Deva runs.
- **`await hello.stop()`** runs the five shutdown steps. `stopped.key` shows the last step that ran.
- **After the stop**, `hello.status()` answers `⭕️ OFFLINE`, and both counts are `0` because every listener is off the bus.
- **`hello.talk('devacore:question')`** answers `⭕️ OFFLINE`. A stopped Deva has no event bus, so it can't send events. `listen()`, `once()` and `ignore()` answer the same way after a stop.
- **`/hello Quinn`** answers `⭕️ OFFLINE`, because a stopped Deva doesn't answer questions.

## The whole file

```javascript
import Deva from '{{ guide.package }}';
import pkg from './package.json' with {type:'json'};
import Agent from './data/agent.json' with {type:'json'};
import Client from './data/client.json' with {type:'json'};

const agent = Agent.DATA;
const client = Client.DATA;

const info = {
	id: pkg.id,
	name: pkg.name,
	describe: pkg.description,
	version: pkg.version,
	copyright: pkg.copyright,
	dir: import.meta.dirname,
	VLA: Agent.VLA,
};

const hello = new Deva({
	info,
	agent: {
		id: agent.id,
		key: agent.key,
		prompt: agent.prompt,
		profile: agent.profile,
	},
	vars: agent.vars,
	func: {
		greet(name) {
			if (!name) return `${this.vars.greeting}.`;
			return `${this.vars.greeting}, and hello to ${name}.`;
		},
	},
	methods: {
		hello(packet) {
			this.context('hello', packet.q.text);
			return new Promise(resolve => {
				const text = this.func.greet(packet.q.text);
				return resolve({
					text,
					html: `<p>${text}</p>`,
					data: {
						greeting: this.vars.greeting,
						name: packet.q.text,
					},
				});
			});
		},
	},
	listeners: {
		'devacore:question'(packet) {
			console.log(`👂 heard: ${packet.q.text}`);
		},
	},
	onReady(data, resolve) {
		const {key} = this.agent();
		console.log(this.status());
		console.log('ready hash:', this._config.hash[key]);
		this.question('/hello Quinn').then(packet => {
			console.log('answer:', packet.a.text);
			console.log('md5:', packet.md5);
			console.log('sha256:', packet.sha256);
			console.log('sha512:', packet.sha512);

			const check = this.lib.copy(packet);
			for (const algo of ['md5', 'sha256', 'sha512']) delete check[algo];
			for (const algo of ['md5', 'sha256', 'sha512']) {
				check[algo] = this.hash(check, algo);
				console.log(`${algo} matches:`, check[algo] === packet[algo]);
			}
			return resolve(data);
		});
	},
	onStop(data, resolve) {
		console.log('stopping:', this.status());
		return this.close(data, resolve);
	},
});

console.log(hello.status());
await hello.init(client);
console.log(hello.status());

const bus = hello.events;
console.log('on the bus:', bus.eventNames().length);
console.log('question listeners:', bus.listenerCount('devacore:question'));

const stopped = await hello.stop();
console.log('stopped:', stopped.key);
console.log(hello.status());
console.log('on the bus:', bus.eventNames().length);
console.log('question listeners:', bus.listenerCount('devacore:question'));
console.log('talk:', hello.talk('devacore:question'));
console.log('answer:', await hello.question('/hello Quinn'));
```

Run it:

```bash
{{ guide.run }}
```

You should see something like this:

```
⭕️ OFFLINE
Hello Deva active since Saturday, November 14, 2026 - 9:26:59 AM
ready hash: {
	vars: 'rDSWWf9z7T32eW+iR+hmpovAlKg00WLgPZHL5lX8Jiw=',
	utils: 'RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=',
	listeners: 'ai+uM2sU+GbXlo68vVrH8JGVJ8rkSiBm5DI//ggURGg=',
	modules: 'RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=',
	func: 'OjSeCqlVjcdUbiGmeGrNh5Hv90nk+nQ6KCxTUjR3+FI=',
	methods: '2YKySno+VMvwOxFVjNfhq7IOROUVA6sDqadLWSanDps='
}
👂 heard: Quinn
answer: Hello World, and hello to Quinn.
md5: F5btSbM4pnX3FtbTL10dmg==
sha256: 6jZOnkot+ZlZavu/w8R8ekqP3VfCcJ3nM2HGzbzX7jQ=
sha512: Xc/30QmT4F8jhtMCuobJkRGyE6rzyEKbLgCbYr2uu7l1ZjJ1c6VwUy2ptv0YUS3+BkG3bnMW5dkw47jQEzBpqQ==
md5 matches: true
sha256 matches: true
sha512 matches: true
Hello Deva active since Saturday, November 14, 2026 - 9:26:59 AM
on the bus: 23
question listeners: 1
stopping: Hello Deva active since Saturday, November 14, 2026 - 9:26:59 AM
stopped: shutdown
⭕️ OFFLINE
on the bus: 0
question listeners: 0
talk: ⭕️ OFFLINE
answer: ⭕️ OFFLINE
```

The program ends by itself as soon as the last line prints. Nothing is left running, because the shutdown took every listener off the bus.

Some of this will be different for you:

- **The date and time** after `active since` are when you started the Deva.
- **The md5, sha256 and sha512 values** change on every run, as in Step {{ life.step }}.
- **The ready hash** stays the same from run to run. It matches the values above only if your vars and your func, methods and listeners are exactly the same as on this page, down to the spacing.
- **The first `on the bus` number** counts the core's own state listeners as well as yours, so it can be different with a different version of Deva Core. The second `on the bus` number should always be `0`.

## If something goes wrong

| You see | What it means |
|---|---|
| `Cannot read properties of undefined (reading 'hash')` | Your installed `{{ guide.package }}` is older than 1.64.70. This step needs version 1.64.70 or newer. Check with `npm ls {{ guide.package }}`. |
| `stopped: stop`, the Deva is still active, and then `TypeError: Cannot read properties of undefined (reading 'text')` | `onStop` didn't hand the shutdown on, so the Deva never stopped. Its listener was still on the bus, and the `talk` line reached it without a question packet. `onStop` must end with `return this.close(data, resolve);`. |
| `TypeError: hello.events.eventNames is not a function` | The code read `hello.events` after the stop. Shutdown sets `hello.events` to `false`, so keep a reference with `const bus = hello.events;` before calling `stop()`, and use `bus` afterward. |
| `⭕️ OFFLINE` from a second `hello.stop()` | This isn't an error. Stopping a Deva that's already stopped answers `⭕️ OFFLINE`. |

## What you did

{% for item in step.learn %}- {{ item }}
{% endfor %}

## Where to go next

That's the whole life of a Deva. Over these seven steps you wrote a client file and an agent file, wired them into `index.js`, gave {{ guide.deva }} a func, a method and a listener, started it with `init(client)`, asked it a question, checked the stamps on its answer, and shut it down cleanly.

Every Deva is built from these same parts. License Deva is a good next one to read. It uses funcs for its database work and methods for its public commands, just as {{ guide.deva }} does. It also does something {{ guide.deva }} doesn't: in its own `onInit`, it compares the agent's VLA, the one in `info`, before it lets itself start. The client's VLA is still checked by the core at `init(client)`, exactly as it was for {{ guide.deva }}.

For the full list of options, events and functions in Deva Core, see the [Docs](/docs/).
