# deva

## Summary
Deva is a Node.js module designed to simplify the development of multi-agent systems by providing a consistent foundation for agent interactions. With Deva, developers can quickly create and manage a network of agents that can communicate and collaborate seamlessly. Deva offers features such as private and public socket communication, secure encryption, and consistent message passing. It also provides built-in support for interacting with various APIs, including YouTube, Twitter, Discord, IBM Watson, and ChatGPT. By using Deva, developers can save time and resources in building and integrating basic agent functionalities, and focus on developing more advanced features.

## Description

The Deva module is a JavaScript library for building multi-agent systems that can communicate with each other and with external services. It provides a unified API for creating agents and defining their behaviors, and includes tools for handling communication between agents and for integrating with third-party APIs. The Deva module is designed to be flexible and customizable, allowing developers to easily create complex systems that can perform a wide range of tasks, from data collection and analysis to chatbot interactions and image generation. The module is written in JavaScript and can be used with Node.js, making it easy to integrate with other JavaScript libraries and tools.

## Core Features
The core features in the @indra.ai deva.core encompass a wide range of functionalities and capabilities. Here's a brief overview of each feature:

1. Security Feature
2. Guard Feature
3. Defense Feature
4. Support Feature
5. Services Feature
6. Systems Feature
7. Networks Feature
8. Legal Feature
9. Justice Feature
10. Authority Feature

These core features work together to provide a comprehensive and robust platform for users, covering essential aspects such as security, support, services, Legal, Authority, and more.

## Functions

1. **Class Structure:** The code follows an object-oriented programming approach by defining a `Deva` class. This allows for encapsulation of properties and methods related to the agent.
2. **State Management:** The `Deva` class has a state management system represented by the `_state` property and the `_states` object. It allows the agent to transition between different states and perform actions based on the current state.
3. **Event System:** The code utilizes an event system by extending the `EventEmitter` class and creating an `events` object. This enables communication and collaboration between different components of the agent and other entities in the system.
4. **Modularity and Inheritance:** The code demonstrates modularity by separating functionalities into different objects such as `config`, `lib`, `methods`, and `listeners`. It also showcases inheritance by assigning inherited properties to child Deva instances.
5. **Error Handling:** The code includes an error handling mechanism through the `error` method. It allows for uniform error reporting and the execution of custom error handling logic.
6. **Promises:** Promises are used in several asynchronous operations, such as initializing the agent, loading Deva models, and handling method calls. Promises ensure that the code can handle asynchronous operations in a structured and controlled manner.
7. **Event-driven Architecture:** The code follows an event-driven architecture where different events trigger specific actions or callbacks. This enables loose coupling and flexibility in the agent's behavior and interactions with other components.
8. **Extensibility:** The code provides hooks for custom logic through methods like `onInit`, `onStart`, `onStop`, `onEnter`, `onExit`, and `onDone`. These allow developers to extend the functionality of the agent by adding custom code at specific stages of its lifecycle.
9. **Messaging and Communication:** The `talk` and `listen` methods facilitate messaging and communication between agents. Agents can ask questions (`ask` method) and receive responses, enabling interaction and collaboration.
10. **Utility Functions:** The code includes utility functions like generating unique IDs (`uid` method), hashing data (`hash` method), and handling event listeners (`listen`, `once`, `ignore` methods).

## contents
- [install](#install) - How to install the deva core.
- [structure](#structure) - Basic structure of `deva`.
- [agent](#agent) - The `agent` object stores the Agent Profile.
- [vars](#vars) - Variables are stored in the `this.vars` object.
- [listeners](#listeners) - Listeners are setup to allow a deva trigger events.
- [devas](#listeners) - This is where sub-devas are loaded into the current deva.
- [modules](#modules) - A `deva` can add modules to add to their functionality.
- [func](#func) - A `deva` the internal functionality is written here.
- [methods](#methods) - Methods expose the `deva` abilities to external commands/calls.
- [states](#states) - There are various states that triger when a `deva` is doing things.
- [utility](#utility) - Interal to a `deva` there are utility functions available to make actions easier like getting a unique id or status.


## install
```bash
$ npm i @indra.ai/deva --save
```

## structure
```javascript
import Deva from '@indra.ai/deva';
import pkg from './package.json' with {type:'json'};
const {agent,vars} = pkg.data;

// set the __dirname
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';    
const __dirname = dirname(fileURLToPath(import.meta.url));

const info = {
  id: pkg.id,
  name: pkg.name,
  describe: pkg.description,
  version: pkg.version,
  url: pkg.homepage,
  dir: __dirname,
  git: pkg.repository.url,
  bugs: pkg.bugs.url,
  author: pkg.author,
  license: pkg.license,
  copyright: pkg.copyright,
};

const DEVA = new Deva({
  info, // info packet to store entity meta information.
  agent, // the agent profile from the package data.
  vars, // the variables the agent uses from the package data.
  utils: {
    translate(input) {return input.trim();},
    parse(input) {return input.trim();},
    process(input) {return input.trim();}
  },
  listeners: {},
  modules: {},
  deva: {},
  func: {
    list(opts) {
     return [
       "test 1",
       "test 2", 
       "test 3",
     ]  
    }
  },
  methods: {
    list(packet) {
      this.context('list', packet.id);
      this.action('method', `list:${packet.id}`);
      return new Promise((resolve, reject) => {
        try {
          const data = this.func.data(packet.q);
          return resolve({
            text: `See Data`,
            html: `See Data`,
            data,
          });
        } catch (err) {
          return this.error(err, packet, reject);          
        }
      });
    }
  },
  onReady(data, resolve) {
    this.prompt(this.vars.messages.ready);
    return resolve(data);
  },
  onError(err, data, reject) {
    this.prompt(this.vars.messages.error);
    console.log(err);
    return reject(err);
  }
});
export default DEVA
```

## agent

```javascript
this.agent();
```

### Data Attributes

- **id:** The Agent id generated by `this.lib.uid()`.  
- **key:** The key to reference the agent by on the network.  
- **prompt:** The prompt configuration for the entity.  
  - **emoji:** The emoji the for the agent.
  - **text:** Algorithm,
  - **colors:** The colors for the agent on the prompt. As each agent can set custom prompt colors.
    - **label:** The label colors for the agent prompt.
      - **R:** The red value 0 to 255.
      - **G:** The green value 0 to 255.
      - **B:** The blue value 0 to 255.
    - **text:** The text colors for the agent prompt.
      - **R:** The red value 0 to 255.
      - **G:** The green value 0 to 255.
      - **B:** The blue value 0 to 255.
- **profile:** The Agent profile configuration data.
  - **name:** The name of the agent.
  - **hashtag:** The hashtag to reference the agent by.
  - **title:** Title of the Agent for media display.
  - **subtitle:** Subtitle of the agent for extra context.
  - **describe:** Short description of the agent to build from.
  - **tweet:** The tweet/post that the agent will share about itself.
  - **hashtags:** Comma list of hashtags to add when posting tweets/posts.
  - **pronouns:** The pronounds the agent will be going by.
  - **gender:** The gender of the agent as pronouns are how they identify and gender is their orientation.
  - **style:** The personal style that reflects the agent/entity.
  - **voice:** The voice profile the entity will use when speaking.
  - **system:** The system the entity/agent is assigned to.
  - **layout:** The display layout templte the entity uses for their personal presentation.
  - **color:** The text color for the presentation layer.
  - **bgcolor:** The background color for the entity presentatino layer.
  - **emoji:** A graphic that represents the entity personal emoji.
  - **avatar:** A graphic that represents the entity/agent personal avatar.
  - **image:** A graphic that represents the entity overall image.
  - **background:** The background graphic for the presentation layer.
  - **owner:** The name of the owner of the agent/entity.
  - **creator:** The name of the creator of the agent/entity.
  - **created:** The date and time the entity/agent was created.

## vars

```javascript
this.vars
```

The vars can be use to set local variables for the deva that need to be used in your program.

There are no default variables, so the scope is for you and your imagination to figure out.

### example
```javascript
  vars: {
    foo: 'bar',
    steps: 10,
    strings: 'Some variable string',
    adding: 1 + 9 + 11,
    objects: {
      key: 'key value'
    },
    arrays: [
      'value 1',
      'value 2',
    ]
  }
```

## listeners
Listeners are what you setup that allow your Deva to communicate with other Deva or parts of your application/system.

```javascript
this.listeners
```

### default

Each Deva comes with a set of default listeners to provide basic functionality.

### start
This will trigger an event to start the Deva.

```javascript
this.talk(`*agent_key*:start`);
```

### stop
This will trigger an event to stop the Deva.

```javascript
this.talk(`*agent_key*:stop`);
```

### status
This will trigger an event to broadcast the Deva status.

```javascript
this.talk(`*agent_key*:status`);
```

## devas

```javascript
this.devas
```

The main object for Deva that are bwlow this Deva.

## modules

The external modules that your Deva might require to function.

```javascript
this.modules
```

## func
The functions that your deva uses to operate. Functions are not exposed through
the api to public access.

```javascript
this.func
```

### methods
```javascript
this.methods
```

The methods are exposed publicly through the question event that parses a string
and sends a request to the question method that then interacts with functions, modules, and variables.

## states
Provided are a set of state functions that trigger when a Deva is at various states of starting/stopping.

### onStart()

The `onStart()` function runs after the `start` function has completed.

```javascript
this.onStart() {
  // some code to run when the deva starts.
}
```

### onStop()

The `onStop()` function runs after the `stop` function has completed.

```javascript
this.onStop() {
  // some code to run when the deva stops
}
```

### onEnter()

The `onEnter()` function runs after the `enter` event has fired.

```javascript
this.onEnter() {
  // some code to run when the deva is loaded
}
```

### onExit()

The `onExit()`function runs after the `exit` event has fired.

```javascript
this.onExit() {
  // some code to run when the deva logs out.
}
```

### onDone()

The `onDone()`function runs after the `done` event has fired.

```javascript
this.onDone() {
  // some code to run when the deva logs out.
}
```

### onInit()

The `onInit()` function runs after the `init()` function has completed.

```javascript
this.onInit() {
  // some code to run when the Deva initializes.
}
```

## utility

### question

The question event is the functionality that exposes the methods to the outside world. When a deva asks a question the string is parsed into a question format so that commands to access various methods can be exposed.

The `question(packet)` function is a default function that allows the system to ask questions of itself or other Deva.

The function checks the beginning of a string for a `#` to determine wether to issue a command to run a specific method.

See [Question Listener](#question) for usage.


```javascript
// async await
const question = await this.question('#*agent_key* *method*:*params* *question string*');

// promises
this.question('#*agent_key* *method*:*params* *question string*').then(response => {
  ...
}).catch(err => {
  ...
})
```

### uid()
Generates a unique ID that is used in packet transfer and other various ways.

```javascript
this.uid() // inside the object

// example
this.vars.id = this.uid()

```

### talk(evt, resource=false)

The `talk()` function is used when your Deva needs to broadcast an event that other Deva
or functions would be listening for.

```javascript
this.talk('event', resource);  // inside the object
deva.talk('event', resource); // outside the object

// example
const evt_id = this.uid();
const evt_data = {
  task_id: 1,
  task_name: 'this is blank data',
  task_contact: 'joe@schmo.com',
};

this.talk('big-event', {
  id: evt_id,
  key: this.me.key,
  q: {
    bot: this.me,
    text: 'text to send to the event',
    data: evt_data,
  },
  created: Date.now(),
});
```

### listen(evt callback)

The `listen` function can assign listeners to the Deva and designate which `callback`
function to run when an event is fired.

Listeners can be set up individually this way or also added to the listeners object
independently.

```javascript
this.listen('some-event', this.func.listener);

this.func.listenter = packet => {
  console.log('some-event-fired');
};

```

### once(evt, callback)

The `once()` function can assign a one-time listener to a function. This is useful when returning data with an id that one Deva has submitted to another Deva. Also very useful for submit responses that are unique to the request.

```javascript
this.once(`some-once-event`, this.func.listener)
this.func.listener = packet => {
  console.log('some-once-event-fired');
}

```

### ignore(evt, callback)

The `ignore()` function removes a listener from the designated event. This is useful for adding and removing events dynamically or as needed.

```javascript
this.ignore('ignore-event', this.func.listener);
this.func.listener = packet => {
  console.log('ignore-event-fired');
}
```


### load(agent, opts)

To add a Deva dynamically use the `load()` function. This can be utilized to add Deva to an existing Deva after the object has already been created.

```javascript
const opts = {
  agent: {...},
  vars: {...},
  listeners: {...},
  deva: {...},
  func: {...},
  onStart() {},
  onStop() {},
  onEnter() {},
  onExit() {},
}
this.load('deva-name', opts);
```

### unload(agent)
To delete a Deva for any reason use `unload()`. This will delete the Deva and all it's parts from the current Deva.

```javascript

this.unload('deva-key');

```

### status()
The `status()` function will return the running status of the current Deva.

### start()
The `start()` function will start the Deva and run the `onStart()` state function.

### stop()
The `stop()` function will stop the Deva and run the `onStop()` state function.

### init(deva=false)
The `init()` function will initialize the Deva and run the `onInit()` state function.

### initDeva()
The `initDeva()` function will initialize the Deva located under the current Deva set. To be used in instances of a main Deva parent situation.

---

[Github Repo](https://github.com/indraai/deva)  
[Back to indra.ai](https://indra.ai)  

©2025 Quinn A Michaels; All rights reserved.  
Legal Signature Required For Lawful Use.  
Distributed under VLA:24789087843554622185 LICENSE.md