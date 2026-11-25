---
layout: page
title: "Step 3: The agent file"
permalink: /guide/step-3/
description: Write agent.json, which describes who the Deva is, including its vars and its own context labels.
image: /assets/banner.png
---

{% assign guide = site.data.guide.DATA %}
{% assign step = guide.steps | where: "step", 3 | first %}
{% assign next = guide.steps | where: "step", 4 | first %}

{{ step.describe }}

The client file says who is talking. The **agent** file says who is listening: your Deva's identity, how it shows up in the prompt, its profile, and its **vars**. Vars are the Deva's own settings and words, and they live right here in the agent file next to the profile.

## 1. The wrapper

The agent file uses the same outer shape as the client file. Open `data/agent.json` and start with this:

```json
{
	"name": "AGENT",
	"describe": "Hello Deva agent file",
	"copyright": "Copyright ©2026 Your Name; All rights reserved.",
	"VLA": {},
	"DATA": {
	}
}
```

Everything the Deva reads goes inside `DATA`. The `VLA` sits above it, at the top level.

## 2. The agent's license (VLA)

The client file and the agent file each carry a VLA, and the two do different jobs:

- The **client VLA**, inside the client's `DATA` from Step 2, is checked when the Deva starts. It's what gives the client access to Deva Core.
- The **agent VLA**, at the top of this file, belongs to the Deva itself. It isn't checked at start-up. It gets compared later, when something accesses this Deva. Custom Devas do that comparison in their own `onInit` event.

For Hello Deva, the agent VLA is the same record that ships with Deva Core. Print it the same way you did in Step 2:

```bash
node -e "console.log(JSON.stringify(require('./node_modules/{{ guide.package }}/package.json').VLA, null, 2))"
```

Copy the whole object it prints into the top-level `"VLA"`, unchanged.

While you're building, the agent's settings live in `agent.json`. When a Deva is ready for production, the same settings move into its `package.json`, so the entity, its data and its package travel together as one file. The VLA stays at the top level either way.

## 3. Identity and prompt

Inside `DATA`, give the Deva an `id`, a `key` and a `prompt`:

```json
"id": "00000000000000000002",
"key": "hello",
"prompt": {
	"emoji": "👋",
	"text": "hello",
	"colors": {
		"label": {"R": 0, "G": 150, "B": 255},
		"text": {"R": 101, "G": 192, "B": 255}
	}
},
```

- `id` is a unique id for this Deva. Make it different from the client's `id`.
- `key` is the Deva's short name. Other Devas and the client's `devas` settings refer to it by this key, so keep it short, lowercase and unique.
- `prompt` works the same as in the client file: the emoji, label and colors the Deva uses when it talks.

## 4. Profile

`profile` describes the Deva:

```json
"profile": {
	"name": "Hello Deva",
	"describe": "My first Deva. It says hello."
},
```

`name` is the one that matters most. The Deva uses it to sign what it says. The profile can also carry its own `warning`, `notice`, `copyright`, `owner` and `creator`. If you leave those out, the Deva uses Deva Core's defaults.

## 5. Vars

`vars` holds the Deva's own values. Anything you put here, the Deva can read later as `this.vars`. Start with one plain value and a `context` map:

```json
"vars": {
	"greeting": "Hello World",
	"context": {
		"hello": "👋 Saying hello"
	}
}
```

- `greeting` is a plain value. You'll use it in Step {{ next.step | plus: 1 }} when the Deva learns to say hello.
- `context` is a map of labels for what the Deva is doing. Each Deva defines its own. When the Deva calls `this.context('hello')`, it announces "👋 Saying hello".

The key is `context`, singular. Add more labels as your Deva learns more.

## The whole file

Put together, `data/agent.json` looks like this. Your VLA record goes in place of `"uid": "your full VLA record"`, and it must be the whole record, copied unchanged:

```json
{
	"name": "AGENT",
	"describe": "Hello Deva agent file",
	"copyright": "Copyright ©2026 Your Name; All rights reserved.",
	"VLA": {
		"uid": "your full VLA record"
	},
	"DATA": {
		"id": "00000000000000000002",
		"key": "hello",
		"prompt": {
			"emoji": "👋",
			"text": "hello",
			"colors": {
				"label": {"R": 0, "G": 150, "B": 255},
				"text": {"R": 101, "G": 192, "B": 255}
			}
		},
		"profile": {
			"name": "Hello Deva",
			"describe": "My first Deva. It says hello."
		},
		"vars": {
			"greeting": "Hello World",
			"context": {
				"hello": "👋 Saying hello"
			}
		}
	}
}
```

Check that it's valid JSON:

```bash
node -e "JSON.parse(require('fs').readFileSync('data/agent.json')); console.log('agent.json ok')"
```

You should see:

```
agent.json ok
```

## What you did

{% for item in step.learn %}- {{ item }}
{% endfor %}

## Next

In **[Step {{ next.step }}: {{ next.title }}]({{ next.permalink }})** you'll write `index.js`, load both files, and pass the agent's vars to your Deva.
