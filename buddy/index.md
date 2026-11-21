---
layout: page
title: Deva Buddy
permalink: /buddy/
description: Deva Buddy asks a few questions and builds a new Deva for you, with its data file, a stub client, help files, assets and a starter test, ready to run.
image: /assets/banner.png
---

{% assign buddy = site.data.buddy.DATA %}

{{ page.description }}

Deva Buddy comes with Deva Core. It's a small Deva itself, so it walks the same path as every other Deva: it comes online, asks its questions, copies the template, and fills in your answers.

## What you need

- **Node.js and npm**, the same versions the [Guide](/guide/) uses.
- A project set up as an ES module, with Deva Core installed:

```bash
mkdir my-devas
cd my-devas
npm init -y
npm pkg set type=module
npm install @indra.ai/deva
```

Buddy needs no other packages.

When Buddy builds a Deva, it copies the Deva Core VLA into your project's `package.json`, because the new Deva reads its VLA from there and won't pass its license check without one. If your `package.json` already has a `VLA`, Buddy keeps it.

## Run Buddy

From your project folder, run:

```bash
npx deva-buddy
```

If you're working inside a copy of the Deva Core repository instead, run:

```bash
npm run buddy
```

Buddy prints its banner and version, comes online with `⭐️ READY`, and then asks its questions one at a time.

## The questions

Press Enter to keep the default shown in brackets. **Key** and **Name** have no default, so you must answer them.

| Question | Default | What it's for |
|---|---|---|
{% for q in buddy.vars.questions %}| **{{ q.message }}** | {% if q.default != "" %}`{{ q.default }}`{% else %}none{% endif %} | {% case q.name %}{% when "key" %}The Deva's key. It names the folder, the agent key, the prompt text and the constant in `index.js`.{% when "vector" %}The Vector the Deva belongs to, saved in its profile.{% when "name" %}The Deva's display name, used in its files, help and tests.{% when "describe" %}A short description, saved in its profile.{% when "pronouns" %}Saved in its profile.{% when "gender" %}Saved in its profile.{% when "owner" %}The owner and creator, used in the profile and the copyright lines. Type your own name here.{% endcase %} |
{% endfor %}| **DIRECTORY** | `devas` in the folder you ran Buddy from | Where Buddy puts the new Deva. It creates this folder if it's missing. |

### Key rules

The key must be **lowercase letters and numbers, starting with a letter**. No spaces, dashes, dots or capitals. Buddy checks this because the key becomes the folder name and the name you import the Deva by.

| Key | OK? |
|---|---|
| `hello` | Yes |
| `hello2` | Yes |
| `Hello` | No, capital letter |
| `hello-world` | No, dash |
| `2hello` | No, starts with a number |

Also skip JavaScript reserved words such as `class`, `default` or `import`. Buddy accepts them, but the import line it prints won't run.

The Name can be anything you like, including spaces and accented letters.

## A full run

🪪 Added the Deva Core VLA to /home/you/my-devas/package.json

Here's a real run that builds a Deva called **Hello Deva** with the key `hello`. Your paths, version and date will be your own.

```
⭐️ READY
Key: hello
Vector: Ether
Name: Hello Deva
Describe: My first Deva
Pronouns (they/them): 
Gender (DEVA): 
Owner (Quinn Michaels): Your Name
DIRECTORY (/home/you/my-devas/devas): 
::::::::::::::::::::::::::::
👽 DEVA
↪ KEY: hello
↪ VECTOR: Ether
↪ NAME: Hello Deva
↪ DESCRIBE: My first Deva
↪ PRONOUNS: they/them
↪ GENDER: DEVA
↪ OWNER: Your Name
↪ DIRECTORY: /home/you/my-devas/devas
::::::::::::::::::::::::::::
📁 QUE FILES
↪ fr: /home/you/my-devas/node_modules/@indra.ai/deva/buddy/template
↪ to: /home/you/my-devas/devas/hello
✅ QUE FILES COMPLETE
📁 /home/you/my-devas/devas/hello
📁 /home/you/my-devas/devas/hello/assets
📁 /home/you/my-devas/devas/hello/data
📁 /home/you/my-devas/devas/hello/help
📝 /home/you/my-devas/devas/hello/assets/avatar.png
📝 /home/you/my-devas/devas/hello/assets/background.png
📝 /home/you/my-devas/devas/hello/assets/emoji.png
📝 /home/you/my-devas/devas/hello/assets/image.png
📝 /home/you/my-devas/devas/hello/data/client.json
📝 /home/you/my-devas/devas/hello/data/index.json
📝 /home/you/my-devas/devas/hello/help/corpus.feecting
📝 /home/you/my-devas/devas/hello/help/main.feecting
📝 /home/you/my-devas/devas/hello/index.js
📝 /home/you/my-devas/devas/hello/index.test.js
✅ DEVA CREATED: hello (Hello Deva)
👉 Add hello to your Deva loader: import hello from './hello/index.js';
```

## Send the answers in one go

Buddy also reads answers piped in, one per line, in the same order as the questions. A blank line keeps the default. This is handy for scripts and bots:

```bash
printf 'hello\nEther\nHello Deva\nMy first Deva\n\n\nYour Name\n\n' | npx deva-buddy
```

The lines are Key, Vector, Name, Describe, Pronouns, Gender, Owner and Directory. Buddy prints each answer next to its question so the run reads the same as a typed one.

## What Buddy builds

```
devas/
	hello/
		index.js
		index.test.js
		data/
			index.json
			client.json
		help/
			main.feecting
			corpus.feecting
		assets/
			avatar.png
			background.png
			emoji.png
			image.png
```

| File | What it is |
|---|---|
| `index.js` | The Deva itself, exported as `HELLO`. It has `info`, `agent`, `vars`, three utils that trim input, empty `listeners`, `modules`, `devas`, `func` and `methods`, plus `onReady` and `onError`. This is where you start building. |
| `index.test.js` | The starter test. See [Test it first](#test-it-first). |
| `data/index.json` | The agent and vars: key, a new id, prompt colors, the profile with your answers, and the lifecycle messages and contexts. |
| `data/client.json` | A stub client for testing, already carrying this Deva Core's VLA so the license check passes. See [The stub client](#the-stub-client). |
| `help/main.feecting` | The main help page. |
| `help/corpus.feecting` | The help corpus. |
| `assets/` | Placeholder images for the emoji, avatar, image and background in the profile. Swap in your own. |

Every text file gets your answers filled in: the key, name, owner, description, Vector, pronouns, gender, a new id, the year, the date, and the VLA number in the copyright header. The images are copied as they are.

`index.js` reads your project's `package.json` from two folders up, so keep the Deva at `devas/<key>/` under the folder that holds `package.json`, which is where Buddy puts it by default.

## Test it first

Run the starter test right after Buddy finishes, before you change anything:

```bash
node --test devas/hello/index.test.js
```

You should see six passing tests:

```
✔ hello builds as a Deva and waits offline before init
✔ hello data has no placeholders left from the build
✔ hello comes online and walks to ready
✔ hello agent matches the build
✔ hello utils answer with trimmed text
✔ hello stops through the full chain
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

| Test | What it checks |
|---|---|
| Builds and waits offline | The export is a Deva and reports offline before `init`. |
| No placeholders left | `data/index.json` and `data/client.json` have no `::name::` style placeholders left over. |
| Comes online | `init` walks start, enter, done and ready in order, each packet carries a uid and md5, sha256 and sha512 hashes, and the ready prompt arrives. |
| Agent matches | The agent key, name and owner match what you typed. |
| Utils | The three utils return trimmed text. |
| Stops | `stop` walks the full chain and ends on `shutdown`, with the key as its value. |

Six passes means the Deva is clean and you can start building. Run it again whenever you change something, and add your own tests to the same file as the Deva grows.

To test several Devas, list the files rather than the folder:

```bash
node --test devas/hello/index.test.js devas/other/index.test.js
```

## Load it

Buddy's last line tells you the import to add to your Deva loader. If you don't have a loader yet, create `devas/index.js`:

```js
import hello from './hello/index.js';
export default {hello};
```

Then bring the Deva online from a file in your project folder, such as `run.js`:

```js
import devas from './devas/index.js';
import Client from './devas/hello/data/client.json' with {type:'json'};

const {hello} = devas;
hello.listen('devacore:prompt', packet => console.log(packet.text));
await hello.init(structuredClone(Client.DATA));
console.log(hello.uid().uid);
await hello.stop();
```

```bash
node run.js
```

Pass `Client.DATA` to `init`, not the whole file. The file wraps the client in a `DATA` key, the same way every Deva data file does.

## The stub client

`data/client.json` is there so the new Deva can come online and pass its tests straight away. Buddy fills in its VLA from the Deva Core you ran it with, which is what the license check compares.

It's only a stub. For real work, replace it with your own client file and add that file to `.gitignore`, so your license details never leave your computer.

## When Buddy stops

Buddy never writes over existing work. If something is wrong, it stops before creating anything and tells you why:

| Message | Why | Fix |
|---|---|---|
| `{{ buddy.vars.messages.incomplete }}` | Key or Name was blank, or a pipe ran out of lines. | Run Buddy again and answer both. |
| `{{ buddy.vars.messages.badkey }}` | The key has capitals, spaces, dashes or other characters, or starts with a number. | Use lowercase letters and numbers, starting with a letter. See [Key rules](#key-rules). |
| `{{ buddy.vars.messages.exists }} <folder>` | A Deva with that key is already in that directory. | Pick another key or another directory. Buddy leaves the existing folder alone. |

## Next

New to Devas? The [Guide](/guide/) walks through every part of a Deva by hand, the same parts Buddy builds for you.
