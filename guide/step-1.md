---
layout: page
title: "Step 1: Set up the project"
permalink: /guide/step-1/
description: Create the project folder, set it up as an ES module, install Deva Core, and lay out the files you will fill in.
image: /assets/banner.png
---

{% assign guide = site.data.guide.DATA %}
{% assign step = guide.steps | where: "step", 1 | first %}
{% assign next = guide.steps | where: "step", 2 | first %}

{{ step.describe }}

## 1. Check your tools

Deva Core needs Node.js {{ guide.node }} or newer and npm {{ guide.npm }} or newer. Check what you have:

```bash
node -v
npm -v
```

If either version is older, update Node.js from [nodejs.org](https://nodejs.org) before you go on. npm comes with it.

## 2. Create the project folder

```bash
mkdir {{ guide.project }}
cd {{ guide.project }}
npm init -y
```

`npm init -y` creates a `package.json` with default values. You can change the name, description and author in it later.

## 3. Set it up as an ES module

Deva Core is an ES module, and {{ guide.deva }} will use `import` to load Deva Core and its JSON files. Tell Node that your project uses modules too:

```bash
npm pkg set type=module
```

This adds `"type": "module"` to your `package.json`.

## 4. Install Deva Core

```bash
{{ guide.install }}
```

Deva Core has no dependencies of its own, so this installs a single package.

To check that it installed and loads, run:

```bash
node --input-type=module -e "import Deva from '{{ guide.package }}'; console.log(typeof Deva);"
```

You should see:

```
function
```

## 5. Lay out the files

Create the main file and a `data` folder for the two JSON files you will write next:

```bash
mkdir data
touch index.js data/client.json data/agent.json
```

On Windows, create the `data` folder and the three empty files in your editor instead of using `touch`.

Your project now looks like this (`node_modules` and `package-lock.json` are left out):

```
{% for line in guide.tree %}{{ line }}
{% endfor %}```

Your `package.json` should include these two entries. The version number may be newer than the one shown:

```json
"type": "module",
"dependencies": {
	"{{ guide.package }}": "^1.64.72"
}
```

## What you did

{% for item in step.learn %}- {{ item }}
{% endfor %}

## Next

The files are empty for now. In **[Step {{ next.step }}: {{ next.title }}]({{ next.permalink }})** you'll fill in `client.json`, which describes who is talking to your Deva.
