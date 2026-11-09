---
layout: page
title: Tests
permalink: /tests/
description: How the Deva Core is tested, what each test suite proves, and the edge cases the suite found and fixed.
image: /assets/banner.png
---

{{ page.description }}

{% assign tests = site.data.tests.DATA %}
{% assign total = 0 %}
{% for suite in tests.suites %}{% assign total = total | plus: suite.count %}{% endfor %}

The Deva Core test suite has {{ tests.suites | size }} suites and {{ total }} tests. It uses Node's built-in `{{ tests.runner }}` runner with `{{ tests.assert }}`, so it adds no dependencies.

## How to run it

Run the tests on Node.js {{ tests.node }} or later:

```bash
{{ tests.command }}
```

## The suites

Each suite builds on the one before it, from building a Deva through to shutting it down.

| Suite | Tests | What it proves |
|---|---|---|
{% for suite in tests.suites %}| **{{ suite.title }}**<br>`{{ suite.file }}` | {{ suite.count }} | {{ suite.describe }} |
{% endfor %}

## Edge cases found and fixed

The suite found {{ tests.edgecases | size }} edge cases. Each looks small on its own, but in a system of thousands of Devas any one of them becomes a real problem. All of them are fixed and covered by the tests.

{% for edge in tests.edgecases %}
### {{ edge.title }}

{{ edge.describe }} Fixed in version {{ edge.fixed }}, tested in `{{ edge.suite }}`.
{% endfor %}
