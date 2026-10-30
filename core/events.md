---
layout: page
title: Core - Events
description: not done yet
image: /assets/banner.png
permalink: /core/events/
---

{{page.description}}

{% for event in site.data.events.DATA %}
	- **key**: {{event[0]}}  
		**value**: {{event[1]}} 
{% endfor %}
