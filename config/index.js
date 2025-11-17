"use strict";
// Copyright ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:64907438819979111427 LICENSE.md

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
	container: {
		begin: '::BEGIN:',
		end: '::END:',
	},
	box: {
		begin: '::begin',
		end: '::end',
	},
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
			prev_key: 'init',
			next_key: 'enter',
			onfunc: 'onStart',
			clear: false,
		},
		enter: {
			prev_key: 'start',
			next_key: 'done',
			onfunc: 'onEnter',
			clear: false,
		},
		done: {
			prev_key: 'enter',
			next_key: 'ready',
			onfunc: 'onDone',
			clear: false,
		},
		ready: {
			prev_key: 'done',
			next_key: false,
			onfunc: 'onReady',
			clear: false,
		},
		finish: {
			prev_key: 'answer',
			next_key: 'complete',
			onfunc: 'onFinish',
			clear: false,
		},
		complete: {
			prev_key: 'finish',
			next_key: false,
			onfunc: 'onComplete',
			clear: false,
		},
		stop: {
			prev_key: false,
			next_key: 'close',
			onfunc: 'onStop',
			clear: false,
		},
		close: {
			prev_key: 'stop',
			next_key: 'leave',
			onfunc: 'onClose',
			clear: false,
		},
		leave: {
			prev_key: 'close',
			next_key: 'exit',
			onfunc: 'onLeave',
			clear: false,
		},
		exit: {
			prev_key: 'stop',
			next_key: 'shutdown',
			onfunc: 'onExit',
			clear: [
				'_license',
				'_feecting',
				'_error',
				'_log',
				'_data',
				'_report',
				'_veda',
				'_indu',
				'_indra',
				'_soma',
				'_king',
				'_owner',
				'_vector',
				'_intelligence',
				'_treasury',
				'_justice',
				'_authority',
				'_legal',
				'_security',
				'_guard',
				'_defense',
				'_sheild',
				'_wall',
				'_proxy',
				'_support',
				'_services',
				'_systems',
				'_networks',				
			]
		},
		shutdown: {
			prev_key: 'exit',
			next_key: false,
			onfunc: 'onShutdown',
			clear: [
				'modules',
				'listeners',
				'events',
				'_config',
				'_active',
			],
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