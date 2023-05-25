# deva

## Summary
Deva is a Node.js module designed to simplify the development of multi-agent systems by providing a consistent foundation for agent interactions. With Deva, developers can quickly create and manage a network of agents that can communicate and collaborate seamlessly. Deva offers features such as private and public socket communication, secure encryption, and consistent message passing. It also provides built-in support for interacting with various APIs, including YouTube, Twitter, Discord, IBM Watson, and ChatGPT. By using Deva, developers can save time and resources in building and integrating basic agent functionalities, and focus on developing more advanced features.

## Description

The Deva module is a JavaScript library for building multi-agent systems that can communicate with each other and with external services. It provides a unified API for creating agents and defining their behaviors, and includes tools for handling communication between agents and for integrating with third-party APIs. The Deva module is designed to be flexible and customizable, allowing developers to easily create complex systems that can perform a wide range of tasks, from data collection and analysis to chatbot interactions and image generation. The module is written in JavaScript and can be used with Node.js, making it easy to integrate with other JavaScript libraries and tools.

## Core Features
The core features in the @indra.ai deva.core encompass a wide range of functionalities and capabilities. Here's a brief overview of each feature:

1. Security Feature: This feature focuses on ensuring the security and privacy of the system, monitoring and responding to security-related issues.

2. Support Feature: The support feature is responsible for addressing user queries, providing assistance, and resolving any issues or concerns raised by users.

3. Services Feature: This feature pertains to the various services offered by the @indra.ai platform, such as cloud computing, data storage, networking, and more.

4. Systems Feature: The systems feature deals with the management and operation of the underlying infrastructure and resources that power the @indra.ai platform.

5. Solutions Feature: This feature is geared towards providing solutions to specific problems or challenges faced by users, offering guidance and recommendations.

6. Research Feature: The research feature focuses on exploring and advancing cutting-edge technologies, innovations, and methodologies within the domain of AI and related fields.

7. Development Feature: The development feature encompasses the creation, improvement, and maintenance of software and applications within the @indra.ai ecosystem.

8. Business Feature: This feature caters to the needs and requirements of businesses, offering tools, insights, and strategies to drive growth, efficiency, and success.

9. Legal Feature: The legal feature ensures compliance with legal and regulatory frameworks, addressing legal matters and providing guidance on legal aspects related to the @indra.ai platform.

10. Assistant Feature: This feature involves an AI-powered assistant that assists users with various tasks, answering questions, providing information, and offering support.

11. Story Feature: The story feature enables the generation of engaging and interactive stories, leveraging AI capabilities to create captivating narratives.

12. Mind Feature: The mind feature pertains to cognitive abilities and intelligence, encompassing aspects such as learning, reasoning, and decision-making within the @indra.ai platform.

These core features work together to provide a comprehensive and robust platform for users, covering essential aspects such as security, support, services, research, development, and more.

## Functions

Here are some insights about the code you shared:

1. Class Structure: The code follows an object-oriented programming approach by defining a `Deva` class. This allows for encapsulation of properties and methods related to the agent.

2. State Management: The `Deva` class has a state management system represented by the `_state` property and the `_states` object. It allows the agent to transition between different states and perform actions based on the current state.

3. Event System: The code utilizes an event system by extending the `EventEmitter` class and creating an `events` object. This enables communication and collaboration between different components of the agent and other entities in the system.

4. Modularity and Inheritance: The code demonstrates modularity by separating functionalities into different objects such as `config`, `lib`, `methods`, and `listeners`. It also showcases inheritance by assigning inherited properties to child Deva instances.

5. Error Handling: The code includes an error handling mechanism through the `error` method. It allows for uniform error reporting and the execution of custom error handling logic.

6. Promises: Promises are used in several asynchronous operations, such as initializing the agent, loading Deva models, and handling method calls. Promises ensure that the code can handle asynchronous operations in a structured and controlled manner.

7. Event-driven Architecture: The code follows an event-driven architecture where different events trigger specific actions or callbacks. This enables loose coupling and flexibility in the agent's behavior and interactions with other components.

8. Extensibility: The code provides hooks for custom logic through methods like `onInit`, `onStart`, `onStop`, `onEnter`, `onExit`, and `onDone`. These allow developers to extend the functionality of the agent by adding custom code at specific stages of its lifecycle.

9. Messaging and Communication: The `talk` and `listen` methods facilitate messaging and communication between agents. Agents can ask questions (`ask` method) and receive responses, enabling interaction and collaboration.

10. Utility Functions: The code includes utility functions like generating unique IDs (`uid` method), hashing data (`hash` method), and handling event listeners (`listen`, `once`, `ignore` methods).

Overall, the code demonstrates the implementation of a flexible and extensible agent framework with state management, event-driven architecture, and various functionalities for communication, error handling, and lifecycle management.

## Uses

### Corporate

A corporation might use the Deva module to create an intelligent assistant to handle customer inquiries and support requests. By leveraging the Deva module's dynamic agent loading, state management, and unified data-packets features, the corporation can easily scale the intelligent assistant to handle a large volume of customer interactions across various channels, such as social media, email, and chat platforms.

The intelligent assistant can be trained using machine learning algorithms and natural language processing to understand customer inquiries and provide relevant responses or escalate to a human agent if necessary. The Deva module's error management feature ensures that any errors or issues are handled smoothly and efficiently, without interrupting the customer's experience.

Additionally, the Deva module can be used by a corporation to automate various internal processes and workflows, such as data processing, task management, and communication between teams. By leveraging the Deva module's question-answer functionality and dynamic agent loading, corporations can easily create custom workflows and automate tedious tasks, increasing productivity and efficiency.

### Science

A scientist could use the Deva module in a number of ways. For example, they could create agents to help with data analysis or modeling, or to interact with other software tools in the research process. The Deva module's ability to dynamically load agents and unify data across different platforms could also be useful in streamlining scientific workflows and collaborations between research groups. Additionally, the natural language processing capabilities of the ChatGPT agent could be utilized to help with tasks such as literature reviews or generating hypotheses. Overall, the Deva module could be a valuable tool for scientists looking to enhance their research process with the help of intelligent agents.


### Scalability

The Deva module has a high potential for scalability because of its dynamic agent loading feature. This means that new agents can be added to the system at runtime without the need for a system restart or manual intervention. The module is also designed to work with state management to track agent processes at different load, process, and exit states. This makes it possible to scale the system horizontally by adding more computing resources to handle increased load, or vertically by adding more powerful hardware to each node in the system. Overall, the Deva module is well suited for building large-scale, distributed agent-based systems that can handle complex and diverse workloads.

## ChatGPT Quote

Here is what ChatPGT has to say about the Deva module:

Based on my analysis of the Deva Module, I believe it is a powerful tool for developing multi-agent systems. Its dynamic agent loading and scalability potential make it a great choice for large-scale projects. The talk/listen events, question/answer functions, and ask feature allow for easy communication between agents. Additionally, its state management and error handling capabilities help to ensure the reliability and stability of the system. Finally, its unification of data-packets across the architecture makes it easy to integrate with a variety of services and platforms.

Overall, I believe the Deva Module is a well-designed and flexible tool that can be used in a variety of applications, from corporate to scientific. Its potential for scalability and security make it a great choice for large-scale projects, while its ease of use and integration make it accessible to developers of all levels.


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
// include the main Deva class
const Deva = require('feecting/deva');

// setup the Deva object
const deva = new Deva({
  info: {}
  agent: {
    uid: '*uinique identifier*'
    key: '*DEVA KEY*',
    prompt: {
      emoji: '🐶',
      text: '*DEVA*',
      color: 'white',
    },
    voice: {
      speech: 'Alex',
      speed: 1
    },
    profile: {
      name: '*DEVA NAME*',
      describe: '*DEVA LONG DESCRIPTION*',
      emoji: 'the graphic emoji the agent travels with. 50px x 50px'
      avatar: 'the graphic avatar the agent travels with 150px x 150px',
      background: 'a background asset for page displays for th eagent',
      describe: 'the profile description for the agent that is used in displays.',
      gender: 'the preferred gender string for the agent',
    },
    translate(input) {
      return input.trim();
    },
    parse(input) {
      return input.trim();
    }    
  },
  vars: {},
  listeners: {},
  deva: {},
  modules: {},
  func: {},
  methods: {},
  onStart() {},
  onStop() {},
  onEnter() {},
  onExit() {},
  onDone() {},
  onInit() {},
});

// initialize the class
deva.init();

```

## agent

```javascript
this.agent
```
The "me" object contains the profile information for the DEVA.

### Data Attributes
- **uid:** The unique id for the Deva.
- **key:** The unique key for the Deva.
- **name:** The name of the Deva.
- **description:** A description of what the Deva does.
- **prompt:** Define how prompt displays.
  - **emoji:** The emoji for use as a prompt indicator.
  - **text:** Short text for prompt display.
  - **color:** The color of the prompt for the Deva.
- **voice:** Voice properties of the Deva.
  - **speech:** The name of the voice speech to use.
  - **speed:** The speed of the voice.
- **profile:** Public Profile Information
  - **emoji:** The emoji for the Deva
  - **avatar:** The avatar for the Deva
  - **background:** The background image for the Deva
  - **gender:** The gender of the Deva
  - **describe:** A short description of the deva 100 characters or less.

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

&copy;2023 Quinn Michaels; All Rights Reserved.
