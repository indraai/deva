---
layout: page
title: Core - Intents
description: What intents are in the Deva Core, how to set one, and the full list of available intents.
image: /assets/banner.png
permalink: /core/intents/
---

{{page.description}}

## What an intent is

An intent records **the purpose or outcome behind what the Deva is doing**. Most calls in the Core use `good` when work succeeds and `bad` when it fails, but the list also covers lifecycle steps such as `init`, `start` and `ready`, and a wide range of purposes such as `help`, `work`, `business` and `lawful`. Each time you set one, the Core records it and broadcasts a `devacore:intent` event. Actions say what is done, states say the condition, and intents say why and how it ended.

## How to use it

```js
this.intent(<intent>, <emit_value>)
```

- `<intent>` is a key from the list below, such as `'good'` or `'bad'`.
- `<emit_value>` is optional extra text added to the record. Use it to say what the intent applies to, such as a function name and an id.

The usual pattern in the Core is to return, mark `good`, and only then hash and stamp the data. Bad data is never hashed.

```js
try {
	const data = this.lib.copy(this[`_${key}`]);
	this.action('return', `_getFeature:${key}`);       // 1. the return action
	this.state('valid', `_getFeature:${key}`);
	this.intent('good', `_getFeature:${key}`);         // 2. the good intent
	return data;
} catch (err) {
	this.state('catch', `_getFeature:${key}`);
	this.intent('bad', `_getFeature:${key}`);          // the failure path marks bad
	return this.err(err);
}
```

## What happens when you call it

1. The Core checks that the Deva is active. If it is not, it returns the offline message.
2. If the intent name is not in the list below, the call is ignored without an error. Check the spelling against the list.
3. Otherwise the Core sets the current intent and builds a record with a unique id, the intent key, the label plus your extra text, the agent, the client, and a timestamp.
4. The record is hashed with md5, sha256 and sha512, emitted as `devacore:intent`, and returned to you.

## Available intents

There are {{ site.data.intents.DATA | size }} intents.

{% for intent in site.data.intents.DATA %}
- **{{ intent[0] }}**: {{ intent[1] }}
{% endfor %}
