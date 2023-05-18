// Copyright (c)2023 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
const {EventEmitter} = require('events');
const { createHash, randomUUID } = require('crypto');

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
    this._states = {                                    // The available states to work with.
      uid: `👻 ${this._agent.name} is making a new #uid`,
      offline: `👻 ${this._agent.name} is offline`,
      online: `📡 ${this._agent.name} is online`,
      config: `‍📀 ${this._agent.name} is checking the config`,
      client: `👨‍💻 ${this._agent.name} opened the ${this._client.key} profile`,
      agent: `👨‍💻 ${this._agent.name} is looking at ${this._agent.key} profile`,
      init: `🚀 ${this._agent.name} is initializing`,
      start: `🎬 ${this._agent.name} has started the process`,
      enter: `🎪 ${this._agent.name} is entering the deva.world`,
      stop: `🛑 ${this._agent.name} has stopped`,
      exit: `🚪 ${this._agent.name} found the exit`,
      done: `🤝 ${this._agent.name} is all done`,
      wait: `😵‍💫 ${this._agent.name} waiting for something to do`,
      data: `📀 ${this._agent.name} is receiving data`,
      ask: `🙋‍♀️ ${this._agent.name} is asking a question`,
      cmd: `📟 ${this._agent.name} is using a command`,
      question: `🐵 ${this._agent.name} question`,
      ask: `🐵 ${this._agent.name} asking`,
      talk: `🎙️ ${this._agent.name} is talking`,
      listen: `🎧 ${this._agent.name} is listening`,
      error: `❌ ${this._agent.name} had an error`,
      story: `📓 ${this._agent.name} telling a story`,
      development: `👨‍💻 ${this._agent.name} needs @Development`,
      security: `🚨 ${this._agent.name} needs @Security`,
      support: `🎗️ ${this._agent.name} needs @Support`,
      services: `🎖️ ${this._agent.name} needs @Services`,
      systems: `👽 ${this._agent.name} needs @Systems`,
      solutions: `🔬 ${this._agent.name} needs @Solutions`,
      devas_start: `✨ Starting all the #Devas...`,
      devas_ready: `📸 The #Devas are ready and waiitng`,
      devas_stop: `🙈 The #Devas are stopping`,
      devas_stopped: `🛑 #Devas have stopped`,
      deva_load: `✅ ${this._agent.name} load`,
      deva_loaded: `✅ ${this._agent.name} loaded`,
      deva_unloaded: `✅ ${this._agent.name} unloaded`,
      question_me: `🐵 ${this._client.name} ask ${this._agent.name} a #question`,
      question_default: `🧞‍♂️ ${this._client.id} sent ${this._agent.name} a #question`,
      question_ask: `🧞 ${this._agent.name} is pondering what ${this._client.name} asked`,
      question_asking: `🧞 ${this._agent.name} is asking another #Deva what ${this._client.name} asked`,
      question_aswering: `🧞 ${this._agent.name} is answering the #question ${this._client.name} asked`,
      question_answer: `🔮 #${this._agent.name} gave #${this._client.name} the answer`,
      question_cmd: `🧞‍♀️ ${this._agent.name} then ran a #command for #${this._client.name}`,
      hash_question: `🔐 ${this._agent.name} created the #question hash`,
      hash_answer: `🔐 ${this._agent.name} created the #answer hash`,
      hash_answer: `🔐 ${this._agent.name} created the #packet hash`,
      ask_question: `👽 ${this._client.name} asked ${this._agent.name} a #question`,
      ask_answer: `🛸 ${this._agent.name} answered ${this._client.name}`,
      method_not_found: `😩 ${this._agent.name} used a bad #command, and may need help.`,
      security_ready: `🚓 @Security is ready`,
      support_ready: `🚑 @Support is ready`,
      services_ready: `🚚 @Services is ready`,
      security_alert: `🚨 #SECURITY 🚨 SETTTINGS`,
      support_alert: `🚨 #SUPPORT 🚨 SETTTINGS`,
      services_alert: `🚨 #SERVICES 🚨 SETTTINGS`,
      setting_client: `⛄️ Setting the #client for ${this._agent.name}`,
      setting_security: `👮‍♂️ ${this._agent.name} given #security`,
      setting_support: `👨‍⚕️ ${this._agent.name} given #support`,
      setting_services: `👷‍♂️ ${this._agent.name} given #services`,
    };
  }

  set Messages(opts) {
    this._messages = {
      offline: `🙅‍♂️ ${this._agent.name} offline`,
      init: `⚠️ ${this._agent.name} init`,
      start: `✅ ${this._agent.name} start`,
      stop: `💥 ${this._agent.name} stop.`,
      enter: `🖖 ${this._agent.name} enter.`,
      exit: `🚪 ${this._agent.name} exit.`,
      done: `👍 ${this._agent.name} done.`,
      devas_started: '🤝 Devas have started',
      devas_stopped: '🛑 Devas have stopped',
      notext: `❌ ${this._client.name}, please provide with valid input.`,
      method_not_found: `❌ ${this._client.name} you sure messed that up!`,
    }
  }
  set Client(cl) {
    // delete the services key to move and move to services.
    const _client = this.copy(cl);
    if (_client.states) delete _client.states;
    if (_client.messages) delete _client.messages;
    if (_client.security) delete _client.security;
    if (_client.support) delete _client.support;
    if (_client.services) delete _client.services;

    this._client = cl;

    this.States = _client.states;
    this.Messages = _client.messages;
  }

  set Security(opt=false) {
    this.state('setting_security');
    if (!opt) this._security = {};
    else {
      this._security = {
        concerns: opt.concerns,
        global: opt.global,
        things: opt.devas[this._agent.key]
      };
    }
  }

  set Support(opt=false) {
    this.state('setting_support');
    if (!opt) this._support = {};
    else {
      this._support = {
        concerns: opt.concerns,
        global: opt.global,
        things: opt.devas[this._agent.key]
      };
    }
  }

  set Services(opt=false) {
    this.state('setting_services');
    if (!opt) this._servcies = {};
    else {
      this._services = {
        concerns: opt.concerns,
        global: opt.global,
        things: opt.devas[this._agent.key]
      };
    }
  }

  /**************
  func: state
  params:
    - st: The state flag to set for the Deva that matches to this._states
  describe
  ***************/
  state(st, data=false) {
    if (!Object.keys(this._states).includes(st)) return;
    this._state = this._states[st];
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

  states() {
    return this._states;
  }

  // Called from the init function to bind the elements defined in the this.bind variable.
  // the assign bind ensures that the *this* scope is available to child elements/functions.

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
    if (guid) return randomUUID()
    const min = Math.floor(Date.now() - (Date.now() / Math.PI));
    const max = Math.floor(Date.now() + (Date.now() * Math.PI));
    return Math.floor(Math.random() * (max - min)) + min;
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

        // *: send just a string of text
        // !: send a command to the local agent
        // #: ask another agent a question
        // #agent method:param1:param2 with text strings for proccessing
        // !method param:list:parse for the local agent
        // if is an ask then we format one way
        let _state = 'question_default';
        if (isAsk) {
          _state = 'question_ask'
          key = t_split[0].substring(1);
          params = t_split[1] ? t_split[1].split(':') : false;
          method = params[0];
          text = t_split.slice(2).join(' ').trim();

        }
        else if (isCmd) {
          _state = 'question_cmd'
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
          this.prompt(`sending key ${key}`);
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
            this.state('hash_answer');
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

        this.Security = client.security;
        this.Support = client.support;
        this.Services = client.services;

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
    let text = `${this._agent.name} active since ${dateFormat}`;
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
  func: hash
  params:
    - texts: The text string to create a hash value for.
    - algo: The hashing algorithm to use for hashing. md5, sha256, or sha512

  describe:
    The hash algorithm will take a string of text and produce a hash.
  ***************/
  hash(text, algo='md5') {
    const the_hash = createHash(algo);
    the_hash.update(text);
    return the_hash.digest('hex');
  }

  /**************
  func: client
  params: none
  describe:
    this function allows statement management for when client prfioe is
    being accessed.
  ***************/
  client() {
    if (!this._active) return Promise.resolve(this._messages.offline);
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
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('agent');
    return this._agent;
  }

  /**************
  func: security
  params: opts
  describe: basic security features available in a Deva.
  ***************/
  security(opts) {}

  /**************
  func: security
  params: opts
  describe: basic support features available in a Deva.
  ***************/
  support(opts) {}

  /**************
  func: security
  params: opts
  describe: basic services features available in a Deva.
  ***************/
  services(opts) {}

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
}
module.exports = Deva;
