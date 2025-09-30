"use strict";
// Copyright ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:44091450722329207445 LICENSE.md

import events from './events.json' with {type:'json'};
import features from './features.json' with {type:'json'};
import zones from './zones.json' with {type:'json'};
import actions from './actions.json' with {type:'json'};
import states from './states.json' with {type:'json'};
import intents from './intents.json' with {type:'json'};
import beliefs from './beliefs.json' with {type:'json'};
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
	ready_hash: [
		"vars",
		"utils",
		"listeners",
		"modules",
		"func",
		"methods"
	],
	invoke: {
		start: {
			key: 'start',
			prev_key: 'init',
			next_key: 'enter',
			onfunc: 'onStart',
		},
		enter: {
			key: 'enter',
			prev_key: 'start',
			next_key: 'done',
			onfunc: 'onEnter',
		},
		done: {
			key: 'done',
			prev_key: 'enter',
			next_key: 'ready',
			onfunc: 'onDone',
		},
		ready: {
			key: 'ready',
			prev_key: 'done',
			next_key: false,
			onfunc: 'onReady',
		},
		finish: {
			key: 'finish',
			prev_key: 'answer',
			next_key: 'complete',
			onfunc: 'onFinish',
		},
		complete: {
			key: 'complete',
			prev_key: 'finish',
			next_key: false,
			onfunc: 'onComplete',
		},
		stop: {
			key: 'stop',
			prev_key: false,
			next_key: 'exit',
			onfunc: 'onStop',
		},
		exit: {
			key: 'exit',
			prev_key: 'stop',
			next_key: false,
			onfunc: 'onExit',
			clear: [
				'_active',
				'_indra',
				'_veda',
				'_license',
				'_data',
				'_error',
				'_log',
				'_report',
				'_vector',
				'_king',
				'_treasury',
				'_security',
				'_guard',
				'_defense',
				'_wall',
				'_proxy',
				'_legal',
				'_authority',
				'_justice',
				'_support',
				'_services',
				'_systems',
				'_networks',				
			]
		}
	},
	context: false,
	events: events.DATA,
	feature: false,
	features: features.DATA,
	zone: false,
	zones: zones.DATA,
	action: false,
	actions: actions.DATA,
	state: 'offline',
	states: states.DATA,
	intent: 'neutral',
	intents: intents.DATA,
	belief: 'vedic',
	beliefs: beliefs.DATA,
	messages: msgs.DATA,
}