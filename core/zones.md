---
layout: page
title: Core - Zones
description: What zones are in the Deva Core, how this.zone() places an entity in one, how this.zones() lists them, and the full list.
image: /assets/banner.png
permalink: /core/zones/
---

{{page.description}}

## What a zone is

A zone is **the place or area an entity is working in right now**: home, away, play, work, rest, or a step of the Core such as init, load, question, answer and the feature areas. Each time you set one, the Core records it and broadcasts a `devacore:zone` event, so you can trace any activity back to where it happened. Zones say where, actions say what, states say the condition, and intents say why.

## Placing an entity in a zone: this.zone()

```js
this.zone(<zone>, <emit_value>)
```

- `<zone>` is a key from the list below, such as `'client'`, `'question'` or `'load'`.
- `<emit_value>` is optional extra text added to the record. Use it to say what is working in that zone, such as a method name and an id.

```js
this.zone('client', `client:${client.id}`);   // the client step
this.zone('question', id.uid);                // a question is being asked
this.zone(key, `${method}:${id.uid}`);        // a feature zone, with the method and request id
```

When you call it:

1. The Core checks that the Deva is active. If it is not, it returns the offline message.
2. If the zone name is not in the list below, the call is ignored without an error. Check the spelling against the list.
3. Otherwise the Core sets the current zone and builds a record with a unique id, the zone key, the label plus your extra text, the agent, the client, and a timestamp.
4. The record is hashed with md5, sha256 and sha512, emitted as `devacore:zone`, and returned to you.

## Listing the zones: this.zones()

```js
const zones = this.zones();
```

This returns every zone the Deva knows about as one data packet, with its own id, the agent, the client, a timestamp, and the md5, sha256 and sha512 hashes. The list itself is under `zones.value`, as key and label pairs. If the Deva is not active it returns the offline message.

## Available zones

There are {{ site.data.zones.DATA | size }} zones.

{% for zone in site.data.zones.DATA %}
- **{{ zone[0] }}**: {{ zone[1] }}
{% endfor %}
