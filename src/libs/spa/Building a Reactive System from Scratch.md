# Building a Reactive System from Scratch

**A Complete Guide to Modern Reactivity**

## Table of Contents

1. [Introduction](#introduction)
2. [Part 1: Understanding Reactivity Fundamentals](#part-1-understanding-reactivity-fundamentals)
3. [Part 2: Building Basic Signals](#part-2-building-basic-signals)
4. [Part 3: Adding Computations](#part-3-adding-computations)
5. [Part 4: Implementing Effects](#part-4-implementing-effects)
6. [Part 5: Optimizing with Batching](#part-5-optimizing-with-batching)
7. [Part 6: Advanced Features](#part-6-advanced-features)
8. [Part 7: Developer Experience](#part-7-developer-experience)
9. [Part 8: Building a Mini UI Framework](#part-8-building-a-mini-ui-framework)
10. [Conclusion](#conclusion)

## Introduction

Reactivity systems are the backbone of modern UI frameworks like React, Vue, and Svelte. They allow data changes to automatically propagate through your application, updating the UI and other dependent values along the way. In this comprehensive tutorial, we'll build a full-featured reactivity system from the ground up, similar to those used in production frameworks.

**What you'll learn:**

- How reactivity works under the hood
- How to build reactive primitives like signals, computed values, and effects
- Advanced patterns like batching, memory management, and error handling
- How to apply these concepts to build a minimal UI framework

**Who this tutorial is for:**
This tutorial is designed for developers who have some JavaScript experience but want to deepen their understanding of reactive programming. We'll start with the basics and work our way up to advanced concepts.

Let's get started!

## Part 1: Understanding Reactivity Fundamentals

### What is Reactivity?

At its core, reactivity is about relationships between values. When one value changes, other values that depend on it should update automatically. This is the foundation of declarative programming - you describe relationships between data rather than manually updating values.

Let's start by understanding the key concepts:

### Key Concepts

1. **Signal**: A reactive value that can change over time
2. **Computed**: A value derived from other signals or computed values
3. **Effect**: A side effect that runs when its dependencies change
4. **Dependency Tracking**: Automatically tracking what depends on what
5. **Reactive Graph**: The network of dependencies between reactive values

### The Mental Model

Think of your application as a spreadsheet:

- **Signals** are like cells where you directly enter values
- **Computed values** are like cells with formulas that reference other cells
- **Effects** are like charts or reports that update when their source data changes

When you change a value in a cell, Excel automatically recalculates all dependent formulas. Our reactivity system will work the same way.

### The Building Blocks: ReactiveNode

The fundamental unit in our reactivity system is the `ReactiveNode`. This represents any reactive value (signal, computed, or effect) in our system.

Let's first understand what a `ReactiveNode` needs to track:

```typescript
interface ReactiveNode {
  id: number;               // Unique identifier
  version: number;          // Version counter for change detection
  sources: WeakMap<ReactiveNode, number>; // What this node depends on
  observers: Set<ReactiveNode>; // What depends on this node
  compute?: () => any;      // How to calculate this node's value
  value?: any;              // The current value
  cleanup?: () => void;     // Cleanup function for effects
  onDirty?: () => void;     // What to do when dependencies change
  dirty?: boolean;          // Whether this node needs recalculation
  error?: any;              // Any error that occurred during computation
  name?: string;            // For debugging
}
```

Don't worry if this looks overwhelming - we'll build it step by step.

### Exercise 1: Create Your First ReactiveNode

Let's start by implementing a simple function that creates a reactive node:

```typescript
function createNode(initialValue, name) {
  return {
    id: nextId++,           // We'll define nextId later
    version: 0,             // Start at version 0
    value: initialValue,    // Store the initial value
    compute: undefined,     // No computation function yet
    cleanup: undefined,     // No cleanup function yet
    error: undefined,       // No errors yet
    dirty: false,           // Not dirty initially
    onDirty: undefined,     // No dirty handler yet
    sources: new WeakMap(), // Empty dependencies list
    observers: new Set(),   // Empty observers list
    name                    // Store the name if provided
  };
}

// We need a counter for unique IDs
let nextId = 1;
```

What's happening here?

- We're creating an object to represent a reactive node
- We're assigning it a unique ID using a counter
- We're initializing all the properties that we'll need later

This is just the start. In the next section, we'll build on this foundation to create our first reactive primitives.

## Part 2: Building Basic Signals

Now that we understand what a `ReactiveNode` is, let's implement our first reactive primitive: signals.

A signal is a reactive value that can change over time. It's the simplest form of reactivity - when a signal changes, anything that depends on it should update.

### Understanding Dependency Tracking

Before we implement signals, we need to understand how dependency tracking works. The key insight is:

*When a signal is read during the execution of a computation or effect, we need to record that dependency.*

This means we need to keep track of what computation or effect is currently running, and record it as a dependency when a signal is accessed.

```typescript
// Currently running computation or effect
let activeObserver = null;

// Record a dependency between the active observer and a source node
function trackAccess(sourceNode) {
  if (activeObserver) {
    // Record that the active observer depends on sourceNode at its current version
    activeObserver.sources.set(sourceNode, sourceNode.version);
    // Record that sourceNode is observed by the active observer
    sourceNode.observers.add(activeObserver);
  }
}
```

### Implementing createSignal

Now we can implement our `createSignal` function:

```typescript
function createSignal(initialValue, options = {}) {
  // Create a node to represent our signal
  const node = createNode(initialValue, options.name);
  
  // Create a function that returns the current value and tracks access
  const signal = function() {
    trackAccess(node);
    return node.value;
  };

  // Method to update the signal's value
  signal.set = function(newValue) {
    if (node.value !== newValue) {  // Only update if the value actually changed
      node.value = newValue;
      node.version++;  // Increment version to indicate a change
      
      // Notify all observers that this node has changed
      notifyObservers(node);
    }
  };

  // Method to update the signal based on its current value
  signal.update = function(fn) {
    signal.set(fn(node.value));
  };
  
  // Method to read the value without tracking (for internal use)
  signal.peek = function() {
    return node.value;
  };

  // Store the node on the signal function for internal use
  signal._node = node;
  
  return signal;
}

// Notify all observers that a node has changed
function notifyObservers(node) {
  for (const observer of node.observers) {
    observer.dirty = true;  // Mark the observer as needing recalculation
    
    // If the observer has an onDirty handler, call it
    if (observer.onDirty) {
      observer.onDirty();
    }
  }
}
```

Let's understand what's happening:

1. We create a node to store the signal's state
2. We create a function that returns the node's value and tracks access when called
3. We add methods to update the signal's value
4. When the value changes, we notify all observers

### Using Signals

Now let's see how to use our signals:

```typescript
// Create a signal with an initial value
const count = createSignal(0, { name: 'count' });

// Read the signal's value
console.log(count()); // 0

// Update the signal's value
count.set(1);
console.log(count()); // 1

// Update based on current value
count.update(n => n + 1);
console.log(count()); // 2
```

### Exercise 2: Implementing Deep Equality

Our current implementation only checks for equality using `===`. This works for primitive values, but not for objects or arrays. Let's implement a `deepEquals` function to handle complex values:

```typescript
function deepEquals(a, b) {
  if (Object.is(a, b)) return true;
  
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i])) return false;
    }
    return true;
  }
  
  if (a.constructor !== b.constructor) return false;
  
  if (a instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp) return a.toString() === b.toString();
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEquals(a[key], b[key])) return false;
  }
  
  return true;
}
```

Now we can update our `createSignal` function to use deep equality by default:

```typescript
function createSignal(initialValue, options = {}) {
  const node = createNode(initialValue, options.name);
  const equals = options.equals || deepEquals;
  
  const signal = function() {
    trackAccess(node);
    return node.value;
  };

  signal.set = function(newValue) {
    if (!equals(node.value, newValue)) {  // Now using deep equality
      node.value = newValue;
      node.version++;
      notifyObservers(node);
    }
  };

  // Rest of the implementation remains the same...
  
  return signal;
}
```

This allows signals to handle complex values like objects and arrays correctly.

## Part 3: Adding Computations

Now that we have signals, let's implement computed values. A computed value is derived from other reactive values (signals or other computed values).

The key difference between a signal and a computed value is:

- A signal's value is set directly
- A computed value's value is calculated from other reactive values

### Implementing createComputed

```typescript
function createComputed(fn, options = {}) {
  // Create a node for our computed value
  const node = createNode(undefined, options.name);
  
  // Set the computation function
  node.compute = fn;
  
  // Run the computation initially
  runNode(node);
  
  // Create a function that returns the current value and tracks access
  const computed = function() {
    // Make sure the value is up-to-date
    updateIfNecessary(node);
    
    // Track that something is accessing this computed value
    trackAccess(node);
    
    // If there was an error during computation, throw it
    if (node.error !== undefined) {
      const err = node.error;
      node.error = undefined;
      throw err;
    }
    
    return node.value;
  };
  
  // Store the node on the computed function for internal use
  computed._node = node;
  
  return computed;
}
```

But for this to work, we need to implement two more functions: `runNode` and `updateIfNecessary`.

### Running a Computation

```typescript
// Stack to detect cycles in the dependency graph
const computationStack = [];

function runNode(node) {
  if (!node.compute) return;  // Only run nodes with compute functions
  
  // Check for cycles in the dependency graph
  if (computationStack.includes(node)) {
    const cycle = computationStack.slice(computationStack.indexOf(node))
      .map(n => n.name || `Node_${n.id}`)
      .join(' → ');
    const error = new Error(`Cycle detected in reactive graph: ${cycle}`);
    console.error(error);
    node.error = error;
    return;
  }
  
  // Add to computation stack for cycle detection
  computationStack.push(node);
  
  // Clean up old sources to avoid memory leaks
  cleanupSources(node);
  
  // Set this node as the active observer so dependencies can be tracked
  const prevObserver = activeObserver;
  activeObserver = node;
  
  try {
    // Run any cleanup function from previous computation
    if (typeof node.cleanup === "function") {
      node.cleanup();
      node.cleanup = undefined;
    }
    
    // Run the computation function
    const newValue = node.compute();
    
    // Handle cleanup function returned by effect
    if (node.onDirty && typeof newValue === "function") {
      node.cleanup = newValue;
    } 
    // Handle value change for computed values
    else if (!node.onDirty && !deepEquals(node.value, newValue)) {
      node.value = newValue;
      node.version++;
      notifyObservers(node);
    }
    
    // Mark as clean
    node.dirty = false;
    node.error = undefined;
  } catch (err) {
    node.error = err;
    console.error(`Error in ${node.name ? node.name : 'reactive computation'}:`, err);
  } finally {
    // Restore the previous active observer
    computationStack.pop();
    activeObserver = prevObserver;
  }
}

function cleanupSources(node) {
  // Remove this node from all its sources' observers lists
  for (const source of Array.from(node.sources.keys())) {
    source.observers.delete(node);
  }
  // Clear the sources list
  node.sources = new WeakMap();
}

function updateIfNecessary(node) {
  if (!node.compute) return false;  // Only update nodes with compute functions
  
  if (node.dirty) {
    runNode(node);
    return true;
  }
  
  return false;
}
```

### Using Computed Values

```typescript
// Create a signal
const count = createSignal(0);

// Create a computed value that depends on the signal
const doubled = createComputed(() => count() * 2);

console.log(doubled()); // 0

// Update the signal
count.set(5);

console.log(doubled()); // 10
```

### Exercise 3: Understanding the Reactive Graph

Now that we have signals and computed values, let's visualize the reactive graph:

```
count (Signal)
   │
   ▼
doubled (Computed)
```

When `count` changes, `doubled` is marked as dirty and will be recomputed when accessed. This is the essence of the reactive graph: a network of dependencies that automatically propagate changes.

## Part 4: Implementing Effects

Effects are the third core primitive in our reactivity system. Unlike signals and computed values, effects are for running side effects (like updating the DOM) when dependencies change.

The key difference is:

- Computed values calculate and return a value
- Effects run side effects but don't return a value

### Implementing createEffect

```typescript
function createEffect(fn, options = {}) {
  // Create a node for our effect
  const node = createNode(undefined, options.name);
  
  // Set the computation function
  node.compute = fn;
  
  // Set the handler for when dependencies change
  node.onDirty = () => {
    runNode(node);  // Immediately run the effect when dependencies change
  };
  
  // Run the effect initially
  runNode(node);
  
  // Return a function to dispose the effect
  return () => {
    if (typeof node.cleanup === "function") {
      node.cleanup();
      node.cleanup = undefined;
    }
    cleanupSources(node);
  };
}
```

But there's a problem with this implementation: if multiple dependencies change in quick succession, our effect will run multiple times. Let's modify it to use a more efficient scheduling mechanism.

### Adding Efficient Scheduling

We'll use microtasks to batch effect executions:

```typescript
// Global state for tracking pending effects
let pendingEffects = new Set();
let pendingMicrotask = false;

function scheduleMicrotask() {
  if (!pendingMicrotask && pendingEffects.size > 0) {
    pendingMicrotask = true;
    queueMicrotask(() => {
      pendingMicrotask = false;
      const effects = Array.from(pendingEffects);
      pendingEffects.clear();
      for (const effect of effects) runNode(effect);
    });
  }
}

function createEffect(fn, options = {}) {
  const node = createNode(undefined, options.name);
  node.compute = fn;
  
  // Schedule the effect to run in a microtask when dependencies change
  node.onDirty = () => {
    pendingEffects.add(node);
    scheduleMicrotask();
  };
  
  // Run the effect initially
  runNode(node);
  
  return () => {
    if (typeof node.cleanup === "function") {
      node.cleanup();
      node.cleanup = undefined;
    }
    cleanupSources(node);
    pendingEffects.delete(node);
  };
}
```

### Using Effects

```typescript
// Create a signal
const count = createSignal(0);

// Create an effect that runs when count changes
const dispose = createEffect(() => {
  console.log(`Count is now: ${count()}`);
});

// Outputs: "Count is now: 0" (initial run)

// Update the signal
count.set(1);
// After microtask: "Count is now: 1"

// Dispose the effect when no longer needed
dispose();

// No more logs will appear when count changes
count.set(2);
```

### Exercise 4: Cleanup Functions

Effects often need to clean up after themselves, like removing event listeners. Let's modify our effect to support cleanup functions:

```typescript
function createEffect(fn, options = {}) {
  const node = createNode(undefined, options.name);
  
  // Set the computation function
  node.compute = () => {
    // The function can return a cleanup function
    return fn();
  };
  
  // ... rest of the implementation stays the same
}

// Using the cleanup function
const dispose = createEffect(() => {
  const button = document.querySelector('button');
  const handler = () => console.log('Button clicked');
  
  button.addEventListener('click', handler);
  
  // Return a cleanup function
  return () => {
    button.removeEventListener('click', handler);
  };
});
```

This ensures that when an effect reruns or is disposed, it cleans up properly.

## Part 5: Optimizing with Batching

Often, we need to update multiple signals at once. If we update them individually, effects will run after each update, which is inefficient. Let's implement batching to group updates.

### Implementing Batching

```typescript
let batchDepth = 0;

function startBatch() {
  batchDepth++;
}

function endBatch() {
  if (--batchDepth === 0) {
    scheduleMicrotask();
  }
}

function batch(fn) {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}
```

Now we need to modify our `createSignal` function to respect batching:

```typescript
function createSignal(initialValue, options = {}) {
  const node = createNode(initialValue, options.name);
  const equals = options.equals || deepEquals;
  
  const signal = function() {
    trackAccess(node);
    return node.value;
  };

  signal.set = function(newValue) {
    if (!equals(node.value, newValue)) {
      node.value = newValue;
      node.version++;
      
      // If we're in a batch, don't immediately run effects
      if (batchDepth > 0) {
        for (const observer of node.observers) {
          observer.dirty = true;
          if (observer.onDirty) {
            pendingEffects.add(observer);
          }
        }
      } else {
        notifyObservers(node);
      }
    }
  };
  
  // ... rest of the implementation remains the same
  
  return signal;
}
```

### Using Batching

```typescript
const count = createSignal(0);
const double = createSignal(0);

// This effect will run only once after the batch
createEffect(() => {
  console.log(`Count: ${count()}, Double: ${double()}`);
});

// Without batching, the effect would run twice
batch(() => {
  count.set(5);
  double.set(10);
});
// Effect runs once: "Count: 5, Double: 10"
```

### Exercise 5: Implementing createBatchedSignals

Let's create a utility to create multiple signals in a batch:

```typescript
function createBatchedSignals(initials, options = {}) {
  const result = {};
  const prefix = options.prefix || '';
  const equals = options.equals;

  startBatch();
  try {
    for (const key in initials) {
      if (Object.prototype.hasOwnProperty.call(initials, key)) {
        result[key] = createSignal(initials[key], {
          name: `${prefix}${key}`,
          equals
        });
      }
    }
  } finally {
    endBatch();
  }

  return result;
}
```

Usage:

```typescript
const { firstName, lastName, age } = createBatchedSignals({
  firstName: 'John',
  lastName: 'Doe',
  age: 30
}, { prefix: 'user.' });

// Now you have three signals: firstName, lastName, and age
```

## Part 6: Advanced Features

Now that we have the core primitives working, let's implement some advanced features to make our library more powerful and developer-friendly.

### Untrack: Reading Values Without Tracking

Sometimes we want to read a signal or computed value without creating a dependency. Let's implement an `untrack` function:

```typescript
function untrack(fn) {
  const prev = activeObserver;
  activeObserver = null;
  try {
    return fn();
  } finally {
    activeObserver = prev;
  }
}
```

Usage:

```typescript
const count = createSignal(0);

createEffect(() => {
  // This creates a dependency on count
  console.log(`Count: ${count()}`);
  
  // This reads count without creating a dependency
  const untracked = untrack(() => count());
  console.log(`Untracked count: ${untracked}`);
});

// When count changes, the effect will run, but only because of the first count() usage
```

### Memoization: Caching Computed Values

Let's implement a `createMemo` function that works like `createComputed` but only recalculates when its dependencies change:

```typescript
function createMemo(fn, options = {}) {
  const node = createNode(undefined, options.name);
  node.compute = fn;

  const memo = () => {
    updateIfNecessary(node);
    trackAccess(node);
    return node.value;
  };

  runNode(node);
  memo._node = node;

  return memo;
}
```

Usage:

```typescript
const count = createSignal(0);

// This will only recalculate when count changes
const expensiveCalculation = createMemo(() => {
  console.log('Calculating...');
  return count() * 10;
});

console.log(expensiveCalculation()); // Logs "Calculating..." and returns 0
console.log(expensiveCalculation()); // Just returns 0, no "Calculating..." log

count.set(5);
console.log(expensiveCalculation()); // Logs "Calculating..." and returns 50
```

### DOM Binding: Connecting to the UI

Let's create a simple way to bind signals to DOM elements:

```typescript
function ref(element, key, signalFn) {
  createEffect(() => {
    element[key] = signalFn();
  });
}
```

Usage:

```typescript
const count = createSignal(0);
const input = document.createElement('input');

// Bind the count signal to the input's value
ref(input, 'value', count);

// When the input changes, update the signal
input.addEventListener('input', () => {
  count.set(input.value);
});

document.body.appendChild(input);
```

### Disposal Scopes: Managing Resource Cleanup

Let's implement a `createScope` function to help manage cleanup of multiple effects:

```typescript
function createScope() {
  const disposers = [];

  return {
    run(fn) {
      const prev = activeObserver;
      activeObserver = {
        sources: new WeakMap(),
        observers: new Set(),
        cleanup: undefined,
        compute: undefined,
        dirty: false,
        error: undefined,
        id: nextId++,
        onDirty: undefined,
        version: 0,
        value: undefined,
      };
      const result = fn();
      cleanupSources(activeObserver);
      if (typeof activeObserver.cleanup === "function") {
        disposers.push(activeObserver.cleanup);
      }
      activeObserver = prev;
      return result;
    },
    
    dispose() {
      for (const d of disposers) {
        if (typeof d === "function") d();
      }
    },
  };
}
```

Usage:

```typescript
const scope = createScope();

// Run code within the scope
scope.run(() => {
  const count = createSignal(0);
  
  createEffect(() => {
    console.log(`Count: ${count()}`);
  });
});

// Later, dispose all effects created within the scope
scope.dispose();
```

### Async Effects: Handling Promises

Finally, let's create an effect that properly handles async functions:

```typescript
function createAsyncEffect(fn, options = {}) {
  let cleanupFn;
  const onCleanup = (cb) => {
    cleanupFn = cb;
  };

  createEffect(() => {
    if (cleanupFn) cleanupFn();
    cleanupFn = undefined;

    const result = fn(onCleanup);
    if (result instanceof Promise) {
      result.catch(console.error);
    }
  }, options);
}
```

Usage:

```typescript
const userId = createSignal(1);

createAsyncEffect(async (onCleanup) => {
  const controller = new AbortController();
  onCleanup(() => controller.abort());
  
  try {
    const response = await fetch(`https://api.example.com/users/${userId()}`, {
      signal: controller.signal
    });
    const data = await response.json();
    console.log(data);
  } catch (err) {
    if (!controller.signal.aborted) {
      console.error(err);
    }
  }
});
```

This ensures that if the `userId` changes while a fetch is in progress, the old fetch is aborted before a new one starts.

## Part 7: Developer Experience

Let's add some utilities to improve the developer experience when using our library.

### Named Signals for Better Debugging

We've already added a `name` option to our primitives, but let's make sure it's properly used in error messages:

```typescript
function createSignal(initialValue, options = {}) {
  const node = createNode(initialValue, options.name);
  // Rest of implementation...
  return signal;
}
```

### Peek Method for Reading Without Tracking

We've already added a `peek` method to signals, but let's make sure it's documented and used properly:

```typescript
signal.peek = function() {
  return node.value;
};
```

Usage:

```typescript
const count = createSignal(0);

// Read the value without creating a dependency
console.log(count.peek());

// This effect won't re-run when count changes
createEffect(() => {
  console.log(`Count (peek): ${count.peek()}`);
});
```

### Better Error Handling

Let's modify our `runNode` function to provide better error messages:

```typescript
function runNode(node) {
  // ... existing code ...
  
  try {
    // ... existing code ...
  } catch (err) {
    node.error = err;
    const name = node.name || `Node_${node.id}`;
    console.error(`Error in ${name}:`, err);
    
    // Add additional debugging info
    console.error(`Dependencies: ${Array.from(node.sources.keys()).map(s => s.name || `Node_${s.id}`).join(', ')}`);
  }
  
  // ... existing code ...
}
```

### Testing Utilities

Let's add some utilities to help test our reactive system:

```typescript
// Create a test harness for signals
function signalTestHarness(initialValue) {
  const reads = { count: 0 };
  const writes = { count: 0 };
  
  const signal = createSignal(initialValue);
  
  const wrappedSignal = function() {
    reads.count++;
    return signal();
  };
  
  wrappedSignal.set = function(value) {
    writes.count++;
    signal.set(value);
  };
  
  wrappedSignal.update = function(fn) {
    writes.count++;
    signal.update(fn);
  };
  
  wrappedSignal.reads = reads;
  wrappedSignal.writes = writes;
  
  return wrappedSignal;
}
```

Usage:

```typescript
const count = signalTestHarness(0);

console.log(count()); // reads.count = 1
console.log(count()); // reads.count = 2

count.set(5); // writes.count = 1

console.log(`Reads: ${count.reads.count}, Writes: ${count.writes.count}`);
```

## Part 8: Building a Mini UI Framework

Now that we have a robust reactivity system, let's build a simple UI framework on top of it. This will demonstrate how these concepts apply to real-world applications.

### The h Function: Creating Virtual DOM Elements

```typescript
function h(tag, props, ...children) {
  return { tag, props: props || {}, children: children.flat() };
}
```

### The render Function: Rendering Virtual DOM to the Real DOM

```typescript
function render(vnode, container) {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return container.appendChild(document.createTextNode(vnode));
  }

  if (typeof vnode === 'function') {
    // Handle reactive functions
    const placeholder = document.createTextNode('');
    container.appendChild(placeholder);
    
    createEffect(() => {
      const result = vnode();
      const newNode = typeof result === 'string' 
        ? document.createTextNode(result)
        : render(result, document.createElement('div'));
      
      placeholder.replaceWith(newNode);
      return () => newNode.remove();
    });
    
    return placeholder;
  }

  const element = document.createElement(vnode.tag);
  
  // Set attributes/props
  Object.entries(vnode.props || {}).forEach(([name, value]) => {
    if (name.startsWith('on')) {
      const eventName = name.slice(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else if (typeof value === 'function') {
      // Handle reactive props
      createEffect(() => {
        element.setAttribute(name, value());
      });
    } else {
      element.setAttribute(name, value);
    }
  });
  
  // Append children
  (vnode.children || []).forEach(child => render(child, element));
