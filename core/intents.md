---
layout: page
title: Core - Intents
description: not done yet
image: /assets/banner.png
permalink: /core/intents/
---

{{page.description}}

{% for intent in site.data.intents.DATA %}
	- **key**: {{intent[0]}}  
		**value**: {{intent[1]}} 
{% endfor %}
