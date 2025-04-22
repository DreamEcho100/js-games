# Building a Production-Ready Reactive System: A Complete Guide

## Introduction

In this tutorial, you'll learn how to build a complete reactive system from scratch. By the end, you'll understand and be able to implement:

- Signals for state management
- Computed values for derived state
- Effects for side effects
- Performance optimizations
- Error handling
- And much more!

This course is structured to take you from beginner to expert, starting with the fundamental concepts and gradually building up to advanced features.

## Table of Contents

1. [Understanding Reactivity](#understanding-reactivity)
2. [Building Our Core: Signals](#building-our-core-signals)
3. [Derived State with Computed Values](#derived-state-with-computed-values)
4. [Side Effects with Effects](#side-effects-with-effects)
5. [Performance Optimizations](#performance-optimizations)
6. [Error Handling and Debugging](#error-handling-and-debugging)
7. [Advanced Features](#advanced-features)
8. [Putting It All Together](#putting-it-all-together)

## Understanding Reactivity

### What is Reactivity?

At its core, reactivity is about automatically updating outputs when inputs change. In a reactive system:

1. You declare dependencies between pieces of data
2. When a piece of data changes, anything that depends on it updates automatically

This is different from imperative programming, where you have to manually update everything when a value changes.

### The Reactive Graph

The fundamental concept behind our reactive system is a **reactive graph**. This is a directed graph where:

- Nodes represent pieces of state or computations
- Edges represent dependencies between nodes

When a node's value changes, all nodes that depend on it (its observers) need to be notified and potentially updated.

Let's start understanding the building blocks of our reactive system.

## Building Our Core: Signals

Signals are the foundation of our reactive system. A signal is a container for a value that can change over time.

### What is a Signal?

A signal is a function that:

1. Returns the current value when called
2. Has methods to update the value
3. Automatically tracks who's reading it

### Implementing a Basic Signal

Let's start with a simplified version of our signal:

```typescript
function createSignal<T>(initialValue: T) {
  // Store the current value
  let value = initialValue;
  
  // List of functions to call when value changes
  const subscribers = new Set<() => void>();
  
  // The signal function
  const signal = () => {
    // Track that someone is reading this signal
    trackAccess(signal);
    return value;
  };
  
  // Method to update the value
  signal.set = (newValue: T) => {
    if (value !== newValue) {
      value = newValue;
      // Notify subscribers
      subscribers.forEach(fn => fn());
    }
  };
  
  return signal;
}
```

However, our actual implementation is more sophisticated. Let's understand the core concept of a reactive node first.

### The ReactiveNode Interface

Every part of our system (signals, computed values, and effects) is represented as a `ReactiveNode`:

```typescript
interface ReactiveNode {
  id: number;                                  // Unique identifier
  version: number;                             // Incremented when value changes
  sources: WeakMap<ReactiveNode, number>;      // Dependencies + version seen
  observers: Set<ReactiveNode>;                // Who depends on me
  compute?: () => any;                         // How to calculate value
  value?: any;                                 // Cached value
  cleanup?: (() => void) | void;               // Cleanup function
  onDirty?: () => void;                        // How to rerun when dirty
  dirty?: boolean;                             // Needs recalculation
  error?: any;                                 // Error state
  name?: string;                               // For debugging
}
```

Let's create a function that builds this node for us:

```typescript
function createNode<T>(val: T, name?: string): ReactiveNode {
  return {
    id: nextId++,
    version: 0,
    value: val,
    compute: undefined,
    cleanup: undefined,
    error: undefined,
    dirty: false,
    onDirty: undefined,
    sources: new WeakMap(),
    observers: new Set(),
    name
  };
}
```

### Implementing a Full Signal

Now let's implement our complete `createSignal` function:

```typescript
function createSignal<T>(initialValue: T, options?: SignalOptions<T>) {
  // Create the reactive node
  const node = createNode(initialValue, options?.name);
  const equals = options?.equals || deepEquals;

  // The signal function
  const signal = (() => {
    trackAccess(node);
    return node.value;
  }) as SignalValue<T>;

  // Method to set a new value
  signal.set = (newValue: T) => {
    if (!equals(node.value, newValue)) {
      startBatch();
      try {
        node.value = newValue;
        node.version++;
        notifyObservers(node);
      } finally {
        endBatch();
      }
    }
  };

  // Method to update based on previous value
  signal.update = (fn: (value: T) => T) =>
    signal.set(fn(node.value));
    
  // Method to read without tracking
  signal.peek = () => node.value;
  
  return signal;
}
```

This signal:

1. Creates a reactive node to track the value
2. Returns a function that gives the current value and tracks who reads it
3. Provides methods to update the value
4. Uses batching for performance
5. Has a `peek` method to read the value without tracking

### Using Signals

Let's see how we can use our signals:

```typescript
// Create a signal with initial value 0
const count = createSignal(0, { name: 'count' });

// Read the value
console.log(count()); // 0

// Update the value
count.set(5);
console.log(count()); // 5

// Update based on previous value
count.update(val => val + 1);
console.log(count()); // 6

// Read without tracking
console.log(count.peek()); // 6
```

## Derived State with Computed Values

Often, we want values that are derived from other values. This is where computed values come in.

### What is a Computed Value?

A computed value is a value that:

1. Is derived from other reactive values
2. Updates automatically when its dependencies change
3. Is cached for performance

### Implementing Computed Values

Let's implement our `createComputed` function:

```typescript
function createComputed<T>(fn: () => T, options?: { name?: string }) {
  // Create the reactive node
  const node = createNode<T>(undefined as T, options?.name);
  // Set the computation function
  node.compute = fn;
  // Run the computation initially
  runNode(node);

  // Return a function that gives the computed value
  const computed = () => {
    updateIfNecessary(node);
    trackAccess(node);

    if (node.error !== undefined) {
      const err = node.error;
      node.error = undefined;
      throw err;
    }

    return node.value;
  };

  return computed;
}
```

For this to work, we need to understand how `runNode` and `updateIfNecessary` work:

```typescript
function runNode(node: ReactiveNode) {
  if (!node.compute) return;
  
  // Detect cycles
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

  // Clean up old dependencies
  cleanupSources(node);

  const prevObserver = activeObserver;
  activeObserver = node;

  try {
    // Run any cleanup function
    if (typeof node.cleanup === "function") {
      node.cleanup();
      node.cleanup = undefined;
    }

    // Run the computation
    const newValue = node.compute();

    // Handle cleanup function returned by effects
    if (node.onDirty && typeof newValue === "function") {
      node.cleanup = newValue;
    } else if (!node.onDirty && !deepEquals(node.value, newValue)) {
      // Update value if it changed
      node.value = newValue;
      node.version++;
      notifyObservers(node);
    }

    node.dirty = false;
    node.error = undefined;
  } catch (err) {
    node.error = err;
    console.error(`Error in ${node.name ? node.name : 'reactive computation'}:`, err);
  } finally {
    // Restore previous observer
    computationStack.pop();
    activeObserver = prevObserver;
  }
}

function updateIfNecessary(node: ReactiveNode): boolean {
  if (!node.compute) return false;
  let shouldUpdate = node.dirty;

  if (!shouldUpdate) {
    shouldUpdate = node.dirty === true;
  }

  if (shouldUpdate) {
    runNode(node);
    return true;
  }

  return false;
}
```

### Using Computed Values

Let's see how we can use computed values:

```typescript
// Create some signals
const firstName = createSignal('John');
const lastName = createSignal('Doe');

// Create a computed value based on those signals
const fullName = createComputed(() => {
  return `${firstName()} ${lastName()}`;
}, { name: 'fullName' });

console.log(fullName()); // "John Doe"

// Update a signal
firstName.set('Jane');
console.log(fullName()); // "Jane Doe"
```

## Side Effects with Effects

Effects let us perform side effects when reactive values change.

### What is an Effect?

An effect is a function that:

1. Runs when its dependencies change
2. Can perform side effects (like DOM updates)
3. Can have a cleanup function

### Implementing Effects

Let's implement our `createEffect` function:

```typescript
function createEffect(fn: () => void, options?: { name?: string }) {
  // Create the reactive node
  const node = createNode(undefined, options?.name);
  // Set the computation function
  node.compute = fn;
  // Set the dirty handler
  node.onDirty = () => {
    if (batchDepth > 0) {
      pendingEffects.add(node);
    } else {
      scheduleMicrotask();
    }
  };

  // Run the effect initially
  runNode(node);

  // Return a function to clean up the effect
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

The key thing to understand is that effects:

1. Run immediately when created
2. Subscribe to any signals or computed values accessed during execution
3. Re-run when any of those dependencies change
4. Can return a cleanup function that runs before the effect runs again

### Using Effects

Let's see how we can use effects:

```typescript
// Create a signal
const count = createSignal(0);

// Create an effect that depends on the signal
const dispose = createEffect(() => {
  console.log(`Count is now: ${count()}`);
});
// Logs: "Count is now: 0"

// Update the signal
count.set(1);
// Will log: "Count is now: 1"

// Clean up the effect
dispose();

// This won't trigger the effect anymore
count.set(2);
```

## Performance Optimizations

Now that we have our basic reactive system working, let's look at some performance optimizations.

### Batching Updates

Batching groups multiple updates together to avoid unnecessary re-renders. Here's how it works:

```typescript
let batchDepth = 0;
const pendingEffects = new Set<ReactiveNode>();

function startBatch() {
  batchDepth++;
}

function endBatch() {
  if (--batchDepth === 0) {
    scheduleMicrotask();
  }
}

function batch<T>(fn: () => T) {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}

// Usage:
batch(() => {
  // Multiple signal updates here will only trigger effects once
  count.set(count.peek() + 1);
  firstName.set('Alice');
  lastName.set('Smith');
});
```

### Microtask Scheduling

Instead of immediately running effects when signals change, we schedule them as microtasks:

```typescript
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
```

This ensures that effects run after all synchronous code has finished, avoiding cascading updates.

### Deep Equality Checking

To prevent unnecessary updates, we use deep equality checking:

```typescript
function deepEquals(a: any, b: any): boolean {
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

### WeakMap for Memory Management

We use WeakMap to track dependencies:

```typescript
sources: WeakMap<ReactiveNode, number>; // dependencies + version seen
```

This allows the garbage collector to clean up nodes that are no longer referenced anywhere else.

## Error Handling and Debugging

A production-ready reactive system needs good error handling and debugging features.

### Cycle Detection

We prevent infinite loops by detecting cycles in the reactive graph:

```typescript
// For cycle detection
const computationStack: ReactiveNode[] = []; 

// Inside runNode():
if (computationStack.includes(node)) {
  const cycle = computationStack.slice(computationStack.indexOf(node))
    .map(n => n.name || `Node_${n.id}`)
    .join(' → ');
  const error = new Error(`Cycle detected in reactive graph: ${cycle}`);
  console.error(error);
  node.error = error;
  return;
}
```

### Named Nodes

We can name our reactive nodes for easier debugging:

```typescript
const count = createSignal(0, { name: 'count' });
const fullName = createComputed(() => firstName() + ' ' + lastName(), { name: 'fullName' });
createEffect(() => console.log(fullName()), { name: 'logFullName' });
```

### Error Propagation

When a computation throws an error, we capture and propagate it:

```typescript
try {
  // Run the computation
  const newValue = node.compute();
  // ...
} catch (err) {
  node.error = err;
  console.error(`Error in ${node.name ? node.name : 'reactive computation'}:`, err);
}

// Later, when accessing the computed value:
if (node.error !== undefined) {
  const err = node.error;
  node.error = undefined;
  throw err;
}
```

## Advanced Features

Now let's look at some advanced features built on top of our core reactive system.

### The peek() Method

The `peek()` method allows reading a signal without creating a dependency:

```typescript
signal.peek = () => node.value;

// Usage:
const count = createSignal(0);
createEffect(() => {
  // This won't create a dependency on count
  console.log(`Using peek: ${count.peek()}`);
});
count.set(1); // Won't trigger the effect
```

### The untrack() Utility

The `untrack()` utility lets you run code without tracking dependencies:

```typescript
export function untrack<T>(fn: () => T) {
  const prev = activeObserver;
  activeObserver = null;
  try {
    return fn();
  } finally {
    activeObserver = prev;
  }
}

// Usage:
createEffect(() => {
  // This won't create dependencies on anything read inside
  const value = untrack(() => count() + otherSignal());
  console.log(value);
});
```

### Resource Management with Scopes

Scopes help manage multiple reactive resources together:

```typescript
export function createScope<T>() {
  const disposers: (() => void)[] = [];

  return {
    run(fn: () => T) {
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

// Usage:
const scope = createScope();
scope.run(() => {
  // Create signals and effects here
  createEffect(() => {
    // This effect will be cleaned up when scope.dispose() is called
  });
});
// Later:
scope.dispose(); // Cleans up all effects created in the scope
```

### DOM Binding with ref()

We can bind signals directly to DOM elements:

```typescript
export function ref<K extends keyof HTMLElementTagNameMap>(
  element: HTMLElementTagNameMap[K],
  key: keyof HTMLElementTagNameMap[K],
  signalFn: () => any,
) {
  createEffect(() => {
    element[key] = signalFn();
  });
}

// Usage:
const text = createSignal("Hello, world!");
const element = document.getElementById("output");
ref(element, "textContent", text);
// element.textContent will automatically update when text changes
```

### Async Effect Support

For handling asynchronous operations:

```typescript
export function createAsyncEffect(
  fn: (onCleanup: (fn: () => void) => void) => void | Promise<void>,
  options?: { name?: string }
) {
  let cleanupFn: (() => void) | undefined;
  const onCleanup = (cb: () => void) => {
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

// Usage:
createAsyncEffect(async (onCleanup) => {
  // Set up some resources
  const controller = new AbortController();
  onCleanup(() => controller.abort());
  
  try {
    const response = await fetch('/api/data', { signal: controller.signal });
    const data = await response.json();
    dataSignal.set(data);
  } catch (err) {
    if (!controller.signal.aborted) {
      console.error(err);
    }
  }
});
```

### Batched Signal Creation

For creating multiple signals efficiently:

```typescript
export function createBatchedSignals<T extends Record<string, unknown>>(
  initials: T,
  options?: { 
    prefix?: string,
    equals?: (a: any, b: any) => boolean
  }
) {
  const result = {} as {
    [K in keyof T & string]: ReturnType<typeof createSignal<T[K]>>;
  };
  const prefix = options?.prefix || '';
  const equals = options?.equals;

  startBatch();
  try {
    for (const key in initials) {
      if (Object.prototype.hasOwnProperty.call(initials, key)) {
        (result as Record<string, any>)[key] = createSignal(initials[key], {
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

// Usage:
const formState = createBatchedSignals({
  name: "",
  email: "",
  age: 0
}, { prefix: "form_" });

// Access individual signals
formState.name.set("John");
console.log(formState.email());
```

## Putting It All Together

Now that we've learned all the building blocks, let's put them together in a small example application:

### Example: A Todo App

```typescript
// Create our state
const todos = createSignal<{ id: number; text: string; completed: boolean }[]>([], { name: "todos" });
const newTodoText = createSignal("", { name: "newTodoText" });

// Derived state
const completedCount = createComputed(() => {
  return todos().filter(todo => todo.completed).length;
}, { name: "completedCount" });

const activeCount = createComputed(() => {
  return todos().length - completedCount();
}, { name: "activeCount" });

// Actions
function addTodo() {
  if (newTodoText().trim() === "") return;
  
  todos.update(currentTodos => [
    ...currentTodos,
    {
      id: Date.now(),
      text: newTodoText(),
      completed: false
    }
  ]);
  
  newTodoText.set("");
}

function toggleTodo(id: number) {
  todos.update(currentTodos => 
    currentTodos.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed } 
        : todo
    )
  );
}

function removeTodo(id: number) {
  todos.update(currentTodos => 
    currentTodos.filter(todo => todo.id !== id)
  );
}

// UI Updates (simplified example)
createEffect(() => {
  console.log(`Active todos: ${activeCount()}, Completed todos: ${completedCount()}`);
  
  // In a real app, this would update the DOM
  const todoList = document.getElementById("todo-list");
  if (todoList) {
    todoList.innerHTML = "";
    todos().forEach(todo => {
      const item = document.createElement("li");
      item.textContent = todo.text;
      if (todo.completed) {
        item.style.textDecoration = "line-through";
      }
      todoList.appendChild(item);
    });
  }
});

// Initialize with some data
batch(() => {
  todos.set([
    { id: 1, text: "Learn about reactivity", completed: true },
    { id: 2, text: "Build a reactive system", completed: false }
  ]);
});
```

## Conclusion

Congratulations! You've now built a complete, production-ready reactive system from scratch. This system includes:

1. **Signals** for holding and updating state
2. **Computed values** for derived state
3. **Effects** for handling side effects
4. **Performance optimizations** like batching and microtask scheduling
5. **Error handling** with cycle detection
6. **Developer experience** features like named signals and peek()
7. **Advanced features** like scopes, async effects, and DOM binding

This is the same architecture used by modern frameworks like SolidJS, Vue, and others. With this foundation, you can build complex, high-performance reactive applications.

Remember that the key to working with reactive systems is to think declaratively: describe what should happen when state changes, rather than imperatively updating things yourself.

## Further Resources

To deepen your understanding, consider exploring:

1. [SolidJS Documentation](https://www.solidjs.com/docs/latest/api)
2. [Vue's Reactivity System](https://vuejs.org/guide/extras/reactivity-in-depth.html)
3. [RxJS for Observable patterns](https://rxjs.dev/guide/overview)
4. [MobX for Object-oriented reactivity](https://mobx.js.org/README.html)

Happy coding!
