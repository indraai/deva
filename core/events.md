---
layout: page
title: Core - Events
description: How the Deva Core event bus works, how to listen to Core events from a Deva listener, and the full list of base events.
image: /assets/banner.png
permalink: /core/events/
---

{{page.description}}

## The event bus

Every Deva has an event bus, `this.events`. It is a standard Node.js `EventEmitter`, unless you pass your own in through the `events` option. A Deva passes its bus down to the Devas inside it, so a parent and its children share one bus and can hear each other.

Everything the Core does is announced on that bus. The base events all start with `devacore:`, and they fall into three groups.

**Lifecycle events** announce a step the Deva has completed. They fire in order as the Deva starts and stops:

- Start up: `devacore:start`, `devacore:enter`, `devacore:done`, `devacore:ready`
- Shut down: `devacore:stop`, `devacore:close`, `devacore:leave`, `devacore:exit`, `devacore:shutdown`
- Questions: `devacore:finish` and `devacore:complete` close out a question the Deva has asked another Deva.

**Record events** announce each time the Deva sets a value in the workflow system: `devacore:feature`, `devacore:zone`, `devacore:action`, `devacore:state`, `devacore:intent`, `devacore:belief` and `devacore:context`. One call such as `this.action('return', id)` fires `devacore:action` with a hashed record of that call.

**Conversation events** announce questions and answers: `devacore:question`, `devacore:answer` and `devacore:ask`.

## Listening to Core events

Use `this.listen(event, callback)`. The callback receives the event's data packet.

```js
this.listen('devacore:ready', packet => {
	console.log('This Deva is ready', packet.id.uid);
});

this.listen('devacore:action', packet => {
	console.log(packet.text); // for example "🤿 Return _getFeature:license"
});
```

The simplest way to register listeners is in the `listeners` option when you create the Deva. The Core binds them and registers them on the bus during `init()`:

```js
const deva = new Deva({
	// ...
	listeners: {
		'devacore:ready': packet => { /* ... */ },
		'devacore:error': packet => { /* ... */ },
	},
});
```

Three related calls manage listeners at any time:

- `this.listen(evt, callback)` adds a listener.
- `this.once(evt, callback)` adds a listener that runs one time, then removes itself.
- `this.ignore(evt, callback)` removes a listener. Pass the same function you registered.

Each of these records its own action and intent, so listening is part of the audit trail like everything else.

## What an event packet contains

Record events (`feature`, `zone`, `action`, `state`, `intent`, `belief`) carry:

| Field | Meaning |
| --- | --- |
| `id` | A unique id for this event. |
| `key` | Which kind of record it is, such as `action`. |
| `value` | The value that was set, such as `return`. |
| `text` | The label for the value, plus any extra text passed in. |
| `agent` and `client` | Who the Deva is and who it is working for. |
| `created` | The time it happened, in milliseconds. |
| `md5`, `sha256`, `sha512` | The three hash tiers of the record. |

Lifecycle events carry the Deva's data packet for that step, with its own `id` and the same hash tiers.

Listeners receive a copy of the data, so changing the packet in your callback does not change the Core's own record.

## Per-Deva listeners and questions

Besides the shared `devacore:` events, each Deva automatically listens on events named for its own key. For every state name that matches one of its functions, the Core registers `<agent key>:<state>`, so a Deva with an `ask` function hears `<key>:ask`.

This is how Devas talk to each other. When one Deva asks another a question that starts with `#`, it announces it on the bus, then waits once on `<key>:ask:<packet id>` for the answer. The other Deva runs the matching method and replies on that exact event. If nothing replies before the ask timeout (30 seconds by default), the question ends with an ask timeout message.

## Cleaning up

When a Deva shuts down, the Core removes its listeners and any pending questions from the bus, so a stopped Deva leaves nothing behind on a shared bus.

## Base events

There are {{ site.data.events.DATA | size }} base events.

{% for event in site.data.events.DATA %}
- **{{ event[0] }}**: `{{ event[1] }}`
{% endfor %}
