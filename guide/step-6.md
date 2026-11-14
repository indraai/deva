---
layout: page
title: "Step 6: Bring it to life"
permalink: /guide/step-6/
description: Call init(client), watch the Deva reach ready, ask it a question, and read the stamped packet that comes back.
image: /assets/banner.png
---

{% assign guide = site.data.guide.DATA %}
{% assign step = guide.steps | where: "step", 6 | first %}
{% assign next = guide.steps | where: "step", 7 | first %}

{{ step.describe }}

In Step 5 your Deva had its skills, but it was still offline. In this step you'll start it with `init(client)`. When it reaches ready, it will answer `/hello Quinn` with the method and func you wrote, your listener will hear the question, and you'll check the three hashes stamped on the answer.

This step needs `{{ guide.package }}` version 1.64.70 or newer. To see which version you have installed, run:

```bash
npm ls {{ guide.package }}
```

## 1. Give the client a profile id

Open `data/client.json` and add an `id` as the first entry in `profile`. Use the same value as the client's `DATA.id`:

```json
"profile": {
  "id": "00000000000000000001",
  "name": "You",
  "fullname": "Your Full Name",
  "email": "you@example.com",
  "company": "Your Company",
  "describe": "The person talking to Hello Deva.",
  "lang": "en",
  "locale": "en-US",
  "currency": "USD"
},
```

The client's id now lives in two places, and each place has its own job:

- **`DATA.id`** is the id the Deva uses when it checks the client's data.
- **`DATA.profile.id`** travels with the client inside its profile. When a packet is signed, the signature's token is built from the client's profile, including this id. In the custom Devas you'll build later, this same id is the one that matches the Deva's VLA uid.

Nothing in this step reads the profile id yet, so you won't see it in the output. Adding it now means your client file is complete before the Deva starts.

## 2. Two licenses, two checks

You now have two VLAs in play. They do different jobs, so keep them separate:

- **The client's VLA** is `DATA.VLA` in `client.json`. The core checks it the moment you call `init(client)`, by comparing it with the VLA that ships with Deva Core. If they match, the client gets access to the core and the Deva starts. If they don't, the Deva stays offline.
- **The agent's VLA** is `Agent.VLA`, which you put into `info` in Step 4. Starting the Deva doesn't check it. It belongs to the Deva itself, and custom Devas compare it later, in their own `onInit`, when something accesses them. Your Hello Deva doesn't do that comparison.

## 3. What happens when you call init(client)

`init(client)` returns a Promise. Between the call and ready, the core does this, in order:

1. It checks the client's VLA, as described above.
2. It marks the Deva active, so `status()` stops answering `⭕️ OFFLINE`.
3. It binds your func, methods and listeners to the Deva, so `this` inside them is the Deva, and it connects your listeners to the event bus. This is the start-up that Step 5 told you about.
4. It reads the client's `features`, the block you wrote in Step 2.
5. It runs the start-up steps `start`, `enter`, `done` and `ready`, one after another.

**Ready** is the last start-up step. It means the Deva is fully started: it's active, its skills are bound, its listeners are connected, and it can answer questions. If you add an `onReady` hook, the core calls it at ready, and `init()` doesn't finish until the hook calls `resolve(data)`. That makes `onReady` the right place to do the Deva's first piece of work.

## 4. Add onReady

Add `onReady` to `new Deva()`, right after the `listeners` block:

```javascript
onReady(data, resolve) {
  const {key} = this.agent();
  console.log(this.status());
  console.log('ready hash:', this._config.hash[key]);
  this.question('/hello Quinn').then(packet => {
    console.log('answer:', packet.a.text);
    console.log('md5:', packet.md5);
    console.log('sha256:', packet.sha256);
    console.log('sha512:', packet.sha512);

    const check = this.lib.copy(packet);
    for (const algo of ['md5', 'sha256', 'sha512']) delete check[algo];
    for (const algo of ['md5', 'sha256', 'sha512']) {
      check[algo] = this.hash(check, algo);
      console.log(`${algo} matches:`, check[algo] === packet[algo]);
    }
    return resolve(data);
  });
},
```

The next three sections explain what each part does.

## 5. The ready hash

At ready, the core takes a sha256 hash of each of these parts of the Deva: `vars`, `utils`, `listeners`, `modules`, `func` and `methods`. For `func`, `methods`, `listeners` and `utils`, it hashes the source code of your functions as you wrote them. It stores the results under the agent's key, which is why the code reads `this._config.hash[key]`.

The ready hash is a **runtime marker**. It records what the Deva's skills looked like at the moment it became ready, so a later change can be detected by comparing against it. It is **not** an identity. Two Devas with exactly the same functions get exactly the same ready hash, and that is intended.

Anything added after ready isn't part of the ready hash. That's deliberate: the marker describes the Deva as it started.

Because the hash comes from your source code and vars, it stays the same every time you run the file. It changes only when you change one of those parts, even by a single space.

## 6. Ask a question

`this.question('/hello Quinn')` asks your Deva a question. The `/` at the start means "run my own method", so the core runs `methods.hello` with `Quinn` as `packet.q.text`. Along the way:

- The core sends the `devacore:question` event, so your listener prints `👂 heard: Quinn`.
- Your method calls your func, and the answer's text is `Hello World, and hello to Quinn.`

`question()` returns a Promise of the finished packet. The question is in `packet.q` and the answer is in `packet.a`.

## 7. Read and check the stamps

Every packet is stamped with three hashes: `md5`, `sha256` and `sha512`. Each hash is a base64 digest of the packet written out as JSON. The question (`packet.q`) and the answer (`packet.a`) each carry their own three stamps, and the whole packet carries three more. The code prints the whole packet's stamps.

The three tiers are deliberate, and each has its own use:

- **md5** is the fast, everyday check, for civilian verification.
- **sha256** is the stronger check, for government and authority verification.
- **sha512** is the strongest check, for military, agency and legal high-security use.

The stamps are added in that order, and each one covers the ones before it. md5 is taken over the packet. sha256 is taken over the packet with md5 already in it. sha512 is taken over the packet with md5 and sha256 already in it.

The second half of `onReady` checks the stamps the same way. It makes a clean copy of the packet with `this.lib.copy()`, removes the three stamps from the copy, and then rebuilds them one at a time in the same order with `this.hash()`. If the packet hasn't been changed since it was stamped, all three match.

Every packet has its own ids and times, so these hashes are different on every run. That's expected.

## 8. Start the Deva

Replace the six `console.log` lines at the bottom of the Step 5 file with these:

```javascript
console.log(hello.status());
await hello.init(client);
console.log(hello.status());
```

The first line shows the Deva is offline before it starts. `await hello.init(client)` starts it and waits until `onReady` calls `resolve(data)`. The last line shows it's still active afterward.

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
  func: {
    greet(name) {
      if (!name) return `${this.vars.greeting}.`;
      return `${this.vars.greeting}, and hello to ${name}.`;
    },
  },
  methods: {
    hello(packet) {
      this.context('hello', packet.q.text);
      return new Promise(resolve => {
        const text = this.func.greet(packet.q.text);
        return resolve({
          text,
          html: `<p>${text}</p>`,
          data: {
            greeting: this.vars.greeting,
            name: packet.q.text,
          },
        });
      });
    },
  },
  listeners: {
    'devacore:question'(packet) {
      console.log(`👂 heard: ${packet.q.text}`);
    },
  },
  onReady(data, resolve) {
    const {key} = this.agent();
    console.log(this.status());
    console.log('ready hash:', this._config.hash[key]);
    this.question('/hello Quinn').then(packet => {
      console.log('answer:', packet.a.text);
      console.log('md5:', packet.md5);
      console.log('sha256:', packet.sha256);
      console.log('sha512:', packet.sha512);

      const check = this.lib.copy(packet);
      for (const algo of ['md5', 'sha256', 'sha512']) delete check[algo];
      for (const algo of ['md5', 'sha256', 'sha512']) {
        check[algo] = this.hash(check, algo);
        console.log(`${algo} matches:`, check[algo] === packet[algo]);
      }
      return resolve(data);
    });
  },
});

console.log(hello.status());
await hello.init(client);
console.log(hello.status());
```

Run it:

```bash
{{ guide.run }}
```

You should see something like this:

```
⭕️ OFFLINE
Hello Deva active since Friday, November 13, 2026 - 9:42:47 PM
ready hash: {
  vars: 'rDSWWf9z7T32eW+iR+hmpovAlKg00WLgPZHL5lX8Jiw=',
  utils: 'RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=',
  listeners: 'ai+uM2sU+GbXlo68vVrH8JGVJ8rkSiBm5DI//ggURGg=',
  modules: 'RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o=',
  func: 'OjSeCqlVjcdUbiGmeGrNh5Hv90nk+nQ6KCxTUjR3+FI=',
  methods: '2YKySno+VMvwOxFVjNfhq7IOROUVA6sDqadLWSanDps='
}
👂 heard: Quinn
answer: Hello World, and hello to Quinn.
md5: Q7x+PAHoCAhSd906szu7tg==
sha256: vPMMSg4EEQ+6spWyx7mBshcAA/j0jM6MckHlabHyQpQ=
sha512: uSlWv/ndZ9M+2TQiuQKvTMCyGh57NbvFrH9EbwiWQ6WqaogQD0TQcyPzR/YYo5HWpLAD8CES7r5AZnprgB49Vg==
md5 matches: true
sha256 matches: true
sha512 matches: true
Hello Deva active since Friday, November 13, 2026 - 9:42:47 PM
```

Some of this will be different for you:

- **The date and time** after `active since` are when you started the Deva.
- **The md5, sha256 and sha512 values** change on every run, because every packet has its own ids and times.
- **The ready hash** stays the same from run to run. It matches the values above only if your vars and your func, methods and listeners are exactly the same as on this page, down to the spacing. `utils` and `modules` show the same value because both are empty.

These lines should always be the same: `⭕️ OFFLINE` first, `👂 heard: Quinn`, `answer: Hello World, and hello to Quinn.`, and `true` on all three `matches` lines.

## If something goes wrong

| You see | What it means |
|---|---|
| `Cannot read properties of undefined (reading 'hash')` | Your installed `{{ guide.package }}` is older than 1.64.70. This step needs version 1.64.70 or newer. Check with `npm ls {{ guide.package }}`. |
| `Cannot create property 'created' on boolean 'false'` | `info` is missing from `new Deva()`. Make sure `info,` is the first entry. |
| `Cannot read properties of undefined (reading 'warning')` | `agent` is the whole agent file instead of what's inside it. It should be `const agent = Agent.DATA;`. |
| Only two `⭕️ OFFLINE` lines, and nothing else | The client's VLA didn't pass the check at `init(client)`, so the Deva never started. To see why, change the line to `console.log(await hello.init(client));`. `❌ Bad Personal VLA` means the client file has no `VLA`. `❌ Invalid VLA Check` means the client's VLA doesn't exactly match the one that ships with Deva Core. Copy it again as shown in Step 2. |
| The program ends without `👂 heard: Quinn` or `answer:` | `onReady` is missing or misspelled. It must be named exactly `onReady`. |
| A `matches` line says `false` | The packet was changed after it was stamped, or the stamps were rebuilt in a different order. Rebuild them in the order md5, sha256, sha512. |

## What you did

{% for item in step.learn %}- {{ item }}
{% endfor %}

## Next

In **[Step {{ next.step }}: {{ next.title }}]({{ next.permalink }})** you'll stop the Deva cleanly with `stop()` and see what it answers once it's offline.
