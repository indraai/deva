---
layout: page
title: Core - Features
description: What features are in the Deva Core, how this.feature() marks which one is active, and the full list.
image: /assets/banner.png
permalink: /core/features/
---

{{page.description}}

## What a feature is

A feature is **a built-in capability of the Deva Core**, such as License, Error, Log, Security or Support. The ten capabilities from License through Systems are loaded when a Deva starts, and each can be read from your code through a getter of the same name, such as `this.license()` or `this.security()`. `init`, `agent` and `client` are also on the list so the Core can mark the startup, agent and client steps.

## How to use it

```js
this.feature(<feature>, <emit_value>)
```

- `<feature>` is a key from the list below, such as `'security'` or `'client'`.
- `<emit_value>` is optional extra text added to the record. Use it to say what the feature is working on, such as an id.

This call **marks** which feature the Deva is working in. It does not load a feature or run one. The Core uses it like this:

```js
this.feature('client', `client:${client.id}`); // marks the client step
this.feature('init', data.id.uid);             // marks the init step
this.feature(key, id.uid);                     // marks a feature as it loads
```

To read a loaded feature's data, call its getter instead:

```js
const license = this.license(); // returns a copy of the license feature data
```

## What happens when you call it

1. The Core checks that the Deva is active. If it is not, it returns the offline message.
2. If the feature name is not in the list below, the call is ignored without an error. Check the spelling against the list.
3. Otherwise the Core sets the current feature and builds a record with a unique id, the feature key, the label plus your extra text, the agent, the client, and a timestamp.
4. The record is hashed with md5, sha256 and sha512, emitted as `devacore:feature`, and returned to you.

## Available features

There are {{ site.data.features.DATA | size }} features.

{% for feature in site.data.features.DATA %}
- **{{ feature[0] }}**: {{ feature[1] }}
{% endfor %}
