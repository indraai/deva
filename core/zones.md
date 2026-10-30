---
layout: page
title: Core - Zones
description: not done yet
image: /assets/banner.png
permalink: /core/zones/
---

{{page.description}}

{% for zone in site.data.zones.DATA %}
	- **key**: {{zone[0]}}  
		**value**: {{zone[1]}} 
{% endfor %}
