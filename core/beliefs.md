---
layout: page
title: Core - Beliefs
description: What beliefs are in the Deva Core, how to set one, and the full list of available beliefs.
image: /assets/banner.png
permalink: /core/beliefs/
---

{{page.description}}

## What a belief is

A belief records **the outlook a Deva is working under** while it does a piece of work, such as positive, productive, or vedic. Each time you set one, the Core records it and broadcasts a `devacore:belief` event. Actions say what is being done, states say what condition it is in, intents say why, and beliefs say from which frame of reference. Together they give a full record of an operation.

## How to use it

```js
this.belief(<belief>, <emit_value>)
```

- `<belief>` is a key from the list below, such as `'vedic'` or `'positive'`.
- `<emit_value>` is optional extra text added to the record. Use it to say what the belief applies to, such as an id.

```js
this.belief('vedic', `init:${data.id.uid}`); // the Core sets this during init
```

## What happens when you call it

1. The Core checks that the Deva is active. If it is not, it returns the offline message.
2. If the belief name is not in the list below, the call is ignored without an error. Check the spelling against the list.
3. Otherwise the Core sets the current belief and builds a record with a unique id, the belief key, the label plus your extra text, the agent, the client, and a timestamp.
4. The record is hashed with md5, sha256 and sha512, emitted as `devacore:belief`, and returned to you.

## Available beliefs

There are {{ site.data.beliefs.DATA | size }} beliefs.

{% for belief in site.data.beliefs.DATA %}
- **{{ belief[0] }}**: {{ belief[1] }}
{% endfor %}
