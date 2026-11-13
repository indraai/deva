---
layout: page
title: Guide
permalink: /guide/
description: Build your first Deva from an empty folder - client and agent files, vars, a func, a method, a listener, and a stamped packet you can verify.
image: /assets/banner.png
---

{% assign guide = site.data.guide.DATA %}

{{ page.description }}

## What you'll build

In this guide you'll build **{{ guide.deva }}**, a small working Deva that runs on your own computer. It knows who it is, knows who is talking to it, answers a question, and hands back a packet stamped with md5, sha256 and sha512 hashes, so you can check that nothing changed after it was stamped.

{{ guide.deva }} is small on purpose. Every Deva in the system, from License Deva to Socket Deva, is built from the same parts you'll put together here, so once you finish you'll know how any Deva is put together.

## What you need

- **Node.js {{ guide.node }} or newer**, along with npm {{ guide.npm }} or newer. Check your versions with `node -v` and `npm -v`.
- A terminal and a text editor.

You don't need any other packages. Deva Core has no dependencies.

## The steps

The guide has {{ guide.steps | size }} steps, and each one builds on the one before it. Every code block on these pages is meant to be copied and run exactly as written.

| Step | What you'll do |
|---|---|
{% for step in guide.steps %}| **[{{ step.step }}. {{ step.title }}]({{ step.permalink }})** | {{ step.describe }} |
{% endfor %}

## Your project

By the end, your project will look like this:

```
{% for line in guide.tree %}{{ line }}
{% endfor %}```

## Ready?

{% assign first = guide.steps | first %}
Open a terminal, pick a place for your project, and head to **[Step {{ first.step }}: {{ first.title }}]({{ first.permalink }})**.
