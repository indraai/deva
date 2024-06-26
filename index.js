// Copyright (c)2023 Quinn Michaels; All Rights Reserved; Legal Signature Required.
// Distributed under the PRIVATE software license, see the accompanying file LICENSE.md
const {EventEmitter} = require('events');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { createHash, randomUUID, createCipheriv, createDecipheriv, randomBytes } = crypto;

const config = require('./config.json').DATA // load the deva core configuration data.
class Deva {
  constructor(opts) {
    opts = opts || {}; // set opts to provided opts or an empty object.
    this._id = opts.id || randomUUID(); // the unique id assigned to the agent at load
    this._info = opts.info || false; // the deva information from the package file.
    this._config = opts.config || {}; // local Config Object
    this._agent = opts.agent || false; // Agent profile object
    this._client = {}; // this will be set on init.
    this._active = false; // the active/birth date.
    this._security = false; // inherited Security features.
    this._support = false; // inherited Support features.
    this._services = false; // inherited Service features.
    this.os = os; // It is used to provide basic operating system related utility functions.
    this.fs = fs; // this is so file system functions are in the core.
    this.path = path; // this is so we can get path in the system.
    this.events = opts.events || new EventEmitter({}); // Event Bus
    this.libs = opts.libs || {}; // used for loading library functions
    this.utils = opts.utils || {}; // parse function
    this.devas = opts.devas || {}; // Devas which are loaded
    this.vars = opts.vars || {}; // Variables object
    this.listeners = opts.listeners || {}; // local Listeners
    this.modules = opts.modules || {}; // 3rd Party Modules
    this.func = opts.func || {}; // local Functions
    this.methods = opts.methods || {}; // local Methods
    this.maxListeners = opts.maxListenners || 0; // set the local maxListeners

    // prevent overwriting existing functions and variables with same name
    for (const opt in opts) {
      if (!this[opt] || !this[`_${opt}`]) this[opt] = opts[opt];
    }

    this.cmdChr = config.cmdChr; // the trigger for local commands
    this.askChr = config.askChr; // the trigger for ask other DEva features

    this.inherit = config.inherit; // set inherit from config
    this.bind = config.bind; // set the bind from the config

    this._state = config.state; // set the current state from config
    this._states = config.states; // set the states from config

    this._zone = config.zone; // set the current zone from config
    this._zones = config.zones; // set the zones from config

    this._action = config.action; // set the action from config
    this._actions = config.actions; // set the actions from config

    this._feature = config.feature; // set the feature from config
    this._features = config.features; // set the features from config

    this._context = opts.context || false; // set the local context

    this._message = config.message; // current message of agent.
    this._messages = config.messages; // set the messages from config
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
        this.bind.forEach(bind => { // loop over the bind items func, method, listener...
          if (this[bind]) for (let x in this[bind]) { // if the root has a bind func, method, listener
            if (typeof this[bind][x] === 'function') { // check to make sure object is a fucntion
              this[bind][x] = this[bind][x].bind(this); // bind the item from the bind object
            }
          }
        });
      }
      catch (e) {
        return this.error(e, false, reject); // trigger the this.error for errors
      }
      finally {
        return resolve(); // when the configuration is complete then return an empty resolve.
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
        for (let listener in this.listeners) { // loop over the liteners
          this.events.on(listener, packet => { // set the event listener
            return this.listeners[listener](packet); // return the listener function
          })
        }
      }
      catch (e) {
        return this.error(e, false, reject); // pass errors to this.error
      }
      finally {
        return resolve(); // resolve the function after everything is done.
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
      id: this.uid(),
      agent: this.agent() || false,
      client: this.client() || false,
      text: `${this._messages.method_not_found}`,
      meta: {
        key: this._agent.key,
        method: packet.q.meta.method,
      },
      created: Date.now(),
    };
    return packet;
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
    this.action('Client');

    // setup any custom methods for the features
    for (const x in client.features) {
      const methods = client.features[x].methods || false;
      if (methods) for (const y in methods) {
        const isFunc = typeof methods[y] === 'function';
        if (isFunc) this.methods[y] = methods[y].bind(this);
      }
    }
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
    this.zone('security');
    this.action('Security'); // set action to Security
    const _cl = this.client(); // set local copy of client data
    try {
      if (!_cl.features.security) return this.Support(); // if no security feature goto Support
      else {
        this.state('set', 'Security');
        const {id, profile, features} = _cl; // make a copy the clinet data.
        const {security} = features; // make a copy the clinet data.
        this._security = { // set this_security with data
          id: this.uid(true), // uuid of the security feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          hash: security.hash, // client preferred hash algorithm
          cipher: security.cipher, // client preferred cipher settings
          concerns: security.concerns, // any concerns for client
          global: security.global, // the global policies for client
          personal: security.devas[this._agent.key], // Client personal features and rules.
        };
        delete this._client.features.security; // make a copy the clinet data.
        this.state('resolve', 'Support');
        return this.Support(); // goto Support when done with Security
      }
    } catch (e) {
      this.state('reject', 'Support');
      return this.error(e); // run error handling if an error is caught
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
    this.zone('support');
    this.action('Support');
    const _cl = this.client(); // set the local client variable
    try {
      if (!_cl.features.support) return this.Services() // move to Services if no support feature
      else {
        this.state('set', 'Support');
        const {id, features, profile} = _cl; // set the local consts from client copy
        const {support} = features; // set support from features const
        this._support = { // set this_support with data
          id: this.uid(true), // uuid of the support feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: support.concerns, // any concerns for client
          global: support.global, // the global policies for client
          personal: support.devas[this._agent.key], // Client personalSecurity features and rules.
        };
        delete this._client.features.support; // delete the support key from the client
        this.state('resolve', 'Services');
        return this.Services(); // when done move to Services
      }
    } catch (e) {
      this.state('reject', 'Services');
      return this.error(e); // run error handling if an error is caught
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
    this.zone('services')
    this.action('Services');
    const _cl = this.client(); // set local client
    try {
      if (!_cl.features.services) return this.Done(); // move to Done if no Services feature
      else {
        this.state('set', 'Services');
        const {id, features, profile} = _cl;   // set the local consts from client copy
        const {services} = features; // set services from features const
        this._services = { // set this_services with data
          id: this.uid(true), // uuid of the services feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: services.concerns, // any concerns for client
          global: services.global, // the global policies for client
          personal: services.devas[this._agent.key], // Client personal features and rules.
        };
        delete this._client.features.services; // delete the services key for isolation
        this.state('resolve', 'Services');
        return this.Done(); // go to Done
      }
    } catch (e) {
      this.state('reject', 'Services');
      return this.error(e); // run error handling if an error is caught
    }
  }

  /**************
  func: Done
  params: none
  describe: The end of the workflow Client Feature Workflow
  ***************/
  Done(client) {
    this.action('done');
    return new Promise((resolve, reject) => {
      try {
        this.state('done');
        delete this._client.features; // delete the features key when done.
        this.state('resolve', 'done');
        return resolve(client); // resolve an empty pr
      } catch (e) {
        this.state('reject', 'done');
        return this.error(e, false, reject);
      }
    });
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
    - evt: The vent label to listen for
    - callback: The callback function to run when the event fires.
  describe: setup a new event listener in the system.
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
    - evt: The event to listen to for a once call.
    - callback: The callback functoin to run when the event fires.
  describe:
  ***************/
  once(evt, callback) {
    return this.events.once(evt, callback);
  }

  /**************
  func: ignore
  params:
    - evt: The event you'd like to ignore.
    - callback: a callback function to execute after removing the event from listerns.
  describe: The ignore function allow the removal of events in the listener group.
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
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.zone('question');

    const id = this.uid(); // generate a unique id for transport.
    const t_split = TEXT.split(' '); // split the text on spaces to get words.
    const data = DATA; // set the DATA to data

    // check to see if the string is an #ask string to talk to the other Deva.
    const isAsk = t_split[0].startsWith(this.askChr);

    // check to see if the string is a command string to run a local method.
    const isCmd = t_split[0].startsWith(this.cmdChr);

    // Format the packet for return on the request.
    const packet = { // create the base q/a packet
      id, // set the id into packet
      q: false, // create empty q object in packet
      a: false, // create empty a object in packet
      created: Date.now(), // timestamp the packet
    };

    let text = TEXT, // let TEXT is text for a manipulation variable
        params = false, // params as false to build params string
        method = 'question', // set the default method to question
        key = this._agent.key; // set a temporary key from the agent key.

    return new Promise((resolve, reject) => {
      // resolve with the no text message if the client says nothing.
      if (!TEXT) return this.finish(this._messages.notext, resolve);
      try { // try to answer the question
        if (isAsk) { // determine if hte question isAsk
          // if:isAsk split the agent key and remove first command character
          key = t_split[0].substring(1);
          //if:isAsk use text split index 1 as the parameter block
          params = t_split[1] ? t_split[1].split(':') : false;
          method = params[0]; // the method to check is then params index 0
          text = t_split.slice(2).join(' ').trim(); // rejoin the text with space
          this.state('ask', `${key} ${method}`);
        }
        else if (isCmd) { // determine if the question is a command
          //if:isCmd use text split index 1 as the parameter block
          params = t_split[0] ? t_split[0].split(':').slice(1) : false;
          method = t_split[0].substring(1); // if:isCmd use the 0 index as the command
          text = t_split.slice(1).join(' ').trim(); // if:isCmd rejoin the string on the space after removing first index
          this.state('cmd', method); // set the state to cmd.
        }

        this.state('set', `question:${method}`)
        packet.q = { // build packet.q container
          id: this.uid(), // set the transport id for the question.
          agent: this.agent(), // set the agent
          client: this.client(), // set the client
          meta: { // build the meta container
            key, // set the key variable
            method, // set method to track function use
            params, // set any params that are associated
          },
          text, // set the text for the packet.
          data, // set the data object
          created: Date.now(), // timestamp the question
        }

        // hash the question
        packet.q.meta.hash = this.hash(packet.q);

        this.action('talk', config.events.question);
        this.talk(config.events.question, this.copy(packet)); // global question event make sure to copy data.

        if (isAsk) { // isAsk check if the question isAsk and talk
          // if: isAsk wait for the once event which is key'd to the packet ID for specified responses
          this.action('talk', `${key}:ask`);
          this.talk(`${key}:ask`, packet);
          this.once(`${key}:ask:${packet.id}`, answer => {
            this.action('talk', config.events.ask);
            this.talk(config.events.ask, this.copy(answer));
            return this.finish(answer, resolve); // if:isAsk resolve the answer from the call
          });
        }
        else { // else: answer tue question locally
          this.state('answer', `question:${method}`);
          return this.answer(packet, resolve, reject);
        }
      }
      catch(e) {
        this.state('reject', 'question');
        return this.error(e); // if a overall error happens this witll call this.error
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
    if (!this._active) return Promise.resolve(this._messages.offline);
    const agent = this.agent();
    const client = this.client();
    // check if method exists and is of type function
    const {method,params} = packet.q.meta;
    const isMethod = this.methods[method] && typeof this.methods[method] == 'function';
    if (!isMethod) return resolve(this._methodNotFound(packet)); // resolve method not found if check if check fails

    // Call the local method to process the question based the extracted parameters
    this.zone('answer', method);
    this.methods[method](packet).then(result => {
      // check the result for the text, html, and data object.
      // this is for when answers are returned from nested Devas.
      const text = typeof result === 'object' ? result.text : result;
      const html = typeof result === 'object' ? result.html : result;
      // if the data passed is NOT an object it will FALSE
      const data = typeof result === 'object' ? result.data : false;

      this.state('set', 'answer')
      const packet_answer = { // setup the packet.a container
        id: this.uid(),
        agent, // set the agent who answered the question
        client, // set the client asking the question
        meta: { // setup the answer meta container
          key: agent.key, // set the agent key inot the meta
          method, // set the method into the meta
          params, // set the params into the meta
        },
        text, // set answer text
        html, // set the answer html
        data, // set the answer data
        created: Date.now(), // set the created date for the answer
      };

      // create a hash for the answer and insert into answer meta.
      packet_answer.meta.hash = this.hash(packet_answer);
      packet.a = packet_answer; // set the packet.a to the packet_answer
      this.action('talk', config.events.answer)
      this.talk(config.events.answer, this.copy(packet)); // global talk event
      this.state('resovle', 'answer')
      return this.finish(packet, resolve); // resolve the packet to the caller.
    }).catch(err => { // catch any errors in the method
      this.state('reject', 'answer');
      return this.error(err, packet, reject); // return this.error with err, packet, reject
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
    if (!this._active) return Promise.resolve(this._messages.offline);
    const {method, params} = packet.q.meta;
    this.zone('ask', method);

    const agent = this.agent();
    const client = this.client();
    // build the answer packet from this model
    const packet_answer = {
      id: this.uid(),
      agent,
      client,
      meta: {
        key: agent.key,
        method,
        params,
      },
      text: false,
      html: false,
      data: false,
      created: Date.now(),
    };

    try {
      if (typeof this.methods[method] !== 'function') {
        return setImmediate(() => {
          this.state('invalid', method);
          this.talk(`${this._agent.key}:ask:${packet.id}`, this._methodNotFound(packet));
        });
      }

      // The method is parsed and depending on what method is asked for it returns
      // the response based on the passed through packet.
      this.methods[method](packet).then(result => {
        if (typeof result === 'object') {
          packet_answer.text = result.text || false;
          packet_answer.html = result.html || false;
          packet_answer.data = result.data || false;
        }
        else {
          packet_answer.text = result;
        }

        this.state('set', `ask:${method}`);
        packet_answer.meta.hash = this.hash(packet_answer);
        packet.a = packet_answer;
        this.talk(config.events.answer, this.copy(packet)); // global talk event
        this.talk(`${agent.key}:ask:${packet.id}`, packet);
      }).catch(err => {
        this.talk(`${agent.key}:ask:${packet.id}`, {error:err});
        return this.error(err, packet);
      })
    }
    catch (e) {
      this.talk(`${agent.key}:ask:${packet.id}`, {error:e});
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
    5. run the onInit custom function if preset or the start function.
    6. The start function will create a chain reaction of states that load.
    7. If there is an error the init function rejects the call.
  usage: this.init(client_object)
  ***************/
  init(client) {
    // set client
    this._active = Date.now();
    const agent = this.agent();

    const _data = {
      id: this.uid(true),
      key: 'init',
      value: agent.key,
      agent,
      client,
      text: this._messages.init,
      created: Date.now(),
    }
    _data.hash = this.hash(_data);

    return new Promise((resolve, reject) => {
      this.events.setMaxListeners(this.maxListeners);
      this._assignInherit().then(() => {
        return this._assignBind();
      }).then(() => {
        return this._assignListeners();
      }).then(() => {
        return this.Client(client);
      }).then(() => {
        return this.Security();
      }).then(() => {
        this.zone('init');
        const hasOnInit = this.onInit && typeof this.onInit === 'function';
        return hasOnInit ? this.onInit(_data) : this.start(_data);
      }).then(done => {
        return resolve(done);
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
    function or running the enter function.
  usage: this.start('msg')
  ***************/
  start(data) {
    this.zone('start');
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.action('start');
    data.value = 'start';
    delete data.hash;
    data.hash = this.hash(data);
    const hasOnStart = this.onStart && typeof this.onStart === 'function' ? true : false;
    this.state('start');
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
  enter(data) {
    this.zone('enter');
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.action('enter');
    data.value = 'enter';
    delete data.hash;
    data.hash = this.hash(data);
    this.state('enter');
    const hasOnEnter = this.onEnter && typeof this.onEnter === 'function' ? true : false;
    return hasOnEnter ? this.onEnter(data) : this.done(data)
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
  done(data) {
    this.zone('done');
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.action('done');
    data.value = 'done';
    delete data.hash;
    data.hash = this.hash(data);
    const hasOnDone = this.onDone && typeof this.onDone === 'function' ? true : false;
    this.state('done');
    return hasOnDone ? this.onDone(data) : Promise.resolve(data);
  }

  /**************
  func: finish
  params:
  - packet: the data to pass to the resolve
  - resolve: the finish resolve to pass back
  describe: This function is use to relay the Agent ito a finish state when
            resolving a question or data.
  usage: this.finish(data, resolve)
  ***************/
  finish(packet, resolve) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.zone('finish'); // set the finish action

    packet.hash = this.hash(packet);// hash the entire packet before finishing.
    // check for agent on finish function in agent
    const hasOnFinish = this.onFinish && typeof this.onFinish === 'function';

    // if: agent has on finish then return on finish
    this.state('finish'); // set the finish state
    if (hasOnFinish) return this.onFinish(packet, resolve);
    // return the provided resolve function or a promise resolve.
    return resolve ? resolve(packet) : Promise.resolve(packet);
  }

  /**************
  func: stop
  params:
    - msg: hte message from the caller incase need to use in calls
  describe:
    The stop function will stop the Deva by setting the active status to false,
    and the state to stop. From here it will check for a custom onStop function
    for anything to run, or run the exit function.

    If the deva is offline it will return the offline message.
  usage:
    this.stop()
  ***************/
  stop() {
    this.zone('stop'); // set the zone to stop
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.state('stop'); // set the state to stop
    const data = { // build the stop data
      id: this.uid(), // set the id
      agent: this.agent(), // set the agent
      client: this.client(), // set the client
      key: 'stop', // set the key
      value: this._messages.stop, // set the value
      created: Date.now(), // set the created date
    }
    this.action('stop'); // set the stop action
    // has stop function then set hasOnStop variable
    const hasOnStop = this.onStop && typeof this.onStop === 'function';
    // if: has on stop then run on stop function or return exit function.
    return hasOnStop ? this.onStop(data) : this.exit(data)
  }


  /**************
  func: exit
  params:
    - msg: hte message from the caller incase need to use in calls
  describe:
    The exit state function is triggered when the Deva is exiting it's online
    status and setting the state to exit for things like security check.

    The return will check for a custom onExit function or run the done
    function.

    If the deva is offline it will return the offline message.
  usage: this.exit('msg')
  ***************/
  exit() {
    this.zone('exit');

    const agent = this.agent();
    const client = this.client();

    this.action('exit');
    const data = {
      id: this.uid(true),
      key: 'exit',
      value: this._messages.exit,
      agent,
      client,
      created: Date.now(),
    }
    data.hash = this.hash(data);

    // clear memory
    this._active = false;
    this._client = false;
    this._security = false;
    this._support = false;
    this._services = false;

    this.state('exit');
    const hasOnExit = this.onExit && typeof this.onExit === 'function';
    return hasOnExit ? this.onExit(data) : Promise.resolve(data)
  }


  ////////////////////////////

  /**************
  func: state
  params:
    - value: The state value to set for the Deva that matches to this._states
    - extra: any extra text to add ot the state change.
  ***************/
  state(value=false, extra=false) {
    try {
      if (!value || !this._states[value]) return; // return if no matching value
      this._state = value; // set the local state variable.
      const lookup = this._states[value]; // set the local states lookup
      const text = extra ? `${lookup} ${extra}` : lookup; // set text from lookup with extra
      const data = { // build the data object
        id: this.uid(), // set the data id
        agent: this.agent(), // set the agent
        client: this.client(), // set the client
        key: 'state', // set the key to state
        value, // set the value to the passed in value
        text, // set the text value of the data
        created: Date.now(), // set the data created date.
      };
      data.hash = this.hash(data); // hash the data
      this.talk(config.events.state, data); // broadcasat the state event
    } catch (e) { // catch any errors
      return this.error(e); // return if an error happens
    }
  }

  /**************
  func: states
  params: none
  describe: returns the avaiable staets values.
  ***************/
  states() {
    this.action('func', 'states');
    this.state('return', 'states');
    return {
      id: this.uid(true),
      key: 'states',
      value: this._states,
      created: Date.now(),
    }
  }

  /**************
  func: zone
  params:
    - st: The zone flag to set for the Deva that matches to this._zones
  describe
  ***************/
  zone(value=false, extra=false) {
    if (!value || !this._zones[value] || value === this._zone) return;
    try {
      this._zone = value;

      const lookup = this._zones[value]; // set the lookup value
      const text = extra ? `${lookup} ${extra}` : lookup; // set the text value

      const data = { // build the zone data
        id: this.uid(), // set the packetid
        agent: this.agent(),
        client: this.client(),
        key: 'zone',
        value,
        text,
        created: Date.now(),
      };
      data.hash = this.hash(data);
      this.talk(config.events.zone, data);
    } catch (e) {
      return this.error(e);
    }
  }

  /**************
  func: zones
  params: none
  describe: returns a listing of zones currently in the system.
  ***************/
  zones() {
    this.action('func', 'zones');
    this.state('return', 'zones');
    return {
      id: this.uid(true), // set the uuid of the data
      agent: this.agent(), // set the agent value
      cleint: this.cleint(), // set the client value
      key: 'zones', // set the key return value
      value: this._zones, // set the list of zones
      created: Date.now(), // set the created date of the object.
    }
  }

  /**************
  func: action
  params:
    - value: The state flag to set for the Deva that matches to this._states
    - extra: Any extra text to send with the action value.
  describe
  ***************/
  action(value=false, extra=false) {
    try {
      if (!value) return; // check feature value
      this._action = value; // set the local action variable
      // check local vars for custom actions
      const var_action = this.vars.actions ? this.vars.actions[value] : false;
      // check the message action
      const msg_action = var_action || this._actions[value];
      const msg = msg_action || action; // set the correct message
      const text = extra ? `${msg} ${extra}` : msg; // set the text of the action
      const data = { // build the data object for the action.
        id: this.uid(true), // generate a guid for the action transmitssion.
        agent: this.agent(), // the agent data to send with the action
        client: this.client(), // the client data to send with the action
        key: 'action', // the key for event to transmit action type
        value, // the value key which is the action passed
        text, // text of the action to send
        created: Date.now(), // action time stamp
      };
      data.hash = this.hash(data); // generate a hash of the action packet.
      this.talk(config.events.action, data); // talk the core action event
    } catch (e) { // catch any errors that occur
      return this.error(e); // return error on error catch
    }
  }

  /**************
  func: actions
  params: none
  describe: Returns a list of available actions in the system.
  ***************/
  actions() {
    this.action('func', 'actions');
    this.state('return', 'actions');
    return {
      id: this.uid(true), // set the id with a uuid
      agent: this.agent(), // set the agent value
      client: this.client(), // set the client value
      key: 'actions', // set the data key
      value: this._actions, // set the value to the actions list
      created: Date.now(), // set the data created date
    }
  }

  /**************
  func: feature
  params:
    - value: The feature flag to set for the Deva that matches to this._features
    - extra: Any extra text to send with the feature value.
  describe
  ***************/
  feature(value=false, extra=false) {
    try {
      if (!value || !this._features[value]) return; // check feature value
      this._feature = value; // set local feature variable

      const lookup = this._features[value]; // set the lookup value
      const text = extra ? `${lookup} ${extra}` : lookup; // set the text value

      const data = { // build data object
        id: this.uid(true), // set the id
        agent: this.agent(), // set the agent transporting the packet.
        key: 'feature', // set the key for transport
        value, // set the value of the key
        text, // set the text value
        created: Date.now(), // set the creation date
      };
      data.hash = this.hash(data); // generate the hash value of the data packet
      this.talk(config.events.feature, data); // talk the feature event with data
    } catch (e) { // catch any errors
      return this.error(e); // retun this.error when an error is caught.
    }
  }

  /**************
  func: features
  params: none
  describe: return a list of features that are available to the system.
  ***************/
  features() {
    this.state('return', 'features');
    return { // return the data object
      id: this.uid(true), // set the object id
      agent: this.agent(), // set the agent value.
      client: this.client(), // set the client value.
      key: 'features', // set the key
      value: this._features, // set the value to the features list
      created: Date.now(), // set the created date.
    }
  }

  /**************
  func: context
  params:
    - value: The context flag to set for the Deva that matches to this._contexts
    - extra: Any extra text that is sent with the context value.
  describe
  ***************/
  context(value=false, extra=false) {
    try {
      if (!value) return;
      this._context = value;
      const lookup = this.vars.context[value] || value;
      const text = extra ? `${lookup} ${extra}` : lookup;

      const data = {
        id: this.uid(true),
        agent: this.agent(),
        client: this.client(),
        key: 'context',
        value,
        text,
        created: Date.now(),
      };

      data.hash = this.hash(data);
      this.talk(config.events.context, data);
    } catch (e) {
      return this.error(e);
    }
  }

  contexts() {
    if (!this._active) return this._messages.offline; // check the active status
    this.state('return', 'contexts');
    return {
      id: this.uid(true),
      agent: this.agent(),
      client: this.client(),
      key: 'contexts',
      value: this.vars.context || false,
      created: Date.now(),
    }
  }

  /**************
  func: client
  params: none
  describe: returns the current client values in the system.
  usage: this.client();
  ***************/
  client() {
    if (!this._active) return this._messages.offline; // check the active status
    const client_copy = this.copy(this._client); // create a copy of the client data
    return client_copy; // return the copy of the client data.
  }

  /**************
  func: agent
  params: none
  describe: returns the current agent values in the system.
  usage: this.agent()
  ***************/
  agent() {
    if (!this._active) return this._messages.offline; // check the active status
    const agent_copy = this.copy(this._agent); // create a copy of the agent data.
    return agent_copy; // return the copy of the agent data.
  }

  // FEATURE FUNCTIONS
  /**************
  func: security
  params: none
  describe: basic security features available in a Deva.
  usage: this.security()
  ***************/
  security() {
    if (!this._active) return this._messages.offline; // check the active status
    this.zone('security');
    this.feature('security'); // set the security state
    try {
      this.state('return', 'security'); // set the security state
      return this.copy(this._security); // return the security feature
    } catch (e) {return this.error(e);}
  }

  /**************
  func: support
  params: none
  describe: basic support features available in a Deva.
  usage: this.support()
  ***************/
  support() {
    if (!this._active) return this._messages.offline; // check the active status
    this.zone('support');
    this.feature('support'); // set the support state
    try {
      this.state('return', 'support'); // set the action to support.
      return this.copy(this._support); // return the support feature
    } catch (e) {
      return this.error(e); // return this.error when error catch
    }
  }

  /**************
  func: services
  params: none
  describe: basic services features available in a Deva.
  usage: this.services()
  ***************/
  services(opts) {
    if (!this._active) return this._messages.offline; // check the active status
    this.zone('services');
    this.feature('services'); // set the support state
    try {
      this.state('return', 'services'); // set the services state
      return this.copy(this._services); // return the services feature
    } catch (e) {
      return this.error(e); // return this.error when error catch
    }
  }

  /**************
  func: load
  params:
    -deva: The Deva model to load.
  describe: This function will enable fast loading of Deva into the system.
  ***************/
  load(key, client) {
    this.zone('load', key);
    this.action('load', key);
    this.state('load', key);
    return this.devas[key].init(client);
  }

  /**************
  func: unload
  params:
    - deva: The deva key to unload
  describe: Unload a currently loaded Deva.
  ***************/
  unload(key) {
    this.zone('unload', key);
    return new Promise((resolve, reject) => {
      try {
        this.action('uload', key);
        this.devas[key].stop().then(exit => {
          delete this.devas[key];
          this.talk(config.events.unload, key);
        });
        this.state('unload', key)
        return resolve(this._states.unload);
      } catch (e) {
        return this.error(e, this.devas[key], reject)
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
    // this.action('hash');
    algo = algo || this._security.hash || 'md5';
    const the_hash = createHash(algo);
    the_hash.update(JSON.stringify(str));
    const _digest = the_hash.digest('base64');
    return `${algo}-${_digest}`;
  }

  /**************
  func: cipher
  params: str - string to encrypt
  describe:
    The encrypt function allows for the internal encryption of data based on the
    defined client security settings.
  ***************/
  cipher(str) {
    this.feature('cipher');
    // this.action('cipher');
    const security = this._security;
    const {password, algorithm} = security.cipher;
    const key = createHash('sha256').update(String(password)).digest('base64');
    const key_in_bytes = Buffer.from(key, 'base64')
    const iv = randomBytes(16);
    // create a new cipher
    const _cipher = createCipheriv(algorithm, key_in_bytes, iv);
    const encrypted = _cipher.update(String(str), 'utf8', 'hex') + _cipher.final('hex');

    this.state('return', 'cipher');
    return {
      iv: iv.toString('base64'),
      key,
      encrypted,
    }
  }

  decipher(opt) {
    this.feature('decipher');
    // this.action('decipher');
    const iv = Buffer.from(opt.iv, 'base64');
    const encrypted = Buffer.from(opt.encrypted, 'hex');
    const key_in_bytes = Buffer.from(opt.key, 'base64')
    const security = this._security;
    const {algorithm} = security.cipher;
    const decipher = createDecipheriv( algorithm, key_in_bytes, iv);
    const decrypted = decipher.update(encrypted);
    const final = Buffer.concat([decrypted, decipher.final()]);
    return final.toString();
    this.state('return', 'decipher');
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
    this.feature('prompt');
    // Talk a global prompt event for the client
    const agent = this.agent();
    const client = this.client();
    const _data = {
      id: this.uid(true),
      key: 'prompt',
      value: agent.key,
      agent,
      client,
      text,
      created: Date.now(),
    }
    return this.talk(config.events.prompt, _data);
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
    return JSON.parse(JSON.stringify(obj));
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
    this.feature('getToday');
    d = d ? d : Date.now();
    const today = new Date(d);
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    this.state('return', 'getToday');
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
    this.feature('formatDate');
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
    const theDate = d.toLocaleDateString(this._client.profile.locale, formats[format]);
    const theTime = time ? this.formatTime(d) : false;
    this.state('return', 'formatDate');
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
    this.feature('formatTime');
    return t.toLocaleTimeString(this._client.profile.locale);     // return the formatted time string
  }

  /**************
  func: formatCurrency
  params:
    - n: is the number that you want to return the currency of.
  describe:
    The formatCurrency function will format a currency value based on the setting
    in the client profile.
  ***************/
  formatCurrency(n, cur=false) {
    this.feature('formatCurrency');
    const currency = cur || this._client.profile.currency;
    return new Intl.NumberFormat(this._client.profile.locale, { style: 'currency', currency: currency }).format(n);
  }

  /**************
  func: formatCurrency
  params:
    - n: is the number that you want to return the currency of.
  describe:
    The formatCurrency function will format a currency value based on the setting
    in the client profile.
  ***************/
  formatNumber(n) {
    this.feature('formatNumber');
    return new Intl.NumberFormat(this._client.profile.locale).format(n);
  }

  /**************
  func: formatPercent
  params:
    - n: is the number that you want to format as a percent.
    - dec: is the number of decimal places to apply to the number.
  describe:
  ***************/
  formatPercent(n, dec=2) {
    this.feature('formatPercent');
    return parseFloat(n).toFixed(dec) + '%';
  }

  /**************
  func: trimWords
  params:
    - text: The text to trim.
    - maxwords: The number of words to max.
  describe:
    A utility function to trimText intput to a specific word count.
  ***************/
  trimWords(text, maxwords) {
    this.feature('trimWords');
    const splitter = text.split(' ');
    if (splitter < maxwords) return text;
    this.state('return', 'trimmed words');
    return splitter.slice(0, maxwords).join(' ');
  }

  /**************
  func: dupes
  params: dupers
  describe: remove duplicees from an array.
  ***************/
  dupes(dupers) {
    this.feature('dupes');
    if (!Array.isArray(dupers)) return dupers;
    const check = [];
    this.state('return', 'duplicates removed');
    return dupers.filter(dupe => {
      if (!check.includes(dupe)) {
        check.push(dupe);
        return dupe;
      }
    });
  }

  /**************
  func: info
  params: id
  describe: return info data.
  ***************/
  info() {
    // check the active status
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.feature('info');
    return this._info;
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
    this.feature('status');

    // format the date since active for output.
    const dateFormat = this.formatDate(this._active, 'long', true);
    // create the text msg string
    let text = `${this._agent.profile.name} active since ${dateFormat}`;
    if (msg) text = text + `\n${msg}`;                      // append the msg string if msg true.
    return text;                           // return final text string
  }

  /**************
  func: help
  params:
    - msg: the help msg to search against
    - help_dir: base directory of the deva help files.
  describe:
    the help utility makes it easy to create help files for your deva. the utility
    checks the existence of a help file in the passed in directory then if
    one exists it will then present it based on the users request text input.
  ***************/
  help(msg, help_dir) {
    return new Promise((resolve, reject) => {
      if (!this._active) return resolve(this._messages.offline);
      this.feature('help');
      this.zone('help');

      const params = msg.split(' ');
      let helpFile = 'main';
      if (params[0]) helpFile = params[0];
      if (params[1]) helpFile = `${params[0]}_${params[1]}`;
      helpFile = path.join(help_dir, 'help', `${helpFile}.feecting`);
      try {
        this.state('resolve', 'help');
        return resolve(fs.readFileSync(helpFile, 'utf8'));
      } catch (e) {
        this.state('reject', 'helpFile');
        return reject(e)
      }
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
    this.zone('error');

    this.action('error')
    const agent = this.agent();
    const client = this.client();
    const _data = {
      id: this.uid(true),
      key: 'error',
      value: agent.key,
      agent,
      client,
      error: err,
      data,
      created: Date.now(),
    }
    this.talk(config.events.error, this.copy(_data));
    const hasOnError = this.onError && typeof this.onError === 'function' ? true : false;

    this.state('error');
    if (hasOnError) return this.onError(err, data, reject);
    else return reject ? reject(err) : err;
  }

}
module.exports = Deva;
