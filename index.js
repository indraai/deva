// Copyright (c)2023 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
const {EventEmitter} = require('events');
const { createHash, randomUUID, createCipheriv, createDecipheriv, randomBytes } = require('crypto');

class Deva {
  constructor(opts) {
    opts = opts || {};

    this._id = randomUUID();                             // the unique id assigned to the agent at load
    this._config = opts.config || {};                    // local Config Object
    this._agent = opts.agent || false;                   // Agent profile object
    this._client = {};                                // this will be set on init.
    this._state = 'OFFLINE';                             // current state of agent.
    this._active = false;                               // the active/birth date.
    this._security = {};                              // inherited Security features.
    this._support = {};                               // inherited Support features.
    this._services = {};                               // inherited Service features.
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

    this.cmdChr = '/';
    this.askChr = '#';
    this.inherit = ["events", "config", "lib", "security", "client"];
    this.bind = ["listeners", "methods", "func", "lib", "security", "agent", "client"];

  }

  set State(opt) {
    this.state(opt);
  }

  set States(opts) {
    const _states = {
      uid: `👻 ${this._agent.profile.name} is making a new #uid`,
      offline: `👻 ${this._agent.profile.name} is offline`,
      online: `📡 ${this._agent.profile.name} is online`,
      config: `‍📀 ${this._agent.profile.name} is checking the config`,
      client: `👨‍💻 ${this._agent.profile.name} opened the ${this._client.key} profile`,
      agent: `👨‍💻 ${this._agent.profile.name} is looking at ${this._agent.key} profile`,
      init: `🚀 ${this._agent.profile.name} is initializing for ${this._client.profile.name}`,
      start: `🎬 ${this._agent.profile.name} has started the process for ${this._client.profile.name}`,
      enter: `🎪 ${this._agent.profile.name} is entering the deva.world with${this._client.profile.name}`,
      stop: `🛑 ${this._agent.profile.name} has stopped for ${this._client.profile.name}`,
      exit: `🚪 ${this._agent.profile.name} found the exit with ${this._client.profile.name}`,
      done: `🤝 ${this._agent.profile.name} is all done time for #offerings 🍫🍌`,
      wait: `😵‍💫 ${this._agent.profile.name} waiting for #stuff from ${this._client.profile.name}`,
      data: `📀 ${this._agent.profile.name} is receiving #data for ${this._client.profile.name}`,
      ask: `🙋‍♀️ ${this._agent.profile.name} is asking a #question from ${this._client.profile.name}`,
      cmd: `📟 ${this._agent.profile.name} entered a #command from ${this._client.profile.name}`,
      question: `🐵 ${this._agent.profile.name} is in #question mode ${this._client.profile.name}`,
      ask: `🐵 ${this._agent.profile.name}  is in #ask mode ${this._client.profile.name}`,
      talk: `🎙️ ${this._agent.profile.name} is in #talk mode with ${this._client.profile.name}`,
      listen: `🎧 ${this._agent.profile.name} is in #listening mode with ${this._client.profile.name}`,
      error: `❌ ${this._agent.profile.name} had an error. Let's have @Systems look into that.`,
      uid: `🪪 ${this._client.profile.name} made a #uid with ${this._agent.profile.name}`,
      hash: `🔑 ${this._client.profile.name} made a #hash with ${this._agent.profile.name}`,
      cipher: `🔐 ${this._client.profile.name} locked a #cipher with ${this._agent.profile.name}`,
      decipher: `🔓 ${this._client.profile.name} unlocked a #cipher with ${this._agent.profile.name}`,
      story: `📓 ${this._agent.profile.name} is creating an amazing #story ${this._client.profile.name}`,
      development: `👨‍💻 ${this._agent.profile.name} called for @Development assistance for ${this._client.profile.name}`,
      security: `🚨 ${this._agent.profile.name} called for @Security assistance for ${this._client.profile.name}`,
      support: `🎗️ ${this._agent.profile.name} called for @Support assistance for ${this._client.profile.name}`,
      services: `🎖️ ${this._agent.profile.name} called for @Services assistance for ${this._client.profile.name}`,
      systems: `👽 ${this._agent.profile.name} called for @Systems assistance for ${this._client.profile.name}`,
      solutions: `🔬 ${this._agent.profile.name} called for @Solutions assistance for ${this._client.profile.name}`,
      devas_start: `✨ Starting all the #Devas with ${this._client.profile.name}`,
      devas_ready: `📸 The #Devas are #ready and #waiitng for ${this._client.profile.name}`,
      devas_stop: `🙈 The #Devas are #stopping with ${this._client.profile.name}`,
      devas_stopped: `🛑 #Devas and ${this._client.profile.name} have #stopped, and that means time for #offerings 🍎🍑🍍🧋`,
      deva_load: `✅ ${this._agent.profile.name} loading for ${this._client.profile.name}`,
      deva_loaded: `✅ ${this._agent.profile.name} loaded for ${this._client.profile.name}`,
      deva_unloaded: `✅ ${this._agent.profile.name} unloaded for ${this._client.profile.name}`,
      question_me: `🐵 ${this._client.profile.name} started with a great #question to ${this._agent.profile.name}`,
      question_default: `🧞‍♂️ ${this._client.profile.name} asked a great #question to ${this._agent.profile.name}`,
      question_ask: `🧞 ${this._agent.profile.name} is pondering what ${this._client.profile.name} asked`,
      question_asking: `🧞 ${this._agent.profile.name} is asking another #Deva for ${this._client.profile.name}`,
      question_aswering: `🧞 ${this._agent.profile.name} is answering the #question ${this._client.profile.name} asked`,
      question_answer: `🔮 ${this._client.profile.name} received an #ansewr from ${this._agent.profile.name}`,
      question_command: `🧞‍♀️ ${this._client.profile.name} issued a #command to ${this._agent.profile.name}`,
      hash_question: `🔑 ${this._agent.profile.name} created the #question #hash for ${this._client.profile.name}`,
      hash_ask: `🔑 ${this._agent.profile.name} created the #ask #hash for ${this._client.profile.name}`,
      hash_answer: `🔑 ${this._client.profile.name} #answer #hash with`,
      hash_command: `🔑 ${this._client.profile.name} #command #hash with ${this._agent.profile.name}`,
      hash_packet: `🔑 ${this._agent.profile.name} created the #packet #hash for ${this._client.profile.name}`,
      ask_question: `👽 ${this._client.profile.name} asked ${this._agent.profile.name} a great #question`,
      ask_answer: `🛸 ${this._client.profile.name} received a great #answer from ${this._agent.profile.name}`,
      method_not_found: `😩 ${this._client.profile.name} used a faulty #command while working with ${this._agent.profile.name}, and may need @Support`,
      ready_security: `🚓 @Security is ready`,
      ready_support: `🚑 @Support is ready`,
      ready_support: `🚑 @Support is ready`,
      ready_services: `🚚 @Services is ready`,
      ready_systems: `🏘️  @Systems is ready`,
      ready_solutions: `🤓 @Solutions is ready`,
      alert_security: `🚨 #SECURITY ALERT`,
      alert_support: `🚨 #SUPPORT ALERT`,
      alert_services: `🚨 #SERVICES ALERT`,
      alert_solutions: `🚨 #SOLUTIONS ALERT`,
      alert_systems: `🚨 #SYSTEMS ALERT`,
      alert_development: `🚨 #SYSTEMS ALERT`,
      setting_client: `⛄️ ${this._agent.profile.name} is setting the #client for ${this._client.profile.name} `,
      setting_development: `🔬 ${this._client.profile.name} and ${this._agent.profile.name} are receiving @Development`,
      setting_security: `👮‍♂️ ${this._client.profile.name} and ${this._agent.profile.name} are receiving @Security`,
      setting_support: `👨‍⚕️ ${this._client.profile.name} and ${this._agent.profile.name} are receiving @Support`,
      setting_services: `👷‍♂️ ${this._client.profile.name} and ${this._agent.profile.name} are receiving @Services`,
      setting_systems: `🏘️  ${this._client.profile.name} and ${this._agent.profile.name} are receiving @Systems`,
      setting_solutions: `🤓 ${this._client.profile.name} and ${this._agent.profile.name} are receiving @Solutions`,
    }
    this._states = _states;                                    // The available states to work with.
  }

  set Messages(opts) {
    this._messages = {
      offline: `🙅‍♂️ ${this._agent.profile.name} offline`,
      init: `⚠️ ${this._agent.profile.name} init`,
      start: `✅ ${this._agent.profile.name} start`,
      stop: `💥 ${this._agent.profile.name} stop.`,
      enter: `🖖 ${this._agent.profile.name} enter.`,
      exit: `🚪 ${this._agent.profile.name} exit.`,
      done: `👍 ${this._agent.profile.name} done.`,
      devas_started: '#Devas are #online and ready for #offerings 🍫🥛🍚🍯🧂',
      devas_stopped: '🛑 #Devas have stopped',
      notext: `❌ ${this._client.profile.name}, please provide with valid input.`,
      method_not_found: `❌ ${this._client.profile.name} you sure messed that up!`,
    }
  }
  set Client(client) {
    // copy the cl parameter into a local _client variable
    const _client = this.copy(client);

    // delete the keys used for other features.
    if (_client.states) delete _client.states;
    if (_client.messages) delete _client.messages;
    if (_client.development) delete _client.development;
    if (_client.security) delete _client.security;
    if (_client.support) delete _client.support;
    if (_client.services) delete _client.services;
    if (_client.systems) delete _client.systems;
    if (_client.solutions) delete _client.solutions;

    // set the local client variable from the clean _client local variable.
    this._client = _client;

    // set the states and messages after the cleint is set.
    this.States = client.states;
    this.Messages = client.messages;
  }

  // setup the @Security feature
  set Security(client=false) {
    if (!client) this._security = {};
    else {
      this.state('setting_security');
      const _client = this.copy(client);
      this._security = {
        id: this.uid(true),
        client_id: _client.id,
        client_name: _client.profile.name,
        hash: _client.security.hash,
        cipher: _client.security.cipher,
        concerns: _client.security.concerns,
        global: _client.security.global,
        personal: _client.security.devas[this._agent.key]
      };
    }
  }

  // setup the @Support feature
  set Support(client=false) {
    if (!client) this._support = {};
    else {
      this.state('setting_support');
      const _client = this.copy(client);
      this._support = {
        id: this.uid(true),
        client_id: _client.id,
        client_name: _client.profile.name,
        concerns: _client.support.concerns,
        global: _client.support.global,
        personal: _client.support.devas[this._agent.key]
      };
    }
  }

  // setup the @Services feature
  set Services(client=false) {
    if (!client) this._servcies = {};
    else {
      this.state('setting_services');
      const _client = this.copy(client);
      this._services = {
        id: this.uid(true),
        client_id: _client.id,
        client_name: _client.profile.name,
        concerns: _client.services.concerns,
        global: _client.services.global,
        personal: _client.services.devas[this._agent.key]
      };
    }
  }

  // setup the @Systems feature
  set Systems(client=false) {
    if (!client) this._systems = {};
    else {
      this.state('setting_systems');
      const _client = this.copy(client);
      this._systems = {
        id: this.uid(true),
        client_id: _client.id,
        client_name: _client.profile.name,
        concerns: _client.systems.concerns,
        global: _client.systems.global,
        personal: _client.systems.devas[this._agent.key]
      };
    }
  }

  // setup the @Solutions feature
  set Solutions(client=false) {
    if (!client) this._solutions = {};
    else {
      this.state('setting_solutions');
      const _client = this.copy(client);
      this._solutions = {
        id: this.uid(true),
        client_id: _client.id,
        client_name: _client.profile.name,
        concerns: _client.solutions.concerns,
        global: _client.solutions.global,
        personal: _client.solutions.devas[this._agent.key]
      };
    }
  }

  // setup the @Development feature.
  set Development(client=false) {
    if (!client) this._development = {};
    else {
      this.state('setting_development');
      const _client = this.copy(client);
      this._development = {
        id: this.uid(true),
        client_id: _client.id,
        client_name: _client.profile.name,
        concerns: _client.development.concerns,
        global: _client.development.global,
        personal: _client.development.devas[this._agent.key]
      };
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
        return reject(e);
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
        return reject(e);
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
        return reject(e);
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
    this._state = `${this._states[st]} on ${this.formatDate(Date.now(), 'short_month', true)}`;
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
  hash(str) {
    const algo = this._security.hash || 'md5';
    const the_hash = createHash(algo);
    the_hash.update(str);
    const _digest = the_hash.digest('base64');
    this.state('hash', {

    })
    return ;
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
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('question_me', {text:TEXT, data:DATA});

    const id = this.uid();                            // generate a unique transport id for the question.
    const t_split = TEXT.split(' ');

    // check to see if the string is an #ask string to talk to the other Deva.
    const isAsk = t_split[0].startsWith(this.askChr);

    // check to see if the string is a command string to run a local method.
    const isCmd = t_split[0].startsWith(this.cmdChr);

    // Format the packet for return on the request.
    const orig = TEXT;
    const data = DATA;
    const packet = {
      id,
      q: {},
      a: {},
      created: Date.now(),
    };

    let text = TEXT,
        params = false,
        method = 'question',
        key = this._agent.key;

    return new Promise((resolve, reject) => {
      if (!TEXT) return reject(this._messages.notext);
      try {
        if (!this._active) return reject(this._messages.offline);

        let _state = 'question_default';
        let _hash = 'hash_asnwer';

        // *: send just a string of text
        // !: send a command to the local agent
        // #: ask another agent a question
        // #agent method:param1:param2 with text strings for proccessing
        // !method param:list:parse for the local agent
        // if is an ask then we format one way
        if (isAsk) {
          _state = 'question_ask'
          _state = 'hash_ask'
          key = t_split[0].substring(1);
          params = t_split[1] ? t_split[1].split(':') : false;
          method = params[0];
          text = t_split.slice(2).join(' ').trim();

        }
        else if (isCmd) {
          _state = 'question_command';
          _hash = 'hash_command'
          params = t_split[1] ? t_split[1].split(':') : false;
          method = t_split[0].substring(1);
          text = t_split.slice(1).join(' ').trim()
        }

        packet.q = {
            agent: this._agent || false,
            client: this._client || false,
            meta: {
              key,
              orig,
              method,
              params,
            },
            text,
            data,
            created: Date.now(),
        }

        // hash the packet and insert the hash into the packet meta object.
        this.state('hash_question');
        packet.q.meta.hash = this.hash(JSON.stringify(packet.q));

        this.state(_state, packet);

        // If a question to another Deva with '#' then trigger events
        if (isAsk) {
          this.state('question_asking');
          this.talk(`${key}:ask`, packet);
          this.once(`${key}:ask:${packet.id}`, answer => {
            return resolve(answer);
          });
        }

        // if the user sends a local command '$' then it will ask of the self.
        else {
          this.state('question_answering');
          if (typeof this.methods[method] !== 'function') {
            return resolve(this._methodNotFound(packet));
          }
          this.methods[method](packet).then(result => {
            const text = typeof result === 'object' ? result.text : result;
            const html = typeof result === 'object' ? result.html : result;
            const data = typeof result === 'object' ? result.data : false;
            packet.a = {
              agent: this._agent || false,
              client: this._client || false,
              meta: {
                key: this._agent.key,
                method,
              },
              text,
              html,
              data,
              created: Date.now(),
            };
            // create a hash for the answer and insert into answer meta.
            this.state(_hash);
            packet.a.meta.hash = this.hash(JSON.stringify(packet.a));

            // create a hash for entire packet and insert into packet
            this.state('hash_packet');
            packet.hash = this.hash(JSON.stringify(packet));

            this.state('question_answer', packet);

            return resolve(packet);
          }).catch(err => {
            return this.error(err, packet);
          });
        }
      }
      catch(e) {
        return this.error(e);
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

        return this.onInit && typeof this.onInit === 'function' ? this.onInit() : this.start();
      }).then(started => {
        return resolve(started)
      }).catch(err => {
        return reject(err);
      });
    });
  }

  // Interface for unified error reporting within all devas.
  // this.error(*error*, *packet*) can be issued at time of any error.
  // e: is the error to pass into the interface.
  // packet: the packet that caused the error.
  error(err,packet=false,reject=false) {
    this.state('error', err);
    if (this.onError && typeof this.onError === 'function') return this.onError(err, packet, reject);
    console.error(err)
    return reject ? reject(err) : err;
  }

  /**************
  func: start
  params: none
  describe:
    The start function begins the process by setting the state to start setting
    the active to the current datetime and then checking for a custom onStart
    function or running the system enter function.
  ***************/
  start(msg=false) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('start');
    return this.onStart && typeof this.onStart === 'function' ? this.onStart() : this.enter(this._messages.start);
  }

  /**************
  func: stop
  params: msg - hte message from the caller incase need to use in calls
  describe:
    The stop function will stop the Deva by setting the active status to false,
    and the state to stop. From here it will check for a custom onStop function
    for anything to run, or run the system exit function.

    If the deva is offline it will return the offline message.
  ***************/
  stop(msg=false) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('stop');
    this._active = false;
    return this.onStop && typeof this.onStop === 'function' ? this.onStop() : this.exit(this._messages.stop);
  }

  /**************
  func: enter
  params: msg - hte message from the caller incase need to use in calls
  describe:
    The ener function will check the actie status of the Deva and set it to
    offline or enter.

    If the Deva is offline it will return the offline message.
  ***************/
  enter(msg=false) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('enter');
    return this.onEnter && typeof this.onEnter === 'function' ? this.onEnter() : this.done(this._messages.enter)
  }

  /**************
  func: exit
  params: msg - hte message from the caller incase need to use in calls
  describe:
    The exit state function is triggered when the Deva is exiting it's online
    status and setting the state to exit for things like security check.

    The return will check for a custom onExit function or run the system done
    function.

    If the deva is offline it will return the offline message.
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
    - msg: The done message
  describe:
    When the done function is triggered the system will also set the state
    of hte Deva to done.

    If the deva is offline it will return the offline message.
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
    - addto: The addto is any additonal string to append to the end of hte call.
  describe:
    The status function provides an easy way to get the current status of a Deva
    and append custom status messages that may pertain to any custom status call.

    If the deva is offline it will return the offline message.
  ***************/
  status(ammend=false) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    const id = this.uid();
    const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' }).format(this._active);
    let text = `${this._agent.profile.name} active since ${dateFormat}`;
    if (ammend) text = text + `\n${ammend}`;
    return Promise.resolve({text});
  }

  /**************
  func: prompt
  params:
    - text: The text string to send to the prompt.
  describe:-
    The prompt function is used to broadcasat a global prompt event with a string. Thsi is handy when passing events between a cli and user interface for example.
  ***************/
  prompt(text) {
    return this.talk('prompt', {text, agent:this._agent});
  }

  /**************
  func: client
  params: none
  describe:
    this function allows statement management for when client prfioe is
    being accessed.
  ***************/
  client() {
    if (!this._active) return this._messages.offline;
    this.state('client');
    return this._client;
  }

  /**************
  func: agent
  params: none
  describe:
    this function allows statement management for when client prfioe is
    being accessed.
  ***************/
  agent() {
    if (!this._active) return this._messages.offline;
    this.state('agent');
    return this._agent;
  }

  /**************
  func: security
  params: opts
  describe: basic security features available in a Deva.
  ***************/
  security(opts) {
    if (!this._active) return this._messages.offline;
    this.state('security');
    return this._security;
  }

  /**************
  func: security
  params: opts
  describe: basic support features available in a Deva.
  ***************/
  support(opts) {
    if (!this._active) return this._messages.offline;
    this.state('support');
    return this._support;
  }

  /**************
  func: security
  params: opts
  describe: basic services features available in a Deva.
  ***************/
  services(opts) {
    if (!this._active) return this._messages.offline;
    this.state('services');
    return this._services;
  }

  /**************
  func: systems
  params: opts
  describe: basic systems features available in a Deva.
  ***************/
  systems(opts) {
    if (!this._active) return this._messages.offline;
    this.state('systems');
    return this._systems;
  }

  /**************
  func: security
  params: opts
  describe: basic solutions features available in a Deva.
  ***************/
  solutions(opts) {
    if (!this._active) return this._messages.offline;
    this.state('solutions');
    return this._solutions;
  }

  /**************
  func: development
  params: opts
  describe: basic development features available in a Deva.
  ***************/
  development(opts) {
    if (!this._active) return this._messages.offline;
    this.state('development');
    return this._development;
  }

  /**************
  func: startDevas
  params: none
  describe:
    Start Devas will initialize the Deva agents inside this curent Deva.
  ***************/
  startDevas(client) {
    this.state('devas_start');
    return new Promise((resolve, reject) => {
      const devas = [];
      for (let x in this.devas) {
        devas.push(this.devas[x].init(client));
      }
      Promise.all(devas).then(() => {
        this.state('devas_ready');
        return resolve({text:this._messages.devas_started,prompt:this._agent.prompt});
      }).catch(reject);
    });
  }
  /**************
  func: stpDevas
  params: none
  describe:
    stopDevas will stop all the devas running in the current Deva.
  ***************/
  stopDevas() {
    this.state('devas_stop');
    return new Promise((resolve, reject) => {
      const devas = [];
      for (let x in this.devas) {
        devas.push(this.devas[x].stop());
      }
      Promise.all(devas).then(() => {
        this.state('devas_stoped');
        return resolve(this._messages.devas_stopped);
      }).catch(reject);
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
  formatDate(d, format='long', time=false) {
    if (!d) d = Date.now();
    d = new Date(d);

    const formats = {
      long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
      long_month: { year: 'numeric', month: 'long', day: 'numeric'},
      short: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
      short_month: { year: 'numeric', month: 'short', day: 'numeric' },
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
    return t.toLocaleTimeString(this._client.locale);
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
