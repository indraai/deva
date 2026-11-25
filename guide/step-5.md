---
layout: page
title: "Step 5: Give it skills"
permalink: /guide/step-5/
description: Add one func, one method and one listener, and see when to use each.
image: /assets/banner.png
---

{% assign guide = site.data.guide.DATA %}
{% assign step = guide.steps | where: "step", 5 | first %}
{% assign next = guide.steps | where: "step", 6 | first %}

{{ step.describe }}

Your Deva has a name, a profile and vars, but it can't do anything yet. In this step you'll give it three kinds of skills: a **func**, a **method** and a **listener**. You'll add all three to the `new Deva()` block you wrote in Step 4. The Deva still won't start in this step. You'll start it and see the skills work in Step {{ next.step }}.

## 1. Three kinds of skills

Each kind has its own job:

| Kind | Where it goes | Who uses it | Use it when |
|---|---|---|---|
| func | `func` | Only the Deva itself, as `this.func.name()` | You have internal work that more than one method might need, such as building text or reading a database. Nobody outside the Deva can call a func by name. |
| method | `methods` | Anyone who asks the Deva a question, as `/name` | You want a public command. A method is what runs when someone asks the Deva to do something. |
| listener | `listeners` | The event bus | You want the Deva to react when an event happens, no matter who caused it. |

A good rule: put the work in a func, let a method call that func, and use a listener to watch what happens.

All three are written as normal functions, like `greet(name) {}`. Don't write them as arrow functions. When the Deva starts, Deva Core binds every func, method and listener to the Deva, so `this` inside them is the Deva. That's how they can reach `this.vars`, `this.func` and the rest. An arrow function can't be bound, so `this` would be wrong inside it.

## 2. Add a func

Add a `func` block inside `new Deva()`, right after `vars: agent.vars,`:

```javascript
	func: {
		greet(name) {
			if (!name) return `${this.vars.greeting}.`;
			return `${this.vars.greeting}, and hello to ${name}.`;
		},
	},
```

`greet` builds the Deva's greeting from `this.vars.greeting`, the `Hello World` you wrote in your agent file in Step 3. If it's given a name, it adds a hello to that name.

## 3. Add a method

Add a `methods` block right after the `func` block:

```javascript
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
```

The method's name is its command. Once the Deva is running, asking it `/hello Quinn` runs `methods.hello`. Here's what each part does:

- **`packet`** is the question packet the Deva builds for you. The text after the command is in `packet.q.text`, so for `/hello Quinn` it's `Quinn`.
- **`this.context('hello', packet.q.text)`** sets the Deva's context to the `hello` label from `vars.context` in your agent file, which is `👋 Saying hello`. That's why you wrote that label in Step 3.
- **`this.func.greet(packet.q.text)`** does the actual work by calling the func you just added.
- **The method returns a Promise.** This is required. The core waits for the Promise and then puts your result into the answer.
- **The result has `text`, `html` and `data`.** These become `a.text`, `a.html` and `a.data` in the answer packet. You can also resolve a plain string, and the core will use it as the text.

## 4. Add a listener

Add a `listeners` block right after the `methods` block:

```javascript
	listeners: {
		'devacore:question'(packet) {
			console.log(`👂 heard: ${packet.q.text}`);
		},
	},
```

The name of a listener is the event it listens for. `devacore:question` is the event Deva Core sends every time the Deva is asked a question, before it answers. The listener receives a copy of the question packet, so the question's text is in `packet.q.text`.

The event name has quotes around it because it contains a colon.

## 5. Check them before the Deva starts

Replace the three `console.log` lines from Step 4 with these:

```javascript
console.log(hello.status());
console.log('func:', Object.keys(hello.func));
console.log('methods:', Object.keys(hello.methods));
console.log('listeners:', Object.keys(hello.listeners));
console.log('heard:', hello.talk('devacore:question'));
console.log('answer:', await hello.question('/hello Quinn'));
```

The Deva hasn't started, so this check shows what's ready and what isn't:

- The first line shows the Deva is still offline.
- The next three lines list the skills you added. The Deva is holding them, ready for start-up.
- `hello.talk('devacore:question')` sends that event and reports whether anything heard it. It answers `false` because the listener isn't connected to the event bus yet. Listeners are connected when the Deva starts.
- `hello.question('/hello Quinn')` asks the Deva to run your method. It answers `⭕️ OFFLINE` because a Deva only answers questions after it has started.

Binding happens at start-up too. Before then, `this` inside a func isn't the Deva yet, so don't call `hello.func.greet()` directly to test it. You'll see all three skills work in Step {{ next.step }}.

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
});

console.log(hello.status());
console.log('func:', Object.keys(hello.func));
console.log('methods:', Object.keys(hello.methods));
console.log('listeners:', Object.keys(hello.listeners));
console.log('heard:', hello.talk('devacore:question'));
console.log('answer:', await hello.question('/hello Quinn'));
```

Run it:

```bash
{{ guide.run }}
```

You should see:

```
⭕️ OFFLINE
func: [ 'greet' ]
methods: [ 'hello' ]
listeners: [ 'devacore:question' ]
heard: false
answer: ⭕️ OFFLINE
```

Every line here is correct for a Deva that hasn't started. Your skills are in place, the listener isn't connected yet, and questions wait until start-up.

## What happens in Step {{ next.step }}

When you start the Deva in Step {{ next.step }}, the same three skills come to life. Asking `/hello Quinn` will make the listener print `👂 heard: Quinn`, and the answer's text will be `Hello World, and hello to Quinn.`, built by your method calling your func.

## If something goes wrong

| You see | What it means |
|---|---|
| `Cannot read properties of undefined (reading 'greeting')` | `hello.func.greet()` was called directly before the Deva started. Before start-up, `this` isn't the Deva yet. Use the check in section 5 instead. |
| `Cannot read properties of undefined (reading 'vars')` | A func, method or listener was written as an arrow function, such as `greet: (name) => {}`. Write it as `greet(name) {}` so it can be bound to the Deva. |
| `.then is not a function` | A method returned a plain value instead of a Promise. Wrap the result in `new Promise(resolve => {})` as `hello` does. |
| `⛔️ METHOD NOT FOUND hello hi` | The command doesn't match a method name. `/hi` looks for `methods.hi`. |
| `SyntaxError: Unexpected token '{'` | A listener's event name is missing its quotes. Write `'devacore:question'(packet)`. |

## What you did

{% for item in step.learn %}- {{ item }}
{% endfor %}

## Next

In **[Step {{ next.step }}: {{ next.title }}]({{ next.permalink }})** you'll start the Deva with `init(client)`, watch it reach ready, ask it `/hello`, and read the stamped packet that comes back.
