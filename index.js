// Copyright (c)2023 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
const {EventEmitter} = require('events');
const { createHash, randomUUID } = require('crypto');

class Deva {
  constructor(opts) {
    opts = opts || {};
    this._id = randomUUID();                             // the unique id assigned to the agent at load
    this._state = 'OFFLINE';                             // current state of agent.
    this._active = false;                               // the active/birth date.
    this.security = false;                              // inherited Security features.
    this.support = false;                               // inherited Support features.
    this.config = opts.config || {};                    // local Config Object
    this.events = opts.events || new EventEmitter({});  // Event Bus
    this.lib = opts.lib || {};                          // used for loading library functions
    this.agent = opts.agent || false;                   // Agent profile object
    this.client = opts.client || false;                 // Client profile object
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
    this._states = {                                    // The available states to work with.
      offline: '👻 OFFLINE',
      online: '📡 ONLINE',
      init: '🚀 INIT',
      start: '🎬 START',
      enter: '🎪 ENTER',
      stop: '🛑 STOP',
      exit: '🚪 EXIT',
      done: '🤝 DONE',
      devas_start: '✨ DEVAS START',
      devas_ready: '📸 DEVAS READY',
      devas_stop: '🙈 DEVAS STOP',
      devas_stopped: '🛑 DEVAS STOPPED',
      deva_load: '✅ DEVA LOAD',
      deva_loaded: '✅ DEVA LOADED',
      deva_unloaded: '✅ DEVA UNLOADED',
      wait: '😵‍💫 WAITING',
      data: '📀 DATA',
      ask: '🙋‍♀️ ASK',
      cmd: '📟 COMMAND',
      question: '🐵 QUESTION',
      question_ask: '🧙‍♂️ QUESTION ASK',
      question_cmd: '🪄 QUESTION CMD',
      question_answer: '🔮 QUESTION ANSWER',
      ask_question: '👽 ASK QUESTION',
      ask_answer: '🛸 ASK ANSWER',
      method_not_found: '😩 METHOD NOT FOUND',
      talk: '🎙️ TALK',
      listen: '🎧 LISTEN',
      error: '❌ ERROR',
      story: '📓 STORY',
      development: '👨‍💻 DEVELOPMENT',
      security: '🚨 SECURITY',
      support: '🎗️ SUPPORT',
      services: '🎖️ SERVICES',
      systems: '👽 SYSTEMS',
      solutions: '🔬 SOLUTIONS',
    };
    this._messages = {
      offline: '🙅‍♂️ DEVA OFFLINE',
      init: '✅ DEVA INITIALIZED',
      start: '✅ DEVA STARTED',
      stop: '💥 DEVA STOPPED',
      enter: '🖖 DEVA ENTERED',
      exit: '🚪 DEVA EXITED',
      done: '👍 DEVA DONE',
      devas_started: '🤝 DEVAS STARTED',
      devas_stopped: '🛑 DEVAS STOPPED',
      notext: '❌ NO TEXT',
      method_not_found: '❌ THAT IS NOT GONNA WORK!',
    }
  }

  // set the state of the agent with the passed value to match the valid keys.
  // this will also talk a global state event with the agent data and state.
  // then security can watch all the glorious state change events.

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
      client: this.client.id,
      agent: this.agent.id,
      st: st,
      state: this._state,
      data,
      created: Date.now(),
    };
    this.prompt(this._state);
    this.talk(`${this.agent.key}:state`, _data);
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
        const translate = this.agent && this.agent.translate && typeof this.agent.translate === 'function';
        if (translate) this.agent.translate = this.agent.translate.bind(this);
        // bind parser
        const parse = this.agent && this.agent.parse && typeof this.agent.parse === 'function';
        if (parse) this.agent.parse = this.agent.parse.bind(this);
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
      agent: this.agent || false,
      client: this.client || false,
      text: `${this._messages.method_not_found} - ${packet.q.meta.method} `,
      meta: {
        key: this.agent.key,
        method: packet.q.meta.method,
      },
      created: Date.now(),
    };
    this.state('method_not_found', packet);
    return packet;
  }

  // A simple interface to generate a unique id for the agent. As agents will
  // quite oftne have to key their transactions. This will provide all agents
  // with the same key generator which can also be modified to link into a remote
  // generator or some other solution if needed.

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
      agent: this.agent || false,
      client: this.client || false,
      meta: {
        key: this.agent.key,
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
          this.talk(`${this.agent.key}:ask:${packet.id}`, packet);
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
        this.talk(`${this.agent.key}:ask:${packet.id}`, packet);
      }).catch(err => {
        this.talk(`${this.agent.key}:ask:${packet.id}`, {error:err.toString()});
        return this.error(err, packet);
      })
    }
    catch (e) {
      this.talk(`${this.agent.key}:ask:${packet.id}`, {error:e.toString()});
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
        key = this.agent.key;

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
        let _state = 'question';
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
            agent: this.agent || false,
            client: this.client || false,
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
        packet.q.meta.hash = this.hash(JSON.stringify(packet.q));
        this.state(_state, packet);

        // If a question to another Deva with '#' then trigger events
        if (isAsk) {
          this.talk(`${key}:ask`, packet);
          this.once(`${key}:ask:${packet.id}`, answer => {
            return resolve(answer);
          });
        }
        // if the user sends a local command '$' then it will ask of the self.
        else {
          if (typeof this.methods[method] !== 'function') {
            return resolve(this._methodNotFound(packet));
          }
          this.methods[method](packet).then(result => {
            const text = typeof result === 'object' ? result.text : result;
            const html = typeof result === 'object' ? result.html : result;
            const data = typeof result === 'object' ? result.data : false;
            packet.a = {
              agent: this.agent || false,
              client: this.client || false,
              meta: {
                key: this.agent.key,
                method,
              },
              text,
              html,
              data,
              created: Date.now(),
            };
            // create a hash for the answer and insert into answer meta.
            packet.a.meta.hash = this.hash(JSON.stringify(packet.a));

            // create a hash for entire packet and insert into packet
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
  params: none
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
  init() {
    this._active = Date.now();
    // set client
    return new Promise((resolve, reject) => {
      this.events.setMaxListeners(this.maxListeners);
      this._assignInherit().then(() => {
        return this._assignBind();
      }).then(() => {
        return this._assignListeners();
      }).then(() => {
        this.state('init');
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
    return this.onDone && typeof this.onDone === 'function' ? this.onDone() : Promise.resolve(this._messages.done)
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
    let text = `${this.agent.name} is ONLINE since ${dateFormat}`;
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
    return this.talk('prompt', {text, agent:this.agent});
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
  func: startDevas
  params: none
  describe:
    Start Devas will initialize the Deva agents inside this curent Deva.
  ***************/
  startDevas() {
    this.state('devas_start');
    return new Promise((resolve, reject) => {
      const devas = [];
      for (let x in this.devas) {
        devas.push(this.devas[x].init());
      }
      Promise.all(devas).then(() => {
        this.state('devas_ready');
        return resolve(this._messages.devas_started);
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
