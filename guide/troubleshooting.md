---
layout: page
title: "Troubleshooting"
permalink: /guide/troubleshooting/
description: Every error and warning message from the Hello Deva guide, what causes it, and how to fix it.
image: /assets/banner.png
---

{% assign guide = site.data.guide.DATA %}
{% assign s1 = guide.steps | where: "step", 1 | first %}
{% assign s2 = guide.steps | where: "step", 2 | first %}
{% assign s3 = guide.steps | where: "step", 3 | first %}
{% assign s4 = guide.steps | where: "step", 4 | first %}
{% assign s5 = guide.steps | where: "step", 5 | first %}
{% assign s6 = guide.steps | where: "step", 6 | first %}
{% assign s7 = guide.steps | where: "step", 7 | first %}

{{ page.description }}

This page collects every problem covered in the guide in one place. Each row tells you what you'll see, why it happens, and how to fix it, and links to the step that explains it in full.

## How to read an error

When Node.js stops with an error, it prints several lines. Here's a real one from Step {{ s6.step }}, shortened to its first `at` line. The path will show your own project folder:

```
file:///home/you/hello-deva/node_modules/@indra.ai/deva/index.js:2119
		const warning = this._agent.profile.warning || this._messages.warning; // agent or default warning
																				^

TypeError: Cannot read properties of undefined (reading 'warning')
		at Deva.uid (file:///home/you/hello-deva/node_modules/@indra.ai/deva/index.js:2119:39)
```

- **The first line** is the file and line number where the error happened. It's often inside Deva Core, in `node_modules`, even when the mistake is in your own file. Line numbers can change from one version to the next, so don't search for them.
- **The line with `^`** points at the exact spot in that line.
- **The line that starts with an error name**, such as `TypeError` or `SyntaxError`, is the message. This is the line to look up in the tables below.
- **Lines that start with `at`** come after the message. They show the path the code took to get there, and you can usually ignore them. Node prints several of them; the example shows only the first.

Not every message is a crash. Messages that start with `❌`, `⛔️` or `⭕️` are Deva Core's own answers. They mean the Deva did something on purpose, such as refusing to start or answering while it's offline.

## Check your version first

Steps {{ s6.step }} and {{ s7.step }} need `{{ guide.package }}` version 1.64.70 or newer. To see which version you have installed, run this in your project folder:

```bash
npm ls {{ guide.package }}
```

| You see | Why | Fix |
|---|---|---|
| `TypeError: Cannot read properties of undefined (reading 'hash')` when the Deva starts | Your installed Deva Core is older than 1.64.70. | Install version 1.64.70 or newer. See [Step {{ s6.step }}]({{ s6.permalink }}). |

## The client and agent files (Steps {{ s2.step }} and {{ s3.step }})

| You see | Why | Fix |
|---|---|---|
| `SyntaxError` with the path to `agent.json` or `client.json`, such as `Expected double-quoted property name in JSON` | The JSON isn't valid. A missing quote, an extra comma or a missing bracket is enough. | Run the JSON check from [Step {{ s2.step }}]({{ s2.permalink }}) or [Step {{ s3.step }}]({{ s3.permalink }}). It names the line and column of the problem. |
| `❌ Bad Personal VLA` | The client file has no `VLA`. | Add the VLA to the client's `DATA`, as shown in [Step {{ s2.step }}]({{ s2.permalink }}). |
| `❌ Invalid VLA Check` | The client's `VLA` was changed or only partly copied, so it doesn't exactly match the one that ships with Deva Core. | Copy it again, unchanged, as shown in [Step {{ s2.step }}]({{ s2.permalink }}). |

Both VLA messages are about the **client's** VLA, which the core checks when the Deva starts. The agent's VLA, at the top of `agent.json`, isn't checked at start-up.

Missing client settings don't stop the Deva. It fills them in with default messages, which you'll see in a feature's data, for example in `hello.license()` while the Deva is running:

| Default message | What's missing from `client.json` |
|---|---|
| `⛔️ NO NAME PROVIDED` | `profile.name` |
| `⛔️ NO CONCERNS PROVIDED` | a feature's `concerns` |
| `⛔️ NO GLOBAL PROVIDED` | a feature's `global` |
| `⛔️ NO DEVAS PROVIDED` | a feature's `devas` |

[Step {{ s2.step }}]({{ s2.permalink }}) shows the full client file with every setting in place.

## Wiring it together (Step {{ s4.step }})

| You see | Why | Fix |
|---|---|---|
| `needs an import attribute of "type: json"` | An import of a JSON file is missing `with {type:'json'}`. | Add `with {type:'json'}` to the end of the import. See [Step {{ s4.step }}]({{ s4.permalink }}). |
| `Cannot find module` for `agent.json` or `client.json` | The import path is wrong. | The files live in `data/`, so the imports should be `./data/agent.json` and `./data/client.json`. |
| `undefined` instead of `Hello World` | `vars: agent.vars` is missing from `new Deva()`. | Add `vars: agent.vars,` after the `agent` block. See [Step {{ s4.step }}]({{ s4.permalink }}). |
| `TypeError: Cannot read properties of undefined (reading 'greeting')` | `agent` is the whole agent file instead of what's inside it, so `agent.vars` doesn't exist. | It should be `const agent = Agent.DATA;`. The same message in Step {{ s5.step }} has a different cause, listed in the next section. |

## Skills (Step {{ s5.step }})

Some of these only show up once the Deva starts and runs your method, which first happens in [Step {{ s6.step }}]({{ s6.permalink }}).

| You see | Why | Fix |
|---|---|---|
| `TypeError: Cannot read properties of undefined (reading 'greeting')` | `hello.func.greet()` was called directly before the Deva started. Before start-up, `this` inside a func isn't the Deva yet. | Use the check from section 5 of [Step {{ s5.step }}]({{ s5.permalink }}) instead. |
| `TypeError: Cannot read properties of undefined (reading 'vars')` | A func, method or listener was written as an arrow function, such as `greet: (name) => {}`. An arrow function can't be bound to the Deva. | Write it as a normal function, such as `greet(name) {}`. See [Step {{ s5.step }}]({{ s5.permalink }}). |
| `.then is not a function`, in a line that starts with `TypeError` | A method returned a plain value instead of a Promise. | Return a Promise, as the `hello` method does with `new Promise(resolve => {})`. See [Step {{ s5.step }}]({{ s5.permalink }}). |
| `⛔️ METHOD NOT FOUND hello hi` | The command doesn't match a method name. `/hi` looks for `methods.hi`. | Ask with the method's exact name, such as `/hello`. |
| `SyntaxError: Unexpected token '{'` | A listener's event name is missing its quotes. | Write the name in quotes, such as `'devacore:question'(packet)`. |

## Bring it to life (Step {{ s6.step }})

| You see | Why | Fix |
|---|---|---|
| `TypeError: Cannot create property 'created' on boolean 'false'` | `info` is missing from `new Deva()`. | Make `info,` the first entry in `new Deva()`. See [Step {{ s4.step }}]({{ s4.permalink }}). |
| `TypeError: Cannot read properties of undefined (reading 'warning')` | `agent` is the whole agent file instead of what's inside it. | It should be `const agent = Agent.DATA;`. |
| Only two `⭕️ OFFLINE` lines, and nothing else | The client's VLA didn't pass the check at `init(client)`, so the Deva never started. | To see why, change the line to `console.log(await hello.init(client));`. It prints `❌ Bad Personal VLA` or `❌ Invalid VLA Check`, both covered above. |
| The program ends without `👂 heard: Quinn` or `answer:` | `onReady` is missing or misspelled. | Name it exactly `onReady`. See [Step {{ s6.step }}]({{ s6.permalink }}). |
| A `matches` line says `false` | The packet was changed after it was stamped, or the stamps were rebuilt in a different order. | Rebuild them in the order md5, sha256, sha512. See [Step {{ s6.step }}]({{ s6.permalink }}). |

## Shut it down (Step {{ s7.step }})

| You see | Why | Fix |
|---|---|---|
| `stopped: stop`, the Deva is still active, and then `TypeError: Cannot read properties of undefined (reading 'text')` | `onStop` didn't hand the shutdown on, so the Deva never stopped. Its listener was still on the bus, and the `talk` line reached it without a question packet. | End `onStop` with `return this.close(data, resolve);`. See [Step {{ s7.step }}]({{ s7.permalink }}). |
| `TypeError: hello.events.eventNames is not a function` | The code read `hello.events` after the stop. Shutdown sets `hello.events` to `false`. | Keep a reference with `const bus = hello.events;` before calling `stop()`, and use `bus` afterward. |
| `⭕️ OFFLINE` from a second `hello.stop()` | This isn't an error. Stopping a Deva that's already stopped answers `⭕️ OFFLINE`. | Nothing to fix. |

## Still stuck?

Go back to the step where the problem started and compare your `index.js` with that step's whole-file block, line by line. Every whole-file block in the guide was run exactly as written.
