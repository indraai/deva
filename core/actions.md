---
layout: page
title: Core - Actions
description: What the Deva Core tracks inside every action, and the reference data behind it.
image: /assets/banner.png
permalink: /core/
---

{{page.description}}


{% for action in site.data.actions.DATA %}
	- **key**: {{action[0]}}  
		**value**: {{action[1]}} 
{% endfor %}
