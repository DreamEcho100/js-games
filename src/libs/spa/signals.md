# Signals: A Fine-Grained Reactive System

Alright, let's dive deep into this fascinating reactive system! We'll break down each part step by step, explaining the concepts and implementation details in a way that should be clear for newcomers while still offering insights for experienced developers.

## Step 1: Understanding the Core Concepts

At its heart, this code implements a **fine-grained reactive system**. This means that only the parts of your application that depend on a piece of data will re-run when that data changes. This is in contrast to coarser-grained reactivity where larger chunks of the UI or logic might re-execute unnecessarily.

Here are the key concepts we'll encounter:

* **Signals:** These are the fundamental building blocks of reactivity. A signal holds a value that can change over time. When the value of a signal is read within a reactive context (like an `effect` or `memo`), that context becomes a **subscriber** of the signal. When the signal's value changes, all its subscribers are notified and potentially re-executed.
* **Effects:** These are functions that run in response to changes in signals they depend on. They are typically used to perform side effects, such as updating the DOM, making API calls, or logging.
* **Memos (Computed Values):** These are derived values that are automatically updated when their dependencies (other signals or memos) change. They are like signals but their value is computed rather than directly set. Memos are useful for optimizing computations by caching results.
* **Scopes:** Scopes provide a way to manage the lifecycle of reactive nodes (signals, effects, memos) and their associated cleanups. When a scope is disposed, all the reactive nodes created within it are also disposed, preventing memory leaks and unexpected behavior.
* **Nodes (ReactiveNode Interface):** This is the internal representation of a reactive entity (signal, effect, or memo). It stores information like its current value, its dependencies (`sources`), and the observers that depend on it (`observers`).
* **Dependency Tracking:** The system automatically tracks which signals and memos are accessed within an `effect` or `memo` function. These accessed reactive nodes become dependencies.
* **Change Propagation:** When a signal's value changes, it notifies all its dependent nodes. This notification triggers a re-evaluation of effects and memos.
* **Batching:** Batching allows multiple signal updates to be grouped together, so effects and memos only re-run once after all the updates have occurred. This improves performance by reducing unnecessary re-renders or computations.
* **Cleanup Functions:** Effects can return cleanup functions that are executed before the effect runs again or when the scope containing the effect is disposed. This is crucial for managing resources like event listeners or timers.

## Step 2: Setting up the Internal State (`Scope` and `ReactiveNode` Interfaces)

Let's examine the core data structures that power this system:

### `Scope` Interface

```ts
interface Scope {
  id: number;
  name?: string;
  depth: number;
  nextSignalId: number;
  batchDepth: number;
  activeObserver: ReactiveNode<any> | null;
  pendingEffects: Set<ReactiveNode<any>>;
  nodes: Set<ReactiveNode<any>>; // New: ALL nodes (signals, memos, effects)
  pendingMicrotask: boolean;
  nextScopes: Scope[];
  prevScope: Scope | null;
  cleanups: (() => void)[];
}
```

* **`id`:** A unique identifier for the scope.
* **`name?`:** An optional name for debugging purposes.
* **`depth`:** Represents the nesting level of the scope.
* **`nextSignalId`:** A counter used to assign unique IDs to reactive nodes created within this scope.
* **`batchDepth`:** Keeps track of the current batching level. When this is greater than 0, effects are queued instead of immediately executed.
* **`activeObserver`:** During the execution of an `effect` or `memo`, this property holds a reference to the currently running `ReactiveNode`. This is how the system knows which signals are being read and should be tracked as dependencies.
* **`pendingEffects`:** A set of `ReactiveNode`s (specifically effects) that need to be executed after the current batch or microtask.
* **`nodes`:** A set that keeps track of all `ReactiveNode`s (signals, memos, and effects) created within this scope. This is crucial for disposing of all resources when the scope is disposed.
* **`pendingMicrotask`:** A boolean flag to ensure that the microtask for flushing pending effects is only scheduled once per batch.
* **`nextScopes`:** An array to hold child scopes created within this scope. This forms a tree of scopes.
* **`prevScope`:** A reference to the parent scope, forming a linked list of the scope hierarchy.
* **`cleanups`:** An array of cleanup functions registered within this scope. These are executed when the scope is disposed.

### `ReactiveNode<TValue>` Interface

```ts
interface ReactiveNode<TValue> {
  id: number;
  version: number; // incremented when value changes
  sources: Map<ReactiveNode<any>, number>; // dependencies + version seen
  observers: Set<ReactiveNode<any>>; // who depends on me
  compute?: () => TValue; // how to calculate value
  value: TValue; // cached value (for signals/computeds)
  cleanup?: (() => void) | void; // cleanup function (for effects)
  onDirty?: () => void; // how to rerun when dirty
  dirty?: boolean;
  error?: any;
  name?: string; // for debugging and cycle detection
  // Flag to identify effect nodes (terminals in the dependency graph)
  type: (typeof NODE_TYPE)[keyof typeof NODE_TYPE];
  equals?: (a: TValue, b: TValue) => boolean;
  scopeRef: Scope;
}
```

This interface describes the internal structure of each reactive node:

* **`id`:** A unique identifier for the node.
* **`version`:** A counter that increments each time the node's value changes. This is used to efficiently check if a dependency has updated.
* **`sources`:** A `Map` where the keys are the `ReactiveNode`s that this node depends on, and the values are the `version` of those dependencies when this node last ran.
* **`observers`:** A `Set` of `ReactiveNode`s that depend on this node (i.e., have accessed its value).
* **`compute?`:** An optional function that defines how the node's value is computed (for memos and effects).
* **`value`:** The current cached value of the node (for signals and memos). Effects might also store their last computed value here.
* **`cleanup?`:** An optional cleanup function associated with the effect.
* **`onDirty?`:** An optional function that is called when the node is marked as `dirty`. This allows for custom scheduling of re-evaluation (used by effects).
* **`dirty?`:** A boolean flag indicating whether the node needs to be re-evaluated because one of its dependencies has changed.
* **`error?`:** Stores any error that occurred during the node's computation.
* **`name?`:** An optional name for debugging.
* **`type`:** Indicates the type of the reactive node (`SIGNAL`, `EFFECT`, or `MEMO`).
* **`equals?`:** An optional function to determine if a new value is actually different from the old value. This can optimize updates.
* **`scopeRef`:** A reference to the `Scope` in which this node was created.

### `NODE_TYPE` Enum

```ts
const NODE_TYPE = {
  SIGNAL: 0,
  EFFECT: 1,
  MEMO: 2,
};
```

A simple enum to categorize the different types of reactive nodes.

## Step 3: Managing Scopes (`createScope`, `disposeScope`, `getScopeId`)

Scopes are essential for managing the lifecycle of reactive resources.

### `createScope` Function

```ts
function createScope<T>(
  fn: () => T,
  options?: { detached?: boolean; name?: string },
): { dispose: () => void; result: T } {
  const parentScope = currentScope;

  const newScope: Scope = {
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
  };

  if (!options?.detached) {
    parentScope.nextScopes.push(newScope);
  }

  // Switch to new scope
  currentScope = newScope;

  let result: T;
  try {
    result = fn();
  } finally {
    // Restore parent scope
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

This function creates a new reactive scope.

1. It captures the `currentScope` (the scope in which `createScope` is called).
2. It initializes a `newScope` object with its own ID, depth, and other relevant properties.
3. If the `detached` option is not true, it links the `newScope` as a child of the `parentScope`.
4. It sets the `currentScope` to the `newScope` before executing the provided `fn`. This ensures that any reactive nodes created within `fn` are associated with this new scope.
5. Crucially, it uses a `try...finally` block to ensure that the `currentScope` is always restored to the `parentScope` after `fn` has executed, even if an error occurs.
6. It returns an object containing the `result` of `fn` and a `dispose` function to manually dispose of the created scope.

### `disposeScope` Function

```ts
function disposeScope(scope: Scope) {
  // Recursively dispose child scopes first
  for (const child of scope.nextScopes) {
    disposeScope(child);
  }
  scope.nextScopes = [];

  for (const node of scope.nodes) {
    disposeNode(node);
  }
  if (process.env.NODE_ENV !== "production" && scope.nodes.size > 0) {
    console.warn(
      `Scope "${scope.name ?? scope.id}" still had ${
        scope.nodes.size
      } nodes when disposed.`,
    );
  }
  scope.nodes.clear();
  scope.pendingEffects.clear();
  scope.pendingMicrotask = false;
  scope.cleanups.forEach((cleanup) => cleanup());
  scope.cleanups = [];
  if (scope.prevScope) {
    scope.prevScope.nextScopes = scope.prevScope.nextScopes.filter(
      (s) => s.id !== scope.id,
    );
  }
  scope.prevScope = null;
}
```

This function disposes of a given scope and all the reactive nodes and child scopes within it.

1. It recursively calls `disposeScope` on all child scopes (`scope.nextScopes`) to ensure a clean disposal from the bottom up.
2. It iterates through all the `nodes` within the scope and calls `disposeNode` on each one.
3. In non-production environments, it warns if there are still nodes left in the scope after disposal, indicating a potential issue.
4. It clears the `nodes` and `pendingEffects` sets.
5. It resets the `pendingMicrotask` flag.
6. It executes all the cleanup functions registered in the `scope.cleanups` array.
7. It removes the scope from its parent's `nextScopes` array and clears its `prevScope` reference.

### `getScopeId` Function

```ts
function getScopeId() {
  return currentScope.id;
}
```

A simple utility function to get the ID of the currently active scope. This is used, for example, in the DOM component placeholders for debugging.

## Step 4: Creating Signals (`createNode`, `untrack`, `trackAccess`, `notifyObservers`, `disposeNode`, `createSignal`)

Signals are the fundamental reactive values.

### `createNode` Function

```ts
function createNode<TValue>(
  val: TValue,
  options: {
    name?: string;
    equals?: (a: TValue, b: TValue) => boolean;
    type: (typeof NODE_TYPE)[keyof typeof NODE_TYPE];
  },
): ReactiveNode<TValue> {
  const node: ReactiveNode<TValue> = {
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

  currentScope.nodes.add(node);

  return node;
}
```

This internal function creates a new `ReactiveNode`. It initializes the node with the provided value, options, and links it to the `currentScope`. Importantly, it adds the newly created node to the `nodes` set of the current scope.

### `untrack` Function

```ts
function untrack<T>(fn: () => T): T {
  const prevObserver = currentScope.activeObserver;
  currentScope.activeObserver = null;
  try {
    return fn();
  } finally {
    currentScope.activeObserver = prevObserver;
  }
}
```

This function allows you to execute a function without tracking any signals that are read within it. This is useful when you want to perform an operation that shouldn't create a reactive dependency. It temporarily sets `currentScope.activeObserver` to `null` and restores it afterwards.

### `trackAccess` Function

```ts
function trackAccess<TValue>(sourceNode: ReactiveNode<TValue>) {
  if (
    process.env.NODE_ENV !== "production" &&
    sourceNode.compute === undefined
  ) {
    console.warn(
      `⚠️ Attempted to read a disposed signal or memo: ${
        sourceNode.name ?? `Node_${sourceNode.id}`
      }`,
    );
  }

  if (currentScope.activeObserver) {
    // ✅ Prevent duplicate tracking
    if (!currentScope.activeObserver.sources.has(sourceNode)) {
      currentScope.activeObserver.sources.set(sourceNode, sourceNode.version);
      sourceNode.observers.add(currentScope.activeObserver);
    }
  }
}
```

This function is called when a signal or memo's value is accessed within a reactive context (i.e., when `currentScope.activeObserver` is not `null`).

1. It performs a warning in non-production environments if a disposed node is accessed.
2. It checks if the `currentScope.activeObserver` (the effect or memo that is currently running) has already tracked this `sourceNode`. If not, it adds the `sourceNode` to the `sources` map of the observer and adds the observer to the `observers` set of the `sourceNode`. This establishes the dependency relationship. It also stores the current `version` of the source node.

### `flushPendingEffects` Function

```ts
function flushPendingEffects(scope: Scope) {
  for (const effect of scope.pendingEffects) {
    runNode(effect);
  }
  scope.pendingEffects.clear();

  for (const child of scope.nextScopes) {
    flushPendingEffects(child);
  }
}
```

This function iterates through the `pendingEffects` of a given scope and executes each one using `runNode`. It then recursively calls itself on all child scopes to ensure all pending effects in the entire scope tree are flushed.

### `scheduleMicrotask` Function

```ts
function scheduleMicrotask() {
  if (currentScope.pendingMicrotask || currentScope.pendingEffects.size === 0) {
    return;
  }

  currentScope.pendingMicrotask = true;
  queueMicrotask(() => {
    currentScope.pendingMicrotask = false;
    // for (const effect of currentScope.pendingEffects) runNode(effect);
    // currentScope.pendingEffects.clear();

    // Instead of only currentScope → flush all scopes recursively
    flushPendingEffects(currentScope);
  });
}
```

This function schedules a microtask to execute the `flushPendingEffects` function. This ensures that effects are not run synchronously during signal updates, allowing for batching and preventing potential infinite loops. It only schedules a microtask if there are pending effects and one hasn't already been scheduled.

### `notifyObservers` Function

```ts
function notifyObservers<TValue>(node: ReactiveNode<TValue>) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`📣 notifyObservers: ${node.name ?? `Node_${node.id}`}`);
  }

  // Make a copy to avoid issues if the set changes during iteration
  const observers = Array.from(node.observers);

  for (const observer of observers) {
    if (!observer.dirty) {
      // Avoid redundant notifications
      observer.dirty = true;
      // ✅ If the observer knows how to reschedule itself, do that
      if (observer.onDirty) {
        observer.onDirty();
      } else {
        currentScope.pendingEffects.add(observer);
        if (currentScope.batchDepth === 0) {
          scheduleMicrotask();
        }
      }
    }
  }
}
```

When a signal's value changes, this function is called to notify all its dependent nodes (`observers`).

1. It logs a message in non-production environments.
2. It creates a copy of the `observers` set to avoid issues if an observer removes itself during the iteration.
3. For each observer:
    * It checks if the observer is already marked as `dirty`. If not, it marks it as `dirty`.
    * If the observer has an `onDirty` function (like effects do for custom scheduling), it calls that function.
    * Otherwise, it adds the observer to the `currentScope.pendingEffects` set. If there is no active batch (`currentScope.batchDepth === 0`), it schedules a microtask to flush these effects.

### `disposeNode` Function

```ts
function disposeNode(node: ReactiveNode<any>) {
  if (node.cleanup) {
    node.cleanup();
    node.cleanup = undefined;
  }
  cleanupSources(node);
  node.scopeRef.pendingEffects.delete(node);
  node.scopeRef.nodes.delete(node);
  node.compute = undefined;
  if (process.env.NODE_ENV !== "production") {
    if (node.observers.size > 0 || node.sources.size > 0) {
      console.warn(
        `⚠️ Node '${
          node.name ?? `Node_${node.id}`
        }' was disposed while still active.`,
      );
    }
  }
}
```

This function disposes of a single reactive node.

1. If the node has a `cleanup` function (typically for effects), it executes it and then clears the `cleanup` property.
2. It calls `cleanupSources` to remove the node from the dependency graph.
3. It removes the node from the `pendingEffects` set of its scope.
4. It removes the node from the `nodes` set of its scope.
5. It clears the `compute` function to mark the node as effectively disposed.
6. In non-production environments, it warns if the node still has observers or sources, indicating it might still be part of the reactive graph.

### `createSignal` Function

```ts
const defaultEquals = Object.is;

/**
 * 🌱 Signal primitive
 */
function createSignal<TValue>(
  initialValue: TValue,
  options?: SignalOptions<TValue>,
) {
  const node = createNode(initialValue, {
    name: options?.name,
    type: NODE_TYPE.SIGNAL,
    equals: options?.equals,
  });

  const signal = Object.assign(
    () => {
      trackAccess(node);
      return node.value;
    },
    {
      set: (newValue: TValue) => {
        if ((node.equals ?? defaultEquals)(node.value, newValue)) {
          return;
        }

        node.value = newValue;
        node.version++;
        notifyObservers(node);
      },
      update: (fn: (value: TValue) => TValue) => signal.set(fn(node.value)),
      peek: () => node.value,
      [SIGNAL]: node,
    },
  ) as SignalValue<TValue>;

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

  onScopeCleanup(() => disposeNode(node));

  return signal;
}
```

This function creates a new signal.

1. It calls `createNode` to create the underlying `ReactiveNode` for the signal, setting its `type` to `SIGNAL`.
2. It creates a getter function that, when called:
    * Calls `trackAccess` to register the current reactive context as a dependency of this signal.
    * Returns the current `node.value`.
3. It extends this getter function with a `set` method:
    * It checks if the new value is different from the old value using the provided `equals` function (or `Object.is` as the default).
    * If the value has changed, it updates `node.value`, increments `node.version`, and calls `notifyObservers` to inform dependent nodes.
4. It also adds an `update` method for conveniently updating the signal's value based on its previous value.
5. A `peek` method is provided to read the signal's value without triggering dependency tracking.
6. A `[SIGNAL]` symbol is used to attach the internal `ReactiveNode` to the signal object (though it's not directly exported).
7. In non-production environments, a `_debug` property is added for inspection.
8. Finally, it registers a cleanup function using `onScopeCleanup` to automatically dispose of the signal's node when the scope it belongs to is disposed.

## Step 5: Creating Effects (`computationStack`, `cleanupSources`, `runNode`, `createEffect`)

Effects are functions that react to changes in signals.

### `computationStack` Variable

```ts
const computationStack: Set<ReactiveNode<unknown>> = new Set();
```

This set is used to detect dependency cycles in reactive computations (memos and effects). If a node is already in the stack during its own computation, it indicates a cycle.

### `cleanupSources` Function

```ts
function cleanupSources<TValue>(node: ReactiveNode<TValue>) {
  // Remove this node as an observer from all its sources
  for (const [source] of node.sources) {
    source.observers.delete(node);
  }

  // Clear all tracked sources
  node.sources = new Map();
}
```

This function removes all dependency relationships of a given node. It iterates through the node's `sources`, removes the node from each source's `observers` set, and then clears the node's `sources` map. This is done before a node re-runs to ensure only the currently accessed signals are tracked as dependencies.

### `runNode` Function

```ts
function runNode(node: ReactiveNode<any>) {
  if (!node.compute) return false;

  // 🔁 Detect cycles
  if (computationStack.has(node)) {
    let cycle = "";
    for (const n of computationStack) {
      cycle += `${n.name ?? `Node_${n.id}`}${n === node ? " (cycle)" : ""} → `;
    }
    cycle += node.name ?? `Node_${node.id}`;

    const error = new Error(`⚠️ Cycle reference detected: ${cycle}`);
    console.warn(error);
    node.error = error;
    node.dirty = false; // ✅ Stop further propagation

    // Clean up incomplete dependencies to prevent further issues
    cleanupSources(node);
    return false;
  }

  computationStack.add(node);

  // Clean up previous dependencies before recomputing
  const prevCleanup = node.cleanup;
  cleanupSources(node);

  const prevObserver = currentScope.activeObserver;
  currentScope.activeObserver = node;

  try {
    // Run previous cleanup if any
    prevCleanup?.();
    node.cleanup = undefined;

    const newValue = node.compute();
    const valueChanged = !((node && node.equals) ?? defaultEquals)(
      node.value,
      newValue,
    );

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
    node.error = error;
    node.dirty = false; // Prevent continuous retries on error
    console.warn(
      `⚠️ Error in reactive computation${node.name ? ` (${node.name})` : ""}:`,
      error,
    );
    return false;
  } finally {
    computationStack.delete(node);
    currentScope.activeObserver = prevObserver;
  }
}
```

This is the core function that executes the computation of a memo or effect.

1. It checks if the node has a `compute` function. If not, it does nothing.
2. **Cycle Detection:** It checks if the current `node` is already in the `computationStack`. If it is, a dependency cycle is detected, a warning is logged, an error is stored on the node, its `dirty` flag is reset, its sources are cleaned up, and it returns `false`.
3. It adds the current `node` to the `computationStack` to track the current execution path.
4. It retrieves and clears the previous `cleanup` function of the node and then calls `cleanupSources` to remove old dependencies.
5. It sets the `currentScope.activeObserver` to the current `node` before executing its `compute` function. This is crucial for dependency tracking within the `compute` function.
6. It executes the previous `cleanup` function (if any).
7. It calls the `node.compute()` function to get the new value.
8. It compares the new value with the old value using the `equals` function.
9. **For Effects:** It updates the `node.value` but does not notify any observers (effects are terminal nodes).
10. **For Memos:** If the value has changed, it updates `node.value`, increments `node.version`, and calls `notifyObservers`.
11. It resets the `node.dirty` flag and clears any previous `error`.
12. It uses a `try...catch...finally` block to handle potential errors during computation and ensures that the `currentScope.activeObserver` is always restored and the `node` is removed from the `computationStack`.

### `createEffect` Function

```ts
/**
 * 👁️ Effect
 */
function createEffect<TValue>(
  fn: () => TValue,
  options?: SignalOptions<TValue>,
) {
  const node = createNode<TValue>(undefined as any, {
    name: options?.name,
    type: NODE_TYPE.EFFECT,
    equals: options?.equals,
  });
  node.compute = fn;
  if (process.env.NODE_ENV !== "production") {
    if (node.observers.size > 0 || node.sources.size > 0) {
      console.warn(
        `⚠️ Effect '${
          node.name ?? `Node_${node.id}`
        }' was disposed while still active.`,
      );
    }
  }

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

  // Return disposal function
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
  onScopeCleanup(() => dispose());
  return dispose;
}
```

This function creates a new effect.

1. It calls `createNode` to create the underlying `ReactiveNode`, setting its `type` to `EFFECT`. The initial `value` is set to `undefined` as effects don't typically have a directly accessible value.
2. It assigns the provided `fn` to `node.compute`.
3. It sets up a custom `onDirty` function for the effect node. When a dependency of this effect changes and marks it as dirty:
    * It resets `node.onDirty` to prevent potential re-entrancy issues.
    * If there's an active batch, it adds the effect to `currentScope.pendingEffects`.
    * Otherwise, it adds the effect to `currentScope.pendingEffects` and schedules a microtask to run them.
4. It immediately calls `runNode(node)` to execute the effect for the first time and establish its initial dependencies.
5. It returns a `dispose` function that, when called, cleans up the effect by executing its cleanup function, removing it from the dependency graph, and removing it from the pending effects.
6. It also registers this `dispose` function with the current scope's cleanup mechanism using `onScopeCleanup`.

## Step 6: Creating Memos (`updateIfNecessary`, `createMemo`)

Memos (computed values) are derived reactive values.

### `updateIfNecessary` Function

```ts
function updateIfNecessary<TValue>(node: ReactiveNode<TValue>): boolean {
  if (!node.compute || !node.dirty) return false;

  return runNode(node);
}
```

This internal function checks if a memo needs to be re-evaluated. It returns `false` if the node doesn't have a `compute` function or is not marked as `dirty`. Otherwise, it calls `runNode` to recompute the memo's value and returns the result of `runNode` (which indicates if the value changed).

### `createMemo` Function

```ts
/**
 * 🔁 Memo
 */
function createMemo<TValue>(
  fn: () => TValue,
  options?: SignalOptions<TValue>,
): MemoValue<TValue> {
  const node = createNode<TValue>(undefined as any, {
    name: options?.name,
    type: NODE_TYPE.MEMO,
    equals: options?.equals,
  });
  node.compute = fn;

  // Create memo function that acts like a signal
  const memo = () => {
    trackAccess(node);
    updateIfNecessary(node);
    return node.value;
  };

  if (process.env.NODE_ENV !== "production") {
    memo._debug = {
      node,
      peek: () => node.value,
      dirty: () => node.dirty,
      id: node.id,
      name: node.name,
      createdAt: new Error().stack,
    };
  }

  // Initial computation
  runNode(node);

  // Add signal methods
  Object.assign(memo, {
    peek: () => node.value,
    [SIGNAL]: node,
  });

  onScopeCleanup(() => disposeNode(node));

  return memo as MemoValue<TValue>;
}
```

This function creates a new memo.

1. It calls `createNode` to create the underlying `ReactiveNode`, setting its `type` to `MEMO`.
2. It assigns the provided `fn` to `node.compute`.
3. It creates a getter function (`memo`) that, when called:
    * Calls `trackAccess` to register the current reactive context as a dependency.
    * Calls `updateIfNecessary` to recompute the memo's value if its dependencies have changed.
    * Returns the current `node.value`.
4. In non-production environments, a `_debug` property is added for inspection.
5. It immediately calls `runNode(node)` to perform the initial computation of the memo's value.
6. It extends the `memo` function with a `peek` method (to read the value without tracking) and the `[SIGNAL]` symbol.
7. It registers a cleanup function using `onScopeCleanup` to dispose of the memo's node when its scope is disposed.

## Step 7: Batching Signals (`batchSignals`)

Batching optimizes updates by grouping multiple signal changes.

### `batchSignals` Function

```ts
/**
 * 📦 Batch signals
 */
function batchSignals<TValue>(fn: () => TValue): TValue {
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

This function allows you to wrap a block of code containing multiple signal updates.

1. It increments the `currentScope.batchDepth` before executing the provided `fn`.
2. It uses a `try...finally` block to ensure that `currentScope.batchDepth` is always decremented after `fn` has executed.
3. In the `finally` block, if the `batchDepth` returns to 0 (meaning the batch is finished) and there are pending effects, it schedules a microtask to flush those effects. This ensures that effects are only run once after all the batched signal updates are complete.

## Step 8: Scope Cleanup (`onScopeCleanup`)

This function allows registering callbacks that run when a scope is disposed.

```ts
/**
 * 🧹 Cleanup function
 */
function onScopeCleanup(fn: () => void) {
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

This function allows you to register a callback function that will be executed when the `currentScope` is disposed.

1. It checks if there is an active `currentScope` and if its `cleanups` array exists.
2. If so, it pushes the provided cleanup `fn` into the `cleanups` array.
3. If there is no active scope, it logs a warning and throws an error, as cleanup functions should always be associated with a scope.

## Step 9: Reactive DOM Components (`List`, `Visible`, `Switch`)

These functions demonstrate how the reactive primitives can be used to build dynamic UI components. They leverage effects to update the DOM in response to signal changes.

### `List` Component

```ts
function List<TValue extends any[]>(
  list: SignalValue<TValue>,
  key: (item: TValue[number], index: number, items: TValue) => string,
  fn: (
    item: TValue[number],
    index: number,
    items: TValue,
  ) => ChildPrimitive | ChildPrimitive[],
) {
  const placeholder = document.createComment(`scope-${getScopeId()}list`);

  type NodeEntry = {
    value: TValue[number];
    elems: (Element | Text)[];
  };

  let nodes = new Map<string, NodeEntry>();

  createEffect(() => {
    const newNodes = new Map<string, NodeEntry>();
    const listValue = list();
    const maxLength = Math.max(listValue.length, nodes.size);

    let prevAnchor: Node = placeholder;

    for (let i = 0; i < maxLength; i++) {
      const item = listValue[i];
      const nodeKey = key(item, i, listValue);
      const oldEntry = nodes.get(nodeKey);

      if (i < listValue.length && oldEntry && oldEntry.value === item) {
        // Reuse, but MOVE before previous anchor
        for (let j = oldEntry.elems.length - 1; j >= 0; j--) {
          const elem = oldEntry.elems[j];
          if (prevAnchor.parentNode) {
            prevAnchor.parentNode.insertBefore(elem, prevAnchor);
          }
        }
        newNodes.set(nodeKey, oldEntry);
      } else if (i < listValue.length) {
        // New node to add
        const _result = fn(item, i, listValue);
        const elems = Array.isArray(_result) ? _result : [_result];
        const normalizedElems = elems.map((elem) =>
          elem instanceof Node
            ? elem
            : document.createTextNode(elem == null ? "" : String(elem)),
        );

        for (let j = normalizedElems.length - 1; j >= 0; j--) {
          const elem = normalizedElems[j];
          prevAnchor.parentNode?.insertBefore(elem, prevAnchor);
        }

        newNodes.set(nodeKey, { value: item, elems: normalizedElems });
      }

      prevAnchor = newNodes.get(nodeKey)?.elems[0] || prevAnchor;
    }

    // Remove any leftover nodes not in new list
    for (const [oldKey, oldEntry] of nodes) {
      if (!newNodes.has(oldKey)) {
        for (const elem of oldEntry.elems) {
          elem.remove();
        }
      }
    }

    nodes = newNodes;
  });

  onScopeCleanup(() => {
    for (const { elems } of nodes.values()) {
      for (const elem of elems) {
        elem.remove();
      }
    }
    nodes.clear();
  });

  return placeholder;
}
```

The `List` component efficiently renders a dynamic list based on a signal.

1. It creates a placeholder comment node to mark the position of the list in the DOM.
2. It maintains a `Map` (`nodes`) to track the DOM elements associated with each item in the list, using a unique `key` generated by the provided `key` function.
3. It uses `createEffect` to react to changes in the `list` signal.
4. Inside the effect:
    * It creates a new `Map` (`newNodes`) for the updated list.
    * It iterates through the new list and the old `nodes` to efficiently reuse existing DOM elements.
    * **Key-based reconciliation:** It uses the `key` function to identify items that have moved or stayed in the list.
    * If an item exists in the old list and its value is the same, it moves the corresponding DOM elements to the correct position in the new list.
    * If a new item is encountered, it calls the `fn` to generate the DOM elements and inserts them into the DOM.
    * It removes any DOM elements that are present in the old list but not in the new list.
    * It updates the `nodes` map with the `newNodes`.
5. It uses `onScopeCleanup` to remove all the created DOM elements and clear the `nodes` map when the component's scope is disposed, preventing memory leaks.
6. It returns the `placeholder` comment node, which acts as the anchor point for the dynamic list.

### `Visible` Component

```ts
function Visible(
  condition: SignalValue<boolean>,
  fn: () => ChildPrimitive | ChildPrimitive[],
) {
  const placeholder = document.createComment(`scope-${getScopeId()}visible`);
  let currentElems: (Element | Text)[] = [];

  createEffect(() => {
    const shouldShow = condition();

    if (shouldShow) {
   const _result = fn();
   const elems = Array.isArray(_result) ? _result : [_result];
   currentElems = elems.map((elem) =>
    elem instanceof Node
     ? elem
     : document.createTextNode(elem == null ? "" : String(elem)),
   );

   for (const elem of currentElems) {
    placeholder.parentNode?.insertBefore(elem, placeholder);
   }
    } else {
      for (const elem of currentElems) {
        elem.remove();
      }
      currentElems = [];
    }
  });

  onScopeCleanup(() => {
    for (const elem of currentElems) {
      elem.remove();
    }
    currentElems = [];
  });

  return placeholder;
}
```

The `Visible` component conditionally renders content based on a boolean signal.

1. It creates a placeholder comment node.
2. It uses `createEffect` to react to changes in the `condition` signal.
3. Inside the effect:
    * If `condition()` is true, it calls the `fn` to generate the DOM elements, normalizes them, and inserts them before the `placeholder`.
    * If `condition()` is false and elements are currently rendered, it removes all the `currentElems` from the DOM and clears the `currentElems` array.
4. It uses `onScopeCleanup` to remove any rendered elements when the component's scope is disposed.
5. It returns the `placeholder` comment node.

### `Switch` Component

```ts
function Switch<TValue extends string>(
  condition: SignalValue<TValue>,
  cases: {
    [key: string]: () => ChildPrimitive | ChildPrimitive[];
  },
) {
  const placeholder = document.createComment(`scope-${getScopeId()}switch`);
  let currentElems: (Element | Text)[] = [];
  let oldCase: string | undefined;

  createEffect(() => {
    const value = condition();
    const caseFn = cases[value];
    if (oldCase === value) {
      return;
    }
    oldCase = value;

    for (const elem of currentElems) {
      elem.remove();
    }
    currentElems = [];

    if (caseFn) {
      const _result = caseFn();
      const elems = Array.isArray(_result) ? _result : [_result];
      currentElems = elems.map((elem) =>
        elem instanceof Node
          ? elem
          : document.createTextNode(elem == null ? "" : String(elem)),
      );

      for (const elem of currentElems) {
        placeholder.parentNode?.insertBefore(elem, placeholder);
      }
    }
  });

  onScopeCleanup(() => {
    for (const elem of currentElems) {
      elem.remove();
    }
    currentElems = [];
  });

  return placeholder;
}
```

The `Switch` component renders different content based on the value of a string signal.

1. It creates a placeholder comment node.
2. It uses `createEffect` to react to changes in the `condition` signal.
3. Inside the effect:
    * It gets the current value of the `condition` signal.
    * It checks if the case has changed since the last execution. If not, it does nothing.
    * It removes any currently rendered elements (`currentElems`).
    * It looks up the corresponding rendering function (`caseFn`) in the `cases` object based on the `condition`'s value.
    * If a matching `caseFn` is found, it calls it to generate the DOM elements, normalizes them, and inserts them before the `placeholder`.
    * It updates the `oldCase` to the current value.
4. It uses `onScopeCleanup` to remove any rendered elements when the component's scope is disposed.
5. It returns the `placeholder` comment node.

## Conclusion

This comprehensive walkthrough has explored the implementation details of a fine-grained reactive system. You've seen how signals, effects, and memos are created and managed within scopes, how dependencies are tracked, and how changes are propagated efficiently. The reactive DOM components (`List`, `Visible`, `Switch`) demonstrate the power of this system for building dynamic user interfaces with minimal re-renders.

This code provides a solid foundation for building more complex reactive applications. By understanding these core principles, you can effectively leverage this system to create performant and maintainable code. Remember the importance of scopes for managing resources and the efficiency gains provided by fine-grained reactivity and batching.
