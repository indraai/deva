---
layout: page
title: Core - Messages
description: What the standard messages in the Deva Core are for, where each one is used, and the full list.
image: /assets/banner.png
permalink: /core/msgs/
---

{{page.description}}

## What messages are

Messages are **the standard text the Core returns when it can't, or won't, do something**, plus the default legal and identity text it stamps on a Deva. They live in one data file, so every Deva says the same thing in the same situation. That makes results consistent, and it lets your code compare a result against a known message.

The Core reads them from `this._messages`. You can add your own: any key you put in your agent's `messages` is added alongside the Core's. A key the Core already has is not replaced, so the standard text always stays the same.

```js
if (result === this._messages.offline) {
	// the Deva has been shut down
}
```

## Where they are used

**The offline message.** Almost every public function checks that the Deva is active first, and returns `offline` if it isn't. It is the most used message in the Core.

**Missing or bad input.** These come back when a function is called with the wrong arguments.

| Message | When |
| --- | --- |
| `notext` | `question()` is called with no text, or text that isn't a string. |
| `nokey`, `invalidkey`, `nodata` | An internal step is called without a key, with a key it doesn't know, or without data. |
| `noid` | Data is checked for an id and doesn't have one. |
| `invalidfeature` | A feature name isn't one of the Core's features. The feature getters return it, and `Feature()` rejects with it. |

**Asking another Deva.**

| Message | When |
| --- | --- |
| `asktimeout` | The Deva you asked didn't answer before the timeout. |
| `noask` | The ask target couldn't be found. |
| `method_not_found` | The Deva you asked has no method with that name. It is returned with the agent key and method. |
| `help_not_found` | A help request has nothing to show. |

**Loading and licensing.**

| Message | When |
| --- | --- |
| `unload` | A feature is unloaded. It is returned with the feature key. |
| `client_license_invalid` | The client's license check fails during startup. |
| `invalid_agent`, `invalid_client` | A hash check on the agent or client fails. |
| `init` | The text of the init data packet. |

**Identity and legal text.** `warning`, `notice`, `copyright`, `status`, `vectors`, `owner`, `creator` and `salute` are the defaults the Core uses when it builds a Deva's license and fingerprint data. If your agent profile sets its own value, the profile wins, and the message is only the fallback.

## Available messages

There are {{ site.data.msgs.DATA | size }} messages.

{% for message in site.data.msgs.DATA %}
- **{{ message[0] }}**: {{ message[1] }}
{% endfor %}