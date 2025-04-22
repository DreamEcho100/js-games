# Building a Reactive System from Scratch

This tutorial will guide you through implementing a complete reactive system, similar to those found in modern frameworks like Vue, Solid, or Svelte. By the end, you'll have a deep understanding of how reactivity works and be able to build your own reactive applications.

## Table of Contents

1. [Introduction to Reactivity](#1-introduction-to-reactivity)
2. [Building Our First Signal](#2-building-our-first-signal)
3. [Tracking Dependencies](#3-tracking-dependencies)
4. [Creating Computations](#4-creating-computations)
5. [Side Effects](#5-side-effects)
6. [Batching Updates](#6-batching-updates)
7. [Memory Management](#7-memory-management)
8. [Cycle Detection](#8-cycle-detection)
9. [Enhanced Features](#9-enhanced-features)
10. [Practical Applications](#10-practical-applications)

## 1. Introduction to Reactivity

### What is Reactivity?

Reactivity is a programming paradigm where changes to data automatically trigger updates to the parts of our application that depend on that data. Instead of manually updating the DOM or recalculating values when data changes, a reactive system handles this for us.

### Core Concepts

- **Signals**: Containers for values that notify dependents when they change
- **Computations**: Functions that automatically recalculate when their dependencies change
- **Effects**: Side effects (like DOM updates) that run when dependencies change
- **Dependency Tracking**: Automatically detecting and managing relationships between reactive values

### Why Build a Reactive System?

- **Declarative Code**: Write what should happen, not how it should happen
- **Automatic Updates**: No need to manually sync your UI with your data
- **Performance**: Only update what needs to be updated
- **Composability**: Build complex behaviors from simple primitives

## 2. Building Our First Signal

Let's start by creating the most fundamental piece: a signal.

```javascript
// The most basic reactive primitive
function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  // Getter function
  function signal() {
    // We'll add tracking here later
    return value;
  }

  // Setter function
  signal.set = (newValue) => {
    if (value === newValue) return;
    value = newValue;
    
    // Notify subscribers
    subscribers.forEach(fn => fn());
  };

  // Update using a function
  signal.update = (fn) => signal.set(fn(value));

  return signal;
}
```

This basic implementation lets us:
1. Create a signal with an initial value
2. Read the value by calling the signal as a function
3. Set a new value using `signal.set()`
4. Update based on the current value with `signal.update()`

Let's use it:

```javascript
const count = createSignal(0);
console.log(count()); // 0

count.set(5);
console.log(count()); // 5

count.update(n => n + 1);
console.log(count()); // 6
```

This works, but it's not very useful yet because we have no way to react to changes. Let's add that next.

## 3. Tracking Dependencies

Now we need a way to track dependencies between signals and their consumers. We'll introduce a global `activeObserver` to track what's currently running.

```javascript
// Core tracking mechanisms
let activeObserver = null;
let nextId = 1;

// Our enhanced reactive node
function createNode(value) {
  return {
    id: nextId++,
    value: value,
    version: 0,  // Incremented when value changes
    sources: new Map(), // What this node depends on
    observers: new Set() // Who depends on this node
  };
}

// Track that sourceNode was accessed by activeObserver
function trackAccess(node) {
  if (activeObserver) {
    // Remember this dependency
    activeObserver.sources.set(node, node.version);
    node.observers.add(activeObserver);
  }
}
```

Now let's update our signal implementation to use this tracking:

```javascript
function createSignal(initialValue) {
  const node = createNode(initialValue);
  
  const signal = () => {
    // Track that someone read from this signal
    trackAccess(node);
    return node.value;
  };
  
  signal.set = (newValue) => {
    if (Object.is(node.value, newValue)) return;
    
    node.value = newValue;
    node.version++; // Increment version
    
    // Notify all observers that we changed
    notifyObservers(node);
  };
  
  signal.update = (fn) => signal.set(fn(node.value));
  
  // Helper to read without tracking (useful later)
  signal.peek = () => node.value;
  
  return signal;
}

function notifyObservers(node) {
  // Mark all observers as dirty
  for (const observer of node.observers) {
    observer.dirty = true;
    
    // For effects, run them immediately or schedule them
    if (observer.onDirty) {
      observer.onDirty();
    }
  }
}
```

We now have signals that can be tracked when read, but we need something that actually does the tracking.

## 4. Creating Computations

Computations are values derived from other reactive values. They're like signals, but their value is calculated from a function.

```javascript
function createComputed(computation) {
  const node = createNode(undefined);
  node.compute = computation; // Store the computation function
  
  // Function to run the computation
  function runComputation() {
    // Clear previous dependencies
    for (const source of node.sources.keys()) {
      source.observers.delete(node);
    }
    node.sources.clear();
    
    // Set this node as current observer while running the computation
    const prevObserver = activeObserver;
    activeObserver = node;
    
    try {
      // Run the computation to get the new value
      const newValue = node.compute();
      
      // Only update if value changed
      if (!Object.is(node.value, newValue)) {
        node.value = newValue;
        node.version++;
        notifyObservers(node);
      }
      
      node.dirty = false;
    } catch (error) {
      node.error = error;
      console.error("Error in computation:", error);
    } finally {
      // Restore previous observer
      activeObserver = prevObserver;
    }
  }
  
  // Check if we need to recalculate
  function updateIfNeeded() {
    // If marked as dirty or any source changed
    if (node.dirty) {
      runComputation();
      return true;
    }
    
    for (const [source, version] of node.sources.entries()) {
      if (version !== source.version) {
        runComputation();
        return true;
      }
    }
    
    return false;
  }
  
  // Run the initial computation
  runComputation();
  
  // Return a function that returns the computed value
  const computed = () => {
    updateIfNeeded();
    trackAccess(node); // Track that someone read this computed
    return node.value;
  };
  
  return computed;
}
```

Now we can create computed values that automatically update:

```javascript
const count = createSignal(0);
const doubled = createComputed(() => count() * 2);

console.log(doubled()); // 0

count.set(5);
console.log(doubled()); // 10
```

The `doubled` value automatically updates when `count` changes!

## 5. Side Effects

Effects are similar to computations, but they're meant for side effects (like updating the DOM) rather than calculating values.

```javascript
function createEffect(fn) {
  const node = createNode(undefined);
  node.compute = fn;
  
  // Define what happens when dependencies change
  node.onDirty = () => runNode(node);
  
  // Function to run the effect
  function runNode(node) {
    // Clear previous dependencies
    for (const source of node.sources.keys()) {
      source.observers.delete(node);
    }
    node.sources.clear();
    
    // Set this node as current observer
    const prevObserver = activeObserver;
    activeObserver = node;
    
    try {
      // Run the cleanup if it exists
      if (typeof node.cleanup === "function") {
        node.cleanup();
        node.cleanup = undefined;
      }
      
      // Run the effect function
      const result = node.compute();
      
      // If effect returns a function, use it as cleanup
      if (typeof result === "function") {
        node.cleanup = result;
      }
      
      node.dirty = false;
    } catch (error) {
      console.error("Error in effect:", error);
    } finally {
      activeObserver = prevObserver;
    }
  }
  
  // Run the effect for the first time
  runNode(node);
  
  // Return a function to dispose the effect
  return () => {
    if (typeof node.cleanup === "function") {
      node.cleanup();
    }
    
    // Remove this node from all sources
    for (const source of node.sources.keys()) {
      source.observers.delete(node);
    }
    node.sources.clear();
  };
}
```

Now we can create effects that run when signals change:

```javascript
const count = createSignal(0);

const dispose = createEffect(() => {
  console.log(`Count changed to: ${count()}`);
  
  // Optionally return a cleanup function
  return () => console.log("Cleaning up previous effect");
});

// Initially logs: "Count changed to: 0"

count.set(5);
// Logs: "Cleaning up previous effect"
// Logs: "Count changed to: 5"

// Stop the effect when we don't need it anymore
dispose();
```

## 6. Batching Updates

Right now, every signal update immediately triggers all effects. This can be inefficient if we update multiple signals in sequence. Let's add batching:

```javascript
let batchDepth = 0;
const pendingEffects = new Set();

function startBatch() {
  batchDepth++;
}

function endBatch() {
  if (--batchDepth === 0) {
    // Process all pending effects
    const effects = Array.from(pendingEffects);
    pendingEffects.clear();
    for (const effect of effects) {
      runNode(effect);
    }
  }
}

// Update notifyObservers to use batching
function notifyObservers(node) {
  for (const observer of node.observers) {
    observer.dirty = true;
    
    if (observer.onDirty) {
      if (batchDepth > 0) {
        // Queue effect to run later
        pendingEffects.add(observer);
      } else {
        // Run immediately if not batching
        observer.onDirty();
      }
    }
  }
}

// Helper function to batch multiple updates
function batch(fn) {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}
```

And update our signal.set function:

```javascript
signal.set = (newValue) => {
  if (Object.is(node.value, newValue)) return;
  
  startBatch();
  try {
    node.value = newValue;
    node.version++;
    notifyObservers(node);
  } finally {
    endBatch();
  }
};
```

Now we can batch multiple updates:

```javascript
const firstName = createSignal("John");
const lastName = createSignal("Doe");

createEffect(() => {
  console.log(`Name: ${firstName()} ${lastName()}`);
});
// Logs: "Name: John Doe"

// Will only trigger the effect once
batch(() => {
  firstName.set("Jane");
  lastName.set("Smith");
});
// Logs: "Name: Jane Smith"
```

## 7. Memory Management

Our current implementation has a potential memory leak: signals keep references to their observers. Let's use WeakMap to allow garbage collection:

```javascript
function createNode(value) {
  return {
    id: nextId++,
    value: value,
    version: 0,
    sources: new WeakMap(), // Using WeakMap instead of Map
    observers: new Set()
  };
}
```

But this introduces a challenge: we can't iterate through a WeakMap's keys. We need a better solution for cleaning up dependencies.

```javascript
function cleanupSources(node) {
  // For each observer that this node is tracked by
  const observers = Array.from(node.observers);
  for (const observer of observers) {
    // Remove node from observer's sources
    observer.sources.delete(node);
  }
  // Create a new WeakMap for sources
  node.sources = new WeakMap();
}
```

This ensures that when a node is no longer referenced, it can be garbage collected, and its memory can be reclaimed.

## 8. Cycle Detection

One dangerous situation is when computations or effects form a cycle, where A depends on B and B depends on A. This can cause infinite loops. Let's add cycle detection:

```javascript
// Track the current computation stack
const computationStack = [];

// Update runNode to detect cycles
function runNode(node) {
  if (!node.compute) return;
  
  // Check if this node is already in the computation stack
  if (computationStack.includes(node)) {
    const cycle = computationStack.slice(computationStack.indexOf(node))
      .map(n => n.name || `Node_${n.id}`)
      .join(' → ');
    const error = new Error(`Cycle detected: ${cycle}`);
    console.error(error);
    node.error = error;
    return;
  }
  
  // Add to computation stack
  computationStack.push(node);
  
  // ... rest of runNode function
  
  // Always remove from stack when done
  computationStack.pop();
}
```

Now we'll get a helpful error if we accidentally create a cycle:

```javascript
const a = createSignal(0);
const b = createComputed(() => c() + 1);
const c = createComputed(() => b() + 1);

// This will throw a cycle error!
console.log(b());
```

## 9. Enhanced Features

Now that we have the core functionality, let's add some enhanced features:

### 9.1 Deep Equality Checking

By default, we use Object.is for equality checks, but for objects and arrays, we might want to check if their content is the same:

```javascript
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

Update the signal creation to accept custom equality checks:

```javascript
function createSignal(initialValue, options = {}) {
  const node = createNode(initialValue);
  const equals = options.equals || Object.is;
  
  // ...existing code
  
  signal.set = (newValue) => {
    if (equals(node.value, newValue)) return;
    // ...rest of set function
  };
  
  // ...rest of createSignal
}
```

### 9.2 Microtask Scheduling

For even better performance, let's use microtasks to batch updates together:

```javascript
let pendingMicrotask = false;

function scheduleMicrotask() {
  if (!pendingMicrotask && pendingEffects.size > 0) {
    pendingMicrotask = true;
    queueMicrotask(() => {
      pendingMicrotask = false;
      const effects = Array.from(pendingEffects);
      pendingEffects.clear();
      for (const effect of effects) {
        runNode(effect);
      }
    });
  }
}
```

Update endBatch to use this:

```javascript
function endBatch() {
  if (--batchDepth === 0) {
    scheduleMicrotask();
  }
}
```

### 9.3 Untracked Reads

Sometimes we want to read a signal without tracking it as a dependency:

```javascript
function untrack(fn) {
  const prevObserver = activeObserver;
  activeObserver = null;
  try {
    return fn();
  } finally {
    activeObserver = prevObserver;
  }
}
```

### 9.4 Resource Management with Scopes

To help manage groups of effects:

```javascript
function createScope() {
  const disposers = [];
  
  return {
    // Run a function in this scope
    run(fn) {
      const dispose = createEffect(() => {
        const result = fn();
        if (typeof result === "function") {
          return result; // Use as cleanup
        }
      });
      
      disposers.push(dispose);
      return dispose;
    },
    
    // Dispose all effects in this scope
    dispose() {
      for (const dispose of disposers) {
        dispose();
      }
      disposers.length = 0;
    }
  };
}
```

### 9.5 Async Effects

For working with promises and async operations:

```javascript
function createAsyncEffect(fn) {
  let cleanupFn;
  const onCleanup = (fn) => {
    cleanupFn = fn;
  };
  
  return createEffect(() => {
    // Run cleanup from previous execution
    if (cleanupFn) {
      cleanupFn();
      cleanupFn = undefined;
    }
    
    const result = fn(onCleanup);
    
    // Handle promises
    if (result instanceof Promise) {
      result.catch(error => {
        console.error("Error in async effect:", error);
      });
    }
  });
}
```

## 10. Practical Applications

Now that we have a complete reactive system, let's apply it to some real-world scenarios:

### 10.1 Building a Simple Counter UI

```javascript
// Create our state
const count = createSignal(0);
const doubled = createComputed(() => count() * 2);

// Create DOM elements
const counterDiv = document.createElement("div");
document.body.appendChild(counterDiv);

const countDisplay = document.createElement("p");
const doubledDisplay = document.createElement("p");
const incrementBtn = document.createElement("button");
incrementBtn.textContent = "Increment";
const decrementBtn = document.createElement("button");
decrementBtn.textContent = "Decrement";

counterDiv.append(countDisplay, doubledDisplay, incrementBtn, decrementBtn);

// Connect UI to signals
createEffect(() => {
  countDisplay.textContent = `Count: ${count()}`;
  doubledDisplay.textContent = `Doubled: ${doubled()}`;
});

// Add event handlers
incrementBtn.addEventListener("click", () => count.update(n => n + 1));
decrementBtn.addEventListener("click", () => count.update(n => n - 1));
```

### 10.2 Form With Validation

```javascript
// Form state
const form = createBatchedSignals({
  name: "",
  email: "",
  password: ""
});

// Derived state for validation
const errors = createComputed(() => {
  const result = {};
  
  if (form.name().length < 3) {
    result.name = "Name must be at least 3 characters";
  }
  
  if (!form.email().includes("@")) {
    result.email = "Email must be valid";
  }
  
  if (form.password().length < 8) {
    result.password = "Password must be at least 8 characters";
  }
  
  return result;
});

const isValid = createComputed(() => {
  return Object.keys(errors()).length === 0;
});

// UI updates automatically!
createEffect(() => {
  submitButton.disabled = !isValid();
  // Update error messages
  nameError.textContent = errors().name || "";
  emailError.textContent = errors().email || "";
  passwordError.textContent = errors().password || "";
});

// Input handlers
nameInput.addEventListener("input", (e) => {
  form.name.set(e.target.value);
});

emailInput.addEventListener("input", (e) => {
  form.email.set(e.target.value);
});

passwordInput.addEventListener("input", (e) => {
  form.password.set(e.target.value);
});
```

### 10.3 Building a Todo List App

```javascript
// State
const todos = createSignal([]);
const newTodoText = createSignal("");
const filter = createSignal("all"); // "all", "active", "completed"

// Derived state
const filteredTodos = createComputed(() => {
  const currentFilter = filter();
  const currentTodos = todos();
  
  if (currentFilter === "all") return currentTodos;
  if (currentFilter === "active") return currentTodos.filter(todo => !todo.completed);
  if (currentFilter === "completed") return currentTodos.filter(todo => todo.completed);
  
  return currentTodos;
});

const activeCount = createComputed(() => {
  return todos().filter(todo => !todo.completed).length;
});

const completedCount = createComputed(() => {
  return todos().filter(todo => todo.completed).length;
});

// Actions
function addTodo() {
  const text = newTodoText().trim();
  if (!text) return;
  
  todos.update(list => [...list, { id: Date.now(), text, completed: false }]);
  newTodoText.set("");
}

function toggleTodo(id) {
  todos.update(list => 
    list.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    )
  );
}

function removeTodo(id) {
  todos.update(list => list.filter(todo => todo.id !== id));
}

function clearCompleted() {
  todos.update(list => list.filter(todo => !todo.completed));
}

// Connect to UI
createEffect(() => {
  // Update todo list rendering
  todoList.innerHTML = "";
  
  filteredTodos().forEach(todo => {
    const li = document.createElement("li");
    li.className = todo.completed ? "completed" : "";
    
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => toggleTodo(todo.id));
    
    const span = document.createElement("span");
    span.textContent = todo.text;
    
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", () => removeTodo(todo.id));
    
    li.append(checkbox, span, deleteBtn);
    todoList.appendChild(li);
  });
  
  // Update counters
  activeCounter.textContent = `${activeCount()} items left`;
});
```

## Conclusion

Congratulations! You've built a complete reactive system from scratch and learned how to apply it to real-world web applications. Your system includes:

- Signals for state management
- Computed values for derived state
- Effects for side effects
- Dependency tracking
- Batching for performance
- Memory management
- Cycle detection
- Advanced features like deep equality checking, untracked reads, and resource management

This reactive system gives you the power to build complex, reactive applications with a clean, declarative programming model. The applications you build with this system will be more maintainable, more performant, and easier to reason about.

As you continue to learn and explore, consider:

- How you might integrate this system with a virtual DOM for even more powerful UI rendering
- How you might add debugging tools to help track dependencies
- How you might optimize performance further

Happy coding! 