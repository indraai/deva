---
layout: page
title: Core
description: What the Deva Core tracks inside every action, and the reference data behind it.
image: /assets/banner.png
permalink: /core/
---

{{page.description}}

Every Deva Core run is described by a small, fixed vocabulary. Each time something happens, the Core records which feature was involved, what was done, what state it is in, and what the intent was. The same names are used everywhere in the code, so a log entry means the same thing in every Deva. This reference is generated from the live data files shipped with the Core.

- [Features]({{ "/core/features/" | relative_url }}) ({{ site.data.features.DATA | size }}): the built-in capabilities, such as License, Error, Log, Security and Support.
- [Zones]({{ "/core/zones/" | relative_url }}) ({{ site.data.zones.DATA | size }}): where an action is happening, so activity can be traced to its location.
- [Actions]({{ "/core/actions/" | relative_url }}) ({{ site.data.actions.DATA | size }}): what was done, such as consent, encrypt, decrypt, return.
- [States]({{ "/core/states/" | relative_url }}) ({{ site.data.states.DATA | size }}): the condition something is in, such as online, active, idle, valid or catch.
- [Intents]({{ "/core/intents/" | relative_url }}) ({{ site.data.intents.DATA | size }}): the purpose behind an action, such as good, bad or lawful.
- [Beliefs]({{ "/core/beliefs/" | relative_url }}) ({{ site.data.beliefs.DATA | size }}): the stance recorded for the work, such as positive, productive or vedic.
- [Events]({{ "/core/events/" | relative_url }}) ({{ site.data.events.DATA | size }}): the named signals the Core emits through its lifecycle, such as `devacore:start`, `devacore:ready` and `devacore:error`, which your own code can listen for.
- [Messages]({{ "/core/msgs/" | relative_url }}) ({{ site.data.msgs.DATA | size }}): the standard text the Core uses for lifecycle steps and errors, so output is consistent and can be audited.

**Why it matters:** these lists form the audit trail. Because every record uses the same fixed names, activity can be searched, verified and reported on without guessing what a label means.