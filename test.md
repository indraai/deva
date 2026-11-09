Here's `tests.md`. It uses the same front matter as `about.md` and the core pages, and it builds everything from `site.data.tests.DATA`, the same way `core/actions.md` loops over its data. The page also adds up the suite counts itself, so the total of 69 isn't written into the page by hand. It's saved at `/workspace/drafts/tests.md`:

```markdown
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
```

**Where it goes:** put it at the repo root next to `about.md` and `docs.md`, so it lives at `/tests/`. To show it in the menu, add `- tests.md` under `header_pages` in `_config.yml`.

I don't have Jekyll on my computer, so I haven't built the page or seen it rendered. One part is worth checking on your first build: the table rows come out of a Liquid loop. Each row has to land directly under the `|---|` line with no blank line in between, or kramdown will cut the table short.

**One mismatch to fix:** `index.md` says Node.js 22 or later, but the tests run on Node 24, which is what I put in the data file. It would be better to make the two agree, or to say the core needs 22 and the tests were run on 24.