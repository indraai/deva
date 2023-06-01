// Copyright (c)2023 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
const {EventEmitter} = require('events');
const { createHash, randomUUID, createCipheriv, createDecipheriv, randomBytes } = require('crypto');
const config = require('./config.json').DATA // load the deva core configuration data.
class Deva {
  constructor(opts) {
    opts = opts || {};
    this._id = randomUUID(); // the unique id assigned to the agent at load
    this._info = opts.info || false; // the deva information from the package file.
    this._config = opts.config || {}; // local Config Object
    this._agent = opts.agent || false; // Agent profile object
    this._client = {}; // this will be set on init.
    this._active = false; // the active/birth date.
    this._security = false; // inherited Security features.
    this._support = false; // inherited Support features.
    this._services = false; // inherited Service features.
    this._systems = false; // inherited Systems features.
    this._solutions = false; // inherited Solutions features.
    this._research = false; // inherited Research features.
    this._development = false; // inherited Development features.
    this._business = false; // inherited Business features.
    this._legal = false; // inherited Legal features.
    this._assistant = false; // inherited Assistant features.
    this._story = false; // inherited Story features.
    this.events = opts.events || new EventEmitter({}); // Event Bus
    this.lib = opts.lib || {}; // used for loading library functions
    this.devas = opts.devas || {}; // Devas which are loaded
    this.vars = opts.vars || {}; // Variables object
    this.listeners = opts.listeners || {}; // local Listeners
    this.modules = opts.modules || {}; // 3rd Party Modules
    this.func = opts.func || {}; // local Functions
    this.methods = opts.methods || {}; // local Methods
    this.maxListeners = opts.maxListenners || 0; // set the local maxListeners

    // prevent overwriting existing functions and variables with same name
    for (var opt in opts) {
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

    this._message = config.message; // current state of agent.
    this._messages = {
      notext: 'NO TEXT WAS PROVIDED',
      nopacket: 'NO PACKET WAS PROVIDED',
      method_not_found: 'METHOD NOT FOUND',
    }; // set the messages from config

    // then here we are going to loop the messages config to make sure custom values are set
    for (let x in config.messages) {
      this._messages[x] = {};
      for (let y in config.messages[x]) {
        this._messages[x][y] = config.messages[x][y].replace('::agent.name::', opts.agent.profile.name);
      }
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
        this.bind.forEach(bind => { // loop over the bind items func, method, listener...
          if (this[bind]) for (let x in this[bind]) { // if the root has a bind func, method, listener
            if (typeof this[bind][x] === 'function') { // check to make sure object is a fucntion
              this[bind][x] = this[bind][x].bind(this); // bind the item from the bind object
            }
          }
        });
        // bind translate
        const translate = this._agent && this._agent.translate && typeof this._agent.translate === 'function';
        if (translate) this._agent.translate = this._agent.translate.bind(this);
        // bind parser
        const parse = this._agent && this._agent.parse && typeof this._agent.parse === 'function';
        if (parse) this._agent.parse = this._agent.parse.bind(this);
        // bind process
        const process = this._agent && this._agent.process && typeof this._agent.process === 'function';
        if (process) this._agent.process = this._agent.process.bind(this);
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
    this.state('method_not_found');
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
    this.feature('Security'); // set feature to Security
    const _cl = this.client(); // set local copy of client data
    try {
      if (!_cl.features.security) return this.Support(); // if no security feature goto Support
      else {
        this.action('Security'); // set action to Security
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
        return this.Support(); // goto Support when done with Security
      }
    } catch (e) {
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
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
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
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
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
      return this.error(e); // run error handling if an error is caught
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
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
      return this.error(e); // run error handling if an error is caught
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
      if (!_cl.features.solutions) return this.Research();
      else {
        this.action('Solutions');
        const {id, features, profile} = _cl; // set the local consts from client copy
        const {solutions} = features; // set solutions from features const
        this._solutions = { // set this_solutions with data
          id: this.uid(true), // uuid of the solutions feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: solutions.concerns, // any concerns for client
          global: solutions.global, // the global policies for client
          personal: solutions.devas[this._agent.key], // Client personal features and rules.
        };
        delete this._client.features.solutions
        return this.Research()
      }
    } catch (e) {
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
      return this.error(e); // run error handling if an error is caught
    }
  }

  /**************
  func: Research
  params: client: false
  describe:
    The Research feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Research() {
    this.feature('Research'); // set state to development setting
    const _cl = this.client(); // set local client variable
    try {
      if (!_cl.features.research) return this.Development(); // if no research goto Business
      else {
        this.action('Research'); // set the action to Research
        const {id, features, profile} = _cl; // set the local consts from client copy
        const {research} = features; // set research from features const
        this._research = { // set this_research with data
          id: this.uid(true), // uuid of the research feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: research.concerns, // any concerns for client
          global: research.global, // the global policies for client
          personal: research.devas[this._agent.key] // Client personal features and rules.
        };
        delete this._client.features.research // delete the research key from client features
        return this.Development(); // goto Development.
      }
    } catch (e) {
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
      return this.error(e); // run error handling if an error is caught
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
    this.feature('Development'); // set state to development setting
    const _cl = this.client(); // get hte client data to local variable
    try {
      if (!_cl.features.development) return this.Business(); // if no development goto Business
      else {
        this.action('Development'); // set the action to Development
        const {id, features, profile} = _cl; // set the local consts from client copy
        const {development} = features; // set development from features const
        this._development = { // set this_development with data
          id: this.uid(true), // uuid of the development feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: development.concerns, // any concerns for client
          global: development.global, // the global policies for client
          personal: development.devas[this._agent.key], // Client personal features and rules.
        };
        delete this._client.features.development; // delete the development key from client features.
        return this.Business(); // goto business when development is done
      }
    } catch (e) {
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
      return this.error(e); // run error handling if an error is caught
    }
  }

  /**************
  func: Business
  params: client: false
  describe:
    The Business feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Business() {
    this.feature('Business'); // set state to business setting
    const _cl = this.client(); // set client into local variable.
    try {
      if (!_cl.features.business) return this.Legal(); // if no business hten goto legal
      else {
        this.action('Business'); // set action to Business
        const {id, features, profile} = _cl; // set the local consts from client copy
        const {business} = features; // set business from features const
        this._business = { // set this_business with data
          id: this.uid(true), // uuid of the business feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: business.concerns, // any concerns for client
          global: business.global, // the global policies for client
          personal: business.devas[this._agent.key] // Client personal features and rules.
        };
        delete this._client.features.business; // delete the business key from the client features
        return this.Legal(); // go to Legal when Business is done.
    }
    } catch (e) {
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
      return this.error(e); // run error handling if an error is caught
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
        const {legal} = features; // set legal from features const
        this._legal = { // set this_legal with data
          id: this.uid(true), // uuid of the legal feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: legal.concerns, // any concerns for client
          global: legal.global, // the global policies for client
          personal: legal.devas[this._agent.key], // Client personal features and rules.
        };
        delete this._client.features.legal;
        return this.Assistant();
      }
    } catch (e) {
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
      return this.error(e); // run error handling if an error is caught
    }
  }

  /**************
  func: Assistant
  params: client: false
  describe:
    The Assistant feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Assistant() {
    this.feature('Assistant'); // set state to assistant setting
    const _cl = this.client(); // set the client into a local variable
    try {
      if (!_cl.features.assistant) return this.Story(); // if no Assistant then goto Done
      else {
        this.action('Assistant'); // set action to Assistant
        const {id, features, profile} = _cl; // set the local consts from client copy
        const {assistant} = features; // set assistant from features const
        this._assistant = { // set this_assistant with data
          id: this.uid(true), // uuid of the assistant feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: assistant.concerns, // any concerns for client
          global: assistant.global, // the global policies for client
          personal: assistant.devas[this._agent.key] // Client personal features and rules.
        };
        delete this._client.features.assistant; // delete the assistant key from client features
        return this.Story(); // when assistant is done goto Story.
      }
    } catch (e) {
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
      return this.error(e); // run error handling if an error is caught
    }
  }

  /**************
  func: Story
  params: client: false
  describe:
    The Story feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Story() {
    this.feature('Story'); // set feature to Story
    const _cl = this.client(); // set local client variable
    try {
      if (!this._client.features.story) return this.Mind(); // if no story goto Mind
      else {
        this.action('Story'); // set action to Story
        const {id, features, profile} = this._client; // set the local consts from client copy
        const {story} = features; // set story from features const
        this._story = { // set this_story with data
          id: this.uid(true), // uuid of the story feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: story.concerns, // any concerns for client
          global: story.global, // the global policies for client
          personal: story.devas[this._agent.key], // Client personal features and rules.
        };
        delete this._client.features.story; // delete story object from client
        return this.Mind(); // when done with Story goto Mind
      }
    } catch (e) {
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
      return this.error(e); // run error handling if an error is caught
    }
  }

  /**************
  func: Mind
  params: client: false
  describe:
    The Mind feature sets the correct variables and necessary rules for the
    client presented data.
  ***************/
  Mind() {
    this.feature('Mind');                 // set state to story setting
    const _cl = this.client();
    try {
      if (!_cl.features.mind) return this.Done();
      else {
        this.action('Mind');
        const {id, features, profile} = _cl; // set the local consts from client copy
        const {mind} = features; // set mind from features const
        this._mind = { // set this_mind with data
          id: this.uid(true), // uuid of the mind feature
          client_id: id, // client id for reference
          client_name: profile.name, // client name for personalization
          concerns: mind.concerns, // any concerns for client
          global: mind.global, // the global policies for client
          personal: mind.devas[this._agent.key], // Client personal features and rules.
        };
        delete this._client.features.mind; // delete the mind feature from client data
        return this.Done(); // when complete then move to the done feature.
      }
    } catch (e) {
      this.action('error'); // set the action to error
      this.feature('error'); // set the feature to error
      return this.error(e); // run error handling if an error is caught
    }
  }

  /**************
  func: Done
  params: none
  describe: The end of the workflow Client Feature Workflow
  ***************/
  Done(client) {
    return new Promise((resolve, reject) => {
      try {
        delete this._client.features; // delete the features key when done.
        this.action('done'); // set state to assistant setting
        this.feature('done'); // set state to assistant setting
        return resolve(); // resolve an empty pr
      } catch (e) {
        this.feature('error')
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

        packet.q = {                                      // build packet.q container
            id: this.uid(),
            agent: this.agent() || false,                  // set the agent
            client: this.client() || false,                // set the client
            meta: {                                       // build the meta container
              key,                                        // set the key variable
              method,                                     // set method to track function use
              params,                                     // set any params that are associated
            },
            text,                                         // set the text for the packet.
            data,                                         // set the data object
            created: Date.now(),                          // timestamp the question
        }

        // hash the question
        packet.q.meta.hash = this.hash(packet.q);

        this.action(_action);
        this.talk(config.events.question, this.copy(packet)); // global question event make sure to copy data.

        if (isAsk) {                                      // isAsk check if the question isAsk and talk
          // if: isAsk wait for the once event which is key'd to the packet ID for specified responses
          this.talk(`${key}:ask`, packet);
          this.once(`${key}:ask:${packet.id}`, answer => {
            this.action('question_ask_answer');
            return this.finish(answer, resolve);                       // if:isAsk resolve the answer from the call
          });
        }
        else {                                            // else: answer tue question locally
          this.action('question_answer');
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
      const packet_answer = {                                  // setup the packet.a container
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
      packet_answer.meta.hash = this.hash(packet_answer);

      packet.a = this.copy(packet_answer);
      packet.hash = this.hash(packet);     // hash the entire packet.


      this.action('answer_talk');
      this.talk(config.events.answer, this.copy(packet)); // global talk event

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

    const agent = this.agent();
    const client = this.client();
    // build the answer packet from this model
    packet.a = {
      id: this.uid(),
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
          this.talk(`${this._agent.key}:ask:${packet.id}`, this._methodNotFound(packet));
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
        this.talk(`${agent.key}:ask:${packet.id}`, packet);
      }).catch(err => {
        this.action('error');
        this.talk(`${agent.key}:ask:${packet.id}`, {error:err});
        return this.error(err, packet);
      })
    }
    catch (e) {
      this.action('error');
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
    5. run the onInit custom function if preset or the system start function.
    6. The system start function will create a chain reaction of states that load.
    7. If there is an error the init function rejects the call.
  usage: this.init(client_object)
  ***************/
  init(client) {
    // set client
    this._active = Date.now();

    const _data = {
      id: this.uid(true),
      key: 'return',
      value: 'init',
      agent: this._agent,
      client: this.copy(client),
      text: this._messages.states.start,
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
  start(data) {
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    this.state('start');
    data.value = 'start';
    delete data.hash;
    data.hash = this.hash(data);

    if (this.info) {
      const _info = this.info(data.id);
      this.prompt(_info);
    }

    this.action(data.value);
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
  enter(data) {
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    this.state('enter');
    data.value = 'enter';
    delete data.hash;
    data.hash = this.hash(data);
    this.action(data.value);
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
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    this.state('done');
    data.value = 'done';
    delete data.hash;
    data.hash = this.hash(data);
    this.action(data.value)
    const hasOnDone = this.onDone && typeof this.onDone === 'function' ? true : false;
    return hasOnDone ? this.onDone(data) : Promise.resolve(data);
  }

  /**************
  func: finish
  params:
  - data: the data to pass to the resolve
  - resolve: the finish resolve to pass back
    If the deva is offline it will return the offline message.
  usage: this.finish(data, resolve)
  ***************/
  done(data) {
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    this.state('finish');
    data.value = 'done';
    delete data.hash;
    data.hash = this.hash(data);
    this.action(data.value)
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
    if (!this._active) return Promise.resolve(this._messages.states.offline);
    this.state('stop');
    const data = {
      id: this.uid(true),
      key: 'return',
      value: 'stop',
      agent: this.agent(),
      client: this.client(),
      text: this._messages.states.stop,
      created: Date.now(),
    }
    data.hash = this.hash(data);
    this.action(data.value);
    const hasOnStop = this.onStop && typeof this.onStop === 'function';
    return hasOnStop ? this.onStop(data) : this.exit(data)
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
  exit(data) {
    this.state('exit');
    this._active = false;
    data.value = 'exit';
    delete data.hash;
    data.hash = this.hash(data);

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

    this.action(data.value);
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
      const data = {
        id: this.uid(true),
        key: 'state',
        value: state,
        agent: this.agent(),
        client: this.client(),
        text,
        created: Date.now(),
      };
      data.hash = this.hash(data);
      this.talk(config.events.state, data);
    } catch (e) {
      return this.error(e);
    }
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
  func: zone
  params:
    - st: The zone flag to set for the Deva that matches to this._zones
  describe
  ***************/
  zone(zone) {
    try {
      if (!this._zones[zone]) return;
      this._zone = zone;
      const text = this._messages.zones[zone];
      const talk = {
        id: this.uid(true),
        key: 'zone',
        value: zone,
        agent: this._agent,
        text,
        created: Date.now(),
      };
      talk.hash = this.hash(talk);
      this.talk(config.events.zone, talk);
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
      const data = {
        id: this.uid(true),
        key: 'action',
        value: action,
        agent: this.agent(),
        client: this.client(),
        text,
        created: Date.now(),
      };
      data.hash = this.hash(data);
      this.talk(config.events.action, data);
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
  feature(feature) {
    try {
      if (!this._features[feature]) return;
      this._feature = feature;
      const text = this._messages.features[feature] ;
      const talk = {
        id: this.uid(true),
        key: 'feature',
        value: feature,
        agent: this._agent,
        text,
        created: Date.now(),
      };
      talk.hash = this.hash(talk);
      this.talk(config.events.feature, talk);
    } catch (e) {
      return this.error(e);
    }
  }

  /**************
  func: context
  params:
    - st: The context flag to set for the Deva that matches to this._contexts
  describe
  ***************/
  context(value) {
    try {
      this._context = value;
      const data = {
        id: this.uid(true),
        key: 'context',
        value,
        agent: this.agent(),
        client: this.client(),
        text: this.vars.context[value] || value,
        created: Date.now(),
      };
      data.hash = this.hash(data);
      this.talk(config.events.context, data);
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
    if (!this._active) return this._messages.states.offline;    // check the active status
    this.state('client_data');                                // set the client state
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
    if (!this._active) return this._messages.states.offline;
    this.state('agent_data');
    const agent_copy = this.copy(this._agent);
    delete agent_copy.parse;
    delete agent_copy.translate;
    delete agent_copy.process;
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
    if (!this._active) return this._messages.states.offline;    // check the active status
    this.feature('security');                              // set the security state
    try {
      this.action('security');                              // set the security state
      return this.copy(this._security);                               // return the security feature
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
    if (!this._active) return this._messages.states.offline;   // check the active status
    this.feature('support');                              // set the support state
    try {
      this.action('support');
      return this.copy(this._support);                               // return the support feature
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
    if (!this._active) return this._messages.states.offline;   // check the active status
    this.feature('services');                             // set the services state
    try {
      this.action('services');                             // set the services state
      return this.copy(this._services);                              // return the services feature
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
    if (!this._active) return this._messages.states.offline;   // check the active status
    this.feature('systems');                              // set the systems state
    try {
      this.action('systems');                              // set the systems state
      return this.copy(this._systems);                               // return the systems feature
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
    if (!this._active) return this._messages.states.offline;   // check the active status
    this.feature('solutions');                            // set the solutions state
    try {
      this.action('solutions');                            // set the solutions state
      return this.copy(this._solutions);                             // return the solutions feature
    } catch (e) {
      this.action('error');                              // set the systems state
      this.feature('error');
      return this.error(e);
    }
  }

  /**************
  func: research
  params: opts
  describe: basic research features available in a Deva.
  ***************/
  research(opts) {
    if (!this._active) return this._messages.states.offline;   // chek the active status
    this.feature('research');                          // set the research state
    try {
      this.action('research');                          // set the research state
      return this.copy(this._research);                           // return research feature
    } catch (e) {
      this.action('error');
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
    if (!this._active) return this._messages.states.offline;   // chek the active status
    this.feature('development');                          // set the development state
    try {
      this.action('development');                          // set the development state
      return this.copy(this._development);                           // return development feature
    } catch (e) {
      this.action('error');
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
    if (!this._active) return this._messages.states.offline;   // chek the active status
    this.feature('assistant');                            // set the assistant state
    try {
      this.action('assistant');                            // set the assistant state
      return this.copy(this._assistant);                             // return assistant feature
    } catch (e) {
      this.action('error');
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
    if (!this._active) return this._messages.states.offline;   // chek the active status
    this.feature('business');                             // set the business state
    try {
      this.action('business');
      return this.copy(this._business);                              // return business feature
    } catch (e) {
      this.action('error');
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
    if (!this._active) return this._messages.states.offline;   // chek the active status
    this.feature('legal');                                // set the legal state
    try {
      this.action('legal');
      return this.copy(this._legal);                                 // return legal feature
    } catch (e) {
      this.action('error');
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
    try {
      this.action('story');
      return this.story(this._story);                                 // return story feature
    } catch (e) {
      this.action('error');
      this.feature('error');
      return this.error(e);
    }
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
        this.talk(config.events.load, {
          id:this.uid(true),
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
        this.devas[key].stop().then(exit => {
          delete this.devas[key];
          this.talk(config.events.unload, key);
        });
        return resolve(this._messages.states.unload);
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
    the_hash.update(str.toString());
    const _digest = the_hash.digest('base64');
    return `${algo}:${_digest}`;
  }

  /**************
  func: cipher
  params: str - string to encrypt
  describe:
    The encrypt function allows for the internal encryption of data based on the
    defined client security settings.
  ***************/
  cipher(str) {
    // this.action('cipher');
    const security = this._security;
    const {password, algorithm} = security.cipher;
    const key = createHash('sha256').update(String(password)).digest('base64');
    const key_in_bytes = Buffer.from(key, 'base64')
    const iv = randomBytes(16);
    // create a new cipher
    const _cipher = createCipheriv(algorithm, key_in_bytes, iv);
    const encrypted = _cipher.update(String(str), 'utf8', 'hex') + _cipher.final('hex');

    return {
      iv: iv.toString('base64'),
      key,
      encrypted,
    }
  }
  decipher(opt) {
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
    const _data = {
      id: this.uid(true),
      key: 'prompt',
      value: 'prompt',
      agent: this.agent(),
      client: this.client(),
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
  func: trimText
  params:
    - text: The text to trim.
    - maxwords: The number of words to max.
  describe:
    A utility function to trimText intput to a specific word count.
  ***************/
  trimWords(text, maxwords) {
    const splitter = text.split(' ');
    if (splitter < maxwords) return text;
    return splitter.slice(0, maxwords).join(' ');
  }

  /**************
  func: dupes
  params: dupers
  describe: remove duplicees from an array.
  ***************/
  dupes(dupers) {
    if (!Array.isArray(dupers)) return dupers;
    const check = [];
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
  info(id=false) {
    id = id || this._id;
    const agent = this.agent();
    if (this._info) {
      const _info = [
        `::begin:info:${id}`,
        `## ${this._agent.profile.name} (#${agent.key})`,
      ];
      for (let x in this._info) {
        _info.push(`- ${x}: ${this._info[x]}`);
      }
      _info.push(`::end:info:${this.hash(this._info)}`);
      return _info.join('\n');
    }
    else {
      return '';
    }
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
      const params = msg.split(' ');
      let helpFile = 'main';
      if (params[0]) helpFile = params[0];
      if (params[1]) helpFile = `${params[0]}_${params[1]}`;
      helpFile = path.join(help_dir, 'help', `${helpFile}.feecting`);
      try {
        return resolve(fs.readFileSync(helpFile, 'utf8'))
      } catch (e) {
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

    const _data = {
      id: this.uid(true),
      key: 'return',
      value: 'error',
      agent: this.agent(),
      client: this.client(),
      error: err,
      data,
      created: Date.now(),
    }
    this.talk(config.events.error, this.copy(_data));

    const hasOnError = this.onError && typeof this.onError === 'function' ? true : false;
    if (hasOnError) return this.onError(err, data, reject);
    else return reject ? reject(err) : err;
  }

}
module.exports = Deva;
