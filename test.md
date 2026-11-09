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