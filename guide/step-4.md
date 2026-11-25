---
layout: page
title: "Step 4: Wire it together"
permalink: /guide/step-4/
description: Import the client and agent files, build the info block from your package.json, and create the Deva.
image: /assets/banner.png
---

{% assign guide = site.data.guide.DATA %}
{% assign step = guide.steps | where: "step", 4 | first %}
{% assign next = guide.steps | where: "step", 5 | first %}
{% assign life = guide.steps | where: "step", 6 | first %}

{{ step.describe }}

You have a client file and an agent file. Now you'll write `index.js`, which loads both, builds an info block from your `package.json`, and creates {{ guide.deva }}. You won't start it yet. That comes in Step {{ life.step }}.

## 1. Fill in package.json

The Deva's info block is built from your `package.json`, so add an `id`, a `description` and a `copyright` to the file you created in Step 1:

```bash
npm pkg set id="00000000000000000003"
npm pkg set description="My first Deva. It says hello."
npm pkg set copyright="Copyright ©2026 Your Name; All rights reserved."
```

Make the `id` different from the client and agent ids. The description and copyright can be your own words. Your `package.json` should now include these entries:

```json
"id": "00000000000000000003",
"name": "hello-deva",
"version": "1.0.0",
"description": "My first Deva. It says hello.",
"copyright": "Copyright ©2026 Your Name; All rights reserved.",
"type": "module"
```

## 2. Load the files

Open `index.js` and start with the imports:

```javascript
import Deva from '{{ guide.package }}';
import pkg from './package.json' with {type:'json'};
import Agent from './data/agent.json' with {type:'json'};
import Client from './data/client.json' with {type:'json'};
```

The `with {type:'json'}` part is required. It's an import attribute that tells Node the file is JSON.

The JSON files have a wrapper, and everything the Deva reads is inside `DATA`. Pull that out:

```javascript
const agent = Agent.DATA;
const client = Client.DATA;
```

You won't use `client` until the Deva starts in Step {{ life.step }}, but loading it now keeps both files in one place.

## 3. Build the info block

`info` is the Deva's own package information. Build it from your `package.json`, plus the folder this file is in and the agent's VLA from the top of the agent file:

```javascript
const info = {
	id: pkg.id,
	name: pkg.name,
	describe: pkg.description,
	version: pkg.version,
	copyright: pkg.copyright,
	dir: import.meta.dirname,
	VLA: Agent.VLA,
};
```

- `describe` is the one name that differs: `package.json` calls it `description`, the info block calls it `describe`.
- `dir` is the folder `index.js` lives in.
- `VLA` is the agent's own license, from the top level of `agent.json`, outside `DATA`. That's why it reads `Agent.VLA` and not `agent.VLA`. It's the license that gets compared later when something accesses this Deva. The client's VLA stays in the client file, and the core checks it when the Deva starts in Step {{ life.step }}.

## 4. Create the Deva

Pass `info`, the agent's identity fields, and the agent's vars:

```javascript
const hello = new Deva({
	info,
	agent: {
		id: agent.id,
		key: agent.key,
		prompt: agent.prompt,
		profile: agent.profile,
	},
	vars: agent.vars,
});

console.log(hello.vars.greeting);
console.log(hello.vars.context);
console.log(hello.status());
```

`vars: agent.vars` is how the greeting and context labels you wrote in the agent file become `hello.vars`. The Deva exists now, but it hasn't started. You'll start it with `init(client)` in [Step {{ life.step }}: {{ life.title }}]({{ life.permalink }}).

## The whole file

```javascript
import Deva from '{{ guide.package }}';
import pkg from './package.json' with {type:'json'};
import Agent from './data/agent.json' with {type:'json'};
import Client from './data/client.json' with {type:'json'};

const agent = Agent.DATA;
const client = Client.DATA;

const info = {
	id: pkg.id,
	name: pkg.name,
	describe: pkg.description,
	version: pkg.version,
	copyright: pkg.copyright,
	dir: import.meta.dirname,
	VLA: Agent.VLA,
};

const hello = new Deva({
	info,
	agent: {
		id: agent.id,
		key: agent.key,
		prompt: agent.prompt,
		profile: agent.profile,
	},
	vars: agent.vars,
});

console.log(hello.vars.greeting);
console.log(hello.vars.context);
console.log(hello.status());
```

Run it:

```bash
{{ guide.run }}
```

You should see:

```
Hello World
{ hello: '👋 Saying hello' }
⭕️ OFFLINE
```

The first two lines are the vars from your agent file. `⭕️ OFFLINE` is the right answer here: the Deva has been created but not started.

## If something goes wrong

| You see | What it means |
|---|---|
| `needs an import attribute of "type: json"` | An import is missing `with {type:'json'}`. |
| `Cannot find module` for `agent.json` or `client.json` | The path is wrong. The files live in `data/`, so the imports should be `./data/agent.json` and `./data/client.json`. |
| undefined instead of Hello World | vars: agent.vars is missing from new Deva. |
| Cannot read properties of undefined (reading 'greeting') | agent is the wrapper (Agent) instead of Agent.DATA. |
| `SyntaxError` in `agent.json` or `client.json` | The JSON isn't valid. Run the JSON check from Step 2 or Step 3 again. |

## What you did

{% for item in step.learn %}- {{ item }}
{% endfor %}

## Next

In **[Step {{ next.step }}: {{ next.title }}]({{ next.permalink }})** you'll add one func, one method and one listener, and see when to use each.
