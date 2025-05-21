<!-- eslint-disable markdown/fenced-code-language -->

# 🚀 Building a Fine-Grained Reactivity System: A Complete Guide

> **Course Guide: Understanding and Building signals.js**
>
> This comprehensive guide takes you from fundamentals to mastery in building a reactive programming system. Perfect for developers looking to understand how modern reactive libraries work under the hood.

## Table of Contents

- 🚀 Building a Fine-Grained Reactivity System: A Complete Guide
  - Table of Contents
  - 🌟 1. Introduction: The Power of Reactivity
    - 1.1 What is Reactivity?
    - 1.2 Fine-Grained vs. Coarse-Grained Reactivity
    - 1.3 Real-World Analogy: The Office Supply Chain
  - 🧩 2. System Architecture Overview
    - 2.1 Core Components
    - 2.2 How They Work Together
  - 🧱 3. Building the Foundation: Data Structures
    - 3.1 The Node Type Constants
    - 3.2 The Reactive Node
    - 3.3 The Scope
    - 3.4 Global State
  - ⚙️ 4. Creating Our First Signal
    - 4.1 The Anatomy of a Signal
    - 4.2 Creating the Node
    - 4.3 Building the Signal Interface
    - 4.4 Adding Debug Support
    - 4.5 Automatic Cleanup
  - 🔄 5. Tracking Dependencies
    - 5.1 How Tracking Works
    - 5.2 Implementing `trackAccess`
    - 5.3 Reading Without Tracking: `untrack`
  - 📢 6. Notifying Observers
    - 6.1 The Notification Process
    - 6.2 Implementing `notifyObservers`
    - 6.3 Scheduling Updates
  - 👁️ 7. Effects: Reacting to Changes
    - 7.1 What is an Effect?
    - 7.2 The Execution Flow
    - 7.3 Implementing `$effect`
    - 7.4 Managing Execution and Cleanup
  - 🧠 8. Memos: Cached Computations
    - 8.1 What is a Memo?
    - 8.2 The Update Process
    - 8.3 Implementing `$memo`
  - 🌐 9. Scopes: Managing Reactive Lifecycles
    - 9.1 What are Scopes?
    - 9.2 Creating a Scope
    - 9.3 Disposing a Scope
    - 9.4 Registering Cleanups
  - 📦 10. Batching: Optimizing Updates
    - 10.1 Why Batch Updates?
    - 10.2 Implementing `batchSignals`
  - 🌍 11. The Context System
    - 11.1 What are Contexts?
    - 11.2 Creating a Context
    - 11.3 Using Contexts
    - 11.4 Selecting from Contexts
  - 🔍 12. Advanced Topics and Edge Cases
    - 12.1 Cycle Detection
    - 12.2 Error Handling
    - 12.3 Custom Equality Checks
  - ⚡ 13. Performance Considerations
    - 13.1 Minimizing Recomputations
    - 13.2 Memory Usage
    - 13.3 Benchmarking
  - 🔨 14. Practical Applications
    - 14.1 Building UI Components
    - 14.2 State Management
    - 14.3 Animations and Transitions
  - 🏁 15. Conclusion

## 🌟 1. Introduction: The Power of Reactivity

### 1.1 What is Reactivity?

Reactivity is a programming paradigm that focuses on automatic updates when data changes. Instead of manually updating your UI or recalculating values when state changes, a reactive system handles these updates for you automatically.

```
Before Reactivity:
┌─────────────┐     Manual Update     ┌─────────────┐
│    Data     │──────────────────────▶│     UI      │
└─────────────┘                       └─────────────┘

With Reactivity:
┌─────────────┐     Automatic      ┌─────────────┐
│    Data     │◀───────────────────│  Observer   │
└─────────────┘                    └─────────────┘
       │                                  ▲
       │                                  │
       │                                  │
       └──────────────► Notify ───────────┘
                      Changes
```

### 1.2 Fine-Grained vs. Coarse-Grained Reactivity

There are two main approaches to reactivity:

**Coarse-Grained Reactivity** 🦣

- Updates entire chunks of your application
- Simpler to implement
- Examples: React's component re-rendering

**Fine-Grained Reactivity** 🔬

- Updates only the specific things that depend on changed data
- More efficient for complex applications
- Examples: SolidJS, Vue 3's reactivity system

Our implementation will focus on fine-grained reactivity, where we can track precisely what depends on what.

### 1.3 Real-World Analogy: The Office Supply Chain

Imagine an office where:

- 📊 **Signals** are like inventory counts for office supplies
- 👁️ **Effects** are like employees who need to be notified when supplies change
- 🧠 **Memos** are like inventory reports that depend on multiple supply counts
- 🌐 **Scopes** are like departments with their own supply management
- 📦 **Batching** is like grouping supply orders to save on shipping

When the paper count (**signal**) changes, the copy room staff (**effect**) is notified automatically. The monthly usage report (**memo**) recalculates only when the supplies it depends on change.

## 🧩 2. System Architecture Overview

### 2.1 Core Components

Our reactivity system consists of these primary building blocks:

```
┌─────────────────────────────────────────────────────────────┐
│                     Reactivity System                        │
├─────────────┬─────────────┬────────────┬──────────┬─────────┤
│   Signals   │   Effects   │   Memos    │  Scopes  │ Context │
│   (Data)    │  (Actions)  │ (Derived)  │(Lifecycle)│(Shared) │
└─────────────┴─────────────┴────────────┴──────────┴─────────┘
```

🎯 **Signals**: Reactive state containers that notify observers when changed  
👁️ **Effects**: Side effects that run automatically when their dependencies change  
🧠 **Memos**: Cached computations that update only when dependencies change  
🌐 **Scopes**: Manage the lifecycle of reactive resources  
🌍 **Contexts**: Share values through a reactive tree without prop drilling  

### 2.2 How They Work Together

Here's a simple flow diagram showing how our components interact:

```
               ┌──────────────┐
               │    Scope     │
               │(owns & cleans)│
               └──────────────┘
                      │
                      ▼
┌─────────┐  depends  ┌─────────┐  depends  ┌─────────┐
│ Effect  │◀──────────│  Signal │───────────▶│  Memo   │
│(side    │  notifies │ (state) │  notifies │(derived │
│ effect) │◀──────────│         │───────────▶│ value)  │
└─────────┘           └─────────┘           └─────────┘
                          ▲
                          │
                     ┌────┴─────┐
                     │   User   │
                     │  Updates │
                     └──────────┘
```

1. **Signals** hold reactive state
2. **Effects** and **Memos** track their dependencies during execution
3. When a **Signal** changes, it notifies its observers
4. **Effects** re-run and **Memos** recalculate when notified
5. **Scopes** manage the lifecycle, cleaning up when done
6. **Contexts** propagate values through the scope hierarchy

## 🧱 3. Building the Foundation: Data Structures

### 3.1 The Node Type Constants

We'll start by defining constants to identify different types of reactive nodes:

```javascript
/**
 * Node type constants that identify the role of each reactive node
 * @type {Object.<string, number>}
 */
const NODE_TYPE = {
  /** Primitive value container that can notify observers */
  SIGNAL: 0,
  /** Side effect with automatic dependency tracking */
  EFFECT: 1,
  /** Cached computation with dependency tracking */
  MEMO: 2,
};
```

### 3.2 The Reactive Node

The `ReactiveNode` is our core data structure. It represents any reactive entity in our system (signal, effect, or memo):

```javascript
/**
 * @template TValue
 * @typedef {object} ReactiveNode
 * @property {number} id - Unique identifier
 * @property {number} version - Incremented on each value change to detect staleness
 * @property {Map<ReactiveNode<any>, number>} sources - Dependencies mapped to the version when last accessed
 * @property {Set<ReactiveNode<any>>} observers - Reactive nodes that depend on this one
 * @property {() => TValue} [compute] - Function to recalculate value (for memos/effects)
 * @property {TValue} value - Current cached value
 * @property {(() => void) | void} [cleanup] - Function to clean up resources between executions
 * @property {() => void} [onDirty] - Custom handler for when node becomes dirty
 * @property {boolean} [dirty] - Whether the node needs recomputation
 * @property {any} [error] - Last error during computation if any
 * @property {string} [name] - Name for debugging and cycle detection
 * @property {(typeof NODE_TYPE)[keyof typeof NODE_TYPE]} type - Type of node (SIGNAL, EFFECT, MEMO)
 * @property {((a: TValue, b: TValue) => boolean) | undefined} [equals] - Custom equality function
 * @property {Scope} scopeRef - Reference to the owning scope for cleanup
 */
```

Think of each `ReactiveNode` as having these key parts:

- 🔑 **Identity**: `id`, `type`, and `name` help identify the node
- 📊 **Value management**: `value`, `version`, and `compute` handle the node's data
- 🔗 **Dependency tracking**: `sources` (what this node depends on) and `observers` (what depends on this node)
- 🧹 **Lifecycle**: `cleanup`, `dirty`, and `error` help manage execution and cleanup
- 🔄 **Update control**: `equals` and `onDirty` customize update behavior

### 3.3 The Scope

The `Scope` manages the lifecycle of reactive nodes:

```javascript
/**
 * @typedef {object} Scope
 * @property {number} id - Unique identifier for the scope
 * @property {string} [name] - Optional name for debugging and tracing
 * @property {number} depth - Nesting level of the scope in the tree
 * @property {number} nextSignalId - Counter for generating unique signal IDs
 * @property {number} batchDepth - Current batch operation depth to defer updates
 * @property {ReactiveNode<any> | null} activeObserver - Currently executing node that tracks dependencies
 * @property {Set<ReactiveNode<any>>} pendingEffects - Effects waiting to be executed
 * @property {Set<ReactiveNode<any>>} nodes - All nodes owned by this scope
 * @property {boolean} pendingMicrotask - Whether a microtask is scheduled for batch updates
 * @property {Scope[]} nextScopes - Child scopes for hierarchical cleanup
 * @property {Scope | null} prevScope - Parent scope for hierarchical navigation
 * @property {(() => void)[]} cleanups - Cleanup functions to run on scope disposal
 * @property {Map<symbol, SignalValue<any>>} contexts - Context values available in this scope
 */
```

Visualize a scope like this:

```
┌─────────────────────── Scope ────────────────────────┐
│                                                      │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐             │
│  │ Signal  │   │ Effect  │   │  Memo   │ ◀── nodes   │
│  └─────────┘   └─────────┘   └─────────┘             │
│                                                      │
│  ┌─────────┐                                         │
│  │ Cleanup │ ◀── cleanup functions                   │
│  │Functions│                                         │
│  └─────────┘                                         │
│                                                      │
│  ┌─────────┐                                         │
│  │ Child   │ ◀── nextScopes                          │
│  │ Scopes  │                                         │
│  └─────────┘                                         │
│                                                      │
│  ┌─────────┐                                         │
│  │Context  │ ◀── shared values                       │
│  │ Values  │                                         │
│  └─────────┘                                         │
└──────────────────────────────────────────────────────┘
```

### 3.4 Global State

We need a few global variables to manage the current state:

```javascript
// Global state
let nextScopeId = 0;

/** @type {Scope} */
let currentScope = {
  id: nextScopeId++,
  depth: 0,
  nextSignalId: 0,
  batchDepth: 0,
  activeObserver: null,
  pendingEffects: new Set(),
  pendingMicrotask: false,
  nextScopes: [],
  prevScope: null,
  nodes: new Set(),
  cleanups: [],
  name: "root",
  contexts: new Map(),
};

const rootScope = currentScope;
```

The `currentScope` is crucial - it tracks the scope we're currently executing in and enables automatic dependency tracking.

## ⚙️ 4. Creating Our First Signal

### 4.1 The Anatomy of a Signal

A signal is both a function and an object:

```
┌──────────── Signal ────────────┐
│                                │
│  ┌───────┐                     │
│  │getter │ signal() → value    │
│  └───────┘                     │
│                                │
│  ┌───────┐                     │
│  │ set   │ signal.set(newValue)│
│  └───────┘                     │
│                                │
│  ┌───────┐                     │
│  │update │ signal.update(fn)   │
│  └───────┘                     │
│                                │
│  ┌───────┐                     │
│  │ peek  │ signal.peek()       │
│  └───────┘                     │
└────────────────────────────────┘
```

When called as a function, it returns the current value and establishes a dependency.

### 4.2 Creating the Node

First, we need a helper to create reactive nodes:

```javascript
/**
 * 🧱 Creates a new reactive node
 */
function createNode(val, options) {
  /** @type {ReactiveNode<TValue>} */
  const node = {
    id: currentScope.nextSignalId++,
    version: 0,
    value: val,
    compute: undefined,
    cleanup: undefined,
    error: undefined,
    dirty: false,
    onDirty: undefined,
    sources: new Map(),
    observers: new Set(),
    scopeRef: currentScope,
    ...options,
  };

  // Register with current scope for lifecycle management
  currentScope.nodes.add(node);

  return node;
}
```

### 4.3 Building the Signal Interface

Now we can implement the `$signal` function:

```javascript
// Default equality function for value comparison
const defaultEquals = Object.is;

/**
 * 🌱 Creates a reactive signal
 */
function $signal(initialValue, options) {
  const node = createNode(initialValue, {
    name: options?.name,
    type: NODE_TYPE.SIGNAL,
    equals: options?.equals,
  });

  /** @type {SignalValue<TValue>} */
  const signal = Object.assign(
    // Getter function - called when signal is invoked as a function
    () => {
      trackAccess(node);
      return node.value;
    },
    {
      /** @param {TValue} newValue */
      set: (newValue) => {
        // Skip update if value hasn't changed according to equals function
        if ((node.equals ?? defaultEquals)(node.value, newValue)) {
          return;
        }

        node.value = newValue;
        node.version++;
        notifyObservers(node);
      },
      /** @param {(value: TValue) => TValue} fn */
      update: (fn) => signal.set(fn(node.value)),
      peek: () => node.value,
      [SIGNAL]: node,
    },
  );

  // Register automatic cleanup when scope is disposed
  onScopeCleanup(() => disposeNode(node));

  return signal;
}
```

Key parts of this implementation:

1. We create a reactive node with the initial value
2. We create a function that, when called, tracks access and returns the value
3. We attach methods to this function: `set`, `update`, and `peek`
4. We register a cleanup function to dispose the node when its scope is disposed

### 4.4 Adding Debug Support

In development mode, we add debug information for easier troubleshooting:

```javascript
// Add debug information in development
if (process.env.NODE_ENV !== "production") {
  signal._debug = {
    node,
    peek: () => node.value,
    dirty: () => node.dirty,
    id: node.id,
    name: node.name,
    createdAt: new Error().stack,
  };
}
```

### 4.5 Automatic Cleanup

We ensure signals clean up properly by registering with the current scope:

```javascript
// Register automatic cleanup when scope is disposed
onScopeCleanup(() => disposeNode(node));
```

## 🔄 5. Tracking Dependencies

### 5.1 How Tracking Works

Dependency tracking is the magic behind reactivity. Here's the basic flow:

```
┌─────────────┐     reads      ┌───────────────┐
│   Effect    │────────────────▶   Signal      │
│ (Observer)  │                │ (Dependency)  │
└─────────────┘                └───────────────┘
       │                              │
       │                              │
       │                              ▼
       │                       ┌────────────┐
       │                       │  Register  │
       │                       │  Observer  │
       │                       └────────────┘
       │                              │
       │                              │
       ▼                              ▼
┌──────────────────────────────────────────────┐
│  When Signal changes → Notify Observer       │
└──────────────────────────────────────────────┘
```

When executing a reactive computation (effect or memo):

1. We set `currentScope.activeObserver` to the current computation
2. During execution, when a signal is read, it registers the active observer
3. This creates a dependency relationship: signal → observer
4. Later, when the signal changes, it notifies all registered observers

### 5.2 Implementing `trackAccess`

```javascript
/**
 * 🧭 Tracks access to a reactive node
 */
function trackAccess(sourceNode) {
  // Development check for accessing disposed nodes
  if (
    process.env.NODE_ENV !== "production" &&
    sourceNode.compute === undefined &&
    sourceNode.type !== NODE_TYPE.SIGNAL
  ) {
    console.warn(
      `⚠️ Attempted to read a disposed signal or memo: ${
        sourceNode.name ?? `Node_${sourceNode.id}`
      }`,
    );
  }

  // Only track if there's an active observer
  if (currentScope.activeObserver) {
    // Development check for excessive dependencies
    if (
      process.env.NODE_ENV !== "production" &&
      currentScope.activeObserver.sources.size >= MAX_DEPENDENCIES
    ) {
      console.warn(
        `Node ${
          currentScope.activeObserver.name ?? currentScope.activeObserver.id
        } has reached max dependencies`,
      );
      return;
    }

    // Prevent duplicate tracking of the same source
    if (!currentScope.activeObserver.sources.has(sourceNode)) {
      // Record the current version seen by the observer
      currentScope.activeObserver.sources.set(sourceNode, sourceNode.version);
      // Add observer to source's observers for notifications
      sourceNode.observers.add(currentScope.activeObserver);
    }
  }
}
```

The `trackAccess` function is called whenever a signal or memo's value is accessed. If there's an active observer (an effect or memo that's currently running), it establishes the dependency relationship.

### 5.3 Reading Without Tracking: `untrack`

Sometimes we want to read a signal's value without creating a dependency:

```javascript
/**
 * 🛑 Reads a value without tracking dependencies
 */
function untrack(fn) {
  const prevObserver = currentScope.activeObserver;
  currentScope.activeObserver = null;
  try {
    return fn();
  } finally {
    currentScope.activeObserver = prevObserver;
  }
}
```

This is useful when you want to:

- Read a value for debugging
- Conditionally depend on a signal
- Avoid creating circular dependencies

## 📢 6. Notifying Observers

### 6.1 The Notification Process

When a signal's value changes, it needs to notify all its dependents:

```
┌─────────────┐    Changes    ┌─────────────────────────────┐
│   Signal    │─────────────▶│ Mark observers as dirty     │
└─────────────┘              └─────────────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────────┐
                              │ Add effects to pending queue│
                              └─────────────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────────┐
                              │ Schedule microtask for flush│
                              └─────────────────────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────────┐
                              │ Execute pending effects     │
                              └─────────────────────────────┘
```

### 6.2 Implementing `notifyObservers`

```javascript
/**
 * 📣 Notifies observers when a node's value changes
 */
function notifyObservers(node) {
  // Development logging
  if (process.env.NODE_ENV !== "production") {
    console.log(`📣 notifyObservers: ${node.name ?? `Node_${node.id}`}`);
  }

  // Make a copy to avoid issues if the set changes during iteration
  const observers = Array.from(node.observers);

  for (const observer of observers) {
    if (!observer.dirty) {
      // Mark as dirty to prevent redundant notifications
      observer.dirty = true;

      // Use custom notification strategy if available
      if (observer.onDirty) {
        observer.onDirty();
      } else {
        // Default strategy: add to pending effects and schedule if not batching
        currentScope.pendingEffects.add(observer);
        if (currentScope.batchDepth === 0) {
          scheduleMicrotask();
        }
      }
    }
  }
}
```

Key points:

1. We make a copy of the observers to avoid issues if the set changes during iteration
2. We check if the observer is already marked as dirty to avoid redundant notifications
3. If the observer has a custom `onDirty` handler, we use that
4. Otherwise, we add it to the pending effects queue and schedule a microtask if not batching

### 6.3 Scheduling Updates

We use microtasks to batch updates efficiently:

```javascript
/**
 * ⏳ Schedules processing of pending effects
 */
function scheduleMicrotask() {
  // Skip if already scheduled or nothing to do
  if (currentScope.pendingMicrotask || currentScope.pendingEffects.size === 0) {
    return;
  }

  currentScope.pendingMicrotask = true;
  queueMicrotask(() => {
    // Skip if scope was disposed while waiting
    if (!currentScope.prevScope && currentScope.id !== rootScope.id) {
      return;
    }
    currentScope.pendingMicrotask = false;

    // Process all scopes recursively for complete update propagation
    flushPendingEffects(currentScope);
  });
}

/**
 * 🧹 Recursively flushes pending effects
 */
function flushPendingEffects(scope) {
  // First, run all pending effects in this scope
  for (const effect of scope.pendingEffects) {
    runNode(effect);
  }
  scope.pendingEffects.clear();

  // Then recursively process child scopes
  for (const child of scope.nextScopes) {
    flushPendingEffects(child);
  }
}
```

By using microtasks, we ensure that:

1. Updates are batched efficiently
2. The DOM has a chance to update before the next animation frame
3. Multiple signal changes don't trigger redundant effect executions

## 👁️ 7. Effects: Reacting to Changes

### 7.1 What is an Effect?

An effect is a side-effect that automatically runs when its dependencies change. It's perfect for:

- Updating the DOM
- Making API calls
- Logging
- Syncing with external systems

```
┌─────────────┐
│ Observable  │
│   Data      │
└─────────────┘
       │
       ▼
┌─────────────┐
│   Effect    │  When data changes
│  Function   │  effect reruns automatically
└─────────────┘
       │
       ▼
┌─────────────┐
│  Side       │
│  Effect     │  (DOM updates, API calls, etc.)
└─────────────┘
```

### 7.2 The Execution Flow

When an effect runs:

1. It cleans up any resources from the previous execution
2. It marks itself as the active observer
3. It executes its function, automatically tracking dependencies
4. It registers itself as an observer of any signals/memos it accessed
5. Later, when those dependencies change, the process repeats

### 7.3 Implementing `$effect`

```javascript
/**
 * 👁️ Creates an effect
 */
function $effect(fn, options) {
  const node = createNode(/** @type {TValue} */ (undefined), {
    name: options?.name,
    type: NODE_TYPE.EFFECT,
    equals: options?.equals,
  });
  node.compute = fn;

  // Custom scheduling strategy for this effect
  node.onDirty = () => {
    node.onDirty = undefined; // Reset to prevent reentrance
    if (currentScope.batchDepth > 0) {
      currentScope.pendingEffects.add(node);
    } else {
      currentScope.pendingEffects.add(node);
      scheduleMicrotask();
    }
  };

  // Initial run
  runNode(node);

  // Create disposal function
  const dispose = () => {
    // Clean up the effect
    if (node.cleanup) {
      node.cleanup();
      node.cleanup = undefined;
    }

    // Remove from dependency graph
    cleanupSources(node);

    // Remove from pending effects
    currentScope.pendingEffects.delete(node);

    // Remove compute function to mark as disposed
    node.compute = undefined;
  };

  // Register automatic cleanup when scope is disposed
  onScopeCleanup(() => dispose());

  return dispose;
}
```

Key points:

1. We create a node of type `EFFECT`
2. We set up a custom `onDirty` handler to schedule re-execution
3. We run the effect immediately to establish initial dependencies
4. We create and return a disposal function that cleans up the effect
5. We register automatic cleanup with the current scope

### 7.4 Managing Execution and Cleanup

The `runNode` function handles the actual execution of effects and memos:

```javascript
/**
 * 🔁 Executes a node's computation
 */
function runNode(node) {
  // Skip if node was disposed
  if (!node.compute) return false;

  // Detect circular dependencies
  if (computationStack.has(node)) {
    // Handle circular dependency (code omitted for brevity)
    return false;
  }

  // Add to computation stack to track cycles
  computationStack.add(node);

  // Clean up previous dependencies before recomputing
  const prevCleanup = node.cleanup;
  cleanupSources(node);

  // Set up for dependency tracking
  const prevObserver = currentScope.activeObserver;
  currentScope.activeObserver = node;

  try {
    // Run previous cleanup if any
    prevCleanup?.();
    node.cleanup = undefined;

    // Compute new value
    const newValue = node.compute();

    // Determine if value has changed
    const valueChanged = !(node.equals ?? defaultEquals)(node.value, newValue);

    // For effect nodes, store result but don't notify (they're terminal)
    if (node.type === NODE_TYPE.EFFECT) {
      node.value = newValue;
    }
    // For computed/memo nodes, update and notify if changed
    else if (valueChanged) {
      node.value = newValue;
      node.version++;
      notifyObservers(node);
    }

    node.dirty = false;
    node.error = undefined;
    return valueChanged;
  } catch (error) {
    // Error handling omitted for brevity
    return false;
  } finally {
    // Always clean up, even if an error occurred
    computationStack.delete(node);
    currentScope.activeObserver = prevObserver;
  }
}
```

This function is the heart of our reactive system, handling:

1. Circular dependency detection
2. Cleanup of previous executions
3. Dependency tracking during execution
4. Value change detection
5. Observer notification
6. Error handling

## 🧠 8. Memos: Cached Computations

### 8.1 What is a Memo?

A memo is a cached computation that automatically updates when its dependencies change. It's perfect for:

- Derived data
- Expensive calculations
- Computed properties

```
┌──────────────┐            ┌──────────────┐
│  Dependency  │────────────▶  Memo        │
│  Signals     │   changes  │  Computation │
└──────────────┘            └──────────────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │  Cached      │
                            │  Result      │
                            └──────────────┘
                                   ▲
                                   │
                            ┌──────────────┐
                            │   Memo       │
                            │   Consumers  │
                            └──────────────┘
```

### 8.2 The Update Process

When a memo is accessed:

1. It checks if it's dirty (if dependencies have changed)
2. If dirty, it reruns its computation
3. If not dirty, it returns the cached value
4. It establishes a dependency relationship with the accessor

### 8.3 Implementing `$memo`

```javascript
/**
 * 🔁 Updates a node if it's marked as dirty
 */
function updateIfNecessary(node) {
  if (!node.compute || !node.dirty) return false;
  return runNode(node);
}

/**
 * 🔁 Creates a memoized value
 */
function $memo(fn, options) {
  const node = createNode(/** @type {TValue} */ (undefined), {
    name: options?.name,
    type: NODE_TYPE.MEMO,
    equals: options?.equals,
  });
  node.compute = fn;

  /**
   * Create memo function that acts like a signal getter
   * @type {MemoValue<TValue>}
   */
  const memo = Object.assign(
    () => {
      trackAccess(node);
      updateIfNecessary(node);
      return node.value;
    },
    {
      peek: () => node.value,
      [SIGNAL]: node,
    },
  );

  // Initial computation
  runNode(node);

  // Register automatic cleanup when scope is disposed
  onScopeCleanup(() => disposeNode(node));

  return memo;
}
```

Key points:

1. We create a node of type `MEMO`
2. We create a function that, when called:
   - Tracks access to establish dependencies
   - Updates the value if necessary
   - Returns the current value
3. We run the memo immediately to compute its initial value
4. We register cleanup with the current scope

## 🌐 9. Scopes: Managing Reactive Lifecycles

### 9.1 What are Scopes?

Scopes are hierarchical containers for reactive resources:

```
┌─────────────── Root Scope ────────────────┐
│                                           │
│  ┌─────────────┐     ┌─────────────┐      │
│  │  Signal A   │     │  Effect X   │      │
│  └─────────────┘     └─────────────┘      │
│                                           │
│  ┌─────────── Child Scope 1 ───────────┐  │
│  │                                     │  │
│  │  ┌─────────────┐                    │  │
│  │  │  Signal B   │                    │  │
│  │  └─────────────┘                    │  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────── Child Scope 2 ───────────┐  │
│  │                                     │  │
│  │  ┌─────────────┐  ┌─────────────┐   │  │
│  │  │  Signal C   │  │  Effect Y   │   │  │
│  │  └─────────────┘  └─────────────┘   │  │
│  │                                     │  │
│  └─────────────────────────────────────┘  │
│                                           │
└───────────────────────────────────────────┘
```

Benefits of scopes:

- Automatic cleanup when components unmount
- Hierarchical organization of reactive resources
- Context propagation through the tree
- Isolation of reactive systems

### 9.2 Creating a Scope

```javascript
/**
 * 🧱 Creates a new reactive scope
 */
function createScope(fn, options) {
  const parentScope = currentScope;

  /** @type {Scope} */
  const newScope = {
    id: nextScopeId++,
    name: options?.name,
    depth: parentScope.depth + 1,
    nextSignalId: 0,
    batchDepth: 0,
    activeObserver: null,
    pendingEffects: new Set(),
    nodes: new Set(),
    pendingMicrotask: false,
    nextScopes: [],
    prevScope: options?.detached ? null : parentScope,
    cleanups: [],
    contexts: new Map(),
  };

  // Add to parent's child scopes for later cleanup
  if (!options?.detached) {
    parentScope.nextScopes.push(newScope);
  }

  // Make this the active scope for reactive operations
  currentScope = newScope;

  /** @type {any} */
  let result;
  try {
    if (options?.deferredProviders) {
      // Context provider handling (omitted for brevity)
    } else {
      // No context providers, execute the function directly
      result = fn();
    }
  } finally {
    // Always restore the parent scope, even if an error occurred
    currentScope = parentScope;
  }

  return {
    result,
    dispose: () => {
      disposeScope(newScope);
    },
  };
}
```

Key points:

1. We create a new scope with its own identity and state
2. We link it to the parent scope (unless detached)
3. We make it the active scope during function execution
4. We restore the parent scope when done, even if errors occur
5. We return both the result and a disposal function

### 9.3 Disposing a Scope

```javascript
/**
 * 🧹 Disposes a scope and all its resources
 */
function disposeScope(scope) {
  // Recursively dispose child scopes first
  for (const child of scope.nextScopes) {
    disposeScope(child);
  }
  scope.nextScopes = [];

  // Dispose all nodes owned by this scope
  for (const node of scope.nodes) {
    disposeNode(node);
  }

  // Clear context values
  scope.contexts.clear();

  // Clear all state
  scope.nodes.clear();
  scope.pendingEffects.clear();
  scope.pendingMicrotask = false;

  // Run cleanup functions registered with onScopeCleanup
  scope.cleanups.forEach((cleanup) => cleanup());
  scope.cleanups = [];

  // Remove from parent scope's children
  if (scope.prevScope) {
    scope.prevScope.nextScopes = scope.prevScope.nextScopes.filter(
      (s) => s.id !== scope.id,
    );
  }
  scope.prevScope = null;
}
```

Key points:

1. We dispose child scopes first (bottom-up cleanup)
2. We dispose all reactive nodes owned by this scope
3. We clear contexts and state
4. We run registered cleanup functions
5. We remove the scope from its parent's children

### 9.4 Registering Cleanups

```javascript
/**
 * 🧹 Registers a function to run when scope is disposed
 */
function onScopeCleanup(fn) {
  if (currentScope?.cleanups) {
    currentScope.cleanups.push(fn);
  } else {
    console.warn(
      "⚠️ Attempted to register a cleanup function outside of a scope.",
    );
    throw new Error("No active scope for cleanup registration.");
  }
}
```

This simple function adds a cleanup callback to the current scope. When the scope is disposed, all cleanup functions are called, releasing resources.

## 📦 10. Batching: Optimizing Updates

### 10.1 Why Batch Updates?

Batching allows multiple signal updates to happen without triggering effects immediately:

```
Without Batching:
┌─────────┐     ┌──────────┐     ┌──────────┐
│Signal A │────▶│ Update   │────▶│  Effect  │
└─────────┘     │ Effects  │     │  Runs    │
                └──────────┘     └──────────┘
                      ▲
┌─────────┐          │
│Signal B │──────────┘
└─────────┘
               (2 effect runs)

With Batching:
┌─────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│Signal A │────▶│           │     │ Batch    │────▶│  Effect  │
└─────────┘     │ Queue     │────▶│ Complete │     │  Runs    │
                │ Updates   │     └──────────┘     └──────────┘
┌─────────┐     │           │
│Signal B │────▶│           │
└─────────┘     └───────────┘
                                  (1 effect run)
```

Benefits:

- Better performance with fewer re-renders
- Atomic updates to related signals
- Consistent view of state for effects

### 10.2 Implementing `batchSignals`

```javascript
/**
 * 📦 Batches multiple signal updates
 */
function batchSignals(fn) {
  currentScope.batchDepth++;
  try {
    return fn();
  } finally {
    currentScope.batchDepth--;
    if (currentScope.batchDepth === 0 && currentScope.pendingEffects.size > 0) {
      scheduleMicrotask();
    }
  }
}
```

This elegantly simple function:

1. Increments the `batchDepth` to defer effect execution
2. Runs the provided function
3. Decrements the `batchDepth` afterward
4. If we've returned to depth 0 (all batches complete) and have pending effects, schedules them

## 🌍 11. The Context System

### 11.1 What are Contexts?

Contexts allow passing values down through nested scopes without prop drilling:

```
┌────────────────────────────────────────┐
│  App Scope                             │
│  ┌─────────────────────────────────┐   │
│  │  Theme Context = "dark"         │   │
│  │                                 │   │
│  │  ┌───────────────────────────┐  │   │
│  │  │  Section Scope            │  │   │
│  │  │                           │  │   │
│  │  │  ┌───────────────────┐    │  │   │
│  │  │  │ Component Scope   │    │  │   │
│  │  │  │                   │    │  │   │
│  │  │  │ Read Theme="dark" │    │  │   │
│  │  │  └───────────────────┘    │  │   │
│  │  └───────────────────────────┘  │   │
│  └─────────────────────────────────┘   │
└────────────────────────────────────────┘
```

Contexts are perfect for:

- Theme data
- User authentication
- Localization
- Application configuration
- Form state

### 11.2 Creating a Context

```javascript
/**
 * 🌳 Creates a context for passing values down the scope tree
 */
function createContext(defaultValue, options) {
  const id = Symbol(options?.name ?? "context");
  const context = {
    id,
    defaultValue,
    Provider: (valueOrSignal, fn) => {
      const value = isSignal(valueOrSignal)
        ? valueOrSignal
        : $signal(valueOrSignal);
      return provideContext(id, value, fn);
    },
    DeferredProvider: (valueOrSignal) => (fn) => {
      const value = isSignal(valueOrSignal)
        ? valueOrSignal
        : $signal(valueOrSignal);
      return provideContext(id, value, fn);
    },
  };

  return context;
}
```

Key points:

1. Each context has a unique symbol identifier
2. A default value is provided for when no provider is found
3. The `Provider` function sets up the context for a subtree
4. The `DeferredProvider` creates a partial function for composition

### 11.3 Using Contexts

```javascript
/**
 * 🔍 Gets a context value from the current scope or ancestors
 */
function getContext(context) {
  const id = context.id;
  const defaultValue = context.defaultValue;

  // Walk up the scope chain to find the context
  /** @type {Scope|null} */
  let scope = currentScope;
  while (scope) {
    if (scope.contexts.has(id)) {
      return /** @type {SignalValue<any>} */ (scope.contexts.get(id));
    }
    scope = scope.prevScope;

    // Development warnings (omitted for brevity)
  }

  // Return default if no provider found, wrapping in signal if needed
  return /** @type {SignalValue<TValue>}*/ (
    isSignal(defaultValue) ? defaultValue : $signal(defaultValue)
  );
}
```

This function walks up the scope tree from the current scope, looking for a context with the specified ID. If not found, it returns the default value (wrapped in a signal if needed).

### 11.4 Selecting from Contexts

For efficiency, we can create selectors that only update when a specific part of a context changes:

```javascript
/**
 * 🔍 Gets a derived value from a context
 */
function getContextSelector(context, selector) {
  const value = getContext(context);
  return $memo(() => selector(value()));
}
```

This is useful for large contexts where you only need a small part, avoiding unnecessary updates.

## 🔍 12. Advanced Topics and Edge Cases

### 12.1 Cycle Detection

Our system includes cycle detection to prevent infinite loops:

```javascript
/**
 * Stack to track computation nesting for cycle detection
 * @type {Set<ReactiveNode<any>>}
 */
const computationStack = new Set();

// In runNode:
if (computationStack.has(node)) {
  let cycle = "";
  for (const n of computationStack) {
    cycle += `${n.name ?? `Node_${n.id}`}${n === node ? " (cycle)" : ""} → `;
  }
  cycle += node.name ?? `Node_${node.id}`;

  const error = new Error(`⚠️ Cycle reference detected: ${cycle}`);
  console.warn(error);
  node.error = error;
  node.dirty = false;
  
  // Clean up incomplete dependencies to prevent further issues
  cleanupSources(node);
  return false;
}
```

By maintaining a computation stack, we can detect when a node tries to access itself during computation.

### 12.2 Error Handling

We handle errors gracefully to prevent the whole system from crashing:

```javascript
try {
  // Compute new value
  const newValue = node.compute();
  // Rest of normal execution...
} catch (error) {
  // Handle errors during computation
  node.error = error;
  node.dirty = false; // Prevent continuous retries on error
  console.warn(
    `⚠️ Error in reactive computation${node.name ? ` (${node.name})` : ""}:`,
    error,
  );
  return false;
}
```

### 12.3 Custom Equality Checks

Our system supports custom equality checks for more control over updates:

```javascript
/**
 * @template TValue
 * @typedef {object} SignalOptions
 * @property {((a: TValue, b: TValue) => boolean) | undefined} [equals] - Custom equality check
 * @property {string | undefined} [name] - Name for debugging
 */

// In signal's set method:
set: (newValue) => {
  // Skip update if value hasn't changed according to equals function
  if ((node.equals ?? defaultEquals)(node.value, newValue)) {
    return;
  }
  
  // Continue with update...
}
```

This allows for deep equality checks, reference equality, or custom comparison logic.

## ⚡ 13. Performance Considerations

### 13.1 Minimizing Recomputations

Our system has several optimizations to minimize recomputations:

```
1. Value comparison     - Updates only happen when values actually change
2. Batching             - Multiple updates can be batched together
3. Dirty flag tracking  - Prevents redundant notifications
4. Microtask scheduling - Ensures efficient batching of effects
5. Memoization          - Caches computed values when dependencies haven't changed
```

### 13.2 Memory Usage

Memory management is crucial for performance:

```
1. Automatic cleanup      - Resources are released when scopes are disposed
2. Dependency cleanup     - Old dependencies are removed before recomputation
3. Efficient data structs - Maps and Sets for O(1) lookups
4. Scope hierarchy        - Allows for tree-based cleanup
```

### 13.3 Benchmarking

For serious applications, consider benchmarking:

```javascript
// Simple benchmark helper
function benchmark(name, fn) {
  console.time(name);
  const result = fn();
  console.timeEnd(name);
  return result;
}

// Example:
benchmark("Creating 1000 signals", () => {
  for (let i = 0; i < 1000; i++) {
    $signal(i);
  }
});
```

## 🔨 14. Practical Applications

### 14.1 Building UI Components

Our reactivity system shines for UI components:

```javascript
function Counter({ initialCount = 0 }) {
  const count = $signal(initialCount);
  const doubled = $memo(() => count() * 2);
  
  // DOM updates automatically when count changes
  return t.div(
    { className: "counter" },
    t.p({}, () => `Count: ${count()}`),
    t.p({}, () => `Doubled: ${doubled()}`),
    t.button({ onclick: () => count.update(n => n + 1) }, "Increment"),
    t.button({ onclick: () => count.set(0) }, "Reset")
  );
}
```

### 14.2 State Management

For larger applications, our system works well for state management:

```javascript
// Create a store
function createStore(initialState) {
  const state = $signal(initialState);
  
  // Create selectors for specific parts
  function select(selector) {
    return $memo(() => selector(state()));
  }
  
  // Update functions
  function update(fn) {
    state.update(fn);
  }
  
  return { state, select, update };
}

// Usage:
const userStore = createStore({ name: "John", age: 30 });
const userName = userStore.select(s => s.name);
const userAge = userStore.select(s => s.age);

// Update a specific property
userStore.update(s => ({ ...s, age: s.age + 1 }));
```

### 14.3 Animations and Transitions

Our system works well for animations too:

```javascript
function animateValue(from, to, duration) {
  const value = $signal(from);
  
  const startTime = performance.now();
  const animate = () => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    value.set(from + (to - from) * progress);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  
  requestAnimationFrame(animate);
  return value;
}

// Usage:
const opacity = animateValue(0, 1, 500);
$effect(() => {
  element.style.opacity = opacity();
});
```

## 🏁 15. Conclusion

You've now learned how to build a complete fine-grained reactivity system from scratch! This system includes:

- 🔄 **Signals** for reactive state
- 👁️ **Effects** for side effects
- 🧠 **Memos** for cached computations
- 🌐 **Scopes** for lifecycle management
- 📦 **Batching** for efficient updates
- 🌍 **Contexts** for sharing values through the tree

This knowledge gives you a deep understanding of how modern reactive frameworks work under the hood, and the ability to build your own reactive systems tailored to your needs.

Remember these key principles:

1. **Track dependencies automatically** during execution
2. **Notify observers** when values change
3. **Batch updates** for efficiency
4. **Clean up resources** to prevent memory leaks
5. **Handle errors gracefully** to prevent system crashes

With these principles in mind, you're well-equipped to build robust, efficient reactive applications!

Similar code found with 5 license types
