"use strict";
// ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:71443370153036576517 LICENSE.md

import events from './events.json' with {type:'json'};
import features from './features.json' with {type:'json'};
import zones from './zones.json' with {type:'json'};
import actions from './actions.json' with {type:'json'};
import states from './states.json' with {type:'json'};
import msgs from './msgs.json' with {type:'json'};

export default {
	cmdChr: '/',
	askChr: '#',
	uid: {
		end_min: 1000000,
		end_max: 9999999
	},
	inherit: [
		'events',
		'lib',
		'config'
	],
	bind: [
		'listeners',
		'methods',
		'utils',
		'func',
		'lib'
	],
	context: false,
	events: events.DATA,
	feature: false,
	features: features.DATA,
	zone: false,
	zones: zones.DATA,
	action: false,
	actions: actions.DATA,
	state: false,
	states: states.DATA,
	messages: msgs.DATA,
}