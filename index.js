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
    this._message = 'offline';                          // current state of agent.
    this._active = false;                               // the active/birth date.
    this._security = false;                             // inherited Security features.
    this._support = false;                              // inherited Support features.
    this._services = false;                             // inherited Service features.
    this._business = false;                             // inherited Business features.
    this._development = false;                          // inherited Business features.
    this._legal = false;                                // inherited Legal features.
    this._story = false;                            // inherited Assistant features.
    this.events = opts.events || new EventEmitter({});  // Event Bus
    this.lib = opts.lib || {};                          // used for loading library functions
    this.devas = opts.devas || {};                      // Devas which are loaded
    this.vars = opts.vars || {};                        // Variables object
    this.listeners = opts.listeners || {};              // local Listeners
    this.modules = opts.modules || {};                  // 3rd Party Modules
    this.func = opts.func || {};                        // local Functions
    this.methods = opts.methods || {};                  // local Methods
    this.maxListeners = opts.maxListenners || 0;        // set the local maxListeners

    // prevent overwriting existing functions and variables with same name
    for (var opt in opts) {
      if (!this[opt] || !this[`_${opt}`]) this[opt] = opts[opt];
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

    this._state = 'offline';                            // current state of agent.
    this._states = {
      ask: `asked another Deva`,
      question: `was asked a question`,
      answer: `offered an answer`,

      offline: `is Offline`,
      online: `is Online`,

      init: `Initialize`,
      start: `start your journey`,
      enter: `enter deva.world`,
      stop: `stop what you are doing`,
      exit: 'exit deva.world',
      load: 'load Deva',
      unload: 'unload Deva',

      invalid: 'State Invalid',
      done: 'State Done',
      error: 'State Error',
    };                                  // states object

    this._zone = false;                            // current state of agent.
    this._zones = {
      deva: 'Deva Zone',
      config: 'Configuration Zone',
      features: 'Feature Zone',
      idle: 'Idle Zone',
      train: 'Training Zone',
      work: 'Working Zone',
      invalid: 'Invalid Invalid',
      done: 'Done Zone',
      error: 'Error Zone',
    };                                  // states object

    this._action = false;
    this._actions = {
      wait: 'wait',
      question: 'question',
      question_ask: 'question:ask',
      question_ask_answer: 'returned with an answer',
      question_cmd: 'question:cmd',
      question_method: 'question:method',
      question_talk: 'question:talk',
      question_hash: 'question:hash',
      question_answer: 'question:answer',
      question_done: 'question:done',
      answer: 'answer',
      answer_hash: 'hashing the answer',
      answer_talk: 'sharing the answer',
      ask: 'asking',
      ask_answer: 'answering',
      security: 'security',
      Security: 'Security Feature',
      support: 'support',
      Support: 'Support Feature',
      systems: 'systems',
      Systems: 'Systems Feature',
      services: 'services',
      Services: 'Services Feature',
      solutions: 'solutions',
      Solutions: 'Solutions Feature',
      development: 'development',
      Development: 'Development Feature',
      business: 'business',
      Business: 'Business Feature',
      legal: 'legal',
      Legal: 'Legal Feature',
      assistant: 'assistant',
      Assistant: 'Assistant Feature',
      story: 'story',
      Story: 'Story Feature',
      mind: 'mind',
      Mind: 'Mind Feature',
      client_data: 'Client Data',
      invalid: 'Actin Invalid',
      error: 'Action Error',
      done: 'Action Done',
    }

    this._feature = false;
    this._features = {
      security: 'security',
      Security: 'Security Feature',
      support: 'support',
      Support: 'Support Feature',
      services: 'services',
      Services: 'Servicees Feature',
      solutions: 'solutions',
      Solutions: 'Solutions Feature',
      systems: 'systems',
      Systems: 'Systems Feature',
      development: 'development',
      Development: 'Development Feature',
      business: 'business',
      Business: 'Business Feature',
      legal:'legal',
      Legal:'Legal Feature',
      assistant: 'assistant',
      Assistant: 'Assistant Feature',
      story: 'story',
      Story: 'Story Feature',
      mind: 'mind',
      Mind: 'Mind Feature',
      error: 'Feature Error',
      done: 'Feature Done',
    };

    this._messages = {
      states: {
        offline: `${this._agent.profile.name} ${this._states.offline}`,
        online: `${this._agent.profile.name} ${this._states.online}`,
        ask: `😎 ${this._agent.profile.name} ${this._states.ask}`,
        question: `🎙️ ${this._agent.profile.name} ${this._states.question}`,
        answer: `🎟️  ${this._agent.profile.name} ${this._states.answer}`,
        offline: `${this._agent.profile.name} ${this._states.offline}`,
        online: `${this._agent.profile.name} ${this._states.online}`,
        init: `🚀 ${this._agent.profile.name} ${this._states.init}`,
        start: `🎬 ${this._agent.profile.name} ${this._states.start}`,
        enter: `📲 ${this._agent.profile.name} ${this._states.enter}`,
        stop: `✋ ${this._agent.profile.name} ${this._states.stop}`,
        exit: `🚪 ${this._agent.profile.name} ${this._states.exit}`,
        load: `📫 ${this._agent.profile.name} ${this._states.load}`,
        unload: `📭 ${this._agent.profile.name} ${this._states.unload}`,
        uid: `${this._agent.profile.name} ${this._states.uid}`,
        hash: `${this._agent.profile.name} ${this._states.hash}`,
        cipher: `${this._agent.profile.name} ${this._states.cipher}`,
        decipher: `${this._agent.profile.name} ${this._states.decipher}`,
        invalid: `⚠️ ${this._agent.profile.name} ${this._states.invalid}`,
        done: `✅ ${this._agent.profile.name} ${this._states.done}`,
        error: `❌ ${this._states.error}`,
      },
      zones: {
        deva: `🎉 ${this._agent.profile.name} entered the ${this._zones.deva}`,
        config: `💪 ${this._agent.profile.name} is in the ${this._zones.config}`,
        features: `🍿 ${this._agent.profile.name} entered the ${this._zones.features}`,
        idle: `🥱 ${this._agent.profile.name} is stuck in the ${this._zones.idle}`,
        train: `👨‍🎓 ${this._agent.profile.name} is learning in the ${this._zones.train}`,
        work: `😓 ${this._agent.profile.name} is handling things in the ${this._zones.work}`,
        invalid: `⚠️ ${this._agent.profile.name} fell into the ${this._zones.invalid}`,
        done: `✅ ${this._agent.profile.name} and here we are in the ${this._zones.done}`,
        error: `❌ ${this._agent.profile.name} fell into the ${this._zones.error}`,
      },
      actions: {
        wait: `😵‍💫 ${this._agent.profile.name} ${this._actions.wait}`,
        question: `👀 ${this._agent.profile.name} ${this._actions.question}`,
        question_ask: `👥 ${this._agent.profile.name} ${this._actions.question_ask}`,
        question_ask_answer: `📣 ${this._agent.profile.name} ${this._actions.question_ask_answer}`,
        question_cmd: `🎮 ${this._agent.profile.name} issued a command`,
        question_method: `🏄‍♂️ ${this._agent.profile.name} ${this._actions.question_method}`,
        question_talk: `📢 ${this._agent.profile.name} ${this._actions.question_talk}`,
        question_hash: `#️⃣  ${this._agent.profile.name} is hashing a question`,
        question_answer: `🎙️ ${this._agent.profile.name} ${this._actions.question_answer}`,
        question_done: `👍 ${this._agent.profile.name} ${this._actions.question_done}`,
        answer: `🎟️  ${this._agent.profile.name} shared the ${this._actions.answer}`,
        answer_talk: `🎟️  ${this._agent.profile.name} is talking the ansnwer for anyone listening `,
        ask: `👥 ${this._agent.profile.name} is asking`,
        ask_answer: `🎟️  ${this._agent.profile.name} is answering the ask`,

        security: `${this._actions.security} is responding`,
        Security: `${this._actions.Security} is ready`,
        support: `${this._actions.support} is responding`,
        Support: `${this._actions.Support} is ready`,
        services: `${this._actions.Services} is responding`,
        Services: `${this._actions.Services} is ready`,
        solutions: `${this._actions.solutions} is responding`,
        Solutions: `${this._actions.Solutions} is ready`,
        solutions: `${this._actions.Systems} is responding`,
        Systems: `${this._actions.Systems} is ready`,
        development: `${this._actions.Development} is responding`,
        Development: `${this._actions.Development} is ready`,
        business: `${this._actions.Business} is responding`,
        Business: `${this._actions.Business} is ready`,
        legal: `${this._actions.Legal} is responding`,
        Legal: `${this._actions.Legal} is ready`,
        assistant: `${this._actions.Assistant} is responding`,
        Assistant: `${this._actions.Assistant} is ready`,
        story: `${this._actions.Story} is responding`,
        Story: `${this._actions.Story} is ready`,
        mind: `${this._actions.Mind} is responding`,
        Mind: `${this._actions.Mind} is ready`,
        client_data: `📂 ${this._agent.profile.name} setting Client Data`,
        invalid: `${this._actions.invalid}`,
        done: `✅ ${this._actions.done}`,
        error: `${this._action.error}`,
      },
      features: {
        security: `${this._features.security} is protecting`,
        Security: `${this._features.Security} loading...`,
        support: `${this._features.support} is caring`,
        Support: `${this._features.Support} loading...`,
        services: `${this._features.services} is servicing`,
        Services: `${this._features.Services} loading...`,
        solutions: `${this._features.solutions} is solving`,
        Solutions: `${this._features.Solutions} loading...`,
        systems: `${this._features.systems} is mantaining`,
        Systems: `${this._features.Systems} loading...`,
        development: `${this._features.development} is developing`,
        Development: `${this._features.Development} loading...`,
        business: `${this._features.business} is successful`,
        Business: `${this._features.Business} loading...`,
        legal: `${this._features.legal} is upholding the law`,
        Legal: `${this._features.Legal} loading...`,
        assistant: `${this._features.assistant} is assisting`,
        Assistant: `${this._features.Assistant} loading...`,
        story: `${this._features.story} is creating`,
        Story: `${this._features.Story} loading...`,
        mind: `${this._features.story} is thinking and pondering`,
        Mind: `${this._features.Mind} loading...`,
        invalid: `⚠️ ${this._features.invalid}`,
        done: `✅ ${this._features.done}`,
        error: `❌ ${this._features.error}`,
      },
    };                                // messages object
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
  Client(client) {
    this.action('client_data');
    const _client = this.copy(client);                // copy the client parameter
    this._client = _client;                           // set local _client to this scope
    return Promise.resolve();
  }

  /**************
  func: Security
  params: client: false
  describe:
    The Security feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Security() {
    this.feature('Security');
    const _cl = this.client();
    try {
      if (!_cl.features.security) return this.Support();
      else {
        this.action('Security');
        const {id, profile, features} = _cl;            // make a copy the clinet data.
        const {security} = features;                    // make a copy the clinet data.
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
        delete this._client.features.security           // make a copy the clinet data.
        return this.Support();
      }
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Support
  params: client: false
  describe:
    The Support feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Support() {
    this.feature('Support');                  // set state to support setting
    const _cl = this.client();
    try {
      if (!_cl.features.support) return this.Services()
      else {
        this.action('Support');
        const {id, features, profile} = _cl;            // set the local consts from client copy
        const {support} = features;                     // set support from features const
        this._support = {                               // set this_support with data
          id: this.uid(true),                           // uuid of the support feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          concerns: support.concerns,                   // any concerns for client
          global: support.global,                       // the global policies for client
          personal: support.devas[this._agent.key]      // Client personalSecurity features and rules.
        };
        delete this._client.features.support
        return this.Services();
      }
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Services
  params: client: false
  describe:
    The Services feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Services() {
    this.feature('Services');                 // set state to security setting
    const _cl = this.client();
    try {
      if (!_cl.features.services) return this.Systems();
      else {
        this.action('Services')
        const {id, features, profile} = _cl;   // set the local consts from client copy
        const {services} = features;                    // set services from features const
        this._services = {                              // set this_services with data
          id: this.uid(true),                           // uuid of the services feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          concerns: services.concerns,                  // any concerns for client
          global: services.global,                      // the global policies for client
          personal: services.devas[this._agent.key]     // Client personal features and rules.
        };
        delete this._client.features.services
        return this.Systems()
      }
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Systems
  params: client: false
  describe:
    The Systems feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Systems() {
    this.feature('Systems');                  // set state to systems setting
    const _cl = this.client();
    try {
      if (!_cl.features.systems) return this.Solutions();
      else {
        this.action('Systems');
        const {id, features, profile} = _cl;   // set the local consts from client copy
        const {systems} = features;                     // set systems from features const
        this._systems = {                               // set this_systems with data
          id: this.uid(true),                           // uuid of the systems feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          concerns: systems.concerns,                   // any concerns for client
          global: systems.global,                       // the global policies for client
          personal: systems.devas[this._agent.key]      // Client personal features and rules.
        };
        delete this._client.features.systems
        return this.Solutions()
      }
    } catch (e) {
      // run error handling if an error is caught
      this.action('error');
      this.feature('error');
      return this.error(e)
    }
  }

  /**************
  func: Solutions
  params: client: false
  describe:
    The Solutions feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Solutions() {
    this.feature('Solutions');                // set state to solutions setting
    const _cl = this.client();
    try {
      if (!_cl.features.solutions) return this.Development();
      else {
        this.action('Solutions');
        const {id, features, profile} = _cl;   // set the local consts from client copy
        const {solutions} = features;                   // set solutions from features const
        this._solutions = {                             // set this_solutions with data
          id: this.uid(true),                           // uuid of the solutions feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          concerns: solutions.concerns,                 // any concerns for client
          global: solutions.global,                     // the global policies for client
          personal: solutions.devas[this._agent.key]    // Client personal features and rules.
        };
        delete this._client.features.solutions
        return this.Development()
      }
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Development
  params: client: false
  describe:
    The Development feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Development() {
    this.feature('Development');              // set state to development setting
    const _cl = this.client();
    try {
      if (!_cl.features.development) return this.Business();
      else {
        this.action('Development');
        const {id, features, profile} = _cl;   // set the local consts from client copy
        const {development} = features;                 // set development from features const
        this._development = {                           // set this_development with data
          id: this.uid(true),                           // uuid of the development feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          concerns: development.concerns,               // any concerns for client
          global: development.global,                   // the global policies for client
          personal: development.devas[this._agent.key]  // Client personal features and rules.
        };
        delete this._client.features.development
        return this.Business()
      }
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Business
  params: client: false
  describe:
    The Business feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Business(client=false) {
    this.feature('Business');                 // set state to business setting
    const _cl = this.client();
    try {
      if (!_cl.features.business) return this.Legal();
      else {
        this.action('Business');
        const {id, features, profile} = _cl;   // set the local consts from client copy
        const {business} = features;                    // set business from features const
        this._business = {                              // set this_business with data
          id: this.uid(true),                           // uuid of the business feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          concerns: business.concerns,                  // any concerns for client
          global: business.global,                      // the global policies for client
          personal: business.devas[this._agent.key]     // Client personal features and rules.
        };
        delete this._client.features.business
        return this.Legal();
    }
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Legal
  params: client: false
  describe:
    The Legal feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Legal() {
    this.feature('Legal');                    // set state to legal setting
    const _cl = this.client();
    try {
      if (!_cl.features.legal) this.Assistant();
      else {
        this.action('Legal');
        const {id, features, profile} = _cl;   // set the local consts from client copy
        const {legal} = features;                       // set legal from features const
        this._legal = {                                 // set this_legal with data
          id: this.uid(true),                           // uuid of the legal feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          concerns: legal.concerns,                     // any concerns for client
          global: legal.global,                         // the global policies for client
          personal: legal.devas[this._agent.key]        // Client personal features and rules.
        };
        delete this._client.features.legal;
        return this.Assistant();
      }
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Assistant
  params: client: false
  describe:
    The Assistant feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Assistant(client=false) {
    this.feature('Assistant');                 // set state to assistant setting
    const _cl = this.client();
    try {
      if (!_cl.features.assistant) return this.Done();
      else {
        this.action('Assistant');
        const {id, features, profile} = _cl;        // set the local consts from client copy
        const {assistant} = features;                    // set assistant from features const
        this._assistant = {                              // set this_assistant with data
          id: this.uid(true),                           // uuid of the assistant feature
          client_id: id,                                // client id for reference
          client_name: profile.name,                    // client name for personalization
          concerns: assistant.concerns,                  // any concerns for client
          global: assistant.global,                      // the global policies for client
          personal: assistant.devas[this._agent.key]     // Client personal features and rules.
        };
        delete this._client.features.assistant;
        return this.Story();
      }
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Story
  params: client: false
  describe:
    The Story feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Story(client=false) {
    this.feature('Story');                 // set state to story setting
    const _cl = this.client();
    try {
      if (!this._client.features.story) return this.Mind();
      else {
        this.action('Story');
        const {id, features, profile} = this._client;       // set the local consts from client copy
        const {story} = features;                           // set story from features const
        this._story = {                                     // set this_story with data
          id: this.uid(true),                               // uuid of the story feature
          client_id: id,                                    // client id for reference
          client_name: profile.name,                        // client name for personalization
          concerns: story.concerns,                         // any concerns for client
          global: story.global,                             // the global policies for client
          personal: story.devas[this._agent.key]            // Client personal features and rules.
        };
        delete this._client.features.story;
        return this.Mind();
      }
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Mind
  params: client: false
  describe:
    The Mind feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Mind(client=false) {
    this.feature('Mind');                 // set state to story setting
    const _cl = this.client();
    try {
      if (!_cl.features.mind) return this.Done();
      else {
        this.action('Mind');
        const {id, features, profile} = _cl;       // set the local consts from client copy
        const {mind} = features;                           // set mind from features const
        this._mind = {                                     // set this_mind with data
          id: this.uid(true),                               // uuid of the mind feature
          client_id: id,                                    // client id for reference
          client_name: profile.name,                        // client name for personalization
          concerns: mind.concerns,                         // any concerns for client
          global: mind.global,                             // the global policies for client
          personal: mind.devas[this._agent.key]            // Client personal features and rules.
        };
        delete this._client.features.mind;
        return this.Done();
      }
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e)                             // run error handling if an error is caught
    }
  }

  /**************
  func: Done
  params: none
  describe: The end of the workflow Client Feature Workflow
  ***************/
  Done() {
    return new Promise((resolve, reject) => {
      try {
        delete this._client.features;               // delete the features key when done.
        this.action('done');                 // set state to assistant setting
        this.feature('done');                 // set state to assistant setting
        return resolve();
      } catch (e) {
        this.feature('error')
        return this.error(e, false, reject);
      }
    });
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
        return resolve();
      }
      catch (e) {
        return this.error(e, false, reject);
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
        return resolve();
      }
      catch (e) {
        return this.error(e, false, reject);
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
      agent: this.agent() || false,
      client: this.client() || false,
      text: `${this._messages.method_not_found}`,
      meta: {
        key: this._agent.key,
        method: packet.q.meta.method,
      },
      created: Date.now(),
    };
    this.state('method_not_found');
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
    this.listeners[evt] = callback;
    return this.events.on(evt, packet => {
      return this.listeners[evt](packet);
    });
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
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    const id = this.uid();                                // generate a unique id for transport.
    const t_split = TEXT.split(' ');                      // split the text on spaces to get words.
    this.state('question');
    this.action('question', id);

    // check to see if the string is an #ask string to talk to the other Deva.
    const isAsk = t_split[0].startsWith(this.askChr);

    // check to see if the string is a command string to run a local method.
    const isCmd = t_split[0].startsWith(this.cmdChr);

    // Format the packet for return on the request.
    const orig = TEXT;                                    // set the TEXT to orig
    const data = DATA;                                    // set the DATA to data
    const packet = {                                      // create the base q/a packet
      id,                                                 // set the id into packet
      q: false,                                              // create empty q object in packet
      a: false,                                              // create empty a object in packet
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
      if (!this._active) return resolve(this._messages.states.offline);
      let _action = 'question_method'
      try {                                               // try to answer the question
        if (isAsk) {                                      // determine if hte question isAsk
          _action = 'question_ask';
          key = t_split[0].substring(1);                  // if:isAsksplit the agent key and remove first command character
          //if:isAsk use text split index 1 as the parameter block
          params = t_split[1] ? t_split[1].split(':') : false;
          method = params[0];                             // the method to check is then params index 0
          text = t_split.slice(2).join(' ').trim();       // then rejoin the text with spaces.
        }
        else if (isCmd) {                                 // determine if the question is a command
          _action = 'question_cmd';
          //if:isCmd use text split index 1 as the parameter block
          params = t_split[0] ? t_split[0].split(':').slice(1) : false;
          method = t_split[0].substring(1);               // if:isCmd use the 0 index as the command
          text = t_split.slice(1).join(' ').trim();       // if:isCmd rejoin the string on the space after removing first index
        }
        else {
        }

        packet.q = {                                      // build packet.q container
            id: this.uid(),
            agent: this.agent() || false,                  // set the agent
            client: this.client() || false,                // set the client
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

        // hash the question
        this.action('question_hash');                      // set the has question state
        packet.q.meta.hash = this.hash(JSON.stringify(packet.q));

        this.action(_action);
        this.talk('devacore:question', this.copy(packet));         // global question event make sure to copy data.

        if (isAsk) {                                      // isAsk check if the question isAsk and talk
          this.state('ask');
          // if: isAsk wait for the once event which is key'd to the packet ID for specified responses
          this.talk(`${key}:ask`, this.copy(packet));
          this.once(`${key}:ask:${packet.id}`, answer => {
            this.action('question_ask_answer');
            return resolve(answer);                       // if:isAsk resolve the answer from the call
          });
        }
        else {                                            // else: answer tue question locally
          this.action('ask_answer');
          return this.answer(packet, resolve, reject);
        }
      }
      catch(e) {                                          // try block error trap
        this.action('error');
        return this.error(e);                             // if a overall error happens this witll call this.error
      }
    });
  }

  /**************
  func: answer
  params:
    - packet
    - resolve
    - reject
  describe:
    The answer function is called from the question fuction to return an answer
    from the agent from the pre-determined method.
  ***************/
  answer(packet, resolve, reject) {
    if (!this._active) return Promise.resolve(this._messages.states.offline);

    this.state('answer');
    // check if method exists and is of type function
    const {method,params} = packet.q.meta;
    const isMethod = this.methods[method] && typeof this.methods[method] == 'function';
    if (!isMethod) {
      this.action('invalid')
      return resolve(this._methodNotFound(packet)); // resolve method not found if check if check fails
    }
    // Call the local method to process the question based the extracted parameters
    return this.methods[method](packet).then(result => {
      this.action('answer');
      // check the result for the text, html, and data object.
      // this is for when answers are returned from nested Devas.
      const text = typeof result === 'object' ? result.text : result;
      const html = typeof result === 'object' ? result.html : result;
      // if the data passed is NOT an object it will FALSE
      const data = typeof result === 'object' ? result.data : false;

      const agent = this.agent() || false;
      const client = this.client() || false;
      packet.a = {                                  // setup the packet.a container
        id: this.uid(),
        agent,                                      // set the agent who answered the question
        client,                                     // set the client asking the question
        meta: {                                     // setup the answer meta container
          key: agent.key,                           // set the agent key inot the meta
          method,                                   // set the method into the meta
          params,                                   // set the params into the meta
        },
        text,                                       // set answer text
        html,                                       // set the answer html
        data,                                       // set the answer data
        created: Date.now(),
      };

      // create a hash for the answer and insert into answer meta.
      this.action('answer_hash');
      packet.a.meta.hash = this.hash(JSON.stringify(packet.a));

      this.action('packet_hash');
      packet.hash = this.hash(JSON.stringify(packet));     // hash the entire packet.


      this.action('answer_talk');
      this.talk('devacore:answer', this.copy(packet));             // talk the answer with a copy of the data

      return resolve(packet);                             // resolve the packet to the caller.
    }).catch(err => {                                     // catch any errors in the method
      this.action('error');
      return this.error(err, packet, reject);             // return this.error with err, packet, reject
    });
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
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    this.state('ask');
    this.action('ask');

    const agent = this.agent() || false;
    const client = this.client() || false;
    // build the answer packet from this model
    packet.a = {
      agent,
      client,
      meta: {
        key: agent.key,
        method: packet.q.meta.method,
        params: packet.q.meta.params,
      },
      text: false,
      html: false,
      data: false,
      created: Date.now(),
    };

    try {
      if (typeof this.methods[packet.q.meta.method] !== 'function') {
        return setImmediate(() => {
          this.action('invalid')
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
        this.action('ask_answer');
        this.talk(`${this._agent.key}:ask:${packet.id}`, this.copy(packet));
      }).catch(err => {
        this.action('error');
        this.talk(`${this._agent.key}:ask:${packet.id}`, {error:err.toString()});
        return this.error(err, packet);
      })
    }
    catch (e) {
      this.action('error');
      this.talk(`${this._agent.key}:ask:${packet.id}`, {error:e.toString()});
      return this.error(e, packet)
    }
    // now when we ask the meta params[0] should be the method
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
    const _data = {
      id: this.uid(true),
      key: 'return',
      value: 'init',
      agent: this._agent,
      client: this.copy(client),
      text: this._messages.states.start,
      created: Date.now(),
    }
    _data.hash = this.hash(JSON.stringify(_data));

    // set client
    this._active = Date.now();
    return new Promise((resolve, reject) => {
      this.events.setMaxListeners(this.maxListeners);
      this._assignInherit().then(() => {
        return this._assignBind();
      }).then(() => {
        return this._assignListeners();
      }).then(() => {
        this.state('init');
        this.zone('config');
        return this.Client(client);
      }).then(() => {
        this.zone('features');
        this.action('features');
        return this.Security();
      }).then(() => {
        this.zone('deva');
        const hasOnInit = this.onInit && typeof this.onInit === 'function';
        return hasOnInit ? this.onInit(_data) : this.start(_data)
      }).catch(err => {
        return this.error(err, client, reject);
      });
    });
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
  start(data=false) {
    this.state('start');
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    data.value = 'start';
    delete data.hash;
    data.hash = this.hash(JSON.stringify(data));

    if (this.info) {
      const _info = JSON.stringify(this.info, null, 2).replace(/\{/g, '::BEGIN:INFO')
                        .replace(/\"|\,/g, '').replace(/\}/g, '::END:INFO').trim()
      this.prompt(_info);
    }
    const hasOnStart = this.onStart && typeof this.onStart === 'function' ? true : false;
    return hasOnStart ? this.onStart(data) : this.enter(data)
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
  enter(data=false) {
    this.state('enter');
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    data.value = 'enter';
    delete data.hash;
    data.hash = this.hash(JSON.stringify(data));
    const hasOnEnter = this.onEnter && typeof this.onEnter === 'function' ? true : false;
    return hasOnEnter ? this.onEnter(_data) : this.done(data)
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
  done(data=false) {
    this.state('done');
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    data.value = 'done';
    delete data.hash;
    data.hash = this.hash(JSON.stringify(data));
    const hasOnDone = this.onDone && typeof this.onDone === 'function' ? true : false;
    return hasOnDone ? this.onDone(data) : Promise.resolve(data);
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
  stop() {
    this.state('stop');
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    const _data = {
      id: this.uid(true),
      key: 'return',
      value: 'stop',
      agent: this.agent(),
      client: this.client(),
      text: this._messages.states.stop,
      created: Date.now(),
    }
    _data.hash = this.hash(JSON.stringify(_data));
    const hasOnStop = this.onStop && typeof this.onStop === 'function';
    return hasOnStop ? this.onStop(_data) : this.exit(_data)
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
  exit(data=false) {
    this.state('exit');
    this._active = false;
    data.value = 'exit';
    delete data.hash;
    data.hash = this.hash(JSON.stringify(data));

    // clear memory
    this._active = false;
    this._client = false;
    this._security = false;
    this._support = false;
    this._services = false;
    this._business = false;
    this._development = false;
    this._legal = false;
    this._story = false;

    const hasOnExit = this.onExit && typeof this.onExit === 'function';
    return hasOnExit ? this.onExit(data) : Promise.resolve(data)
  }


  ////////////////////////////

  /**************
  func: state
  params:
    - st: The state flag to set for the Deva that matches to this._states
  describe
  ***************/
  state(state) {
    try {
      if (!this._states[state]) return;
      this._state = state;
      const text = this._messages.states[state];
      const _data = {
        id: this.uid(true),
        key: 'state',
        value: state,
        agent: this.agent(),
        client: this.client(),
        text,
        created: Date.now(),
      };
      _data.hash = this.hash(JSON.stringify(_data));
      this.talk('devacore:state', this.copy(_data));
    } catch (e) {
      return this.error(e);
    }
  }

  /**************
  func: zone
  params:
    - st: The zone flag to set for the Deva that matches to this._zones
  describe
  ***************/
  zone(zone, data=false) {
    try {
      if (!this._zones[zone]) return;
      this._zone = zone;
      const text = this._messages.zones[zone];
      const _data = {
        id: this.uid(true),
        key: 'zone',
        value: zone,
        agent: this._agent,
        text,
        data,
        created: Date.now(),
      };
      _data.hash = this.hash(JSON.stringify(_data));
      this.talk('zone', _data);
    } catch (e) {
      return this.error(e);
    }
  }

  /**************
  func: action
  params:
    - st: The state flag to set for the Deva that matches to this._states
  describe
  ***************/
  action(action) {
    try {
      if (!this._actions[action]) return;
      this._action = action;
      const text = this._messages.actions[action];
      const _data = {
        id: this.uid(true),
        key: 'action',
        value: action,
        agent: this.agent(),
        client: this.client(),
        text,
        created: Date.now(),
      };
      _data.hash = this.hash(JSON.stringify(_data));
      this.talk('devacore:action', this.copy(_data));
    } catch (e) {
      return this.error(e)
    }
  }

  /**************
  func: feature
  params:
    - st: The state flag to set for the Deva that matches to this._states
  describe
  ***************/
  feature(feature, data=false) {
    try {
      if (!this._features[feature]) return;
      this._feature = feature;
      const text = this._messages.features[feature] ;
      const _data = {
        id: this.uid(true),
        key: 'feature',
        value: feature,
        agent: this._agent,
        text,
        data,
        created: Date.now(),
      };
      _data.hash = this.hash(JSON.stringify(_data));
      this.talk('feature', _data);
    } catch (e) {
      return this.error(e);
    }
  }


  ///////////////////////////

  /**************
  func: client
  params: none
  describe:
    this function allows state management for when client prfioe is
    being accessed.
  usage: this.client();
  ***************/
  client() {
    this.state('client_data');                                // set the client state
    if (!this._active) return this._messages.states.offline;    // check the active status
    const client_copy = this.copy(this._client);
    // delete client_copy.parse;
    // delete client_copy.translate;
    return client_copy;                                 // return the client feature
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
    this.state('agent_data');
    if (!this._active) return this._messages.states.offline;
    const agent_copy = this.copy(this._agent);
    delete agent_copy.parse;
    delete agent_copy.translate;
    return agent_copy;
  }

  // FEATURE FUNCTIONS
  /**************
  func: security
  params: none
  describe: basic security features available in a Deva.
  usage: this.security()
  ***************/
  security() {
    this.feature('security');                              // set the security state
    try {
      if (!this._active) return this._messages.states.offline;    // check the active status
      this.action('security');                              // set the security state
      return this._security;                               // return the security feature
    } catch (e) {
      this.action('error');                              // set the security state
      this.feature('error');
      return this.error(e);
    }
  }

  /**************
  func: support
  params: none
  describe: basic support features available in a Deva.
  usage: this.support()
  ***************/
  support() {
    this.feature('support');                              // set the support state
    try {
      if (!this._active) return this._messages.states.offline;   // check the active status
      this.action('support');                              // set the support state
      return this._support;                               // return the support feature
    } catch (e) {
      this.action('error');                             // set the services state
      this.feature('error');
      return this.error(e);
    }
  }

  /**************
  func: services
  params: none
  describe: basic services features available in a Deva.
  usage: this.services()
  ***************/
  services(opts) {
    this.feature('services');                             // set the services state
    try {
      if (!this._active) return this._messages.states.offline;   // check the active status
      this.action('services');                             // set the services state
      return this._services;                              // return the services feature
    } catch (e) {
      this.action('error');                             // set the services state
      this.feature('error');
      return this.error(e);
    }
  }

  /**************
  func: systems
  params: opts
  describe: basic systems features available in a Deva.
  usage: this.systems()
  ***************/
  systems(opts) {
    this.feature('systems');                              // set the systems state
    try {
      if (!this._active) return this._messages.states.offline;   // check the active status
      this.action('systems');                              // set the systems state
      return this._systems;                               // return the systems feature
    } catch (e) {
      this.action('error');                              // set the systems state
      this.feature('error');
      return this.error(e)
    }
  }

  /**************
  func: solutions
  params: opts
  describe: basic solutions features available in a Deva.
  usage: this.solutions()
  ***************/
  solutions(opts) {
    this.feature('solutions');                            // set the solutions state
    try {
      if (!this._active) return this._messages.states.offline;   // check the active status
      this.action('solutions');                            // set the solutions state
      return this._solutions;                             // return the solutions feature
    } catch (e) {
      this.action('error');                              // set the systems state
      this.feature('error');
      return this.error(e);
    }
  }

  /**************
  func: development
  params: opts
  describe: basic development features available in a Deva.
  ***************/
  development(opts) {
    try {
      if (!this._active) return this._messages.states.offline;   // chek the active status
      this.feature('development');                          // set the development state
      return this._development;                           // return development feature
    } catch (e) {
      this.feature('error');
      return this.error(e);
    }
  }

  /**************
  func: assistant
  params: opts
  describe: basic assistant features available in a Deva.
  ***************/
  assistant(opts) {
    try {
      if (!this._active) return this._messages.states.offline;   // chek the active status
      this.feature('assistant');                            // set the assistant state
      return this._assistant;                             // return assistant feature
    } catch (e) {
      this.feature('error');
      return this.error(e);
    }
  }

  /**************
  func: business
  params: opts
  describe: basic business features available in a Deva.
  ***************/
  business(opts) {
    try {
      if (!this._active) return this._messages.states.offline;   // chek the active status
      this.feature('business');                             // set the business state
      return this._business;                              // return business feature
    } catch (e) {
      this.feature('error');
      return this.error('error');
    }
  }

  /**************
  func: legal
  params: opts
  describe: basic legal features available in a Deva.
  ***************/
  legal(opts) {
    try {
      if (!this._active) return this._messages.states.offline;   // chek the active status
      this.feature('legal');                                // set the legal state
      return this._legal;                                 // return legal feature
    } catch (e) {
      this.feature('error');
      return this.error(e);
    }
  }

  /**************
  func: story
  params: opts
  describe: basic story features available in a Deva.
  ***************/
  story(opts) {
    if (!this._active) return this._messages.states.offline;   // chek the active status
    this.feature('story');                                // set the story state
    return this._story;                                 // return story feature
  }

  /**************
  func: load
  params:
    -deva:      The Deva model to load.
  describe:
    This function will enable fast loading of Deva into a system.
  ***************/
  load(key, client) {
    return new Promise((resolve, reject) => {
      this.state('load');
      this.devas[key].init(client).then(loaded => {
        this.talk(`deva:load`, {
          key,
          created: Date.now(),
        });
        return resolve(this._messages.states.load);
      }).catch(err => {
        return this.error(err, deva, reject);
      })
    });
  }

  /**************
  func: unload
  params:
    - deva:     The deva key to unload
  describe:     Unload a currently loaded Deva.
  ***************/
  unload(key) {
    return new Promise((resolve, reject) => {
      try {
        this.state('uload');
        delete this.devas[key];
        this.talk(`unload`, {
          key,
          created: Date.now(),
        });
        return resolve(this._messages.states.unload);
      } catch (e) {
        return reject(e, this.devas[key], reject)
      }
    });
  }


  // UTILITY FUNCTIONS
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
    this.state('decipher');
    return final.toString();
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
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    // format the date since active for output.
    const dateFormat = this.formatDate(this._active, 'long', true);
    // create the text msg string
    let text = `${this._agent.profile.name} active since ${dateFormat}`;
    if (msg) text = text + `\n${msg}`;                      // append the msg string if msg true.
    return Promise.resolve(text);                           // return final text string
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
    return this.talk('devacore:prompt', {
      id: this.uid(),
      key: 'return',
      value: 'prompt',
      agent: this.agent(),
      client: this.client(),
      text,
      created: Date.now(),
    });
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
  func: getToday
  params:
    - d: The date string to get the day of..
  describe:
    a date can be passed in or generated to produce a date string for the day
    where time is 0. This feature is useful for logging for getting a date
    with no time value for the current day.
  ***************/
  getToday(d) {
    d = d ? d : Date.now();
    const today = new Date(d);
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return today.getTime();
  }

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
    this.state('error');
    // check fo rthe custom onError function in the agent.
    console.log('\n::BEGIN:ERROR\n');
    console.log(err);
    console.log('\n::END:ERROR\n');
    if (data) {
      console.log('::::::');
      console.log('\n::BEGIN:DATA\n');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n::END:DATA\n');
    }

    this.talk('devacore:error', {
      id: this.uid(true),
      key: 'return',
      value: 'error',
      agent: this.agent(),
      client: this.client(),
      text: err.toString(),
      data,
      created: Date.now(),
    });

    const hasOnError = this.onError && typeof this.onError === 'function' ? true : false;
    if (hasOnError) return this.onError(err, data, reject);
    else {
      return reject ? reject(err) : err;
    }
  }

}
module.exports = Deva;
