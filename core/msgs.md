---
layout: page
title: Core - Messagess
description: not done yet
image: /assets/banner.png
permalink: /core/features/
---

{{page.description}}

{% for message in site.data.msgs.DATA %}
	- **key**: {{message[0]}}  
		**value**: {{message[1]}} 
{% endfor %}
