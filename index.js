// Copyright (c)2021 Quinn Michaels
// Distributed under the MIT software license, see the accompanying
// file LICENSE.md or http://www.opensource.org/licenses/mit-license.php.
const {EventEmitter} = require('events');
class Deva {
  constructor(opts) {
    opts = opts || {};
    this._uid = this.uid();                             // the unique id assigned to the agent at load
    this.active = false;                                // the active/birth date.
    this.security = false;                              // inherited Security features.
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

    this.opts = {};
    for (var opt in opts) {
      if (!this[opt]) this.opts[opt] = opts[opt];       // set any remaining opts to this.opts.
    }

    this.cmdChr = '!';
    this.askChr = '#';
    this.inherit = ["events", "config", "lib", "security", "client"];
    this.bind = ["listeners", "methods", "func", "lib", "security", "agent", "client"];
    this.states = ["question", "ask", "start", "stop", "status", "enter", "exit", "done"];
    this.messages = {
      offline: 'AGENT OFFLINE'
    }
  }

  // Called from the init function to bind the elements defined in the this.bind variable.
  // the assign bind ensures that the *this* scope is available to child elements/functions.
  _assignBind() {
    try {
      this.bind.forEach(bind => {
        for (let x in this[bind]) {
            if (typeof this[bind][x] === 'function') this[bind][x] = this[bind][x].bind(this);
        }
      });

      const translate = this.agent.translate && typeof this.agent.translate === 'function';
      if (translate) this.agent.translate = this.agent.translate.bind(this);

      const parse = this.agent.parse && typeof this.agent.parse === 'function';
      if (parse) this.agent.parse = this.agent.parse.bind(this);
      return Promise.resolve();
    } catch (e) {
      // this error is before the error reporting so just log to console.
      console.error(e, bind);
    }
  }

  // Called from the init function to assign the listeners to various states.
  // when the listener fires it will call the associated named function.
  _assignListeners() {
    this.states.forEach(state => {
      this.events.on(`${this.agent.key}:${state}`, packet => {
        return this[state](packet);
      })
    })
    for (let x in this.listeners) {
      this.events.on(x, packet => {
        return this.listeners[x](packet);
      })
    }
    return Promise.resolve();
  }

  // Some elements will inherit the data of the parent. this object will loop over
  // any children data that theis deva has and assign the inherited information.
  _assignInherit() {
    for (let d in this.devas) {
      this.inherit.forEach(inherit => {
        this.devas[d][inherit] = this[inherit];
      });
    }
    return Promise.resolve();
  }

  // General handler for when a method is NOT found from a user command.
  _methodNotFound(packet) {
    packet.a = {
      agent: this.agent,
      text: `${packet.q.meta.method} is NOT a valid method.`,
      meta: {
        key: this.agent.key,
        method: packet.q.meta.method,
      },
      created: Date.now(),
    };
    return packet;
  }

  // A simple interface to generate a unique id for the agent. As agents will
  // quite oftne have to key their transactions. This will provide all agents
  // with the same key generator which can also be modified to link into a remote
  // generator or some other solution if needed.
  uid() {
    const min = Math.floor(Date.now() - (Date.now() / Math.PI));
    const max = Math.floor(Date.now() + (Date.now() * Math.PI));
    return Math.floor(Math.random() * (max - min)) + min;
  }

  // The talk interface binds to the events emitter to allow agents to perform a
  // this.talk(*) feature.
  talk(evt, resource=false) {
    return this.events.emit(evt, resource);
  }

  // the listen interface binds to the event emitter to allow agents to listen
  // this.listen(*) feature.
  listen(evt, callback) {
    return this.events.on(evt, callback);
  }

  // Instances where listening for only one unique keyed event is required
  // this interface is provided for the this.once(*) feature.
  once(evt, callback) {
    return this.events.once(evt, callback);
  }

  // where an agent needs to ignore events or remove a lisatener this interface
  // serves the this.ignore(*) feature.
  ignore(evt, callback) {
    return this.events.removeListener(evt, callback);
  }

  // Used when loading a Deva dynamically into the current set.
  load(opts) {
    this.devas[opts.key] = opts;
    // inherit the data to the new deva.
    this.inherit.forEach(inherit => {
      this.devas[agent][inherit] = this[inherit];
    });

    return Promise.resolve();
  }

  // Used when unloading a deva dynamically from the set.
  unload(agent) {
    delete this.devas[agent];
    return Promise.resolve();
  }

  // Askign a question to another deva in the set besides itself. If the question
  // interface detects the action is to ask another deva a question with
  // this.askChr variable match. Then an answer packet is generated and the
  // deva is asked to process the question asked and return it's proper data set
  // from the requested method.
  // this is an event function that relies on talk/listen

  ask(packet) {

    packet.a = {
      agent: this.agent,
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
        // talk back to the once event with the ask key.
        this.talk(`${this.agent.key}:ask:${packet.id}`, packet);
      }).catch(err => {
        // If the ask method fails then a reject error is returned from the this.error
        // interface.
        this.talk(`${this.agent.key}:ask:${packet.id}`, {error:err.toString()});
        return this.error(err, packet);
      })
    }
    catch (e) {
      // if any error is caught in the processing of the ask then it returns and
      // executes the this.error(*) interface.
      this.talk(`${this.agent.key}:ask:${packet.id}`, {error:e.toString()});
      return this.error(e, packet)
    }
    // now when we ask the meta params[0] should be the method
  }

  // general question interface.
  // accepts two arguments a *TEXT* and *DATA* object.
  // if the question being asked is a simple text command then
  // this.question('#*agent.key *method* *text*')
  // if the question is a data object
  // this.question('#*agent.key* *method* *properties*', {*data*});
  question(TEXT=false, DATA=false) {
    const id = this.uid();
    return new Promise((resolve, reject) => {
      try {
        if (!TEXT) return reject('NO TEXT');
        if (!this.active && _method !== 'start') return reject(this.messages.offline);

        let text,
            t_params,
            _deva = false,
            _method = 'question';

        const t_split = TEXT.split(' ');
        const isCmd = t_split[0] && t_split[0].startsWith(this.cmdChr) ? t_split[0].substr(1) : false;
        const isAsk = t_split[0] && t_split[0].startsWith(this.askChr) ? t_split[0].substr(1) : false;
        const params = t_split[1] && (isCmd || isAsk) ? t_split[1].split(':') : false;
        const method = isCmd ? isCmd : params ? params[0] : 'question';
        text = isCmd || isAsk ? t_split.slice(2).join(' ').trim() : TEXT;

        // Format the packet for return on the request.
        const packet = {
          id,
          q: {
            agent: this.agent || false,
            client: this.client || false,
            meta: {
              key: isAsk || this.agent.key,
              cmd: TEXT,
              method,
              params,
            },
            text,
            data: DATA,
            created: Date.now(),
          },
          a: {},
          created: Date.now(),
        };

        // if the user asks a question to another deva '#' then issue the talk/once
        // event combination.
        if (isAsk) {
          this.talk(`${isAsk}:ask`, packet);
          this.once(`${isAsk}:ask:${packet.id}`, answer => {
            return resolve(answer);
          });
        }

        // if the user sends a local command '!' then it will ask of the self.
        else {
          if (typeof this.methods[method] !== 'function') return resolve(this._methodNotFound(packet));
          this.methods[method](packet).then(result => {
            text = typeof result === 'object' ? result.text : result;
            const data = typeof result === 'object' ? result.data : false;
            packet.a = {
              agent: this.agent,
              meta: {
                key: this.agent.key,
                method,
              },
              text,
              data,
              created: Date.now(),
            };
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

  // interface to return the status of the current deva with the time/date requested.
  status(addtl=false) {
    const id = this.uid();
    if (!this.active) return Promise.resolve(`${this.agent.name} is OFFLINE!`);
    const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' }).format(this.active);
    let text = `${this.agent.name} is ONLINE since ${dateFormat}`;
    if (addtl) text = text + `\n${addtl}`;
    return Promise.resolve(text);
  }

  // start the deva then return the 'onStart' function.
  start() {
    if (this.active) return;
    this.active = Date.now();
    if (this.onStart) return this.onStart.call(this);
    return Promise.resolve('start');
  }

  // stop teh deva then return the onStop function.
  stop() {
    if (!this.active) return;
    this.active = false;
    if (this.onStop) return this.onStop.call(this);
    return Promise.resolve('stop');
  }

  // enter the deva then return the onEnter function.
  enter() {
    if (!this.active) return false;
    if (this.onEnter) return this.onEnter.call(this);
    return Promise.resolve('enter');
  }

  // exit the deva then return the onExit function.
  exit() {
    if (this.onExit) return this.onExit.call(this);
    return Promise.resolve('exit');
  }

  // set the deva as done then return the oDone function.
  done() {
    if (!this.active) return;
    if (this.onDone) return this.onDone.call(this);
    return Promise.resolve('done');
  }

  // Interface for unified error reporting within all devas.
  // this.error(*error*, *packet*) can be issued at time of any error.
  // e: is the error to pass into the interface.
  // packet: the packet that caused the error.
  error(e, packet=false) {
    console.error(e);
    // broadcast a global uniform error event.
    this.talk('error', {
      id: this.uid(),
      agent: this.agent,
      client: this.client,
      error: e.toString(),
      packet,
      created: Date.now(),
    });
    // call the onError if there is a logcal one.
    // if there is no local error return a promise reject.
    if (this.onError) this.onError.call(this, e, packet);
    return Promise.reject(e);
  }

  // The main init interface where the chain begins.
  // a set of options is passed into the init function which is the configuration
  // object. from this opts object the system is built. After the opts object is processed
  // the inherit is assigned and then bind then listners then
  // opts: The options object containing the necessary vaules to build a Deva.
  init(client=false) {
    this.events.setMaxListeners(this.maxListeners);
    // set client
    this.client = client;

    return this._assignInherit().then(() => {
      return this._assignBind();
    }).then(() => {
      return this._assignListeners();
    }).then(() => {
      if (this.onInit) return this.onInit.call(this, opts);
      return Promise.resolve(true);
    }).catch(err => {
      return this.error(e, opts);
    });
  }

  // initDeva interface is to initialize devas that this deva is a parent of.
  // This feature allows a Deva to be a parent of a parent of a parent etc....
  initDeva() {
    return new Promise((resolve, reject) => {
      const devas = [];
      for (let x in this.devas) {
        devas.push(this.devas[x].init());
      }
      Promise.all(devas).then(() => {
        return resolve('✨ DEVAS LOADED');
      }).catch(reject);
    });
  }
}
module.exports = Deva;
