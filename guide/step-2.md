---
layout: page
title: "Step 2: The client file"
permalink: /guide/step-2/
description: Write client.json, which describes who is talking to the Deva.
image: /assets/banner.png
---

{% assign guide = site.data.guide.DATA %}
{% assign step = guide.steps | where: "step", 2 | first %}
{% assign next = guide.steps | where: "step", 3 | first %}
{% assign life = guide.steps | where: "step", 6 | first %}

{{ step.describe }}

Every Deva talks to someone. That someone is the **client**: you, another program, or another Deva. The client file tells {{ guide.deva }} who you are, which license you agreed to, and how each feature should treat you. You pass it to the Deva when you start it in [Step {{ life.step }}: {{ life.title }}]({{ life.permalink }}).

## 1. The wrapper

Every Deva data file uses the same outer shape. Open `data/client.json` and start with this:

```json
{
  "name": "CLIENT",
  "describe": "Hello Deva client file",
  "copyright": "Copyright ©2026 Your Name; All rights reserved.",
  "DATA": {
  }
}
```

The `name`, `describe` and `copyright` fields describe the file itself. Everything the Deva reads goes inside `DATA`.

## 2. Identity

Inside `DATA`, add an `id` and a `key`:

```json
"id": "00000000000000000001",
"key": "you",
```

- `id` is a unique id for this client.
- `key` is a short name the Deva uses to refer to you.

## 3. The license (VLA)

Deva Core is distributed under the Vedic License Agreement (VLA). Before a Deva starts, it checks that the client carries the **exact** VLA record that ships with Deva Core. If anything in it is missing or changed, the Deva won't start.

Print the VLA record from your installed copy of Deva Core:

```bash
node -e "console.log(JSON.stringify(require('./node_modules/{{ guide.package }}/package.json').VLA, null, 2))"
```

Copy the whole object it prints into `DATA` as `"VLA"`:

```json
"VLA": {
  "uid": "31711622713594414221",
  "time": 1793599499238,
  "iso": "2026-11-02T06:04:59.238Z",
  "utc": "Mon, 02 Nov 2026 06:04:59 GMT",
  "date": "Sunday, November 1, 2026 - 10:04:59 PM",
  "license": "72443233535603396055",
  "fingerprint": "zzMBZpU94qrbpev4Qht/sUkyT8D99Tsy7VZYmaAlVnE=",
  "client": "Q9dobkaWSoReFRaX7A3/nVU1O4hm5brd9RtV1pmZ3Fo=",
  "agent": "vcXZCwDVqcr3kx8TLmt6HmxQbvi9u7ru4uOuFsmu86g=",
  "machine": "mZE0ISwPqtlxfv15ffcdGLGDuv/PXxsAz0aM6n0swaU=",
  "core_hash": "JJ11NWZU3gE0heHMR15vc2fDrIhbDxUxqoFkOYr1j0I=",
  "status": "vedic",
  "warning": "🪪 License Deva declares UNLAWFUL USE, MODIFICATION, INSTALLATION, DUPLICATION, DISTRIBUTION, INTERACTION, or IMPLEMENTATION constitutes VEDIC SAHASA a CRIME of the HIGHEST DEGREE. A FINE amounting to 1000 PANAS (1 pana = 3.5 grams of gold) for each INSTANCE has been ORDAINED the PUNISHMENT for SAHASA of the HIGHEST DEGREE.",
  "notice": "Any USE or INTERACTION with License Deva constitutes EXPLICIT CONSENT and AGREEMENT to be GOVERNED ACCORDING to the LAWS of the VEDIC RELIGION and The United States of America.",
  "vectors": "#Quinn #QuinnMichaels #InsideTheNet #IndraAI #DEVA #DevaWorld #DevaCloud #DevaSpace #License #LicenseDeva #VedicLicenseAgreement",
  "owner": "Quinn Michaels",
  "creator": "Quinn Michaels",
  "salute": "🤝🫡🪪🕉🇺🇸",
  "copyright": "Copyright ©2000-2026 Quinn Michaels; All rights reserved.",
  "md5": "Nyx04ZFTi9GasJKyyeu/1w==",
  "sha256": "nK9Po2wQi4J5wxEl8z0oUaZnYxtRoSnRrArcjE8EE54=",
  "sha512": "w/VOPKO2Ynnpw4EIWsJYht4Tyu90a8CgRTNkqWE5JTu6C+zz16gHPDcpy4rcg48G+yYKB+RbaDeu4E5mwqxNMQ=="
},
```

Read the [VLA](/vla/) page to see what you're agreeing to.

## 4. Prompt

`prompt` controls how your messages look when they're printed, with an emoji, a label and colors as RGB values:

```json
"prompt": {
  "emoji": "🙂",
  "text": "you",
  "colors": {
    "label": {"R": 2, "G": 229, "B": 77},
    "text": {"R": 2, "G": 229, "B": 77}
  }
},
```

## 5. Profile

`profile` describes the person behind the client:

```json
"profile": {
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

## 6. Features

Deva Core has ten built-in features: license, error, log, data, report, legal, security, support, services and systems. When a Deva starts, it reads your settings for each of them from the client file. If a feature or one of its lists is missing, the Deva fills in a default message like `⛔️ NO CONCERNS PROVIDED` and keeps going, so it's best to list all ten, even empty, and know exactly what each one holds.

Each feature has three lists:

- `concerns` are things this feature should watch for with you.
- `global` holds rules that apply to every Deva.
- `devas` holds rules for specific Devas, keyed by each Deva's `key`.

Start with all ten empty:

```json
"features": {
  "license":  {"concerns": [], "global": [], "devas": {}},
  "error":    {"concerns": [], "global": [], "devas": {}},
  "log":      {"concerns": [], "global": [], "devas": {}},
  "data":     {"concerns": [], "global": [], "devas": {}},
  "report":   {"concerns": [], "global": [], "devas": {}},
  "legal":    {"concerns": [], "global": [], "devas": {}},
  "security": {"concerns": [], "global": [], "devas": {}},
  "support":  {"concerns": [], "global": [], "devas": {}},
  "services": {"concerns": [], "global": [], "devas": {}},
  "systems":  {"concerns": [], "global": [], "devas": {}}
}
```

## The whole file

Put together, `data/client.json` looks like this, with your VLA record in place of the `...`:

```json
{
  "name": "CLIENT",
  "describe": "Hello Deva client file",
  "copyright": "Copyright ©2026 Your Name; All rights reserved.",
  "DATA": {
    "id": "00000000000000000001",
    "key": "you",
    "VLA": {
      "uid": "31711622713594414221",
      "time": 1793599499238,
      "iso": "2026-11-02T06:04:59.238Z",
      "utc": "Mon, 02 Nov 2026 06:04:59 GMT",
      "date": "Sunday, November 1, 2026 - 10:04:59 PM",
      "license": "72443233535603396055",
      "fingerprint": "zzMBZpU94qrbpev4Qht/sUkyT8D99Tsy7VZYmaAlVnE=",
      "client": "Q9dobkaWSoReFRaX7A3/nVU1O4hm5brd9RtV1pmZ3Fo=",
      "agent": "vcXZCwDVqcr3kx8TLmt6HmxQbvi9u7ru4uOuFsmu86g=",
      "machine": "mZE0ISwPqtlxfv15ffcdGLGDuv/PXxsAz0aM6n0swaU=",
      "core_hash": "JJ11NWZU3gE0heHMR15vc2fDrIhbDxUxqoFkOYr1j0I=",
      "status": "vedic",
      "warning": "🪪 License Deva declares UNLAWFUL USE, MODIFICATION, INSTALLATION, DUPLICATION, DISTRIBUTION, INTERACTION, or IMPLEMENTATION constitutes VEDIC SAHASA a CRIME of the HIGHEST DEGREE. A FINE amounting to 1000 PANAS (1 pana = 3.5 grams of gold) for each INSTANCE has been ORDAINED the PUNISHMENT for SAHASA of the HIGHEST DEGREE.",
      "notice": "Any USE or INTERACTION with License Deva constitutes EXPLICIT CONSENT and AGREEMENT to be GOVERNED ACCORDING to the LAWS of the VEDIC RELIGION and The United States of America.",
      "vectors": "#Quinn #QuinnMichaels #InsideTheNet #IndraAI #DEVA #DevaWorld #DevaCloud #DevaSpace #License #LicenseDeva #VedicLicenseAgreement",
      "owner": "Quinn Michaels",
      "creator": "Quinn Michaels",
      "salute": "🤝🫡🪪🕉🇺🇸",
      "copyright": "Copyright ©2000-2026 Quinn Michaels; All rights reserved.",
      "md5": "Nyx04ZFTi9GasJKyyeu/1w==",
      "sha256": "nK9Po2wQi4J5wxEl8z0oUaZnYxtRoSnRrArcjE8EE54=",
      "sha512": "w/VOPKO2Ynnpw4EIWsJYht4Tyu90a8CgRTNkqWE5JTu6C+zz16gHPDcpy4rcg48G+yYKB+RbaDeu4E5mwqxNMQ=="  
    },
    "prompt": {
      "emoji": "🙂",
      "text": "you",
      "colors": {
        "label": {"R": 2, "G": 229, "B": 77},
        "text": {"R": 2, "G": 229, "B": 77}
      }
    },
    "profile": {
      "name": "You",
      "fullname": "Your Full Name",
      "email": "you@example.com",
      "company": "Your Company",
      "describe": "The person talking to Hello Deva.",
      "lang": "en",
      "locale": "en-US",
      "currency": "USD"
    },
    "features": {
      "license":  {"concerns": [], "global": [], "devas": {}},
      "error":    {"concerns": [], "global": [], "devas": {}},
      "log":      {"concerns": [], "global": [], "devas": {}},
      "data":     {"concerns": [], "global": [], "devas": {}},
      "report":   {"concerns": [], "global": [], "devas": {}},
      "legal":    {"concerns": [], "global": [], "devas": {}},
      "security": {"concerns": [], "global": [], "devas": {}},
      "support":  {"concerns": [], "global": [], "devas": {}},
      "services": {"concerns": [], "global": [], "devas": {}},
      "systems":  {"concerns": [], "global": [], "devas": {}}
    }
  }
}
```

Check that the file is valid JSON:

```bash
node -e "JSON.parse(require('fs').readFileSync('data/client.json')); console.log('client.json ok')"
```

You should see:

```
client.json ok
```

## If something goes wrong later

You'll find out whether the client file works when you start the Deva. A bad license stops the Deva from starting:

| You see | What it means |
|---|---|
| `❌ Bad Personal VLA` | The client file has no `VLA`. |
| `❌ Invalid VLA Check` | The `VLA` was changed or only partly copied. Copy it again, unchanged. |

Missing client settings don't stop the Deva. It fills them in with default messages, so if you see one of these in a feature, that's the part of `client.json` to fill in:

| Default message | What's missing |
|---|---|
| `⛔️ NO NAME PROVIDED` | `profile.name` |
| `⛔️ NO CONCERNS PROVIDED` | a feature's `concerns` |
| `⛔️ NO GLOBAL PROVIDED` | a feature's `global` |
| `⛔️ NO DEVAS PROVIDED` | a feature's `devas` |

## What you did

{% for item in step.learn %}- {{ item }}
{% endfor %}

## Next

In **[Step {{ next.step }}: {{ next.title }}]({{ next.permalink }})** you'll write `agent.json`, which describes who your Deva is.
