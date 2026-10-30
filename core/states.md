---
layout: page
title: Core - States
description: What states are in the Deva Core, how to set one with this.state(), how to list them with this.states(), and the full list.
image: /assets/banner.png
permalink: /core/states/
---

{{page.description}}

## What a state is

A state records **the condition a Deva or a piece of work is in right now**: online, idle, waiting, pending, valid, or catch for an error. Each time you set one, the Core records it and broadcasts a `devacore:state` event. Actions say what is being done, and states say what condition it is in while it happens.

## Setting a state: this.state()

```js
this.state(<state>, <emit_value>)
```

- `<state>` is a key from the list below, such as `'try'`, `'valid'` or `'catch'`.
- `<emit_value>` is optional extra text added to the record. Use it to say what the state applies to, such as a function name and an id.

```js
this.state('try', key);                              // work is starting inside a try block
this.state('valid', `_getFeature:${key}`);           // the data passed its check
this.state('catch', `_getFeature:${key}`);           // an error was caught
```

When you call it:

1. The Core checks that the Deva is active. If it is not, it returns the offline message.
2. If the state name is not in the list below, the call is ignored without an error. Check the spelling against the list.
3. Otherwise the Core sets the current state and builds a record with a unique id, the state key, the label plus your extra text, the agent, the client, and a timestamp.
4. The record is hashed with md5, sha256 and sha512, emitted as `devacore:state`, and returned to you.

## Listing the states: this.states()

```js
const states = this.states();
```

This returns every state the Deva knows about as one data packet, with its own id, the agent, the client, a timestamp, and the md5, sha256 and sha512 hashes. The list itself is under `states.value`, as key and label pairs. If the Deva is not active it returns the offline message. Calling it also records a `states` action and a `data` state of its own, so reading the list leaves a trace like everything else.

The matching functions `this.actions()`, `this.zones()`, `this.intents()` and the others work the same way for their lists.

## Available states

There are {{ site.data.states.DATA | size }} states.

{% for state in site.data.states.DATA %}
- **{{ state[0] }}**: {{ state[1] }}
{% endfor %}
