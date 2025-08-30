// Copyright (c)2025 Quinn Michaels; All Rights Reserved; Legal Signature Required.
// Distributed under the Restricted software license, see the accompanying file LICENSE.md
import {EventEmitter} from 'node:events';
import {randomUUID} from 'crypto';
import lib from './lib/index.js';
import pkg from './package.json' with {type:'json'};

const {name,version,repository,author,bugs,homepage,license,config} = pkg;

class Deva {
  constructor(opts) {
    opts = opts || {}; // set opts to provided opts or an empty object.
    this._core = {name,version,repository,author,bugs,homepage,license};
    this._id = opts.id || randomUUID(); // the unique id assigned to the agent at load
    this._info = opts.info || false; // the deva information from the package file.
    this._config = opts.config || {}; // local Config Object
    this._agent = opts.agent || false; // Agent profile object
    this._client = {}; // this will be set on init.
    this._active = false; // the active/birth date.
    this._vector = false; // inherited Vector features.
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
    this.lib = new lib({}); // used for loading library functions
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
      id: this.lib.uid(),
      agent: this.agent() || false,
      client: this.client() || false,
      text: `${this._messages.method_not_found}`,
      meta: {
        key: this._agent.key,
        method: packet.q.meta.method,
      },
      created: Date.now(),
    };
    packet.a.hash = this.lib.hash(packet.a);
    delete packet.hash;
    packet.md5 = this.lib.hash(packet);
    packet.sha256 = this.lib.hash(packet, 'sha256');
    packet.sha512 = this.lib.hash(packet, 'sha512');
    
    this.state('invalid', `${packet.q.meta.method}:${packet.id}`);
    return packet;
  }

  _getFeature(key, value) {
    if (!this._active) return this._messages.offline; // check the active status
    this.zone(key);
    this.feature(key); // set the security state
    try {
      const data = this.lib.copy(value);
      this.state('return', key); // set the security state
      return data; // return the security feature
    } catch (e) {
      this.state('catch', key);
      return this.error(e);
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
    this.feature('client');
    this.zone('client');
    this.action('client');
    // setup any custom methods for the features
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
      this.state('set', 'client');
      this._client = _client;                           // set local _client to this scope
      this.state('resolve', 'client');
      return resolve();
    } catch (e) {
      return this.error(e, false, reject);
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
    const _id = this.lib.uid();
    this.feature(feature, _id);
    this.zone(feature, _id);
    const _cl = this.client(); // set local copy of client data
    try {
      if (!_cl.features[feature]) return resolve(); // if no security feature goto Support
      else {
        this.action(feature, _id); // set action to feature
        const _fe = `_${feature}`;
        const {id, profile, features} = _cl; // make a copy the clinet data.
        const data = features[feature]; // make a copy the clinet data.
        this.state('set', `feature:${id}`);
        this[_fe] = { // set this_security with data
          id: _id, // uuid of the security feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: data.concerns, // any concerns for client
          global: data.global, // the global policies for client
          personal: data.devas[this._agent.key], // Client personal features and rules.
          created: Date.now(),
        };
        delete this._client.features[feature]; // make a copy the clinet data.
        this.state('resolve', `${feature}:${_id}`);
        return resolve(feature); // resolve when done
      }
    } catch (e) {
      this.state('catch', `${feature}:${_id}`);
      return this.error(e, feature, reject); // run error handling if an error is caught
    }
  }

  /**************
  func: Vector
  params: client: false
  describe:
    The Vector feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Vector(resolve, reject) {
    return this.Feature('vector', resolve, reject);
  }

  /**************
  func: Security
  params: client: false
  describe:
    The Security feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Security(resolve, reject) {
    return this.Feature('security', resolve, reject);
  }

  /**************
  func: Guard
  params: client: false
  describe:
    The Guard feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Guard(resolve, reject) {
    return this.Feature('guard', resolve, reject);
  }

  /**************
  func: Defense
  params: client: false
  describe:
    The Defense feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Defense(resolve, reject) {
    return this.Feature('defense', resolve, reject);
  }

  /**************
  func: Wall
  params: client: false
  describe:
    The Defense feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Wall(resolve, reject) {
    return this.Feature('wall', resolve, reject);
  }

  /**************
  func: Shield
  params: client: false
  describe:
    The Shield feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Shield(resolve, reject) {
    return this.Feature('shield', resolve, reject);
  }

  /**************
  func: Proxy
  params: client: false
  describe:
    The Defense feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Proxy(resolve, reject) {
    return this.Feature('proxy', resolve, reject);
  }

  /**************
  func: Legal
  params: client: false
  describe:
    The Legal feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Legal(resolve, reject) {
    return this.Feature('legal', resolve, reject);
  }
  
  /**************
  func: Justice
  params: client: false
  describe:
    The Justice feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Justice(resolve, reject) {
    return this.Feature('justice', resolve, reject);
  }
  
  /**************
  func: Authority
  params: client: false
  describe:
    The Authority feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Authority(resolve, reject) {
    return this.Feature('authority', resolve, reject);
  }

  /**************
  func: Support
  params: client: false
  describe:
    The Support feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Support(resolve, reject) {
    return this.Feature('support', resolve, reject);
  }

  /**************
  func: Services
  params: client: false
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
      return resolve(this.client()); // resolve an empty pr
    } catch (e) {
      this.state('catch', 'Done');
      return this.error(e, false, reject);
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
    this.action('talk', `${evt}:${packet.id}`);
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
    const id = this.lib.uid(); // generate a unique id for transport.
    // check the active status
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.zone('question', id);
    this.action('question', id);
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
      this.state('try', `question:${id}`);
      try { // try to answer the question
        if (isAsk) { // determine if hte question isAsk
          // if:isAsk split the agent key and remove first command character
          key = t_split[0].substring(1);
          //if:isAsk use text split index 1 as the parameter block
          params = t_split[1] ? t_split[1].split(':') : false;
          method = params[0]; // the method to check is then params index 0
          text = t_split.slice(2).join(' ').trim(); // rejoin the text with space
          this.state('ask', `${key}:${method}:${id}`);
        }
        else if (isCmd) { // determine if the question is a command
          //if:isCmd use text split index 1 as the parameter block
          params = t_split[0] ? t_split[0].split(':') : false;
          method = t_split[0].split(':')[0].substring(1); // if:isCmd use the 0 index as the command
          text = t_split.slice(1).join(' ').trim(); // if:isCmd rejoin the string on the space after removing first index
          this.state('cmd', `${method}:${id}`); // set the state to cmd.
        }

        this.state('set', `question:${method}:${id}`)
        packet.q = { // build packet.q container
          id: this.lib.uid(), // set the transport id for the question.
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
        packet.q.md5 = this.lib.hash(packet.q);
        packet.q.sha256 = this.lib.hash(packet.q, 'sha256');
        packet.q.sha512 = this.lib.hash(packet.q, 'sha512');

        this.talk(config.events.question, this.lib.copy(packet)); // global question event make sure to copy data.

        if (isAsk) { // isAsk check if the question isAsk and talk
          // if: isAsk wait for the once event which is key'd to the packet ID for specified responses
          this.talk(`${key}:ask`, packet);
          this.once(`${key}:ask:${packet.id}`, answer => {
            this.talk(config.events.ask, this.lib.copy(answer));
            this.state('return', `${key}:ask:${id}`);
            return this.finish(answer, resolve); // if:isAsk resolve the answer from the call
          });
        }
        else { // else: answer the question locally
          this.state('answer', `${method}:${id}`); //set the answer state to the method
          return this.answer(packet, resolve, reject);
        }
      }
      catch(e) {
        this.state('catch', 'question');
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
    The answer function is called from the question function to return an answer
    from the agent from the pre-determined method.
  ***************/
  answer(packet, resolve, reject) {
    const id = this.lib.uid();
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.zone('answer', id); // set zone to answer
    const agent = this.agent();
    const client = this.client();
    // check if method exists and is of type function
    const {method,params} = packet.q.meta;
    this.action('answer', `${method}:${id}`);
        
    this.state('try', `answer:${method}:${id}`);
    try {
      const isMethod = this.methods[method] && typeof this.methods[method] == 'function';
      if (!isMethod) return resolve(this._methodNotFound(packet)); // resolve method not found if check if check fails      

      this.action('method', `answer:${method}:${id}`);
      this.methods[method](packet).then(result => {
        // check the result for the text, html, and data object.          // this is for when answers are returned from nested Devas.
        const text = typeof result === 'object' ? result.text : result;
        const html = typeof result === 'object' ? result.html : result;
        // if the data passed is NOT an object it will FALSE
        const data = typeof result === 'object' ? result.data : false;
      
        this.state('set', `answer:${method}:packet_answer:${id}`);
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
        packet_answer.md5 = this.lib.hash(packet_answer);
        packet_answer.sha256 = this.lib.hash(packet_answer, 'sha256');
        packet_answer.sha512 = this.lib.hash(packet_answer, 'sha512');

        packet.a = packet_answer; // set the packet.a to the packet_answer
        this.talk(config.events.answer, this.lib.copy(packet)); // global talk event
      
        this.state('return', `answer:${method}:${id}`); // set the state resolve answer
        return this.finish(packet, resolve); // resolve the packet to the caller.
      }).catch(err => { // catch any errors in the method
        this.state('catch', `answer:${method}:${id}`); // set the state reject answer
        return this.error(err, packet, reject); // return this.error with err, packet, reject
      });
    } catch (e) {
      this.state('catch', `answer:${method}:${id}`);
      return this.error(e, packet, reject);
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
    this.zone('ask', `${method}:${packet.id}`);
    this.action('ask', `${method}:${packet.id}`);
    // build the answer packet from this model
    this.state('try', `ask:${method}:${packet.id}`);
    try {
      if (typeof this.methods[method] !== 'function') {
        return setImmediate(() => {
          this.talk(`${this._agent.key}:ask:${packet.id}`, this._methodNotFound(packet));
        });
      }

      this.state('set', `ask:${method}:packet_answer:${packet.id}`);
      const packet_answer = {
        id: this.lib.uid(),
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

        packet_answer.md5 = this.lib.hash(packet_answer);
        packet_answer.sha256 = this.lib.hash(packet_answer, 'sha256');
        packet_answer.sha512 = this.lib.hash(packet_answer, 'sha512');

        packet.a = packet_answer;
        this.talk(config.events.answer, this.lib.copy(packet)); // global talk event
        this.talk(`${agent.key}:ask:${packet.id}`, packet);
      }).catch(err => {
        this.talk(`${agent.key}:ask:${packet.id}`, {error:err});
        this.state('catch', `ask:${method}:${packet.id}`);
        return this.error(err, packet);
      })
    }
    catch (e) {
      this.state('catch', `ask:${method}:${packet.id}`);
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
      id: this.lib.uid(),
      key: 'init',
      value: agent.key,
      agent,
      client,
      text: this._messages.init,
      created: Date.now(),
    }
    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');

    return new Promise((resolve, reject) => {
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
        return this.Client(client, resolve, reject);
      }).then(() => {
        return this.Vector(resolve, reject);
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
        this.state('return', `init:${data.id}`);
        return hasOnInit ? this.onInit(data, resolve) : this.start(data, resolve);
      }).catch(err => {
        this.state('catch', `init:${data.id}`);
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
  start(data, resolve) {
    this.zone('start', data.id);
    if (!this._active) return resolve(this._messages.offline);

    this.action('start', data.id);
    const id = this.lib.uid();
    
    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.value = 'start';

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    
    const hasOnStart = this.onStart && typeof this.onStart === 'function' ? true : false;

    this.state('start', data.id);
    return hasOnStart ? this.onStart(data, resolve) : this.enter(data, resolve)
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
  enter(data, resolve) {
    this.zone('enter', data.id);
    if (!this._active) return resolve(this._messages.offline);

    this.action('enter', data.id);
    const hasOnEnter = this.onEnter && typeof this.onEnter === 'function' ? true : false;
    
    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.value = 'enter';

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    
    this.state('enter', data.id);
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
    this.zone('done', data.id);
    if (!this._active) return resolve(this._messages.offline);

    this.action('done', data.id);
    const hasOnDone = this.onDone && typeof this.onDone === 'function' ? true : false;
    
    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.value = 'done';

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    
    this.state('done', data.id);
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
    this.zone('ready', data.id);
    if (!this._active) return resolve(this._messages.offline);

    this.action('ready', data.id);
    const hasOnReady = this.onReady && typeof this.onReady === 'function';  
    
    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.value = 'ready';

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    
    this.state('ready', data.id);
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
    this.zone('finish', data.id); // enter finish zone
    if (!this._active) return resolve(this._messages.offline); //

    this.action('finish', data.id); // start finish action
    const hasOnFinish = this.onFinish && typeof this.onFinish === 'function';

    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.finish = Date.now(); // set the finish timestamp

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    
    this.state('finish', data.id); // set finish state
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
    this.zone('complete', data.id);
    if (!this._active) return Promise.resolve(this._messages.offline);

    this.action('complete', data.id);
    const hasOnComplete = this.onComplete && typeof this.onComplete === 'function';

    delete data.md5;
    delete data.sha256;
    delete data.sha512;

    data.complete = Date.now();// set the complete date on the whole data.
    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    
    this.state('complete', data.id);
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
    const id = this.lib.uid();
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

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');

    // has stop function then set hasOnStop variable
    // if: has on stop then run on stop function or return exit function.
    this.state('stop', id); // set the state to stop
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
    const id = this.lib.uid();
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

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');

    this.state('exit', id); // set the state to stop
    // clear memory
    this._active = false;
    this._client = false;
    this._vector = false;
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
        id: this.lib.uid(), // set the data id
        agent: this.agent(), // set the agent
        client: this.client(), // set the client
        key: 'state', // set the key to state
        value, // set the value to the passed in value
        text, // set the text value of the data
        created: Date.now(), // set the data created date.
      };

      data.md5 = this.lib.hash(data);
      data.sha256 = this.lib.hash(data, 'sha256');
      data.sha512 = this.lib.hash(data, 'sha512');

      this.talk(config.events.state, data); // broadcasat the state event
      return data;
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
    const id = this.lib.uid();    
    this.action('states', id);
    const data = {
      id,
      key: 'states',
      value: this._states,
      created: Date.now(),      
    }

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');

    this.state('return', `states:${id}`);
    return data;
  }

  /**************
  func: zone
  params:
    - st: The zone flag to set for the Deva that matches to this._zones
  describe
  ***************/
  zone(value=false, extra=false) {
    const id = this.lib.uid();
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

      data.md5 = this.lib.hash(data);
      data.sha256 = this.lib.hash(data, 'sha256');
      data.sha512 = this.lib.hash(data, 'sha512');

      this.talk(config.events.zone, data);
      return data;
    } catch (e) {
      this.state('catch', `zone:${value}:${id}`);
      return this.error(e, value);
    }
  }

  /**************
  func: zones
  params: none
  describe: returns a listing of zones currently in the system.
  ***************/
  zones() {
    const id = this.lib.uid();
    this.action('zones', id);
    this.state('return', `zones:${id}`);
    
    const data = {
      id, // set the uuid of the data
      agent: this.agent(), // set the agent value
      cleint: this.client(), // set the client value
      key: 'zones', // set the key return value
      value: this._zones, // set the list of zones
      created: Date.now(), // set the created date of the object.
    }
    
    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    
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
    const id = this.lib.uid();
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

      data.md5 = this.lib.hash(data);
      data.sha256 = this.lib.hash(data, 'sha256');
      data.sha512 = this.lib.hash(data, 'sha512');

      this.talk(config.events.action, data); // talk the core action event
      return data;
    } catch (e) { // catch any errors that occur
      this.state('catch', `action:${value}:${id}`);
      return this.error(e); // return error on error catch
    }
  }

  /**************
  func: actions
  params: none
  describe: Returns a list of available actions in the system.
  ***************/
  actions() {
    const id = this.lib.uid();
    this.action('actions', id);
    const data = {
      id, // set the id with a uuid
      agent: this.agent(), // set the agent value
      client: this.client(), // set the client value
      key: 'actions', // set the data key
      value: this._actions, // set the value to the actions list
      created: Date.now(), // set the data created date      
    };

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');

    this.state('return', `actions:${id}`);
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
    const id = this.lib.uid();
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

      data.md5 = this.lib.hash(data);
      data.sha256 = this.lib.hash(data, 'sha256');
      data.sha512 = this.lib.hash(data, 'sha512');

      this.talk(config.events.feature, data); // talk the feature event with data
      return data;
    } catch (e) { // catch any errors
      this.state('catch', `feature:${value}:${id}`);
      return this.error(e); // retun this.error when an error is caught.
    }
  }

  /**************
  func: features
  params: none
  describe: return a list of features that are available to the system.
  ***************/
  features() {
    if (!this._active) return this._messages.offline; // check the active status
    const id = this.lib.uid();
    this.action('features', id);
    const data = {
      id, // set the object id
      agent: this.agent(), // set the agent value.
      client: this.client(), // set the client value.
      key: 'features', // set the key
      value: this._features, // set the value to the features list
      created: Date.now(), // set the created date.
    };

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');

    this.state('return', `features:${id}`);
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
    const id = this.lib.uid();
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

      data.md5 = this.lib.hash(data);
      data.sha256 = this.lib.hash(data, 'sha256');
      data.sha512 = this.lib.hash(data, 'sha512');

      this.talk(config.events.context, data);
      return data;
    } catch (e) {
      this.state('catch', `context:${value}:${id}`);
      return this.error(e, value);
    }
  }

  contexts() {
    if (!this._active) return this._messages.offline; // check the active status
    const id = this.lib.uid();
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

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');

    this.state('return', `contexts:${id}`);
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
    data.created = Date.now();
    
    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    
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
    data.created = Date.now();

    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    return data; // return the copy of the agent data.
  }

  // FEATURE FUNCTIONS
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
  describe: basic proxy features available in a Deva.
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
    this.zone('deva', key);
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
        return resolve(`${this._states.unload}:${key}`);
      } catch (e) {
        return this.error(e, this.devas[key], reject)
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
    if (!this._active) return this._messages.offline;
    const id = this.lib.uid();
    // Talk a global prompt event for the client
    const agent = this.agent();
    const client = this.client();
    const data = {
      id,
      key: 'prompt',
      value: agent.key,
      agent,
      client,
      text,
      created: Date.now(),
    }
    
    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    
    this.talk(config.events.prompt, data);
    return data;
  }

  /**************
  func: core
  params: none
  describe: return core data.
  ***************/
  core() {
    if (!this._active) return this._messages.offline;
    const id = this.lib.uid();
    this.action('core', id);    

    // check the active status
    const data = this.lib.copy(this._core);
    data.id = id;
    data.created = Date.now();
    
    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');
    
    this.state('return', `core:${id}`);
    return data;
  }

  /**************
  func: info
  params: none
  describe: return info data.
  ***************/
  info() {
    if (!this._active) return this._messages.offline;
    const id = this.lib.uid();
    this.action('info', id);    

    const data = this.lib.copy(this._info);
    data.id = id;
    data.created = Date.now();
    
    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');

    this.state('return', `info:${id}`);
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
    const id = this.lib.uid();
    this.action('status', id);    
    // check the active status

    // format the date since active for output.
    const dateFormat = this.lib.formatDate(this._active, 'long', true);
    // create the text msg string
    this.state('return', `status:${id}`);
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
      const id = this.lib.uid();
      this.zone('help', id);
      if (!this._active) return resolve(this._messages.offline);

      this.feature('help', id);
      this.action('help', id);
      this.state('help', id);
      this.context('help', id);
      const params = msg.split(' '); // split the msg into an array by spaces.

      const splitText = params[0].split(':');
      const part = splitText[1] ? splitText[1].toUpperCase() : 'MAIN';
      const helpFile = splitText[0] ? splitText[0] : 'main';
            
      const helpPath = this.lib.path.join(help_dir, 'help', `${helpFile}.feecting`);

      try {
        this.state('try', `help:${id}`);

        // check if help file exists first and resolve if no file
        const helpExists = this.lib.fs.existsSync(helpPath); // check if help file exists
        if (!helpExists) {
          this.state('return', `${this._messages.help_not_found}:${id}`);
          return resolve(this._messages.help_not_found);
        }
        
        // get the help file and check to make sure the part we are looking for exists.
        const helpFile = this.lib.fs.readFileSync(helpPath, 'utf8');
        const helpPart = helpFile.split(`::BEGIN:${part}`);
        if (!helpPart[1]) {
          this.state('return', `${this._messages.help_not_found}:${id}`);
          resolve(this._messages.help_not_found);
        }
        
        // last set the help doc and split out the selected part.
        helpDoc = helpFile.split(`::BEGIN:${part}`)[1].split(`::END:${part}`)[0];
      } 
      catch(e) {
        this.state('catch', `help:${id}`);
        return this.error(e, msg, reject);
      }
      finally {
        this.state('return', `help:${id}`);
        return resolve(helpDoc);
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
    The error function provides the consistent error manage of the system.
  usage: this.error(err, data, reject);
  ***************/
  error(err,packet,reject=false) {
    const id = this.lib.uid();
    this.zone('error', id);
    const agent = this.agent();
    const client = this.client();

    this.action('error', id);
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
    data.md5 = this.lib.hash(data);
    data.sha256 = this.lib.hash(data, 'sha256');
    data.sha512 = this.lib.hash(data, 'sha512');

    this.talk(config.events.error, this.lib.copy(data));

    this.state('return', `error:${id}`);
    this.state('error', id);
    this.context('error', id);
    if (hasOnError) return this.onError(err, packet, reject);
    else return reject ? reject(err) : Promise.reject(err);
  }

}
export default Deva;
