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
    this._security = false; // inherited Security features.
    this._defense = false; // inherited Security features.
    this._support = false; // inherited Support features.
    this._services = false; // inherited Service features.
    this._systems = false; // inherited Systems features.
    this._networks = false; // inherited Systems features.
    this._legal = false; // inherited Legal features.
    this._justice = false; // inherited Justice features.
    this._authority = false; // inherited Justice features.
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
    return packet;
  }

  _getFeature(key, value) {
    if (!this._active) return this._messages.offline; // check the active status
    this.zone(key);
    this.feature(key); // set the security state
    try {
      const data = this.lib.copy(value);
      data.id = this.lib.uid();
      data.hash = this.lib.hash(value);
      data.created = Date.now();
      this.state('return', key); // set the security state
      return data; // return the security feature
    } catch (e) {
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
    this.feature(feature);
    this.zone(feature);
    const _cl = this.client(); // set local copy of client data
    try {
      if (!_cl.features[feature]) return resolve(); // if no security feature goto Support
      else {
        this.action(feature); // set action to feature
        const _fe = `_${feature}`;
        const {id, profile, features} = _cl; // make a copy the clinet data.
        const data = features[feature]; // make a copy the clinet data.
        this.state('set', feature);
        this[_fe] = { // set this_security with data
          id: this.lib.uid(), // uuid of the security feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: data.concerns, // any concerns for client
          global: data.global, // the global policies for client
          personal: data.devas[this._agent.key], // Client personal features and rules.
        };
        delete this._client.features[feature]; // make a copy the clinet data.
        this.state('resolve', feature);
        return resolve(feature); // resolve when done
      }
    } catch (e) {
      this.state('reject', feature);
      return this.error(e, feature, reject); // run error handling if an error is caught
    }
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
  func: Done
  params: none
  describe: The end of the workflow Client Feature Workflow
  ***************/
  Done(resolve, reject) {
    this.action('done');
    try {
      this.state('Done');
      delete this._client.features; // delete the features key when done.
      return resolve(this.client()); // resolve an empty pr
    } catch (e) {
      this.state('reject', 'Done');
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

    const id = this.lib.uid(); // generate a unique id for transport.
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
      if (!TEXT) return resolve(this._messages.notext, resolve);
      this.state('try', 'question');
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
        packet.q.meta.hash = this.lib.hash(packet.q);

        this.action('talk', config.events.question);
        this.talk(config.events.question, this.lib.copy(packet)); // global question event make sure to copy data.

        if (isAsk) { // isAsk check if the question isAsk and talk
          // if: isAsk wait for the once event which is key'd to the packet ID for specified responses
          this.action('talk', `${key}:ask`);
          this.talk(`${key}:ask`, packet);
          this.once(`${key}:ask:${packet.id}`, answer => {
            this.action('talk', config.events.ask);
            this.talk(config.events.ask, this.lib.copy(answer));
            this.state('finish', `${key}:ask`);
            return this.finish(answer, resolve); // if:isAsk resolve the answer from the call
          });
        }
        else { // else: answer the question locally
          this.state('answer', method); //set the answer state to the method
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
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.zone('answer'); // set zone to answer

    const agent = this.agent();
    const client = this.client();
    // check if method exists and is of type function
    const {method,params} = packet.q.meta;

    this.state('try', `answer:${method}`);
    try {
      const isMethod = this.methods[method] && typeof this.methods[method] == 'function';
      if (!isMethod) return resolve(this._methodNotFound(packet)); // resolve method not found if check if check fails      

      this.action('method', method);
      this.methods[method](packet).then(result => {
        // check the result for the text, html, and data object.          // this is for when answers are returned from nested Devas.
        const text = typeof result === 'object' ? result.text : result;
        const html = typeof result === 'object' ? result.html : result;
        // if the data passed is NOT an object it will FALSE
        const data = typeof result === 'object' ? result.data : false;
      
        this.state('set', `answer:${method}:packet_answer`);
        const packet_answer = { // setup the packet.a container
          id: this.lib.uid(),
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
        this.action('talk', config.events.answer)
        packet_answer.meta.hash = this.lib.hash(packet_answer);
        packet.a = packet_answer; // set the packet.a to the packet_answer
        this.talk(config.events.answer, this.lib.copy(packet)); // global talk event
      
        this.state('finish', `answer:${method}`); // set the state resolve answer
        return this.finish(packet, resolve); // resolve the packet to the caller.
      }).catch(err => { // catch any errors in the method
        this.state('catch', `answer:${method}`); // set the state reject answer
        return this.error(err, packet, reject); // return this.error with err, packet, reject
      });
    } catch (e) {
      this.state('catch', `answer:${method}`);
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
    const {method, params} = packet.q.meta;
    this.zone('ask', method);

    const agent = this.agent();
    const client = this.client();
    // build the answer packet from this model
    this.state('set', `ask:${method}:packet_answer`);
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

    this.state('try', `ask:${method}`);
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

        packet_answer.meta.hash = this.lib.hash(packet_answer);
        packet.a = packet_answer;
        this.action('talk', config.events.answer);
        this.talk(config.events.answer, this.lib.copy(packet)); // global talk event
        this.action('talk', `ask:${packet.id}`);
        this.talk(`${agent.key}:ask:${packet.id}`, packet);
      }).catch(err => {
        this.talk(`${agent.key}:ask:${packet.id}`, {error:err});
        this.state('catch', `ask:${method}`);
        return this.error(err, packet);
      })
    }
    catch (e) {
      this.state('catch', `ask:${method}`);
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

    const _data = {
      id: this.lib.uid(),
      key: 'init',
      value: agent.key,
      agent,
      client,
      text: this._messages.init,
      created: Date.now(),
    }
    _data.hash = this.lib.hash(_data);
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
        return this.Security(resolve, reject);
      }).then(() => {
        return this.Guard(resolve, reject);
      }).then(() => {
        return this.Defense(resolve, reject);
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
        return hasOnInit ? this.onInit(_data, resolve) : this.start(_data, resolve);
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
  start(data, resolve) {
    this.zone('start');
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.action('start');
    data.value = 'start';
    delete data.hash;
    data.hash = this.lib.hash(data);
    const hasOnStart = this.onStart && typeof this.onStart === 'function' ? true : false;
    this.state('start');
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
    this.zone('deva');
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.action('enter');
    data.value = 'enter';
    delete data.hash;
    data.hash = this.lib.hash(data);
    this.state('enter');
    const hasOnEnter = this.onEnter && typeof this.onEnter === 'function' ? true : false;
    return hasOnEnter ? this.onEnter(data, resolve) : this.done(data, resolve)
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
  done(data, resolve) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.action('done');
    data.value = 'done';
    delete data.hash;
    data.hash = this.lib.hash(data);
    const hasOnDone = this.onDone && typeof this.onDone === 'function' ? true : false;
    this.state('done');
    return hasOnDone ? this.onDone(data, resolve) : this.ready(data, resolve);
  }

  /**************
  func: ready
  params:
  - packet: the data to pass to the resolve
  - resolve: the complete resolve to pass back
  describe: This function is use to relay the to the ready state.
  usage: this.ready(data, resolve)
  ***************/
  ready(packet, resolve) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.action('ready'); // set the complete action
  
    packet.hash = this.lib.hash(packet);// hash the entire packet before completeing.
    // check for agent on complete function in agent
    const hasOnReady = this.onReady && typeof this.onReady === 'function';
  
    // if: agent has on complete then return on complete
    this.state('ready'); // set the finish state
  
    // return the provided resolve function or a promise resolve.
    return hasOnReady ? this.onReady(packet, resolve) : resolve(packet);
  }
  


  /**************
  func: finish
  params:
  - packet: the data to pass to the resolve
  - resolve: the finish resolve to pass back
  describe: This function is used to relay into the finish state when resolving a question or data.
  usage: this.finish(data, resolve)
  ***************/
  finish(packet, resolve) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.action('finish'); // set the finish action
    packet.hash = this.lib.hash(packet);// hash the entire packet before finishing.
    // check for agent on finish function in agent
    const hasOnFinish = this.onFinish && typeof this.onFinish === 'function';

    // if: agent has on finish then return on finish
    this.state('finish'); // set the finish state

    // return the provided resolve function or a promise resolve.
    return hasOnFinish ? this.onFinish(packet, resolve) : this.complete(packet, resolve);
  }

  /**************
  func: complete
  params:
  - packet: the data to pass to the resolve
  - resolve: the complete resolve to pass back
  describe: This function is use to relay into a complete state when
            resolving a question or data.
  usage: this.complete(data, resolve)
  ***************/
  complete(packet, resolve) {
    if (!this._active) return Promise.resolve(this._messages.offline);
    this.action('complete'); // set the complete action

    packet.hash = this.lib.hash(packet);// hash the entire packet before completeing.
    // check for agent on complete function in agent
    const hasOnComplete = this.onComplete && typeof this.onComplete === 'function';

    // if: agent has on complete then return on complete
    this.state('complete'); // set the finish state
    // return the provided resolve function or a promise resolve.
    return hasOnComplete ? this.onComplete(packet, resolve) : resolve(packet);
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
      id: this.lib.uid(), // set the id
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
    this.zone('exit');

    const agent = this.agent();
    const client = this.client();

    this.action('exit');
    const data = {
      id: this.lib.uid(),
      key: 'exit',
      value: this._messages.exit,
      agent,
      client,
      created: Date.now(),
    }
    data.hash = this.lib.hash(data);

    // clear memory
    this._active = false;
    this._client = false;
    this._security = false;
    this._support = false;
    this._services = false;
    this._systems = false;
    this._networks = false;
    this._legal = false;
    this._authority = false;
    this._justice = false;

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
      data.hash = this.lib.hash(data); // hash the data
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
    this.action('func', 'states');
    this.state('return', 'states');
    return {
      id: this.lib.uid(),
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
        id: this.lib.uid(), // set the packetid
        agent: this.agent(),
        client: this.client(),
        key: 'zone',
        value,
        text,
        created: Date.now(),
      };
      data.hash = this.lib.hash(data);
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
      id: this.lib.uid(), // set the uuid of the data
      agent: this.agent(), // set the agent value
      cleint: this.client(), // set the client value
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
      if (!value || !this._actions[value] || value === this._action) return;
      this._action = value; // set the local action variable
      // check local vars for custom actions
      const var_action = this.vars.actions ? this.vars.actions[value] : false;
      // check the message action
      const msg_action = var_action || this._actions[value];
      const msg = msg_action || action; // set the correct message
      const text = extra ? `${msg} ${extra}` : msg; // set the text of the action
      const data = { // build the data object for the action.
        id: this.lib.uid(), // generate a guid for the action transmitssion.
        agent: this.agent(), // the agent data to send with the action
        client: this.client(), // the client data to send with the action
        key: 'action', // the key for event to transmit action type
        value, // the value key which is the action passed
        text, // text of the action to send
        created: Date.now(), // action time stamp
      };
      data.hash = this.lib.hash(data); // generate a hash of the action packet.
      this.talk(config.events.action, data); // talk the core action event
      return data;
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
    const data = {
      id: this.lib.uid(), // set the id with a uuid
      agent: this.agent(), // set the agent value
      client: this.client(), // set the client value
      key: 'actions', // set the data key
      value: this._actions, // set the value to the actions list
      created: Date.now(), // set the data created date      
    };
    data.hash = this.lib.hash(data)
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
    try {
      if (!value || !this._features[value]) return; // check feature value

      const lookup = this._features[value]; // set the lookup value
      const text = extra ? `${lookup} ${extra}` : lookup; // set the text value

      const data = { // build data object
        id: this.lib.uid(), // set the id
        agent: this.agent(), // set the agent transporting the packet.
        key: 'feature', // set the key for transport
        value, // set the value of the key
        text, // set the text value
        created: Date.now(), // set the creation date
      };
      data.hash = this.lib.hash(data); // generate the hash value of the data packet
      this.talk(config.events.feature, data); // talk the feature event with data
      return data;
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
    const data = {
      id: this.lib.uid(), // set the object id
      agent: this.agent(), // set the agent value.
      client: this.client(), // set the client value.
      key: 'features', // set the key
      value: this._features, // set the value to the features list
      created: Date.now(), // set the created date.
    };
    data.hash = this.lib.hash(data);
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
    try {
      if (!value) return;
      this._context = value;
      const lookup = this.vars.context[value] || value;
      const text = extra ? `${lookup} ${extra}` : lookup;

      const data = {
        id: this.lib.uid(),
        agent: this.agent(),
        client: this.client(),
        key: 'context',
        value,
        text,
        created: Date.now(),
      };
      data.hash = this.lib.hash(data);
      this.talk(config.events.context, data);
      return data;
    } catch (e) {
      return this.error(e);
    }
  }

  contexts() {
    if (!this._active) return this._messages.offline; // check the active status
    this.state('return', 'contexts');
    return {
      id: this.lib.uid(),
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
    const client_copy = this.lib.copy(this._client); // create a copy of the client data
    client_copy.hash = this.lib.hash(client_copy);
    client_copy.created = Date.now();
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
    const agent_copy = this.lib.copy(this._agent); // create a copy of the agent data.
    agent_copy.hash = this.lib.hash(agent_copy);
    agent_copy.created = Date.now();
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
  func: legal
  params: none
  describe: basic legal features available in a Deva.
  usage: this.systems()
  ***************/
  legal() {
    return this._getFeature('legal', this._legal);
  }

  /**************
  func: justice
  params: none
  describe: basic justice features available in a Deva.
  usage: this.systems()
  ***************/
  justice() {
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
    const agent = this.agent();
    const client = this.client();
    const _data = {
      id: this.lib.uid(),
      key: 'prompt',
      value: agent.key,
      agent,
      client,
      text,
      created: Date.now(),
    }
    _data.hash = this.lib.hash(_data);
    return this.talk(config.events.prompt, _data);
  }






  /**************
  func: core
  params: none
  describe: return core data.
  ***************/
  core() {
    // check the active status
    if (!this._active) return Promise.resolve(this._messages.offline);
    const data = this.lib.copy(this._core);
    data.id = this.lib.uid();
    data.hash = this.lib.hash(data);
    return data;
  }

  /**************
  func: info
  params: none
  describe: return info data.
  ***************/
  info() {
    // check the active status
    if (!this._active) return Promise.resolve(this._messages.offline);
    const data = this.lib.copy(this._info);
    data.id = this.lib.uid();
    data.hash = this.lib.hash(data);
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
    // check the active status
    if (!this._active) return Promise.resolve(this._messages.offline);

    // format the date since active for output.
    const dateFormat = this.lib.formatDate(this._active, 'long', true);
    // create the text msg string
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
      if (!this._active) return resolve(this._messages.offline);
      this.zone('help');
      this.feature('help');
      this.action('help');
      this.state('help');
      this.context('help');

      const params = msg.split(' ');
      let helpFile = 'main';
      if (params[0]) helpFile = params[0];
      if (params[1]) helpFile = `${params[0]}_${params[1]}`;
      helpFile = this.lib.path.join(help_dir, 'help', `${helpFile}.feecting`);
      try {
        this.state('resolve', 'help');
        return resolve(this.lib.fs.readFileSync(helpFile, 'utf8'));
      } catch (e) {
        this.state('reject', 'help');
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
    The error function provides the consistent error manage of the system.
  usage: this.error(err, data, reject);
  ***************/
  error(err,data=false,reject=false) {
    this.zone('error');
    this.action('error')
    const agent = this.agent();
    const client = this.client();
    const _data = {
      id: this.lib.uid(),
      key: 'error',
      value: agent.key,
      agent,
      client,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,        
      },
      data,
      created: Date.now(),
    }
    _data.hash = this.lib.hash(_data);
    this.talk(config.events.error, this.lib.copy(_data));
    const hasOnError = this.onError && typeof this.onError === 'function' ? true : false;

    this.state('error');
    if (hasOnError) return this.onError(err, data, reject);
    else return reject ? reject(err) : err;
  }

}
export default Deva;
