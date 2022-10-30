# DEVA
Deva is a class object that provides events and object management with inherited properties.

[Back to indra.ai](https://indra.ai)

## Install
```bash
$> npm i @feecting/deva
```

## Basic Structure
```javascript
// include the main Deva class
const Deva = require('feecting/deva');

// setup the Deva object
const deva = new Deva({
  agent: {
    uid: '*uinique identifier*'
    key: '*DEVA KEY*',
    name: '*DEVA NAME*',
    describe: '*DEVA LONG DESCRIPTION*',
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
  modules: {},
  func: {},
  methods: {},
  deva: {},
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

## Breakdown
### Agent
```javascript
this.agent
```
The "me" object contains the profile information for the DEVA.
##### Data Attributes
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

### Vars
```javascript
this.vars
```
The vars can be use to set local variables for the deva that need to be used in your program.

There are no default variables, so the scope is for you and your imagination to figure out.

##### Example
```javascript
...
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
...

```
### Listeners
Listeners are what you setup that allow your Deva to communicate with other Deva or parts of your application/system.

```javascript
this.listeners
```

#### Default Listeners

Each Deva comes with a set of default listeners to provide basic functionality.

##### Question
The question event is the functionality that exposes the methods to the outside world. When a deva asks a question the string is parsed into a question format so that commands to access various methods can be exposed.

```javascript
const question = await this.question(`#*agent_key* *method*:*params* *question string*`);
```

##### Start
This will trigger an event to start the Deva.

```javascript
this.talk(`*agent_key*:start`);
```

##### Stop
This will trigger an event to stop the Deva.

```javascript
this.talk(`*agent_key*:stop`);
```

##### Status
This will trigger an event to broadcast the Deva status.

```javascript
this.talk(`*agent_key*:status`);
```

### Deva
```javascript
this.deva
```

The main object for Deva that are bwlow this Deva.

### Modules
The external modules that your Deva might require to function.

```javascript
this.modules
```


### Func
The functions that your deva uses to operate. Functions are not exposed through
the api to public access.

```javascript
this.func
```

### Methods
```javascript
this.methods
```
The methods are exposed publicly through the question event that parses a string
and sends a request to the question method that then interacts with functions, modules, and variables.

### State Functions
Provided are a set of state functions that trigger when a Deva is at various states of starting/stopping.

#### onStart()

The `onStart()` function runs after the `start` function has completed.

```javascript
this.onStart() {
  // some code to run when the deva starts.
}
```

#### onStop()

The `onStop()` function runs after the `stop` function has completed.

```javascript
this.onStop() {
  // some code to run when the deva stops
}
```


#### onEnter()

The `onEnter()` function runs after the `enter` event has fired.

```javascript
this.onEnter() {
  // some code to run when the deva is loaded
}
```


#### onExit()

The `onExit()`function runs after the `exit` event has fired.

```javascript
this.onExit() {
  // some code to run when the deva logs out.
}
```

#### onDone()

The `onDone()`function runs after the `done` event has fired.

```javascript
this.onDone() {
  // some code to run when the deva logs out.
}
```


#### onInit()

The `onInit()` function runs after the `init()` function has completed.

```javascript
this.onInit() {
  // some code to run when the Deva initializes.
}
```

## Utility Functions

### uid()
Generates a unique ID that is used in packet transfer and other various ways.

```javascript
this.uid() // inside the object
deva.uid() // outside the object

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


### Load(agent, opts)

To add a Deva dynamically use the `load()` function. This can be utilized to add Deva to an existing Deva after the object has already been created.

```javascript
const opts = {
  me: {...},
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

### question(packet)
The `question(packet)` function is a default function that allows the system to ask questions of itself or other Deva.

The function checks the beginning of a string for a `#` to determine wether to issue a command to run a specific method.

See [Question Listener](#question) for usage.

```bash
#deva method:params message
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

-
[Back to indra.ai](https://indra.ai)
&copy;2021 Quinn Michaels; All Rights Reserved.
