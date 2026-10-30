---
layout: page
title: Core - Features
description: not done yet
image: /assets/banner.png
permalink: /core/features/
---

{{page.description}}

{% for feature in site.data.features.DATA %}
	- **key**: {{feature[0]}}  
		**value**: {{feature[1]}} 
{% endfor %}
