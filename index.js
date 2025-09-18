"use strict";
// ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:44435048570336088519 LICENSE.md

import {EventEmitter} from 'node:events';
import {createHash,randomUUID} from 'crypto';
import lib from './lib/index.js';
import config from './config/index.js';
import pkg from './package.json' with {type:'json'};

class Deva {
  constructor(opts) {
    opts = opts || {}; // set opts to provided opts or an empty object.
    this._core = pkg;
    this._id = opts.id || randomUUID(); // the unique id assigned to the agent at load
    this._info = opts.info || false; // the deva information from the package file.
    this._config = opts.config || {}; // local Config Object
    this._agent = opts.agent || false; // Agent profile object
    this._client = {}; // this will be set on init.
    this._active = false; // the active/birth date.
    this._indra = false; // inherited Indra features.
    this._veda = false; // inherited Veda features.
    this._license = false; // inherited License features.
    this._data = false; // inherited Data features.
    this._error = false; // inherited Error features.
    this._log = false; // inherited Log features.
    this._report = false; // inherited Report features.
    this._vector = false; // inherited Vector features.
    this._king = false; // inherited King features.
    this._treasury = false; // inherited Vector features.
    this._security = false; // inherited Security features.
    this._guard = false; // inherited Guard features.
    this._defense = false; // inherited Security features.
    this._wall = false; // inherited Wall features.
    this._proxy = false; // inherited Proxy features.
    this._legal = false; // inherited Legal features.
    this._authority = false; // inherited Justice features.
    this._justice = false; // inherited Justice features.
    this._support = false; // inherited Support features.
    this._services = false; // inherited Service features.
    this._systems = false; // inherited Systems features.
    this._networks = false; // inherited Systems features.
    this.events = opts.events || new EventEmitter({}); // Event Bus
    this.lib = new lib({pkg}); // used for loading library functions    
    this.utils = opts.utils || {}; // parse functions inside the deva
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

    this._inherit = config.inherit; // set inherit from config data.
    this._bind = config.bind; // set the bind from the config data.

    this._uid = config.uid; // set the uid options

    
    this._events = config.events; // set the core system events
    this._feature = config.feature; // set the feature from config data.
    this._features = config.features; // set the features from config data.

    this._zone = config.zone; // set the current zone from config data.
    this._zones = config.zones; // set the zones from config data.
    
    this._action = config.action; // set the action from config data.
    this._actions = config.actions; // set the actions from config data.

    this._state = config.state; // set the current state from config data.
    this._states = config.states; // set the states from options

    this._context = config.context || false; // set the local context

    this._messages = config.messages; // set the messages from config data.
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
        this._bind.forEach(bind => { // loop over the bind items func, method, listener...
          if (this[bind]) for (let x in this[bind]) { // if the root has a bind func, method, listener
            if (typeof this[bind][x] === 'function') { // check to make sure object is a fucntion
              this[bind][x] = this[bind][x].bind(this); // bind the item from the bind object
            }
          }
        });
      }
      catch (e) {
        return this.err(e, false, reject); // trigger the this.err for errors
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
        return this.err(e, false, reject); // pass errors to this.err
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
          this._inherit.forEach(inherit => {
            this.devas[d][inherit] = this[inherit];
          });
        }
        return resolve();
      }
      catch (e) {
        return this.err(e, false, reject);
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
    if (!this._active) return this._messages.offline; // check the active status
    const id = this.uid();
    const agent = this.agent() || false;
    const client = this.client() || false;
    const {meta, params} = packet.q;
    const text = `${this._messages.method_not_found} ${agent.key} ${meta.method}`
    packet.a = {
      id,
      agent,
      client,
      text,
      meta: {
        key: agent.key,
        method: meta.method,
      },
      created: Date.now(),
    };
    packet.a.md5 = this.hash(packet.a, 'md5');
    packet.a.sha256 = this.hash(packet.a, 'sha256');
    packet.a.sha512 = this.hash(packet.a, 'sha512');

    delete packet.md5;
    delete packet.sha256;
    delete packet.sha512;
    
    packet.md5 = this.hash(packet, 'md5');
    packet.sha256 = this.hash(packet, 'sha256');
    packet.sha512 = this.hash(packet, 'sha512');
    
    this.state('invalid', `${meta.method}:${packet.id.uid}`);
    return packet;
  }

  _getFeature(key, value) {
    if (!this._active) return this._messages.offline; // check the active status
    this.zone(key);
    this.feature(key); // set the security state
    this.action(key);
    this.state(key);
    try {
      const data = this.lib.copy(value);
      this.state('return', key); // set the security state
      return data; // return the security feature
    } catch (e) {
      this.state('catch', key);
      return this.err(e);
    }    
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
  Client(client, resolve, reject) {
    this.feature('client', `client:${client.id}`);
    this.zone('client', `client:${client.id}`);
    this.action('client', `client:${client.id}`);
    // setup any custom methods for the features
    this.state('set', `client:feature:methods:${client.id}`);
    try {
      for (const x in client.features) {
        const methods = client.features[x].methods || false;
        if (methods) for (const y in methods) {
          const isFunc = typeof methods[y] === 'function';
          if (isFunc) {
            this.methods[y] = methods[y].bind(this);
          }
        }
      }
      const _client = this.lib.copy(client);                // copy the client parameter
      this.state('data', `client:${client.id}`);
      this._client = _client;                           // set local _client to this scope

      this.action('return', `client:${client.id}`);
      return resolve();
    } catch (e) {
      this.action('investigate', `client:${client.id}`);
      return this.err(e, false, reject);
    }
  }

  /**************
  func: Feature
  params: client: false
  describe:
    The Security feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Feature(feature, resolve, reject) {
    const _id = this.uid();
    this.feature(feature, _id.uid);
    this.zone(feature, _id.uid);
    const _cl = this.client(); // set local copy of client data
    try {
      if (!_cl.features[feature]) return resolve(); // if no security feature goto Support
      else {
        this.action(feature, _id.uid); // set action to feature
        const _fe = `_${feature}`;
        const {id, profile, features} = _cl; // make a copy the clinet data.
        const data = features[feature]; // make a copy the clinet data.
        this.state(feature, _id.uid);
        this[_fe] = { // set this feature with data
          id: _id, // uid of the feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: data.concerns, // any concerns for client
          global: data.global, // the global policies for client
          personal: data.devas[this._agent.key], // Client personal features and rules.
          created: Date.now(),
        };
        delete this._client.features[feature]; // make a copy the clinet data.
        this.state('resolve', `${feature}:${_id.uid}`);
        return resolve(feature); // resolve when done
      }
    } catch (e) {
      this.state('catch', `${feature}:${_id.uid}`);
      return this.err(e, feature, reject); // run error handling if an error is caught
    }
  }


  /**************
  func: Indra
  params: resolve, reject
  describe:
    The Indra feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Indra(resolve, reject) {
    return this.Feature('indra', resolve, reject);
  }

  /**************
  func: Veda
  params: resolve, reject
  describe:
    The Veda feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Veda(resolve, reject) {
    return this.Feature('veda', resolve, reject);
  }

  /**************
  func: License
  params: resolve, reject
  describe:
    The License feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  License(resolve, reject) {
    return this.Feature('license', resolve, reject);
  }

  /**************
  func: Data
  params: resolve, reject
  describe:
    The Data feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Data(resolve, reject) {
    return this.Feature('data', resolve, reject);
  }

  /**************
  func: Error
  params: resolve, reject
  describe:
    The Error feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Error(resolve, reject) {
    return this.Feature('error', resolve, reject);
  }

  /**************
  func: Log
  params: resolve, reject
  describe:
    The Log feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Log(resolve, reject) {
    return this.Feature('log', resolve, reject);
  }

  /**************
  func: Report
  params: resolve, reject
  describe:
    The Report feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Report(resolve, reject) {
    return this.Feature('report', resolve, reject);
  }

  /**************
  func: Vector
  params: resolve, reject
  describe:
    The Vector feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Vector(resolve, reject) {
    return this.Feature('vector', resolve, reject);
  }

  /**************
  func: King
  params: resolve, reject
  describe:
    The King feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  King(resolve, reject) {
    return this.Feature('king', resolve, reject);
  }

  /**************
  func: Owner
  params: resolve, reject
  describe:
    The Owner feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Owner(resolve, reject) {
    return this.Feature('owner', resolve, reject);
  }

  /**************
  func: Treasury
  params: resolve, reject
  describe:
    The Treasury feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Treasury(resolve, reject) {
    return this.Feature('treasury', resolve, reject);
  }

  /**************
  func: Security
  params: resolve, reject
  describe:
    The Security feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Security(resolve, reject) {
    return this.Feature('security', resolve, reject);
  }

  /**************
  func: Guard
  params: resolve, reject
  describe:
    The Guard feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Guard(resolve, reject) {
    return this.Feature('guard', resolve, reject);
  }

  /**************
  func: Defense
  params: resolve, reject
  describe:
    The Defense feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Defense(resolve, reject) {
    return this.Feature('defense', resolve, reject);
  }

  /**************
  func: Wall
  params: resolve, reject
  describe:
    The Defense feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Wall(resolve, reject) {
    return this.Feature('wall', resolve, reject);
  }

  /**************
  func: Shield
  params: resolve, reject
  describe:
    The Shield feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Shield(resolve, reject) {
    return this.Feature('shield', resolve, reject);
  }

  /**************
  func: Proxy
  params: resolve, reject
  describe:
    The Defense feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Proxy(resolve, reject) {
    return this.Feature('proxy', resolve, reject);
  }

  /**************
  func: Legal
  params: resolve, reject
  describe:
    The Legal feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Legal(resolve, reject) {
    return this.Feature('legal', resolve, reject);
  }
  
  /**************
  func: Justice
  params: resolve, reject
  describe:
    The Justice feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Justice(resolve, reject) {
    return this.Feature('justice', resolve, reject);
  }
  
  /**************
  func: Authority
  params: resolve, reject
  describe:
    The Authority feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Authority(resolve, reject) {
    return this.Feature('authority', resolve, reject);
  }

  /**************
  func: Support
  params: resolve, reject
  describe:
    The Support feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Support(resolve, reject) {
    return this.Feature('support', resolve, reject);
  }

  /**************
  func: Services
  params: resolve, reject
  describe:
    The Services feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Services(resolve, reject) {
    return this.Feature('services', resolve, reject);
  }

  /**************
  func: Systems
  params: client: false
  describe:
    The Systems feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Systems(resolve, reject) {
    return this.Feature('systems', resolve, reject);
  }

  /**************
  func: Networks
  params: resolve, reject
  describe:
    The Networks feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Networks(resolve, reject) {
    return this.Feature('networks', resolve, reject);
  }

  /**************
  func: Done
  params: none
  describe: The end of the workflow Client Feature Workflow
  ***************/
  Done(resolve, reject) {
    try {
      delete this._client.features; // delete the features key when done.
      this.state('Done', 'Done'); // set the done state.
      return resolve(this._client); // resolve an empty pr
    } catch (e) {
      this.state('catch', 'Done');
      return this.err(e, false, reject);
    }
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
  talk(evt, packet=false) {
    this.action('talk', evt)
    return this.events.emit(evt, packet);
  }

  /**************
  func: listen
  params:
    - evt: The vent label to listen for
    - callback: The callback function to run when the event fires.
  describe: setup a new event listener in the system.
  ***************/
  listen(evt, callback) {
    this.action('listen', evt);
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
    this.action('once', evt)
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
    this.action('ignore', evt);
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
    const id = this.uid(); // generate a unique id for transport.
    // check the active status
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.zone('question', id.uid);
    this.action('question', id.uid);
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
        key = this.agent().key; // set a temporary key from the agent key.

    return new Promise((resolve, reject) => {
      // resolve with the no text message if the client says nothing.
      if (!TEXT) return resolve(this._messages.notext, resolve);
      this.state('try', `question:${id.uid}`);
      try { // try to answer the question
        if (isAsk) { // determine if hte question isAsk
          // if:isAsk split the agent key and remove first command character
          key = t_split[0].substring(1);
          //if:isAsk use text split index 1 as the parameter block
          params = t_split[1] ? t_split[1].split(':') : false;
          method = params[0]; // the method to check is then params index 0
          text = t_split.slice(2).join(' ').trim(); // rejoin the text with space
          this.state('ask', `${key}:${method}:${id.uid}`);
        }
        else if (isCmd) { // determine if the question is a command
          //if:isCmd use text split index 1 as the parameter block
          params = t_split[0] ? t_split[0].split(':') : false;
          method = t_split[0].split(':')[0].substring(1); // if:isCmd use the 0 index as the command
          text = t_split.slice(1).join(' ').trim(); // if:isCmd rejoin the string on the space after removing first index
          this.state('cmd', `${method}:${id.uid}`); // set the state to cmd.
        }

        this.state('set', `question:${method}:${id.uid}`)
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
        packet.q.md5 = this.hash(packet.q, 'md5');
        packet.q.sha256 = this.hash(packet.q, 'sha256');
        packet.q.sha512 = this.hash(packet.q, 'sha512');

        this.talk(this._events.question, this.lib.copy(packet)); // global question event make sure to copy data.

        if (isAsk) { // isAsk check if the question isAsk and talk
          // if: isAsk wait for the once event which is key'd to the packet ID for specified responses
          this.talk(`${key}:ask`, packet);
          this.once(`${key}:ask:${packet.id.uid}`, answer => {
            this.talk(this._events.ask, this.lib.copy(answer));
            this.state('return', `${key}:ask:${packet.id.uid}`);
            return this.finish(answer, resolve); // if:isAsk resolve the answer from the call
          });
        }
        else { // else: answer the question locally
          this.state('answer', `${method}:${id.uid}`); //set the answer state to the method
          return this.answer(packet, resolve, reject);
        }
      }
      catch(e) {
        this.state('catch', `${id.uid}`);
        return this.err(e); // if a overall error happens this witll call this.err
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
    The answer function is called from the question function to return an answer
    from the agent from the pre-determined method.
  ***************/
  answer(packet, resolve, reject) {
    const id = this.uid();
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.zone('answer', id.uid); // set zone to answer
    const agent = this.agent();
    const client = this.client();
    // check if method exists and is of type function
    const {method,params} = packet.q.meta;
    this.action('answer', `${method}:${id.uid}`);
        
    this.state('try', `answer:${method}:${id.uid}`);
    try {
      const isMethod = this.methods[method] && typeof this.methods[method] == 'function';
      if (!isMethod) return resolve(this._methodNotFound(packet)); // resolve method not found if check if check fails      

      this.action('method', `answer:${method}:${id.uid}`);
      this.methods[method](packet).then(result => {
        // check the result for the text, html, and data object.          // this is for when answers are returned from nested Devas.
        const text = typeof result === 'object' ? result.text : result;
        const html = typeof result === 'object' ? result.html : result;
        // if the data passed is NOT an object it will FALSE
        const data = typeof result === 'object' ? result.data : false;
      
        this.state('set', `answer:${method}:packet_answer:${id.uid}`);
        const packet_answer = { // setup the packet.a container
          id,
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
        packet_answer.md5 = this.hash(packet_answer, 'md5');
        packet_answer.sha256 = this.hash(packet_answer, 'sha256');
        packet_answer.sha512 = this.hash(packet_answer, 'sha512');

        packet.a = packet_answer; // set the packet.a to the packet_answer
        this.talk(this._events.answer, this.lib.copy(packet)); // global talk event
      
        this.state('return', `answer:${method}:${id.uid}`); // set the state resolve answer
        return this.finish(packet, resolve); // resolve the packet to the caller.
      }).catch(err => { // catch any errors in the method
        this.state('catch', `answer:${method}:${id.uid}`); // set the state reject answer
        return this.err(err, packet, reject); // return this.err with err, packet, reject
      });
    } catch (e) {
      this.state('catch', `answer:${method}:${id.uid}`);
      return this.err(e, packet, reject);
    }
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
    const agent = this.agent();
    const client = this.client();
    const {method, params} = packet.q.meta;
    this.zone('ask', `${method}:${packet.id.uid}`);
    this.action('ask', `${method}:${packet.id.uid}`);
    // build the answer packet from this model
    this.state('try', `ask:${method}:${packet.id.uid}`);
    try {
      if (typeof this.methods[method] !== 'function') {
        return setImmediate(() => {
          this.talk(`${this._agent.key}:ask:${packet.id.uid}`, this._methodNotFound(packet));
        });
      }

      this.state('set', `ask:${method}:packet_answer:${packet.id.uid}`);
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
        
        packet_answer.md5 = this.hash(packet_answer, 'md5'); // md5 the answer.
        packet_answer.sha256 = this.hash(packet_answer, 'sha256'); // sha256 the answer.
        packet_answer.sha512 = this.hash(packet_answer, 'sha512'); // sha512 the answer

        packet.q.agent = agent; // set the question agent as the ask agent.
        packet.a = packet_answer; // set the packet answer.
        
        // delete previous hashes before creating new ones.
        delete packet.md5;
        delete packet.sha256;
        delete packet.sha512;
        
        // create new hashes for the packet before return.
        packet.md5 = this.hash(packet, 'md5');
        packet.sha256 = this.hash(packet, 'sha256');
        packet.sha512 = this.hash(packet, 'sha512');
        
        this.talk(this._events.answer, this.lib.copy(packet)); // global talk event
        this.talk(`${agent.key}:ask:${packet.id.uid}`, packet);
      }).catch(err => {
        this.talk(`${agent.key}:ask:${packet.id.uid}`, {error:err});
        this.state('catch', `ask:${method}:${packet.id.uid}`);
        return this.err(err, packet);
      })
    }
    catch (e) {
      this.state('catch', `ask:${method}:${packet.id.uid}`);
      this.talk(`${agent.key}:ask:${packet.id.uid}`, {error:e});
      return this.err(e, packet)
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
    2. Assign the Inherited Properties
    3. Assign binding functions and methods to 'this' scope.
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

    const data = {
      id: this.uid(),
      key: 'init',
      value: agent.key,
      agent,
      client,
      text: this._messages.init,
      created: Date.now(),
    }
    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');

    return new Promise((resolve, reject) => {
      
      const license_check = this.license_check(client.VLA, this._core.VLA);
      if (!license_check) {
        this.prompt(this._messages.client_license_invalid);
        return resolve(this._messages.client_license_invalid); // return if} license check fails
      }
      
      this.events.setMaxListeners(this.maxListeners);
      this._assignInherit().then(() => {
        return this._assignBind();
      }).then(() => {
        return this._assignListeners();
      }).then(() => {
        this.feature('init');
        this.zone('init');
        this.action('init');
        this.state('init');
      }).then(() => {
        return this.Client(client, resolve, reject);
      }).then(() => {
        return this.Indra(resolve, reject);
      }).then(() => {
        return this.Veda(resolve, reject);
      }).then(() => {
        return this.License(resolve, reject);
      }).then(() => {
        return this.Data(resolve, reject);
      }).then(() => {
        return this.Error(resolve, reject);
      }).then(() => {
        return this.Log(resolve, reject);
      }).then(() => {
        return this.Report(resolve, reject);
      }).then(() => {
        return this.Vector(resolve, reject);
      }).then(() => {
        return this.King(resolve, reject);
      }).then(() => {
        return this.Owner(resolve, reject);
      }).then(() => {
        return this.Treasury(resolve, reject);
      }).then(() => {
        return this.Security(resolve, reject);
      }).then(() => {
        return this.Guard(resolve, reject);
      }).then(() => {
        return this.Defense(resolve, reject);
      }).then(() => {
        return this.Wall(resolve, reject);
      }).then(() => {
        return this.Shield(resolve, reject);
      }).then(() => {
        return this.Proxy(resolve, reject);
      }).then(() => {
        return this.Legal(resolve, reject);
      }).then(() => {
        return this.Authority(resolve, reject);
      }).then(() => {
        return this.Justice(resolve, reject);
      }).then(() => {
        return this.Support(resolve, reject);
      }).then(() => {
        return this.Services(resolve, reject);
      }).then(() => {
        return this.Systems(resolve, reject);
      }).then(() => {
        return this.Networks(resolve, reject);
      }).then(() => {
        return this.Done(resolve, reject);
      }).then(() => {
        const hasOnInit = this.onInit && typeof this.onInit === 'function';
        this.state('return', `init:${data.id.uid}`);
        return hasOnInit ? this.onInit(data, resolve) : this.start(data, resolve);
      }).catch(err => {
        this.state('catch', `init:${data.id.uid}`);
        return this.err(err, client, reject);
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
  start(data, resolve) {
    this.zone('start', data.id.uid);
    if (!this._active) return resolve(this._messages.offline);

    this.action('start', data.id.uid);
    const id = this.uid();
    
    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.value = 'start';

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');
    
    const hasOnStart = this.onStart && typeof this.onStart === 'function' ? true : false;

    this.state('start', data.id.uid);
    this.talk(this._events.start, data);
    return hasOnStart ? this.onStart(data, resolve) : this.enter(data, resolve)
  }

  /**************
  func: enter
  params:
    - msg: the message from the caller incase need to use in calls
  describe:
    The enter function will check the active status of the Deva and set it to
    offline or enter.

    If the Deva is offline it will return the offline message.
  usage: this.enter('msg')
  ***************/
  enter(data, resolve) {
    this.zone('enter', data.id.uid);
    if (!this._active) return resolve(this._messages.offline);

    this.action('enter', data.id.uid);
    const hasOnEnter = this.onEnter && typeof this.onEnter === 'function' ? true : false;
    
    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.value = 'enter';

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');
    
    this.state('enter', data.id.uid);
    this.talk(this._events.enter, data);
    return hasOnEnter ? this.onEnter(data, resolve) : this.done(data, resolve)
  }

  /**************
  func: done
  params:
  - data: hte message from the caller incase need to use in calls
  describe:
    When the done function is triggered the system will also set the state
    of hte Deva to done.

    If the deva is offline it will return the offline message.
  usage: this.done('msg')
  ***************/
  done(data, resolve) {
    this.zone('done', data.id.uid);
    if (!this._active) return resolve(this._messages.offline);

    this.action('done', data.id.uid);
    const hasOnDone = this.onDone && typeof this.onDone === 'function' ? true : false;
    
    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.value = 'done';

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');
    
    this.state('done', data.id.uid);
    this.talk(this._events.done, data);
    return hasOnDone ? this.onDone(data, resolve) : this.ready(data, resolve);
  }

  /**************
  func: ready
  params:
  - data: the data to pass to the resolve
  - resolve: the complete resolve to pass back
  describe: This function is use to relay the to the ready state.
  usage: this.ready(data, resolve)
  ***************/
  ready(data, resolve) {
    this.zone('ready', data.id.uid);
    if (!this._active) return resolve(this._messages.offline);

    this.action('ready', data.id.uid);
    const hasOnReady = this.onReady && typeof this.onReady === 'function';  
    
    // Delete previous data hashes
    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.value = 'ready';

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');

    this.state('ready', data.id.uid);
    this.talk(this._events.ready, data);    
    return hasOnReady ? this.onReady(data, resolve) : resolve(data);
  }
  
  /**************
  func: finish
  params:
  - data: the data to pass to the resolve
  - resolve: the finish resolve to pass back
  describe: This function is used to relay into the finish state when resolving a question or data.
  usage: this.finish(data, resolve)
  ***************/
  finish(data, resolve) {
    this.zone('finish', data.id.uid); // enter finish zone
    if (!this._active) return resolve(this._messages.offline); //

    this.action('finish', data.id.uid); // start finish action
    const hasOnFinish = this.onFinish && typeof this.onFinish === 'function';

    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.finish = Date.now(); // set the finish timestamp

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');
    
    this.state('finish', data.id.uid); // set finish state
    this.talk(this._events.finish, data);    
    return hasOnFinish ? this.onFinish(data, resolve) : this.complete(data, resolve);
  }

  /**************
  func: complete
  params:
  - data: the data to pass to the resolve
  - resolve: the complete resolve to pass back
  describe: This function is use to relay into a complete state when
            resolving a question or data.
  usage: this.complete(data, resolve)
  ***************/
  complete(data, resolve) {
    this.zone('complete', data.id.uid);
    if (!this._active) return Promise.resolve(this._messages.offline);

    this.action('complete', data.id.uid);
    const hasOnComplete = this.onComplete && typeof this.onComplete === 'function';

    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.complete = Date.now();// set the complete date on the whole data.
    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');
    
    this.state('complete', data.id.uid);
    this.talk(this._events.complete, data);
    return hasOnComplete ? this.onComplete(data, resolve) : resolve(data);
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
    const id = this.uid();
    this.zone('stop', id);
    if (!this._active) return Promise.resolve(this._messages.offline);

    this.action('stop', id);
    const hasOnStop = this.onStop && typeof this.onStop === 'function';

    const data = { // build the stop data
      id, // set the id
      key: 'stop', // set the key
      value: this._messages.stop, // set the value
      agent: this.agent(), // set the agent
      client: this.client(), // set the client
      created: Date.now(), // set the created date
    }

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');

    // has stop function then set hasOnStop variable
    // if: has on stop then run on stop function or return exit function.
    this.state('stop', id); // set the state to stop
    this.talk(this._events.stop, data);    
    return hasOnStop ? this.onStop(data) : this.exit()
  }

  /**************
  func: exit
  params:
    - msg: hte message from the caller incase need to use in calls
  describe:
    The exit state function is triggered when the Deva is exiting.

    The return will check for a custom onExit function or run the done
    function.
  ***************/
  exit() {
    const id = this.uid();
    this.zone('exit', id);
    if (!this._active) return Promise.resolve(this._messages.offline);

    this.action('exit', id);
    const hasOnExit = this.onExit && typeof this.onExit === 'function';
    
    const data = {
      id,
      key: 'exit',
      value: this._messages.exit,
      agent: this.agent(),
      client: this.client(),
      created: Date.now(),
    }

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');

    this.state('exit', id); // set the state to stop
    this.talk(this._events.exit, data);    
    
    // clear memory
    this._active = false;
    this._client = false;
    this._vector = false;
    this._data = false;
    this._treasury = false;
    this._security = false;
    this._guard = false;
    this._defense = false;
    this._wall = false;
    this._shield = false;
    this._proxy = false;
    this._legal = false;
    this._authority = false;
    this._justice = false;
    this._support = false;
    this._services = false;
    this._systems = false;
    this._networks = false;
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
      if (!value || !this._states[value] || value === this._state) return; // return if no matching value
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

      data.md5 = this.hash(data);
      data.sha256 = this.hash(data, 'sha256');
      data.sha512 = this.hash(data, 'sha512');

      this.talk(this._events.state, data); // broadcasat the state event
      return data;
    } catch (e) { // catch any errors
      return this.err(e); // return if an error happens
    }
  }

  /**************
  func: states
  params: none
  describe: returns the avaiable staets values.
  ***************/
  states() {
    const id = this.uid();    
    this.action('states', id);
    const data = {
      id,
      key: 'states',
      value: this._states,
      created: Date.now(),      
    }

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');

    this.state('return', `states:${id.uid}`);
    return data;
  }

  /**************
  func: zone
  params:
    - st: The zone flag to set for the Deva that matches to this._zones
  describe
  ***************/
  zone(value=false, extra=false) {
    const id = this.uid();
    if (!value || !this._zones[value] || value === this._zone) return;

    try {
      this._zone = value;
      const lookup = this._zones[value]; // set the lookup value
      const text = extra ? `${lookup} ${extra}` : lookup; // set the text value

      const data = { // build the zone data
        id, // set the packetid
        agent: this.agent(),
        client: this.client(),
        key: 'zone',
        value,
        text,
        created: Date.now(),
      };

      data.md5 = this.hash(data);
      data.sha256 = this.hash(data, 'sha256');
      data.sha512 = this.hash(data, 'sha512');

      this.talk(this._events.zone, data);
      return data;
    } catch (e) {
      this.state('catch', `zone:${value}:${id.uid}`);
      return this.err(e, value);
    }
  }

  /**************
  func: zones
  params: none
  describe: returns a listing of zones currently in the system.
  ***************/
  zones() {
    const id = this.uid();
    this.action('zones', id.uid);
    this.state('return', `zones:${id.uid}`);
    
    const data = {
      id, // set the uuid of the data
      agent: this.agent(), // set the agent value
      cleint: this.client(), // set the client value
      key: 'zones', // set the key return value
      value: this._zones, // set the list of zones
      created: Date.now(), // set the created date of the object.
    }
    
    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');
    
    return data
  }

  /**************
  func: action
  params:
    - value: The state flag to set for the Deva that matches to this._states
    - extra: Any extra text to send with the action value.
  describe
  ***************/
  action(value=false, extra=false) {
    const id = this.uid();
    try {
      if (!value || !this._actions[value] || value === this._action) return;
      this._action = value; // set the local action variable
      // check local vars for custom actions
      const var_action = this.vars.actions ? this.vars.actions[value] : false;
      // check the message action
      const msg_action = var_action || this._actions[value];
      const msg = msg_action || action; // set the correct message
      const text = extra ? `${msg} ${extra}` : msg; // set the text of the action

      const data = { // build the data object for the action.
        id, // generate a guid for the action transmitssion.
        agent: this.agent(), // the agent data to send with the action
        client: this.client(), // the client data to send with the action
        key: 'action', // the key for event to transmit action type
        value, // the value key which is the action passed
        text, // text of the action to send
        created: Date.now(), // action time stamp
      };

      data.md5 = this.hash(data);
      data.sha256 = this.hash(data, 'sha256');
      data.sha512 = this.hash(data, 'sha512');

      this.talk(this._events.action, data); // talk the core action event
      return data;
    } catch (e) { // catch any errors that occur
      this.state('catch', `action:${value}:${id.uid}`);
      return this.err(e); // return error on error catch
    }
  }

  /**************
  func: actions
  params: none
  describe: Returns a list of available actions in the system.
  ***************/
  actions() {
    const id = this.uid();
    this.action('actions', id.uid);
    const data = {
      id, // set the id with a uuid
      agent: this.agent(), // set the agent value
      client: this.client(), // set the client value
      key: 'actions', // set the data key
      value: this._actions, // set the value to the actions list
      created: Date.now(), // set the data created date      
    };

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');

    this.state('return', `actions:${id.uid}`);
    return data;
  }

  /**************
  func: feature
  params:
    - value: The feature flag to set for the Deva that matches to this._features
    - extra: Any extra text to send with the feature value.
  describe
  ***************/
  feature(value=false, extra=false) {
    const id = this.uid();
    try {
      if (!value || !this._features[value]) return; // check feature value

      const lookup = this._features[value]; // set the lookup value
      const text = extra ? `${lookup} ${extra}` : lookup; // set the text value

      const data = { // build data object
        id, // set the id
        agent: this.agent(), // set the agent transporting the packet.
        key: 'feature', // set the key for transport
        value, // set the value of the key
        text, // set the text value
        created: Date.now(), // set the creation date
      };

      data.md5 = this.hash(data);
      data.sha256 = this.hash(data, 'sha256');
      data.sha512 = this.hash(data, 'sha512');

      this.talk(this._events.feature, data); // talk the feature event with data
      return data;
    } catch (e) { // catch any errors
      this.state('catch', `feature:${value}:${id.uid}`);
      return this.err(e); // retun this.err when an error is caught.
    }
  }

  /**************
  func: features
  params: none
  describe: return a list of features that are available to the system.
  ***************/
  features() {
    if (!this._active) return this._messages.offline; // check the active status
    const id = this.uid();
    this.action('features', id.uid);
    const data = {
      id, // set the object id
      agent: this.agent(), // set the agent value.
      client: this.client(), // set the client value.
      key: 'features', // set the key
      value: this._features, // set the value to the features list
      created: Date.now(), // set the created date.
    };

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');

    this.state('return', `features:${id.uid}`);
    return data;
  }

  /**************
  func: context
  params:
    - value: The context flag to set for the Deva that matches to this._contexts
    - extra: Any extra text that is sent with the context value.
  describe
  ***************/
  context(value=false, extra=false) {
    if (!this._active) return this._messages.offline; // check the active status
    const id = this.uid();
    try {
      if (!value) return;
      this._context = value;
      const lookup = this.vars.context[value] || value;
      const text = extra ? `${lookup} ${extra}` : lookup;

      const data = {
        id,
        agent: this.agent(),
        client: this.client(),
        key: 'context',
        value,
        text,
        created: Date.now(),
      };

      data.md5 = this.hash(data);
      data.sha256 = this.hash(data, 'sha256');
      data.sha512 = this.hash(data, 'sha512');

      this.talk(this._events.context, data);
      return data;
    } catch (e) {
      this.state('catch', `context:${value}:${id.uid}`);
      return this.err(e, value);
    }
  }

  contexts() {
    if (!this._active) return this._messages.offline; // check the active status
    const id = this.uid();
    this.action('contexts', id);
    if (!this._active) return this._messages.offline; // check the active status
    const data = {
      id,
      agent: this.agent(),
      client: this.client(),
      key: 'contexts',
      value: this.vars.context || false,
      created: Date.now(),      
    };

    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');

    this.state('return', `contexts:${id.uid}`);
    return data;
  }

  /**************
  func: client
  params: none
  describe: returns the current client values in the system.
  usage: this.client();
  ***************/
  client() {
    if (!this._active) return this._messages.offline; // check the active status
    const data = this.lib.copy(this._client); // create a copy of the client data        
    data.md5 = this.hash(data, 'md5');
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');
    return data; // return the copy of the client data.
  }

  /**************
  func: agent
  params: none
  describe: returns the current agent values in the system.
  usage: this.agent()
  ***************/
  agent() {
    if (!this._active) return this._messages.offline; // check the active status
    const data = this.lib.copy(this._agent); // create a copy of the agent data.
    data.md5 = this.hash(data, 'md5');
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');
    return data; // return the copy of the agent data.
  }

  // FEATURE FUNCTIONS

  /**************
  func: indra
  params: none
  describe: basic indra features available in a Deva.
  usage: this.indra()
  ***************/
  indra() {
    return this._getFeature('indra', this._indra);
  }
  

  /**************
  func: veda
  params: none
  describe: basic veda features available in a Deva.
  usage: this.veda()
  ***************/
  veda() {
    return this._getFeature('veda', this._veda);
  }

  /**************
  func: license
  params: none
  describe: basic license features available in a Deva.
  usage: this.license()
  ***************/
  license() {
    return this._getFeature('license', this._license);
  }

  /**************
  func: data
  params: none
  describe: basic data features available in a Deva.
  usage: this.data()
  ***************/
  data() {
    return this._getFeature('data', this._data);
  }

  /**************
  func: error
  params: none
  describe: basic error features available in a Deva.
  usage: this.error()
  ***************/
  error() {
    return this._getFeature('error', this._error);
  }

  /**************
  func: log
  params: none
  describe: basic log features available in a Deva.
  usage: this.log()
  ***************/
  log() {
    return this._getFeature('log', this._error);
  }

  /**************
  func: report
  params: none
  describe: basic report features available in a Deva.
  usage: this.report()
  ***************/
  report() {
    return this._getFeature('report', this._error);
  }


  /**************
  func: vector
  params: none
  describe: basic vector features available in a Deva.
  usage: this.vector()
  ***************/
  vector() {
    return this._getFeature('vector', this._vector);
  }

  
  /**************
  func: king
  params: none
  describe: basic king features available in a Deva.
  usage: this.king()
  ***************/
  king() {
    return this._getFeature('king', this._king);
  }

  /**************
  func: owner
  params: none
  describe: basic owner features available in a Deva.
  usage: this.owner()
  ***************/
  owner() {
    return this._getFeature('owner', this._king);
  }

  /**************
  func: treasury
  params: none
  describe: basic treasury features available in a Deva.
  usage: this.treasury()
  ***************/
  treasury() {
    return this._getFeature('treasury', this._treasury);
  }

  /**************
  func: security
  params: none
  describe: basic security features available in a Deva.
  usage: this.security()
  ***************/
  security() {
    return this._getFeature('security', this._security);
  }

  /**************
  func: guard
  params: none
  describe: basic guard features available in a Deva.
  usage: this.guard()
  ***************/
  guard() {
    return this._getFeature('guard', this._guard);
  }

  /**************
  func: defense
  params: none
  describe: basic defense features available in a Deva.
  usage: this.defense()
  ***************/
  defense() {
    return this._getFeature('defense', this._defense);
  }

  /**************
  func: wall
  params: none
  describe: basic wall features available in a Deva.
  usage: this.wall()
  ***************/
  wall() {
    return this._getFeature('wall', this._wall);
  }

  /**************
  func: shield
  params: none
  describe: basic shield features available in a Deva.
  usage: this.shield()
  ***************/
  shield() {
    return this._getFeature('shield', this._shield);
  }

  /**************
  func: proxy
  params: none
  describe: basic proxy features availcoable in a Deva.
  usage: this.proxy()
  ***************/
  proxy() {
    return this._getFeature('proxy', this._proxy);
  }

  /**************
  func: legal
  params: none
  describe: basic legal features available in a Deva.
  usage: this.systems()
  ***************/
  legal() {
    return this._getFeature('legal', this._legal);
  }
  
  /**************
  func: authority
  params: none
  describe: basic authority features available in a Deva.
  usage: this.systems()
  ***************/
  authority() {
    return this._getFeature('authority', this._authority);
  }
  
  /**************
  func: justice
  params: none
  describe: basic justice features available in a Deva.
  usage: this.systems()
  ***************/
  justice() {
    return this._getFeature('justice', this._justice);
  }
  
  /**************
  func: support
  params: none
  describe: basic support features available in a Deva.
  usage: this.support()
  ***************/
  support() {
    return this._getFeature('support', this._support);
  }

  /**************
  func: services
  params: none
  describe: basic services features available in a Deva.
  usage: this.services()
  ***************/
  services() {
    return this._getFeature('services', this._services);
  }

  /**************
  func: systems
  params: none
  describe: basic systems features available in a Deva.
  usage: this.systems()
  ***************/
  systems() {
    return this._getFeature('systems', this._systems);
  }

  /**************
  func: networks
  params: none
  describe: basic networks features available in a Deva.
  usage: this.networks()
  ***************/
  networks() {
    return this._getFeature('networks', this._networks);
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
        this.action('unload', key);
        this.devas[key].stop().then(exit => {
          delete this.devas[key];
          this.talk(this._events.unload, key);
        });
        this.state('unload', key);
        return resolve(`${this._states.unload}:${key}`);
      } catch (e) {
        return this.err(e, this.devas[key], reject)
      }
    });
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
    if (!this._active) return this._messages.offline; // return offline message if inactive.
    const id = this.uid(); // generate the id for the prompt
    const agent = this.agent(); // set the agent for the prompt
    const client = this.client(); // set the client for the prompt
    const {key} = agent; // set the key from agent
    const value = 'prompt'; // set the value of the key.
    // create data packet to generate prompt 
    
    this.state('data', `${key}:${value}:${id.uid}`)
    const data = {
      id,
      key,
      value,
      agent,
      client,
      text,
      created: Date.now(),
    }
    
    this.state('hash', `${key}:${value}:md5:${id.uid}`)
    data.md5 = this.hash(data); // md5 the data packet

    this.state('hash', `${key}:${value}:sha256:${id.uid}`)
    data.sha256 = this.hash(data, 'sha256'); // sha256 the data packet

    this.state('hash', `${key}:${value}:sha512:${id.uid}`)
    data.sha512 = this.hash(data, 'sha512'); // sha512 the data packet
    
    this.action('talk', `${key}:${value}:${id.uid}`);
    this.talk(this._events.prompt, data);
    
    this.action('return', `${key}:${value}:${id.uid}`);
    return data;
  }

  /**************
  func: core
  params: none
  describe: return core data.
  ***************/
  core() {
    if (!this._active) return this._messages.offline;
    const id = this.uid();
    this.action('core', id.uid);    

    // check the active status
    const data = this.lib.copy(this._core);
    data.id = id;
    data.created = Date.now();
    
    data.md5 = this.hash(data, 'md5');
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');
    
    this.state('return', `core:${id.uid}`);
    return data;
  }

  /**************
  func: info
  params: none
  describe: return info data.
  ***************/
  info() {
    if (!this._active) return this._messages.offline;
    const id = this.uid();
    this.action('info', id.uid);    

    const data = this.lib.copy(this._info);
    data.id = id;
    data.created = Date.now();
    
    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');

    this.state('return', `info:${id.uid}`);
    return data;
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
  status() {
    if (!this._active) return this._messages.offline;
    const id = this.uid();
    this.action('status', id);    
    // check the active status

    // format the date since active for output.
    const dateFormat = this.lib.formatDate(this._active, 'long', true);
    // create the text msg string
    this.state('return', `status:${id.uid}`);
    return `${this._agent.profile.name} active since ${dateFormat}`;                           // return final text string
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
      let helpDoc = false;
      const id = this.uid();
      this.zone('help', id);
      if (!this._active) return resolve(this._messages.offline);

      this.feature('help', id.uid);
      this.action('help', id.uid);
      this.state('help', id.uid);
      this.context('help', id.uid);
      const params = msg.split(' '); // split the msg into an array by spaces.

      const splitText = params[0].split(':');
      const part = splitText[1] ? splitText[1].toUpperCase() : 'MAIN';
      const helpFile = splitText[0] ? splitText[0] : 'main';
            
      const helpPath = this.lib.path.join(help_dir, 'help', `${helpFile}.feecting`);

      try {
        this.state('try', `help:${id.uid}`);

        // check if help file exists first and resolve if no file
        const helpExists = this.lib.fs.existsSync(helpPath); // check if help file exists
        if (!helpExists) {
          this.state('return', `${this._messages.help_not_found}:${id.uid}`);
          return resolve(this._messages.help_not_found);
        }
        
        // get the help file and check to make sure the part we are looking for exists.
        const helpFile = this.lib.fs.readFileSync(helpPath, 'utf8');
        const helpPart = helpFile.split(`::BEGIN:${part}`);
        if (!helpPart[1]) {
          this.state('return', `${this._messages.help_not_found}:${id.uid}`);
          resolve(this._messages.help_not_found);
        }
        
        // last set the help doc and split out the selected part.
        helpDoc = helpFile.split(`::BEGIN:${part}`)[1].split(`::END:${part}`)[0];
      } 
      catch(e) {
        this.state('catch', `help:${id.uid}`);
        return this.err(e, msg, reject);
      }
      finally {
        this.state('return', `help:${id.uid}`);
        return resolve(helpDoc);
      }
    });
  }
  
  /**************
  func: err
  params:
    - err: The error to process
    - data: Any additional data associated with the error
    - reject: An associated promise reject if the caller requires.
  describe:
    The err function provides the consistent error manage of the system.
  usage: this.err(err, data, reject);
  ***************/
  err(err,packet,reject=false) {
    const id = this.uid();
    this.zone('error', id.uid);
    this.feature('error', id.uid);
    
    const agent = this.agent();
    const client = this.client();
        
    this.action('error', id.uid);
    const hasOnError = this.onError && typeof this.onError === 'function' ? true : false;
  
    const data = {
      id,
      key: 'error',
      value: agent.key,
      agent,
      client,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,        
      },
      packet,
      created: Date.now(),
    }
    data.md5 = this.hash(data);
    data.sha256 = this.hash(data, 'sha256');
    data.sha512 = this.hash(data, 'sha512');
  
    this.talk(this._events.error, this.lib.copy(data));
  
    this.state('return', `error:${id.uid}`);
    this.state('error', id.uid);
    this.context('error', id.uid);
    if (hasOnError) return this.onError(err, packet, reject);
    else return reject ? reject(err) : Promise.reject(err);
  }
  
  /**************
  func: uid
  params:
    - guid: This is a true false flag for generating a guid.
  describe:
    The uid function can create two types of id for you.
    1. random GUID - this is good for when you need a uinique record id returned
    2. transport uid - The transport id is a number generated to provide a
                      secure numerical number used for transporting records
                      across networks without collision or needing to store system uuid.
    3. the uid is then returned with a created, md5, sha256, and sha512 hash of the value
  copyright: 2025 Quinn A Michaels. All rights reserved.
  ***************/
  uid(guid=false) {
    const time = Date.now(); // set time to local constant
    const date = this.lib.formatDate(time, 'long', true); // set date to local constant

    const core_hash = this.hash(this._core, 'sha256');
    const client_hash = this.client().sha256 || false;
    const agent_hash = this.agent().sha256 || false;
    const machine_hash = this.lib.machine();
    
    const data = {
      uid: false,
      time,
      date,
      client: client_hash,
      agent: agent_hash,
      core: core_hash,
      machine: machine_hash,
      warning: this._messages.uid_warning,
      copyright: this._core.copyright,
    }
    if (guid) {
      const uid = randomUUID(); // set uid into local constant.
      data.uid = uid; // set base data object.
    }
    else {
      const min = Math.floor(time - (time / Math.PI)); // generate min time from Math.PI divisor.
      const max = Math.ceil(time + (time * Math.PI)); // generate max time form Math.PI multiplier.
      const begin_random = Math.floor(Math.random() * (max - min) + min); // generate random number between min and max.
      const {end_min, end_max} = this._uid; // set end min and max in to constant
      const end_random = Math.ceil(Math.random() * (end_max - end_min) + end_min); // generate the 5 digit end salt on the number for added randomness.
      
      const uid = `${begin_random}${end_random}`; // set uid to local constant
      data.uid = uid; // set base data object.
    }
    data.md5 = this.hash(data, 'md5'); // md5 the uid and created. 
    data.sha256 = this.hash(data, 'sha256'); // sha256 the uid, created, md5
    data.sha512 = this.hash(data, 'sha512'); // sha512 the uid, created, md5, sha256.
    return data; // return the complete uid data.
  }  
  
  sign(packet) {
    const time = Date.now();
    const client = this.client();
    const agent = this.agent();
    const {q, id} = packet;
    const transport = id.uid; // set the transport id from the packet id.
    
    const {meta, text} = q;
    const {key, method, params} = meta;
    const opts = this.lib.copy(params); // copy the params and set as opts.
    const command = opts.shift();
    
    const {invalid_agent,invalid_client} = this._messages;

    const agent_hash = agent.sha256 === packet.q.agent.sha256 ? agent.sha256 : invalid_agent;
    const client_hash = client.sha256 === packet.q.client.sha256 ? client.sha256 : invalid_client;
    const created = this.lib.formatDate(time, 'long', true); // Formatted created date.
    
    const container = `OM:O:${key.toUpperCase()}:${transport}`; // set container string.

    const packet_hash = this.hash(packet, 'sha256');
    const token = this.hash(`${key} client:${client.profile.id} fullname:${client.profile.fullname} transport:${transport}`, 'sha256');
    
    // build the main data packet.
    const data = {
      id,
      key,
      method,
      opts: opts.join('.'),
      text,
      time,
      container,
      client: {
        key: client.key,
        name: client.profile.name,
        fullname: client.profile.fullname,
        emojis: client.profile.emojis,
        company: client.profile.company,
        expires: client.expires ? time + client.expires : 'none',
        caseid: client.profile.caseid || 'none',
        token,
        sha256: client.sha256,
      },
      agent: {
        key: agent.key,
        name: agent.profile.name,
        sha256: agent.sha256,
      },
      packet: packet_hash,
      created,
      warning: client.warning || agent.warning || 'none',
      copyright: client.profile.copyright || agent.profile.copyright,
    };
    data.md5 = this.hash(data, 'md5'); // hash data packet into md5 and inert into data.
    data.sha256 = this.hash(data, 'sha256'); // hash data into sha 256 then set in data.
    data.sha512 = this.hash(data, 'sha512'); // hash data into sha 512 then set in data.
    return data;
  }
  
  license_check(personalVLA, packageVLA) {    
    this.state('license', `check:personalVLA:${packageVLA.uid}`);
    if (!personalVLA) return false;
    this.state('license', `check:packageVLA:${packageVLA.uid}`);
    if (!packageVLA) return false;
    
    // this is to ensure no additional information is being transmitted.
    this.state('license', `compare:sha256:${packageVLA.uid}`);
    const personalVLA_hash = this.hash(personalVLA, 'sha256');
    const packageVLA_hash = this.hash(packageVLA, 'sha256');
    
    if (personalVLA_hash !== packageVLA_hash) return false;
  

    const approved = {
      id: this.uid(),
      time: Date.now(),
      personal: personalVLA_hash,
      package: packageVLA_hash,
    };
    approved.md5 = this.hash(approved, 'md5');
    approved.sha256 = this.hash(approved, 'sha256');
    approved.sha512 = this.hash(approved, 'sha512');

    this.state('return', `license:${packageVLA.uid}`);
    return approved;
  }

  /**************
  func: hash
  params:
    - texts: The text string to create a hash value for.
    - algo: The hashing algorithm to use for hashing. md5, sha256, or sha512
  
  describe:
    The hash algorithm will take a string of text and produce a hash.
  ***************/
  hash(str, algo='md5') {
    const the_hash = createHash(algo);
    the_hash.update(JSON.stringify(str));
    return the_hash.digest('base64');
  }
  
}
export default Deva;
