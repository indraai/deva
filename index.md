---
layout: home
title: Deva Core
headline: Agents that keep a verifiable record of every step.
description: A Vedic-based, event-driven Node.js framework for building integrated AI agents, with stamped, verifiable data on every step.
image: /assets/banner.png
features:
  - title: A shared event bus
    text: Devas talk with question, answer, ask, talk and listen. Asks time out instead of hanging.
    url: /docs/#messaging
    link: Messaging
  - title: A named workflow
    text: Features, zones, actions, states, intents, beliefs and contexts are first-class data you can read back stamped.
    url: /core/
    link: Core reference
  - title: Stamped packets
    text: Cumulative md5, sha256 and sha512 tiers on every packet, so you can verify what happened and in what order.
    url: /docs/#stamping-and-the-hash-tiers
    link: Hash tiers
  - title: Tested in the open
    text: Node's built-in test runner, no extra dependencies, run on Node 22 and 24 on every push.
    url: /tests/
    link: Test suites
---

## How it works

Each agent is one `Deva` class instance on a shared event bus. As it works, it moves through named features, zones, actions, states, intents, beliefs and contexts, and it announces every step as an event. Every data packet it builds is stamped with cumulative md5, sha256 and sha512 hashes.

Node.js 22 or later. ES modules only.

## Start here

- [Read the documentation](/docs/), with install, a working quick start, the lifecycle, messaging between Devas, the packet, hashing, events and the method reference.
- [Make a new Deva with Deva Buddy](/buddy/), which asks a few questions and builds a ready-to-run Deva with its data, a stub client, help files and a starter test.
- [Build your first Deva](/guide/), a step-by-step guide from an empty folder to a working Deva with a skill, a method and a listener, then a clean shutdown.
- [Deva Core on GitHub](https://github.com/indraai/deva), where the code, the issues and the examples live.
- [`@indra.ai/deva` on npm](https://www.npmjs.com/package/@indra.ai/deva), for the published package.

## Working with a team

Building a multi-agent system and want help with the design, the audit trail or a commercial license? Email [quinn@indra.ai](mailto:quinn@indra.ai). Read the [VLA](/vla/) first.

Created by Quinn Michaels. [indra.ai](https://indra.ai)
