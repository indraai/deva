---
layout: page
title: Core - States
description: not done yet
image: /assets/banner.png
permalink: /core/states/
---

{{page.description}}

{% for state in site.data.states.DATA %}
	- **key**: {{state[0]}}  
		**value**: {{state[1]}} 
{% endfor %}
