// Copyright (c)2023 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
const {EventEmitter} = require('events');
const { createHash, randomUUID, createCipheriv, createDecipheriv, randomBytes } = require('crypto');

class Deva {
  constructor(opts) {
    opts = opts || {};

    this._id = randomUUID();                            // the unique id assigned to the agent at load
    this._config = opts.config || {};                   // local Config Object
    this._agent = opts.agent || false;                  // Agent profile object
    this._client = {};                                  // this will be set on init.
    this._state = 'OFFLINE';                            // current state of agent.
    this._active = false;                               // the active/birth date.
    this._security = false;                             // inherited Security features.
    this._support = false;                              // inherited Support features.
    this._services = false;                             // inherited Service features.
    this._assistant = false;                            // inherited @Assistant features.
    this._business = false;                             // inherited @Business features.
    this._legal = false;                                // inherited @Legal features.
    this.events = opts.events || new EventEmitter({});  // Event Bus
    this.lib = opts.lib || {};                          // used for loading library functions
    this.devas = opts.devas || {};                      // Devas which are loaded
    this.vars = opts.vars || {};                        // Variables object
    this.listeners = opts.listeners || {};              // local Listeners
    this.modules = opts.modules || {};                  // 3rd Party Modules
    this.func = opts.func || {};                        // local Functions
    this.methods = opts.methods || {};                  // local Methods
    this.maxListeners = opts.maxListenners || 0;        // set the local maxListeners

    for (var opt in opts) {
      if (!this[opt]) this[opt] = opts[opt];            // set any remaining opts to this.
    }

    this.cmdChr = '/';                                  // the trigger for local commands
    this.askChr = '#';                                  // the trigger for ask other DEva features
    // index of the items
    this.inherit = ["events", "lib"];
    this.bind = [
      "listeners",
      "methods",
      "func",
      "lib",
      "_agent"
    ];
    this.features = {
      assistant: {
        label: '🤖ASSISTANT',
        name: '@ASSISTANT',
        tag: '#ASSISTANT',
        loc: '$ASSISTANT',
      },
      business: {
        label: '💼BUSINESS',
        name: '@BUSINESS',
        tag: '#BUSINESS',
        loc: '$BUSINESS',
      },
      legal: {
        label: '👨‍⚖️LEGAL',
        name: '@LEGAL',
        tag: '#LEGAL',
        loc: '$LEGAL',
      },
      development: {
        label: '👨‍💻DEVELOPMENT',
        name: '@DEVELOPMENT',
        tag: '#DEVELOPMENT',
        loc: '$DEVELOPMENT',
      },
      security: {
        label: '🚨SECURITY',
        name: '@SECURITY',
        tag: '#SECURITY',
        loc: '$SECURITY',
      },
      support: {
        label: '🆘SUPPORT',
        name: '@SUPPORT',
        tag: '#SUPPORT',
        loc: '$SUPPORT',
      },
      services: {
        label: '📞SERVICES',
        name: '@SERVICES',
        tag: '#SERVICES',
        loc: '$SERVICES',
      },
      solutions: {
        label: '💡SOLUTIONS',
        name: '@SOLUTIONS',
        tag: '#SOLUTIONS',
        loc: '$SOLUTIONS',
      },
      systems: {
        label: '🔧SYSTEMS',
        name: '@SOLUTIONS',
        tag: '#SOLUTIONS',
        loc: '$SOLUTIONS',
      },
    }
  }

  /**************
  func: States
  params: sts - custm states object to add to the system states
  describe:
    The States function builds the list of states with the associated client and
    agent variables in the place holders. This function runs after the Client
    function to ensure that hte messages are personalized to the Client and AGent.
  ***************/
  set States(sts) {
    const {
            development, security, services, support,
            systems, solutions, assistant, business, legal
          } = this.features;

    const {_agent, _client} = this;
    const _states = {
      uid: `${security.label}:UID ${_client.profile.name} made a #uid with ${_agent.profile.name}`,
      hash: `${security.label}:HASH ${_client.profile.name} made a #hash with ${_agent.profile.name}`,
      cipher: `${security.label}:CIPHER ${_client.profile.name} locked a #cipher with ${_agent.profile.name}`,
      decipher: `${security.label}:DECIPHER ${_client.profile.name} unlocked a #cipher with ${_agent.profile.name}`,
      offline: `👻 ${_agent.profile.name} is offline`,
      online: `📡 ${_agent.profile.name} is online`,
      config: `‍📀 ${_agent.profile.name} is checking the config`,
      client: `👨‍💻 ${_agent.profile.name} opened the ${_client.key} profile`,
      agent: `👨‍💻 ${_agent.profile.name} is looking at ${_agent.key} profile`,
      init: `🚀 ${_agent.profile.name} is initializing for ${_client.profile.name}`,
      start: `🎬 ${_agent.profile.name} has started the process for ${_client.profile.name}`,
      enter: `🎪 ${_agent.profile.name} is entering the deva.world with${_client.profile.name}`,
      stop: `🛑 ${_agent.profile.name} has stopped for ${_client.profile.name}`,
      exit: `🚪 ${_agent.profile.name} found the exit with ${_client.profile.name}`,
      done: `🤝 ${_agent.profile.name} is all done time for #offerings 🍫🍌`,
      wait: `😵‍💫 ${_agent.profile.name} waiting for #stuff from ${_client.profile.name}`,
      data: `📀 ${_agent.profile.name} is receiving #data for ${_client.profile.name}`,
      ask: `🙋‍♀️ ${_agent.profile.name} is asking a #question from ${_client.profile.name}`,
      cmd: `📟 ${_agent.profile.name} entered a #command from ${_client.profile.name}`,
      question: `🐵 ${_agent.profile.name} is in #question mode ${_client.profile.name}`,
      ask: `🐵 ${_agent.profile.name}  is in #ask mode ${_client.profile.name}`,
      talk: `🎙️ ${_agent.profile.name} is in #talk mode with ${_client.profile.name}`,
      listen: `🎧 ${_agent.profile.name} is in #listening mode with ${_client.profile.name}`,
      error: `❌ ${_agent.profile.name} had an error. Let's have @Systems look into that.`,
      story: `📓STORY: ${_client.profile.name} is creating an amazing #story ${_client.profile.name}`,
      development: `${development.label}: ${_client.profile.name} and ${_agent.profile.name} need ${development.name} assistance`,
      security: `${security.label}: ${_client.profile.name} and ${_agent.profile.name} need ${security.name} assistance`,
      support: `${support.label}: ${_client.profile.name} and ${_agent.profile.name} need ${support.name} assistance`,
      services: `${services.label}: ${_client.profile.name} and ${_agent.profile.name} need ${services.name} assistance`,
      systems: `${systems.label}: ${_client.profile.name} and ${_agent.profile.name} need ${systems.name} assistance`,
      solutions: `${development.label}: ${_client.profile.name} and ${_agent.profile.name} need ${development.name} assistance`,
      legal: `${legal.label}: ${_client.profile.name} and ${_agent.profile.name} need ${legal.name} assistance`,
      business: `${business.label}: ${_client.profile.name} and ${_agent.profile.name} need ${business.name} assistance`,
      devas_start: `🧞‍♂️DEVAS: Starting all the #Devas with ${_client.profile.name}`,
      devas_ready: `🧞‍♂️DEVA:READY The #Devas are #ready and #waiitng for ${_client.profile.name} using @${_client.profile.key} #${_client.profile.key} $${_client.profile.key}`,
      devas_stop: `🧞‍♂️DEVA:STOPPING The #Devas are #stopping with ${_client.profile.name}`,
      devas_stopped: `🧞‍♂️DEVA:🛑STOP #Devas and ${_client.profile.name} have #stopped, and that means time for #offerings 🍎🍑🍍🧋`,
      deva_load: `🧞‍♂️DEVA:LOADING ${_agent.profile.name} loading for ${_client.profile.name}`,
      deva_loaded: `🧞‍♂️DEVA:LOADED ${_agent.profile.name} loaded for ${_client.profile.name}`,
      deva_unloaded: `🧞‍♂️DEVAS:UNLOADED ${_agent.profile.name} unloaded for ${_client.profile.name}`,
      question_me: `❓QUESTION:START ${_client.profile.name} started with a great #question to ${_agent.profile.name}`,
      question_default: `🧞‍♂️QUESTION:ME ${_client.profile.name} asked a great #question to ${_agent.profile.name}`,
      question_ask: `🧞QUESTION:ASK ${_agent.profile.name} is pondering what ${_client.profile.name} asked`,
      question_asking: `🧞QUESTION:ASK:ANSWER ${_agent.profile.name} is asking another #Deva for ${_client.profile.name}`,
      question_aswering: `🧞QUESTION:ASK:ANSWERING ${_agent.profile.name} is answering the #question ${_client.profile.name} asked`,
      question_answer: `🔮QUESTION:ANSWER ${_client.profile.name} received an #ansewr from ${_agent.profile.name}`,
      question_command: `🧞‍♀️QUESTION:CMD ${_client.profile.name} issued a #command to ${_agent.profile.name}`,
      hash_question: `${security.label}:HASH:QUESTION ${_agent.profile.name} created the #question #hash for ${_client.profile.name}`,
      hash_ask: `${security.label}:HASH:ASK ${_agent.profile.name} created the #ask #hash for ${_client.profile.name}`,
      hash_answer: `${security.label}:HASH:ANSWER ${_client.profile.name} #answer #hash with ${_agent.profile.name}`,
      hash_command: `${security.label}:HASH:COMMAND ${_client.profile.name} used a #command with ${_agent.profile.name}`,
      hash_packet: `${security.label}:HASH:PACKET ${_agent.profile.name} created the #packet #hash for ${_client.profile.name}`,
      ask_question: `❓QUESTION: ${_client.profile.name} asked ${_agent.profile.name} a great #question`,
      ask_answer: `💡ANSWER: ${_client.profile.name} received a great #answer from ${_agent.profile.name}`,
      method_not_found: `${security.label}:ERROR:COMMAND ${_client.profile.name} used a #command while working with ${_agent.profile.name}, and may need from ${security.name}`,

      ready_security: `${security.label}:READY - ${security.name} is ready on ${security.tag} in ${security.loc}`,
      ready_support: `${support.label}:READY - ${support.name} is ready on ${support.tag} in ${support.loc}`,
      ready_services: `${services.label}:READY - ${services.name} is ready on ${services.tag} in ${services.loc}`,
      ready_systems: `${systems.label}:READY - ${systems.name} is ready on ${systems.tag} in ${systems.loc}`,
      ready_solutions: `${solutions.label}:READY - ${solutions.name} is ready on ${solutions.tag} in ${solutions.loc}`,
      ready_development: `${development.label}:READY - ${development.name} is ready ${development.tag} in ${development.loc}`,
      ready_legal: `${legal.label}:READY - ${legal.name} is ready on ${legal.tag} in ${legal.loc}`,
      ready_business: `${business.label}:READY - ${business.name} is ready ${business.tag} in ${business.loc}`,
      ready_assistant: `${assistant.label}:READY - ${assistant.name} is ready ${assistant.tag} in ${business.loc}`,

      alert_security: `${security.label}:ALERT There is an #issue with ${_client.profile.name} and ${_agent.profile.name}.`,
      alert_support: `${support.label}:ALERT There is an #issue with ${_client.profile.name} and ${_agent.profile.name}.`,
      alert_services: `${services.label}:ALERT There is an #issue with ${_client.profile.name} and ${_agent.profile.name}.`,
      alert_solutions: `${solutions.label}:ALERT There is an #issue with ${_client.profile.name} and ${_agent.profile.name}.`,
      alert_systems: `${systems.label}:ALERT There is an #issue with ${_client.profile.name} and ${_agent.profile.name}.`,
      alert_development: `${development.label}:ALERT There is an #issue with ${_client.profile.name} and ${_agent.profile.name}.`,
      alert_assistant: `${assistant.label}:ALERT There is an #issue with ${_client.profile.name} and ${_agent.profile.name}.`,
      alert_legal: `${legal.label}:ALERT There is an #issue with ${_client.profile.name} and ${_agent.profile.name}.`,
      alert_business: `${business.label}:ALERT There is an #issue with ${_client.profile.name} and ${_agent.profile.name}.`,

      setting_client: `👨CLIENT: ${_agent.profile.name} is setting #${_client.key} for ${_client.profile.name} `,
      setting_development: `${development.label}: ${_client.profile.name} and ${_agent.profile.name} are receiving ${development.name} on ${development.tag} in ${development.loc}`,
      setting_security: `${security.label}: ${_client.profile.name} and ${_agent.profile.name} are receiving ${security.name} on ${security.tag} in ${security.loc}`,
      setting_support: `${development.label}: ${_client.profile.name} and ${_agent.profile.name} are receiving ${development.name} on ${development.tag} in ${development.loc}`,
      setting_services: `${services.label}: ${_client.profile.name} and ${_agent.profile.name} are receiving ${services.name} on ${services.tag} in ${services.loc}`,
      setting_systems: `${systems.label}: ${_client.profile.name} and ${_agent.profile.name} are receiving ${systems.name} on ${systems.tag} in ${systems.loc}`,
      setting_solutions: `${solutions.label}: ${_client.profile.name} and ${_agent.profile.name} are receiving ${solutions.name} on ${solutions.tag} in ${solutions.loc}`,
      setting_assistant: `${assistant.label}: ${_client.profile.name} and ${_agent.profile.name} are receiving ${assistant.name} on ${assistant.tag} in ${assistant.loc}`,
      setting_legal: `${legal.label}: ${_client.profile.name} and ${_agent.profile.name} are receiving ${legal.name} on ${legal.tag} in ${legal.loc}`,
      setting_business: `${business.label}: ${_client.profile.name} and ${_agent.profile.name} are receiving ${business.name} on ${business.tag} in ${business.loc}`,
    }

    // determine if msgs is an object and then loop the msgs
    if (sts && typeof sts === 'object') for (let x in sts) {
      if (!_states[x]) _states[x] = sts[x];             // new state added if not matching _states
    }
    this._states = _states;                             // set _states as this._states;
    this._states = _states;                             // The available states to work with.
  }

  /**************
  func: Messages
  params: msgs -additional messages
  describe:
    The Messages function builds the system messages, and allows for the
    reloading of system messages when client or agent data changes.
  ***************/
  set Messages(msgs) {
    // Default system messages
    const _messages = {
      offline: `🙅‍♂️ ${this._agent.profile.name} offline`,
      init: `⚠️ ${this._agent.profile.name} init`,
      start: `✅ ${this._agent.profile.name} start`,
      stop: `💥 ${this._agent.profile.name} stop.`,
      enter: `🖖 ${this._agent.profile.name} enter.`,
      exit: `🚪 ${this._agent.profile.name} exit.`,
      done: `👍 ${this._agent.profile.name} done.`,
      devas_started: '#Devas are #online and ready for #offerings 🍫🥛🍚🍯🧂',
      devas_stopped: '🛑 #Devas have stopped',
      notext: `❌ ${this._client.profile.name}, Invalid input.`,
      method_not_found: `❌ ${this._client.profile.name} you sure messed that up!`,
    }

    // determine if msgs is an object and then loop the msgs
    if (msgs && typeof msgs === 'object') for (let x in msgs) {
      if (!_messages[x]) _messages[x] = msgs[x];         // new msg added if not matching _messages
    }
    this._messages = this.copy(_messages);               // set a copy of _messages as this._messages;
  }

  /**************
  func: Client
  params: client - client provided data.
  describe:
    The Client feature sets up the client variables and removes any unnecessary
    keys from the client object that are used in other features.

  usage:
    this.Client = {data}
  ***************/
  set Client(client) {
    const _client = this.copy(client);                // copy the client parameter
    if (_client.states) delete _client.states;        // delete states key for client security
    if (_client.messages) delete _client.messages;    // delete messages key for client security
    if (_client.featuers) delete _client.features;    // delete features key for client security
    this._client = _client;                           // set local _client to this scope
    this.States = client.states;                      // set the States after the Client
    this.Messages = client.messages;                  // set the Messages after the Client
  }

  /**************
  func: Security
  params: client: false
  describe:
    The Security feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  set Security(client=false) {
    try {
      if (!client) this._security = {};                 // if no client then set to empty object
      else {
        this.state('setting_security');                 // set state to security setting
        const _client = this.copy(client);              // make a copy the clinet data.
        const {id, features, profile} = _client;        // set the local consts from client copy
        const {security} = features;                    // set security from features const
        this._security = {                              // set this_security with data
          id: this.uid(true),                           // uuid of the security feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          hash: security.hash,                          // client preferred hash algorithm
          cipher: security.cipher,                      // client preferred cipher settings
          concerns: security.concerns,                  // any concerns for client
          global: security.global,                      // the global policies for client
          personal: security.devas[this._agent.key]     // Client personal features and rules.
        };
      }
    } catch (e) {
      this.error(e, client)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Support
  params: client: false
  describe:
    The Support feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  set Support(client=false) {
    try {
      if (!client) this._support = {};                  // if no client then set to empty object
      else {
        this.state('setting_support');                  // set state to support setting
        const _client = this.copy(client);              // make a copy the clinet data.
        const {id, features, profile} = _client;        // set the local consts from client copy
        const {support} = features;                     // set support from features const
        this._support = {                               // set this_support with data
          id: this.uid(true),                           // uuid of the support feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          hash: support.hash,                           // client preferred hash algorithm
          cipher: support.cipher,                       // client preferred cipher settings
          concerns: support.concerns,                   // any concerns for client
          global: support.global,                       // the global policies for client
          personal: support.devas[this._agent.key]      // Client personalSecurity features and rules.
        };
      }
    } catch (e) {
      this.error(e, client)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Services
  params: client: false
  describe:
    The Services feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  set Services(client=false) {
    try {
      if (!client) this._security = {};                 // if no client then set to empty object
      else {
        this.state('setting_security');                 // set state to security setting
        const _client = this.copy(client);              // make a copy the clinet data.
        const {id, features, profile} = _client;        // set the local consts from client copy
        const {security} = features;                    // set security from features const
        this._security = {                              // set this_security with data
          id: this.uid(true),                           // uuid of the security feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          hash: security.hash,                          // client preferred hash algorithm
          cipher: security.cipher,                      // client preferred cipher settings
          concerns: security.concerns,                  // any concerns for client
          global: security.global,                      // the global policies for client
          personal: security.devas[this._agent.key]     // Client personal features and rules.
        };
      }
    } catch (e) {
      this.error(e, client)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Systems
  params: client: false
  describe:
    The Systems feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  set Systems(client=false) {
    try {
      if (!client) this._systems = {};                 // if no client then set to empty object
      else {
        this.state('setting_systems');                 // set state to systems setting
        const _client = this.copy(client);              // make a copy the clinet data.
        const {id, features, profile} = _client;        // set the local consts from client copy
        const {systems} = features;                    // set systems from features const
        this._systems = {                              // set this_systems with data
          id: this.uid(true),                           // uuid of the systems feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          hash: systems.hash,                          // client preferred hash algorithm
          cipher: systems.cipher,                      // client preferred cipher settings
          concerns: systems.concerns,                  // any concerns for client
          global: systems.global,                      // the global policies for client
          personal: systems.devas[this._agent.key]     // Client personal features and rules.
        };
      }
    } catch (e) {
      this.error(e, client)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Solutions
  params: client: false
  describe:
    The Solutions feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  set Solutions(client=false) {
    try {
      if (!client) this._solutions = {};                 // if no client then set to empty object
      else {
        this.state('setting_solutions');                 // set state to solutions setting
        const _client = this.copy(client);              // make a copy the clinet data.
        const {id, features, profile} = _client;        // set the local consts from client copy
        const {solutions} = features;                    // set solutions from features const
        this._solutions = {                              // set this_solutions with data
          id: this.uid(true),                           // uuid of the solutions feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          hash: solutions.hash,                          // client preferred hash algorithm
          cipher: solutions.cipher,                      // client preferred cipher settings
          concerns: solutions.concerns,                  // any concerns for client
          global: solutions.global,                      // the global policies for client
          personal: solutions.devas[this._agent.key]     // Client personal features and rules.
        };
      }
    } catch (e) {
      this.error(e, client)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Development
  params: client: false
  describe:
    The Development feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  set Development(client=false) {
    try {
      if (!client) this._development = {};                 // if no client then set to empty object
      else {
        this.state('setting_development');                 // set state to development setting
        const _client = this.copy(client);              // make a copy the clinet data.
        const {id, features, profile} = _client;        // set the local consts from client copy
        const {development} = features;                    // set development from features const
        this._development = {                              // set this_development with data
          id: this.uid(true),                           // uuid of the development feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          hash: development.hash,                          // client preferred hash algorithm
          cipher: development.cipher,                      // client preferred cipher settings
          concerns: development.concerns,                  // any concerns for client
          global: development.global,                      // the global policies for client
          personal: development.devas[this._agent.key]     // Client personal features and rules.
        };
      }
    } catch (e) {
      this.error(e, client)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Assistant
  params: client: false
  describe:
    The Assistant feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  set Assistant(client=false) {
    try {
      if (!client) this._assistant = {};                 // if no client then set to empty object
      else {
        this.state('setting_assistant');                 // set state to assistant setting
        const _client = this.copy(client);              // make a copy the clinet data.
        const {id, features, profile} = _client;        // set the local consts from client copy
        const {assistant} = features;                    // set assistant from features const
        this._assistant = {                              // set this_assistant with data
          id: this.uid(true),                           // uuid of the assistant feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          hash: assistant.hash,                          // client preferred hash algorithm
          cipher: assistant.cipher,                      // client preferred cipher settings
          concerns: assistant.concerns,                  // any concerns for client
          global: assistant.global,                      // the global policies for client
          personal: assistant.devas[this._agent.key]     // Client personal features and rules.
        };
      }
    } catch (e) {
      this.error(e, client)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Business
  params: client: false
  describe:
    The Business feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  set Business(client=false) {
    try {
      if (!client) this._business = {};                 // if no client then set to empty object
      else {
        this.state('setting_business');                 // set state to business setting
        const _client = this.copy(client);              // make a copy the clinet data.
        const {id, features, profile} = _client;        // set the local consts from client copy
        const {business} = features;                    // set business from features const
        this._business = {                              // set this_business with data
          id: this.uid(true),                           // uuid of the business feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          hash: business.hash,                          // client preferred hash algorithm
          cipher: business.cipher,                      // client preferred cipher settings
          concerns: business.concerns,                  // any concerns for client
          global: business.global,                      // the global policies for client
          personal: business.devas[this._agent.key]     // Client personal features and rules.
        };
      }
    } catch (e) {
      this.error(e, client)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Legal
  params: client: false
  describe:
    The Legal feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  set Legal(client=false) {
    try {
      if (!client) this._legal = {};                 // if no client then set to empty object
      else {
        this.state('setting_legal');                 // set state to legal setting
        const _client = this.copy(client);              // make a copy the clinet data.
        const {id, features, profile} = _client;        // set the local consts from client copy
        const {legal} = features;                    // set legal from features const
        this._legal = {                              // set this_legal with data
          id: this.uid(true),                           // uuid of the legal feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          hash: legal.hash,                          // client preferred hash algorithm
          cipher: legal.cipher,                      // client preferred cipher settings
          concerns: legal.concerns,                  // any concerns for client
          global: legal.global,                      // the global policies for client
          personal: legal.devas[this._agent.key]     // Client personal features and rules.
        };
      }
    } catch (e) {
      this.error(e, client)                             // run error handling if an error is caught
    }
  }

  /**************
  func: _assignBind
  params: none
  describe:
    The assign bind function will bind the translate functions and parse functions
    of the agent and bind their functionality to the state machine.
  ***************/
  _assignBind() {
    return new Promise((resolve, reject) => {
      try {
        this.bind.forEach(bind => {
          if (this[bind]) for (let x in this[bind]) {
            if (typeof this[bind][x] === 'function') {
              this[bind][x] = this[bind][x].bind(this);
            }
          }
        });
        // bind translate
        const translate = this._agent && this._agent.translate && typeof this._agent.translate === 'function';
        if (translate) this._agent.translate = this._agent.translate.bind(this);
        // bind parser
        const parse = this._agent && this._agent.parse && typeof this._agent.parse === 'function';
        if (parse) this._agent.parse = this._agent.parse.bind(this);
      }
      catch (e) {
        return this.error(e, false, reject);
      }
      finally {
        return resolve();
      }
    });
  }

  /**************
  func: _assignListeners
  params: none
  describe:
    Assign listeners will take the this.lisners objects and assign the appropriate
    lisnter values for the event bus.
  ***************/
  _assignListeners() {
    return new Promise((resolve, reject) => {
      try {
        // set the default listeners for the states of the agent.
        for (let state in this._states) {
          if (typeof this[state] === 'function') {
            this.events.on(`${this._agent.key}:${state}`, packet => {
              return this[state](packet);
            });
          }
        }

        // set the assigned listeners for the agent.
        for (let listener in this.listeners) {
          this.events.on(listener, packet => {
            return this.listeners[listener](packet);
          })
        }
      }
      catch (e) {
        return this.error(e, false, reject);
      }
      finally {
        return resolve();
      }
    });
  }

  // Some elements will inherit the data of the parent. this object will loop over
  // any children data that theis deva has and assign the inherited information.
  /**************
  func: _assignInherit
  params: none
  describe:
    The assign inherit will make sure the Devas in the current Deva have all the
    inherited properties all setup to collaborate efficiently.
  ***************/
  _assignInherit() {
    return new Promise((resolve, reject) => {
      try {
        for (let d in this.devas) {
          this.inherit.forEach(inherit => {
            this.devas[d][inherit] = this[inherit];
          });
        }
      }
      catch (e) {
        return this.error(e, false, reject);
      }
      finally {
        return resolve();
      }
    });
  }

  // General handler for when a method is NOT found from a user command.
  /**************
  func: _methodNotFound
  params:
    - packet: The packet to relay when a method is not found.
  describe:
    The _methodNotFound function allows for additional security by firing
    a specfici program functon every single time a interaction happens wehre a
    method is not located. This assits in security and support by identifying
    troubls or users who may be attemptng to explit features.

    Then we talk a security event that watches all methods and return the packet.

    This will return a not found text string preventing any furhter processing.
  ***************/
  _methodNotFound(packet) {
    packet.a = {
      agent: this._agent || false,
      client: this._client || false,
      text: `${this._messages.method_not_found} - ${packet.q.meta.method} `,
      meta: {
        key: this._agent.key,
        method: packet.q.meta.method,
      },
      created: Date.now(),
    };
    this.state('method_not_found', packet);
    return packet;
  }

  /**************
  func: states
  params: none
  describe: returns the avaiable staets values.
  ***************/
  states() {
    return this._states;
  }

  /**************
  func: state
  params:
    - st: The state flag to set for the Deva that matches to this._states
  describe
  ***************/
  state(st, data=false) {
    if (!Object.keys(this._states).includes(st)) return;
    this._state = `${this._states[st]} | ${this.formatDate(Date.now(), 'short_month', true)}`;
    const _data = {
      id: this.uid(true),
      client: this._client.id,
      agent: this._agent.id,
      st: st,
      state: this._state,
      data,
      created: Date.now(),
    };
    this.prompt(this._state);
    this.talk(`${this._agent.key}:state`, _data);
    return this._state;
  }

  /**************
  func: uid
  params:
    - guid: This is a true false flag for generating a guid.
  describe:
    The uid function can create two types of id for you.
    1. random GUID - this is good for when you need a uinique record id returned
    2. transport id - The transport id is a number generated to provide a
                      numerical number used for transporting records to places
                      like social networks, email, other networks where informaton
                      is shared.
  ***************/
  uid(guid=false) {
    let id;
    if (guid) {
      id = randomUUID()
    }
    else {
      const min = Math.floor(Date.now() - (Date.now() / Math.PI));
      const max = Math.floor(Date.now() + (Date.now() * Math.PI));
      id = Math.floor(Math.random() * (max - min)) + min;
    }
    return id;
  }

  /**************
  func: hash
  params:
    - texts: The text string to create a hash value for.
    - algo: The hashing algorithm to use for hashing. md5, sha256, or sha512

  describe:
    The hash algorithm will take a string of text and produce a hash.
  ***************/
  hash(str, algo=false) {
    algo = algo || this._security.hash || 'md5';
    const the_hash = createHash(algo);
    the_hash.update(str);
    const _digest = the_hash.digest('base64');
    this.state('hash', {
      id: this.uid(true),
      value: _digest,
      client_id: this._client.id,
      agent_id: this._agent.id,
      created: Date.now(),
    });
    return _digest;
  }

  /**************
  func: cipher
  params: str - string to encrypt
  describe:
    The encrypt function allows for the internal encryption of data based on the
    defined client security settings.
  ***************/
  cipher(str) {
    const security = this._security;
    const {password, algorithm} = security.cipher;
    const key = createHash('sha256').update(String(password)).digest('base64');
    const key_in_bytes = Buffer.from(key, 'base64')
    const iv = randomBytes(16);

    // create a new cipher
    const _cipher = createCipheriv(algorithm, key_in_bytes, iv);
    const encrypted = _cipher.update(String(str), 'utf8', 'hex') + _cipher.final('hex');

    this.state('cipher', {
      id: this.uid(true),
      iv,
      key,
      agent_id: this._agent.id,
      client_id: this._client.id,
      created: Date.now()
    });

    return {
      iv: iv.toString('base64'),
      key,
      encrypted,
    }
  }
  decipher(opt) {
    const iv = Buffer.from(opt.iv, 'base64');
    const encrypted = Buffer.from(opt.encrypted, 'hex');
    const key_in_bytes = Buffer.from(opt.key, 'base64')
    const security = this._security;
    const {algorithm} = security.cipher;
    const decipher = createDecipheriv( algorithm, key_in_bytes, iv);
    const decrypted = decipher.update(encrypted);
    const final = Buffer.concat([decrypted, decipher.final()]);
    this.state('decipher', {
      id: this.uid(true),
      iv: opt.iv,
      key: opt.key,
      agent_id: this._agent.id,
      client_id: this._client.id,
      created: Date.now()
    });
    return final.toString();
  }

  /**************
  func: copy
  params: obj
  describe:
    a simple copy object to create a memory clean copy of data to
    prevent collisions when needed. Handles clean text, array, object copy.
    it makes the assumption tha the user is submitting either an array or object
    for copying.
  ***************/
  copy(obj) {
    let v, key;
    const output = Array.isArray(obj) ? [] : {};
    for (key in obj) {
        v = obj[key];
        output[key] = (typeof v === "object") ? this.copy(v) : v;
    }
    return output;
  }
  /**************
  func: talk
  params:
    - evt: The event the Deva is speaking to listen back for on a once event.
    - resource: The payload resource to send with the talk event.
  describe:
    The talk event allows agents to broadcast events that other Deva can listen
    to and make a response. talk events can be then returned with a talk even id
    to create seamless collaboration between Devas.
  ***************/
  talk(evt, resource=false) {
    return this.events.emit(evt, resource);
  }

  /**************
  func: listen
  params:
    - evt:      The vent label to listen for
    - callback: The callback function to run when the event fires.
  describe:
  ***************/
  listen(evt, callback) {
    return this.events.on(evt, callback);
  }

  /**************
  func: once
  params:
    - evt:      The event to listen to for a once call. These event are handy
                when waiting for a key response one time.
    - callback: The callback functoin to run when the event fires.
  describe:
  ***************/
  once(evt, callback) {
    return this.events.once(evt, callback);
  }

  /**************
  func: ignore
  params:
    - evt:      The event you'd like to ignore.
    - callback: a callback function to execute after removing the event from listerns.
  describe:
    The ignore function allow the removal of events that are in the existing devas lister group.
  ***************/
  ignore(evt, callback) {
    return this.events.removeListener(evt, callback);
  }

  /**************
  func: load
  params:
    -deva:      The Deva model to load.
  describe:
    This function will enable fast loading of Deva into a system.
  ***************/
  load(deva) {
    this.state('deva_load');
    this.devas[deva.key] = deva;
    // inherit the data to the new deva.
    this.inherit.forEach(inherit => {
      this.devas[deva.key][inherit] = this[inherit];
    });
    this.state('deva_loaded');
    return Promise.resolve();
  }


  /**************
  func: unload
  params:
    - deva:     The deva key to unload
  describe:     Unload a currently loaded Deva.
  ***************/
  unload(deva) {
    this.state('deva_unload');
    delete this.devas[deva];
    this.state('deva_unloaded');
    return Promise.resolve(`unload:${deva} `);
  }

  /**************
  func: ask
  params: packet
  describe:
    The ask function gives each agent the ability to ask question to other agents
    in the system. When a question is asked the Agent with the question if it
    detect an ask event it will trigger. Then if an Agent with the matching ask
    event is listening they will respond. The question function uses this to
    create integrated communication between itself and other Deva in it's library.

    It can also be used in a custom manner to broadcast ask events inside other coe aswell.

    When the talk has an answer it will respond with a talk event that has the packet id
    so the event is specific to the talk.
  ***************/
  ask(packet) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('ask_question', packet);

    packet.a = {
      agent: this._agent || false,
      client: this._client || false,
      meta: {
        key: this._agent.key,
        method: packet.q.meta.method,
        params: packet.q.meta.params,
      },
      text: false,
      html: false,
      data: false,
      created: Date.now(),
    };

    try {
      if (this.methods[packet.q.meta.method] === undefined) {
        return setImmediate(() => {
          packet.a.text = `INVALID METHOD (${packet.q.meta.method})`;
          this.talk(`${this._agent.key}:ask:${packet.id}`, packet);
        });
      }

      // The method is parsed and depending on what method is asked for it returns
      // the response based on the passed through packet.
      this.methods[packet.q.meta.method](packet).then(result => {
        if (typeof result === 'object') {
          packet.a.text = result.text || false;
          packet.a.html = result.html || false;
          packet.a.data = result.data || false;
        }
        else {
          packet.a.text = result;
        }

        this.state('ask_answer', packet);
        this.talk(`${this._agent.key}:ask:${packet.id}`, packet);
      }).catch(err => {
        this.talk(`${this._agent.key}:ask:${packet.id}`, {error:err.toString()});
        return this.error(err, packet);
      })
    }
    catch (e) {
      this.talk(`${this._agent.key}:ask:${packet.id}`, {error:e.toString()});
      return this.error(e, packet)
    }
    // now when we ask the meta params[0] should be the method
  }

  /**************
  func: question
  example: this.question('#*agent.key *method* *text*')
  example: this.question('#*agent.key* *method* *properties*', {*data*})
  params:
    = TEXT: The text string is the question to process in the current state.
    - DATA: The data is a data array or object that also can be passed to the question.
  describe:
  ***************/
  question(TEXT=false, DATA=false) {
    // check the active status
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('question_me', {text:TEXT, data:DATA});    // set the question me state text TEXT & DATA passed in.
    const id = this.uid();                                // generate a unique id for transport.
    const t_split = TEXT.split(' ');                      // split the text on spaces to get words.

    // check to see if the string is an #ask string to talk to the other Deva.
    const isAsk = t_split[0].startsWith(this.askChr);

    // check to see if the string is a command string to run a local method.
    const isCmd = t_split[0].startsWith(this.cmdChr);

    // Format the packet for return on the request.
    const orig = TEXT;                                    // set the TEXT to orig
    const data = DATA;                                    // set the DATA to data
    const packet = {                                      // create the base q/a packet
      id,                                                 // set the id into packet
      q: {},                                              // create empty q object in packet
      a: {},                                              // create empty a object in packet
      created: Date.now(),                                // timestamp the packet
    };

    let text = TEXT,                                      // let TEXT is text for a manipulation variable
        params = false,                                   // params as false to build params string
        method = 'question',                              // set the default method to question
        key = this._agent.key;                            // set a temporary key from the agent key.

    return new Promise((resolve, reject) => {
      // resolve with the no text message if the client says nothing.
      if (!TEXT) return resolve(this._messages.notext);
      // reject question if Deva offline
      if (!this._active) return resolve(this._messages.offline);

      try {                                               // try to answer the question
        let _state = 'question_default';                  // set temporary question state variable
        let _hash = 'hash_asnwer';                        // set emporary hash state variable
        if (isAsk) {                                      // determine if hte question isAsk
          _state = 'question_ask'                         // if:isAk then set question state
          _state = 'hash_ask'                             // if:isAsk then set hash state
          key = t_split[0].substring(1);                  // if:isAsksplit the agent key and remove first command character
          //if:isAsk use text split index 1 as the parameter block
          params = t_split[1] ? t_split[1].split(':') : false;
          method = params[0];                             // the method to check is then params index 0
          text = t_split.slice(2).join(' ').trim();       // then rejoin the text with spaces.
        }
        else if (isCmd) {                                 // determine if the question is a command
          _state = 'question_command';                    // if:isCmd set question state
          _hash = 'hash_command'                          // if:isCmd set hash state
          //if:isCmd use text split index 1 as the parameter block
          params = t_split[1] ? t_split[1].split(':') : false;
          method = t_split[0].substring(1);               // if:isCmd use the 0 index as the command
          text = t_split.slice(1).join(' ').trim();       // if:isCmd rejoin the string on the space after removing first index
        }

        packet.q = {                                      // build packet.q container
            agent: this._agent || false,                  // set the agent
            client: this._client || false,                // set the client
            meta: {                                       // build the meta container
              key,                                        // set the key variable
              orig,                                       // set orig text to track chances
              method,                                     // set method to track function use
              params,                                     // set any params that are associated
            },
            text,                                         // set the text after it has been modified form orig
            data,                                         // set the data object
            created: Date.now(),                          // timestamp the question
        }

        this.state('hash_question');                      // set the has question state
        // hash the question
        packet.q.meta.hash = this.hash(JSON.stringify(packet.q));

        this.state(_state, packet);                       // set the state to teh _state variable

        if (isAsk) {                                      // isAsk check if the question isAsk and talk
          this.state('question_asking');                  // if:isAsk set state to question asking
          this.talk(`${key}:ask`, packet);                // if:isAsk talk the event to theother Deva
          // if: isAsk wait for the once event which is key'd to the packet ID for specified responses
          this.once(`${key}:ask:${packet.id}`, answer => {
            return resolve(answer);                       // if:isAsk resolve the answer from the call
          });
        }

        else {                                            // else: answer tue question locally
          this.state('question_answering');
          // check if method exists and is of type function
          if (this.methods[method] && typeof this.methods[method] !== 'function') {
            return resolve(this._methodNotFound(packet)); // resolve method not found if check if check fails
          }
          // Call the local method to process the question based the extracted parameters
          return this.methods[method](packet).then(result => {
            // check the result for the text, html, and data object.
            // this is for when answers are returned from nested Devas.
            const text = typeof result === 'object' ? result.text : result;
            const html = typeof result === 'object' ? result.html : result;
            // if the data passed is NOT an object it will FALSE
            const data = typeof result === 'object' ? result.data : false;
            packet.a = {                                  // setup the packet.a container
              agent: this._agent || false,                // set the agent who answered the question
              client: this._client || false,              // set the client asking the question
              meta: {                                     // setup the answer meta container
                key: this._agent.key,                     // set the agent key inot the meta
                method,                                   // set the method into the meta
                params,                                   // set the params into the meta
              },
              text,                                       // set answer text
              html,
              data,
              created: Date.now(),
            };
            // create a hash for the answer and insert into answer meta.
            this.state(_hash);
            packet.a.meta.hash = this.hash(JSON.stringify(packet.a));
            // create a hash for entire packet and insert into packet
            this.state('hash_packet');
            // hash the entire packet.
            packet.hash = this.hash(JSON.stringify(packet));
            this.state('question_answer', packet);        // set the question answer state
            return resolve(packet);                       // resolve the packet to the caller.
          }).catch(err => {                               // catch any errors in the method
            return this.error(err, packet, reject);       // return this.error with err, packet, reject
          });
        }
      }
      catch(e) {                                          // try block error trap
        return this.error(e);                             // if a overall error happens this witll call this.error
      }
    });
  }

  /**************
  func: init
  params: client - the client data to use that is provided by the clients.
  describe:
    The main init interface where the chain begins. Where the states fire for
    each process of setting:
    1. Set the Max listeners to control event memory buffer.
    2. Assign the Interited Properties
    3. Assign binding functions and methods to 'this' scoe.
    4. Assign any listeners for additional functionality.
    5. run the onInit custom function if preset or the system start function.
    6. The system start function will create a chain reaction of states that load.
    7. If there is an error the init function rejects the call.
  usage: this.init(client_object)
  ***************/
  init(client) {
    // set client
    this.Client = client;


    this._active = Date.now();
    return new Promise((resolve, reject) => {
      this.events.setMaxListeners(this.maxListeners);
      this._assignInherit().then(() => {
        return this._assignBind();
      }).then(() => {
        return this._assignListeners();
      }).then(() => {
        this.state('init');

        this.Security = client;
        this.Support = client;
        this.Services = client;
        this.Systems = client;
        this.Solutions = client;
        this.Development = client;
        this.Assistant = client;
        this.Business = client;
        this.Legal = client;

        return this.onInit && typeof this.onInit === 'function' ? this.onInit() : this.start();
      }).then(started => {
        return resolve(started)
      }).catch(err => {
        return this.error(err, client, reject);
      });
    });
  }

  /**************
  func: error
  params:
    - err: The error to process
    - data: Any additional data associated with the error
    - reject: An associated promise reject if the caller requires.
  describe:
    The erro function rpovides the consistent error manage of the system.
  usage: this.error(err, data, reject);
  ***************/
  error(err,data=false,reject=false) {
    this.state('error', {err, data});                           // set the state to error
    // check fo rthe custom onError function in the agent.
    if (this.onError && typeof this.onError === 'function') return this.onError(err, data, reject);
    else {
      console.log(':::::: ERROR :::::::');
      console.log(err);
      console.log('\n::::::::::::::::::::\n');
      return reject ? reject(err) : err;
    }
  }

  /**************
  func: start
  params:
    - msg: the message for use when using custome flow logic to pass to onEnter
  describe:
    The start function begins the process by setting the state to start setting
    the active to the current datetime and then checking for a custom onStart
    function or running the system enter function.
  usage: this.start('msg')
  ***************/
  start(msg=false) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('start');
    return this.onStart && typeof this.onStart === 'function' ? this.onStart() : this.enter(this._messages.start);
  }

  /**************
  func: stop
  params:
    - msg: hte message from the caller incase need to use in calls
  describe:
    The stop function will stop the Deva by setting the active status to false,
    and the state to stop. From here it will check for a custom onStop function
    for anything to run, or run the system exit function.

    If the deva is offline it will return the offline message.
  usage:
    this.stop('msg')
  ***************/
  stop(msg=false) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('stop');
    this._active = false;
    return this.onStop && typeof this.onStop === 'function' ? this.onStop() : this.exit(this._messages.stop);
  }

  /**************
  func: enter
  params:
    - msg: hte message from the caller incase need to use in calls
  describe:
    The ener function will check the actie status of the Deva and set it to
    offline or enter.

    If the Deva is offline it will return the offline message.
  usage: this.enter('msg')
  ***************/
  enter(msg=false) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('enter');
    return this.onEnter && typeof this.onEnter === 'function' ? this.onEnter() : this.done(this._messages.enter)
  }

  /**************
  func: exit
  params:
    - msg: hte message from the caller incase need to use in calls
  describe:
    The exit state function is triggered when the Deva is exiting it's online
    status and setting the state to exit for things like security check.

    The return will check for a custom onExit function or run the system done
    function.

    If the deva is offline it will return the offline message.
  usage: this.exit('msg')
  ***************/
  exit(msg=false) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('exit');
    this._active = false;
    return this.onExit && typeof this.onExit === 'function' ? this.onExit() : Promise.resolve(this._messages.exit)
  }

  /**************
  func: done
  params:
  - msg: hte message from the caller incase need to use in calls
  describe:
    When the done function is triggered the system will also set the state
    of hte Deva to done.

    If the deva is offline it will return the offline message.
  usage: this.done('msg')
  ***************/
  done(msg=false) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('done');
    msg = msg ? msg : this._state;
    return this.onDone && typeof this.onDone === 'function' ? this.onDone() : Promise.resolve({text:this._messages.done,prompt:this._agent.prompt})
  }

  /**************
  func: status
  params:
    - msg: The msg is any additonal string to append to the end of hte call.
  describe:
    The status function provides an easy way to get the current status of a Deva
    and append custom status messages that may pertain to any custom status call.

    If the deva is offline it will return the offline message.
  usage: this.status('msg')
  ***************/
  status(msg=false) {
    // check the active status
    if (!this._active) return Promise.resolve(this._messages.offline);
    // format the date since active for output.
    const dateFormat = this.formatDate(this._active, 'long', true);
    // create the text msg string
    let text = `${this.features.systems.label}:STATUS ${this._agent.profile.name} active since ${dateFormat}`;
    if (msg) text = text + `\n${msg}`;                      // append the msg string if msg true.
    return text;                                            // return final text string
  }

  /**************
  func: prompt
  params:
    - text: The text string to send to the prompt.
  describe:-
    The prompt function is used to broadcasat a global prompt event with a string. Thsi is handy when passing events between a cli and user interface for example.

  usage: this.prompt('text')
  ***************/
  prompt(text) {
    // Talk a global prompt event for the client
    return this.talk(`prompt`, {text, agent:this._agent});
  }

  /**************
  func: client
  params: none
  describe:
    this function allows state management for when client prfioe is
    being accessed.
  usage: this.client();
  ***************/
  client() {
    if (!this._active) return this._messages.offline;    // check the active status
    this.state('client');                                // set the client state
    return this._client;                                 // return the client feature
  }

  /**************
  func: agent
  params: none
  describe:
    this function allows statement management for when client prfioe is
    being accessed.
  usage: this.agent()
  ***************/
  agent() {
    if (!this._active) return this._messages.offline;
    this.state('agent');
    return this._agent;
  }

  /**************
  func: security
  params: none
  describe: basic security features available in a Deva.
  usage: this.security()
  ***************/
  security() {
    if (!this._active) return this._messages.offline;    // check the active status
    this.state('security');                              // set the security state
    return this._security;                               // return the security feature
  }

  /**************
  func: support
  params: none
  describe: basic support features available in a Deva.
  usage: this.support()
  ***************/
  support() {
    if (!this._active) return this._messages.offline;   // check the active status
    this.state('support');                              // set the support state
    return this._support;                               // return the support feature
  }

  /**************
  func: services
  params: none
  describe: basic services features available in a Deva.
  usage: this.services()
  ***************/
  services(opts) {
    if (!this._active) return this._messages.offline;   // check the active status
    this.state('services');                             // set the services state
    return this._services;                              // return the services feature
  }

  /**************
  func: systems
  params: opts
  describe: basic systems features available in a Deva.
  usage: this.systems()
  ***************/
  systems(opts) {
    if (!this._active) return this._messages.offline;   // check the active status
    this.state('systems');                              // set the systems state
    return this._systems;                               // return the systems feature
  }

  /**************
  func: solutions
  params: opts
  describe: basic solutions features available in a Deva.
  usage: this.solutions()
  ***************/
  solutions(opts) {
    if (!this._active) return this._messages.offline;   // check the active status
    this.state('solutions');                            // set the solutions state
    return this._solutions;                             // return the solutions feature
  }

  /**************
  func: development
  params: opts
  describe: basic development features available in a Deva.
  ***************/
  development(opts) {
    if (!this._active) return this._messages.offline;   // chek the active status
    this.state('development');                          // set the development state
    return this._development;                           // return development feature
  }

  /**************
  func: assistant
  params: opts
  describe: basic assistant features available in a Deva.
  ***************/
  assistant(opts) {
    if (!this._active) return this._messages.offline;   // chek the active status
    this.state('assistant');                            // set the assistant state
    return this._assistant;                             // return assistant feature
  }

  /**************
  func: business
  params: opts
  describe: basic business features available in a Deva.
  ***************/
  business(opts) {
    if (!this._active) return this._messages.offline;   // chek the active status
    this.state('business');                             // set the business state
    return this._business;                              // return business feature
  }

  /**************
  func: legal
  params: opts
  describe: basic legal features available in a Deva.
  ***************/
  legal(opts) {
    if (!this._active) return this._messages.offline;   // chek the active status
    this.state('legal');                                // set the legal state
    return this._legal;                                 // return legal feature
  }

  /**************
  func: startDevas
  params: none
  describe:
    Start Devas will initialize the Deva agents inside this curent Deva.
  ***************/
  startDevas(client) {
    const _client = this.copy(client);                  // copy the client data
    this.state('devas_start');                          // set the devas start state
    return new Promise((resolve, reject) => {
      const devas = [];                                 // create devas index
      for (let x in this.devas) {
        devas.push(this.devas[x].init(_client));        // push the to devas index
      }
      Promise.all(devas).then(() => {
        this.state('devas_ready');                      // set to ready state
        return resolve({                                // return the response
          text:this._messages.devas_started,            // include started state message
          prompt:this._agent.prompt,                    // include agent prompt settings
        });
      }).catch(err => {                                 // catch any errors
        return this.error(err, client, reject);         // send to error handler.
      });
    });
  }
  /**************
  func: stpDevas
  params: none
  describe:
    stopDevas will stop all the devas running in the current Deva.
  ***************/
  stopDevas() {
    this.state('devas_stop');                           // set the  devas stop state
    return new Promise((resolve, reject) => {
      const devas = [];                                 // create empty devas index
      for (let x in this.devas) {
        devas.push(this.devas[x].stop());               // push the deva to devas index
      }
      Promise.all(devas).then(() => {
        this.state('devas_stoped');                     // set the deva stopped state
        return resolve({
          text: this._messages.devas_stopped,           // include stopped state message
          prompt: this._agent.prompt,                   // include agent prompt settings
        });
      }).catch(err => {                                 // catch any errors
        return this.error(err, false, reject);          // send to error handler
      });
    });
  }

  // UTILITY FUNCTIONS
  /**************
  func: formatDate
  params:
    - d: The date string to format.
    - format: the various formats that can be selected.
    - time: boolean flag to include the time stampt iwth the date.
    - locale: The locale formatting of the date to return.
  describe:
    formats: long, long_month, short, short_month, year, month, day
    FDate format ensures that consistent date formatting is used within the
    system based on the language and locale in the client profile.
  ***************/
  formatDate(d, format='milli', time=false) {
    if (!d) d = Date.now();
    d = new Date(d);

    if (format === 'milli') return d.getTime();
    // pre-set date formats for returning user dates.
    const formats = {
      long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      long_month: { year: 'numeric', month: 'long', day: 'numeric'},
      short: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
      short_month: { year: 'numeric', month: 'short', day: 'numeric' },
      numeric: { year: 'numeric', month: 'numeric', day: 'numeric' },
      year: { year: 'numeric' },
      month: { month: 'long' },
      day: { day: 'long' },
      log: { year: 'numeric', month: 'short', day: 'numeric' },
    };
    const theDate = d.toLocaleDateString(this._client.locale, formats[format]);
    const theTime = this.formatTime(d);
    return !theTime ? theDate : `${theDate} - ${theTime}`;
  }

  /**************
  func: formatTime
  params:
    - t: the time to format
  describe:
    The formatTime fucntion will return a consistent local time for the t
    parameter based on the locale setting in the client profile..
  ***************/
  formatTime(t) {
    return t.toLocaleTimeString(this._client.locale);     // return the formatted time string
  }

  /**************
  func: formatCurrency
  params:
    - n: is the number that you want to return the currency of.
  describe:
    The formatCurrency function will format a currency value based on the setting
    in the client profile.
  ***************/
  formatCurrency(n) {
    return new Intl.NumberFormat(this._client.locale, { style: 'currency', currency: this._client.currency }).format(n);
  }

  /**************
  func: formatPerdent
  params:
    - n: is the number that you want to format as a percent.
    - dec: is the number of decimal places to apply to the number.
  describe:
  ***************/
  formatPerdent(n, dec=2) {
    return parseFloat(n).toFixed(dec) + '%';
  }

}
module.exports = Deva;
