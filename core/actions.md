---
layout: page
title: Core - Actions
description: What actions are in the Deva Core, when to set one, and the full list of available actions.
image: /assets/banner.png
permalink: /core/actions/
---

{{page.description}}

## What an action is

An action says **what the Deva is doing right now**: encrypting, returning data, hashing, talking to a listener. Each time you set one, the Core records it and broadcasts a `devacore:action` event, so you can log it, watch it, or audit it later. If you also set a state (the condition) and an intent (the purpose), you get a complete record of an operation from start to finish.

## How to use it

```js
this.action(<action>, <emit_value>)
```

- `<action>` is a key from the list below, such as `'return'` or `'hash'`.
- `<emit_value>` is optional extra text added to the record. Use it to say what the action applies to, such as an id or a function name.

```js
this.action('return', `_getFeature:${key}`);  // marks that the function is returning
this.action('hash', `${label}:${algo}:${uid}`); // marks a hashing step
```

## What happens when you call it

1. The Core checks that the Deva is active. If it is not, it returns the offline message.
2. If the action name is not in the list below, the call is ignored without an error. Check the spelling against the list.
3. Otherwise the Core sets the current action and builds a record with a unique id, the action key, the label plus your extra text, the agent, the client, and a timestamp.
4. The record is hashed with md5, sha256 and sha512, emitted as `devacore:action`, and returned to you.

## Good habits

- Set the action at the start of the work and set `return` just before you return, so the trail shows both ends.
- Put the function name and an id in the extra text, so entries can be matched to a request.
- Don't set an action from inside the state functions themselves, since logging an action calls them again.

## Available actions

There are {{ site.data.actions.DATA | size }} actions.

{% for action in site.data.actions.DATA %}
- **{{ action[0] }}**: {{ action[1] }}
{% endfor %}
