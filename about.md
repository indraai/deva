---
layout: page
title: About
permalink: /about/
---

Deva Core is a small, dependency-free Node.js framework for building software agents ("Devas") that work as a team on a shared event bus, describe everything they do in plain named steps, and stamp every packet of data they produce so it can be verified later.

It is written and maintained by Quinn Arjuna America Michaels, and it has been in development for more than ten years. It is the base that the other Deva modules build on.

## 1. What Deva Core is

- **A framework for agents.** Each agent is one `Deva` instance. You give it an identity, some methods, and the listeners it should react to.
- **An event bus.** Every Deva announces what it is doing as an event. Other Devas, loggers, dashboards and tests can listen to those events without the Deva knowing about them.
- **A named workflow.** While it works, a Deva moves through named features, zones, actions, states, intents, beliefs and contexts. Each step is recorded as data you can read back, so you can see what happened and why.
- **A record you can verify.** Every packet it builds is stamped with three cumulative hashes (md5, sha256 and sha512), so you can check later that the data has not changed since it was stamped.

## 2. What it does

| Capability | What it means for you |
|---|---|
| **Agent lifecycle** | Every Deva starts, enters, runs, finishes and shuts down through the same steps, and you can hook any step with your own code. |
| **Messaging between Devas** | Devas ask each other questions and get answers back. Asks have a timeout, so a Deva that never answers does not hang the caller. |
| **Workflow records** | Features, zones, actions, states, intents, beliefs and contexts are first-class data you can list, read and stamp. |
| **Stamped packets** | Three hash tiers, md5, sha256 and sha512, built on each other in order, on every packet. |
| **Client policy** | A client object carries the policies and concerns for the work (license, security, data, reporting, and others). Each Deva stores the part that applies to it. |
| **Child Devas** | A Deva can host other Devas, start them, and pass its context down to them. |
| **Your own code** | Methods, listeners, utilities and extra workflow names are added through the constructor and merged with the Core's own. |

## 3. How it fits together

1. **Create** a `Deva` with an identity, a client and your own methods.
2. **Initialize** it. The Core checks the client's license, loads the client's policies, and brings the Deva online.
3. **Work.** Your Deva answers questions, asks other Devas, and emits events as it goes. Each answer is wrapped in a stamped packet.
4. **Observe.** Anything that listens to the bus sees every step, in order.
5. **Stop** cleanly. Listeners and pending asks are removed and the Deva goes offline.

## 4. Where it can be used

These are ideas for where the design fits, not a list of finished products.

- **Auditable AI assistants.** A team of agents where every step and every answer is recorded and can be verified afterwards.
- **Workflow and automation services.** Specialist agents, one for each job (intake, review, reporting), passing work to each other over the bus.
- **Compliance-minded back offices.** Services that need to show what was decided, when, and with what data, such as document handling, approvals and reporting.
- **Multi-agent research and analysis.** A coordinator Deva that asks other Devas for parts of an answer and gathers the results.
- **Monitoring and observability.** Listener-only Devas that watch events from other Devas and raise reports or alerts.
- **Education and simulation.** Agents with named states, intents and beliefs make behavior easy to inspect and explain.
- **A base for your own Deva modules.** Build a specialist module on the Core and reuse it across products.

## 5. What a decision maker should know

**Technical fit**

- **Runtime:** Node.js 22 or later, npm 9.5.1 or later. ES modules only.
- **Dependencies:** none beyond Node.js itself. The Core's own code makes no network calls, and anything that reaches outside your system is code you add.
- **Size:** one main class in a single file, plus JSON configuration. It is small enough for a team to read in full.
- **Built-in helpers:** the Core's `lib` gives your Devas file, operating system and process helpers (including `exec` and `spawn`) and encrypt and decrypt functions. Treat a Deva as trusted code that runs with your process's permissions, and review how you use these helpers.
- **Integration:** it is a library inside your own process, not a hosted service. You decide how to deploy it, where it logs, and what it connects to.
- **Package:** [`@indra.ai/deva`](https://www.npmjs.com/package/@indra.ai/deva) on npm, source on [GitHub](https://github.com/indraai/deva).

**Integrity and records**

- The hash tiers give you a way to check that a packet has not changed since it was stamped. They are integrity checks. The hashes are not encryption and they are not digital signatures, so decide separately how to store and protect the data.
- Because every step is a named event, you can send the full event stream to your own log, audit or monitoring system.

**Licensing**

- Deva Core is distributed under the **Vedic License Agreement (VLA)**, owned by Quinn Arjuna America Michaels and distributed through License Deva.
- Every client must present a VLA that matches the one in the Core. Without it, the Core will not start.
- The license limits modification, redistribution, derivative works, and official, government or commercial use unless the Owner has verified and authorized it. **A company planning commercial use should contact the Owner first and have the authorization in writing.** Read the full [license](https://github.com/indraai/deva/blob/main/LICENSE.md) before you evaluate the Core.

**Maturity and support**

- The Core is on the 1.x line, published on npm, with documentation in the [README](/docs/) and a working example.
- It is maintained by one author. Plan for that in your own support and continuity needs.
- Today the automated test run checks that the Core starts and runs without errors. A full suite of assertion tests is planned. Ask for the current status before you rely on it for a regulated workload.

## 6. Get started

```bash
npm install @indra.ai/deva
```

- [Read the documentation](/docs/), with install, a quick start, the lifecycle and the method reference.
- [Browse the source and examples](https://github.com/indraai/deva).
- [Questions and issues](https://github.com/indraai/deva/issues).
- Licensing and commercial use: quinn@indra.ai.

## 7. Frequently asked questions

**Is this an AI model?** No. Deva Core is the framework that agents run on. You can connect any model or service your own code calls.

**Does it send my data anywhere?** The Core runs inside your Node.js process and its own code has no network calls. What your Devas connect to is up to the code you write.

**Can I use it in a commercial product?** Only with the Owner's verified authorization under the VLA. Contact quinn@indra.ai before you build on it.

**Why three hash tiers?** They let public work be verified quickly (md5), by authorities (sha256) and at high security (sha512), and the tiers build on each other so a packet can move between those levels.
