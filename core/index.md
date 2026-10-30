---
layout: page
title: Core
description: The Deva Core Events, Features, Zones, Beliefs, Actions, States, Intents, and Messages.
image: /assets/banner.png
permalink: /core/
---

the core components

- (Beliefs)[/core/beliefs]
- (Events)[/core/events]
- (Features)[/core/features/]
- (Events)[/core/events]
- (Intents)[/core/intents]
- (Messages)[/core/msgs]
- (States)[/core/states]
- (Zones)[/core/zones]

{% for action in site.data.actions.DATA %}
	- key: {{action[0]}}  
	  value: {{action[1]}} 
{% endfor %}
