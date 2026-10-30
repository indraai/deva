---
layout: page
title: Deva Core
---

**A Vedic-inspired, event-based framework for building integrated AI agents in Node.js.**

Deva Core is the base of every Deva. Each agent is one `Deva` class instance on a shared event bus. As it works, it moves through named features, zones, actions, states, intents, beliefs and contexts, and it announces every step as an event. Every data packet it builds is stamped with cumulative md5, sha256 and sha512 hashes, so you can verify what happened and in what order.

```bash
npm install @indra.ai/deva
```

Node.js 22 or later. ES modules only.

## Start here

- [Read the documentation](/docs/), with install, a working quick start, the lifecycle, messaging between Devas, the packet, hashing, events and the method reference.
- [Deva Core on GitHub](https://github.com/indraai/deva), where the code, the issues and the examples live.
- [`@indra.ai/deva` on npm](https://www.npmjs.com/package/@indra.ai/deva), for the published package.

## What it gives you

- **A shared event bus.** Devas talk to each other with `question`, `answer`, `ask`, `talk` and `listen`. Asks time out instead of hanging.
- **A named workflow.** Features, zones, actions, states, intents, beliefs and contexts are first-class data, and you can read each one back stamped.
- **Stamped packets.** The md5, sha256 and sha512 tiers build on each other, in order, on every packet.
- **Your own methods.** Add agent methods, listeners and extra workflow names through the constructor, and the Core merges them with its own.

## License

Deva Core is distributed under the **Vedic License Agreement (VLA)**. Read the [license](https://github.com/indraai/deva/blob/main/LICENSE.md) before you use it.

Created by Quinn Arjuna America Michaels. [indra.ai](https://indra.ai)
