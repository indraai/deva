---
layout: page
title: Core - Beliefs
description: not done yet
image: /assets/banner.png
permalink: /core/beliefs/
---

{{page.description}}

{% for belief in site.data.beliefs.DATA %}
	- **key**: {{belief[0]}}  
		**value**: {{belief[1]}} 
{% endfor %}
