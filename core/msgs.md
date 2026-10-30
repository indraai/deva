---
layout: page
title: Core - Messages
description: not done yet
image: /assets/banner.png
permalink: /core/msgs/
---

{{page.description}}

{% for message in site.data.msgs.DATA %}
	- **key**: {{message[0]}}  
		**value**: {{message[1]}} 
{% endfor %}
