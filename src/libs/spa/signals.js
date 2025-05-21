// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./signals.d.ts" />

/**
 * Reactive Signals Library
 *
 * A fine-grained reactivity system inspired by SolidJS and React Signals,
 * providing automatic dependency tracking and efficient updates.
 *
 * Core primitives:
 * - Signals: Reactive state containers
 * - Effects: Side effects that automatically track dependencies
 * - Memos: Cached computations that update only when dependencies change
 * - Scopes: Nested reactive environments with lifecycle management
 * - Contexts: Value propagation through the reactive tree
 */

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

/**
 * @template TValue
 * @typedef {{ dispose: () => void; result: TValue }} ScopeResult
 */

/**
 * @typedef {object} Scope
 * @property {number} id - Unique identifier for the scope
 * @property {string} [name] - Optional name for debugging and tracing
 * @property {number} depth - Nesting level of the scope in the tree
 * @property {number} nextSignalId - Counter for generating unique signal IDs
 * @property {number} batchDepth - Current batch operation depth to defer updates
 * @property {ReactiveNode<any> | null} activeObserver - Currently executing node that tracks dependencies
 * @property {Set<ReactiveNode<any>>} pendingEffects - Effects waiting to be executed
 * @property {Set<ReactiveNode<any>>} nodes - All nodes (signals, memos, effects) owned by this scope
 * @property {boolean} pendingMicrotask - Whether a microtask is scheduled for batch updates
 * @property {Scope[]} nextScopes - Child scopes for hierarchical cleanup
 * @property {Scope | null} prevScope - Parent scope for hierarchical navigation
 * @property {(() => void)[]} cleanups - Cleanup functions to run on scope disposal
 * @property {Map<symbol, SignalValue<any>>} contexts - Context values available in this scope
 */

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

/**
 * @template TValue
 * @typedef {object} SignalOptions
 * @property {((a: TValue, b: TValue) => boolean) | undefined} [equals] - Custom equality check to prevent unnecessary updates
 * @property {string | undefined} [name] - Name for debugging and error reporting
 */

/**
 * @template TValue
 * @typedef {object} BaseSignalValue
 * @property {object} [_debug] - Debug information (only in development)
 * @property {ReactiveNode<TValue>} [_debug.node] - Reference to internal node
 * @property {() => TValue} [_debug.peek] - Function to get value without tracking
 * @property {() => boolean | undefined} [_debug.dirty] - Function to check if needs recomputation
 * @property {number} [_debug.id] - Node ID for debugging
 * @property {string | undefined} [_debug.name] - Node name for debugging
 * @property {string | undefined} [_debug.createdAt] - Stack trace for debugging
 * @property {() => TValue} peek - Function to get current value without tracking dependencies
 */

/**
 * @template TValue
 * @typedef {() => TValue} BaseGetter
 */

/**
 * @template TValue
 * @typedef {BaseGetter<TValue> & BaseSignalValue<TValue> & {
 *  set: (value: TValue) => void;
 *  update: (fn: (value: TValue) => TValue) => void;
 * }} SignalValue
 */

/**
 * @template TValue
 * @typedef {BaseGetter<TValue> & BaseSignalValue<TValue>} MemoValue
 */

/**
 * @template TValue
 * @typedef {{
 *   id: symbol;
 *   defaultValue: TValue | SignalValue<TValue>;
 *   Provider: <TReturn>(valueOrSignal: SignalValue<TValue> | TValue, fn: () => TReturn) => TReturn;
 *   DeferredProvider: <TReturn>(valueOrSignal: SignalValue<TValue> | TValue) => (fn: () => TReturn) => TReturn;
 * }} Context
 */

// Symbol used to access internal node (not exported)
const SIGNAL = Symbol("signal");

// Configuration constants
const MAX_DEPENDENCIES = 10000; // Maximum dependencies a node can track before warnings
const MAX_COMPUTATION_DEPTH = 10000; // Maximum recursive computation depth

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

/************************ ************************/
/*************  SCOPE MANAGEMENT  ***************/
/************************ ************************/

/**
 * 🧹 Disposes a scope and all its resources
 *
 * Recursively cleans up child scopes, runs cleanup functions,
 * and removes relationships with parent scope.
 *
 * @param {Scope} scope - The scope to clean up
 * @returns {void}
 *
 * @description
 * - Recursively disposes child scopes first
 * - Disposes all reactive nodes owned by the scope
 * - Clears context values
 * - Runs registered cleanup functions
 * - Detaches from parent scope
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

  // Development warning for leaked nodes
  if (process.env.NODE_ENV !== "production" && scope.nodes.size > 0) {
    console.warn(
      `Scope "${scope.name ?? scope.id}" still had ${
        scope.nodes.size
      } nodes when disposed.`,
    );
  }

  // Clear all state
  scope.nodes.clear();
  scope.pendingEffects.clear();
  scope.pendingMicrotask = false;

  // Run cleanup functions registered with onScopeCleanup
  for (const cleanup of scope.cleanups) cleanup();
  scope.cleanups = [];

  // Remove from parent scope's children
  if (scope.prevScope) {
    scope.prevScope.nextScopes = scope.prevScope.nextScopes.filter(
      (s) => s.id !== scope.id,
    );
  }
  scope.prevScope = null;
}

/**
 * 🧱 Creates a new reactive scope
 *
 * Scopes provide isolated reactive environments with their own lifecycle.
 * They enable modular component structures and proper cleanup of resources.
 *
 * @template TValue
 * @param {() => TValue} fn - Function to run within the new scope
 * @param {{
 *   detached?: boolean;
 *   name?: string;
 *   deferredProviders?: ReturnType<Context<any>['DeferredProvider']>[]
 * }} [options] - Configuration options
 * @returns {ScopeResult<TValue>} - Object with result and dispose function
 *
 * @example
 * // Basic component with cleanup
 * const component = createScope(() => {
 *   const counter = $signal(0);
 *
 *   // Setup DOM elements
 *   const elem = document.createElement('div');
 *   document.body.appendChild(elem);
 *
 *   // Register cleanup
 *   onScopeCleanup(() => {
 *     elem.remove();
 *   });
 *
 *   return elem;
 * });
 *
 * // Later, to clean up:
 * component.dispose();
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
      // Apply each context provider in sequence
      for (const lazyProvider of options.deferredProviders) {
        if (!result) {
          result = lazyProvider;
          continue;
        }
        result = lazyProvider(result);
      }
      // Execute the function within the final context
      result = result ? result(fn) : fn();
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

/**
 * 🧹 Registers a function to run when scope is disposed
 *
 * Use this to clean up resources like DOM nodes, event listeners,
 * timers, or other side effects when a scope is unmounted.
 *
 * @param {() => void} fn - Cleanup function to register
 * @throws {Error} If called outside of a reactive scope
 * @returns {void}
 *
 * @example
 * createScope(() => {
 *   // Create a timer
 *   const intervalId = setInterval(() => console.log('tick'), 1000);
 *
 *   // Register cleanup to prevent memory leaks
 *   onScopeCleanup(() => {
 *     clearInterval(intervalId);
 *   });
 * });
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

/**
 * 🔢 Gets the current scope's unique identifier
 *
 * Useful for generating unique IDs for elements in templates.
 *
 * @returns {number} The current scope's ID
 *
 * @example
 * createScope(() => {
 *   const scopeId = getScopeId();
 *   const buttonId = `button-${scopeId}`;
 *
 *   document.body.innerHTML = `<button id="${buttonId}">Click me</button>`;
 *   document.getElementById(buttonId).addEventListener('click', handleClick);
 * });
 */
function getScopeId() {
  return currentScope.id;
}

/************************ ************************/
/***********  REACTIVE PRIMITIVES  **************/
/************************ ************************/

/**
 * 🧱 Creates a new reactive node
 *
 * Internal utility for creating the underlying data structure for
 * signals, effects, and memos.
 *
 * @template TValue
 * @param {TValue} val - Initial value for the node
 * @param {{
 *   name?: string;
 *   equals?: (a: TValue, b: TValue) => boolean;
 *   type: (typeof NODE_TYPE)[keyof typeof NODE_TYPE];
 * }} options - Node configuration
 * @returns {ReactiveNode<TValue>} The created reactive node
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

/**
 * 🛑 Reads a value without tracking dependencies
 *
 * This prevents the current effect/memo from depending on
 * signals read within the provided function.
 *
 * @template TValue
 * @param {() => TValue} fn - Function to execute without tracking
 * @returns {TValue} The result of the function
 *
 * @example
 * // Effect that only depends on `name`, not `counter`
 * $effect(() => {
 *   const nameVal = name();
 *
 *   // Read counter without creating a dependency
 *   const counterVal = untrack(() => counter());
 *
 *   console.log(`Name: ${nameVal}, Counter: ${counterVal}`);
 * });
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

/**
 * 🧭 Tracks access to a reactive node
 *
 * Internal function that establishes dependency relationships when
 * signals are accessed during effects or memo executions.
 *
 * @template TValue
 * @param {ReactiveNode<TValue>} sourceNode - Node being accessed
 * @returns {void}
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

/**
 * 🧹 Recursively flushes pending effects
 *
 * Processes all queued effects in the current scope and its children.
 *
 * @param {Scope} scope - The scope to process
 * @returns {void}
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

/**
 * ⏳ Schedules processing of pending effects
 *
 * Queues a microtask to run all pending effects, ensuring
 * batched updates and preventing redundant executions.
 *
 * @returns {void}
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
 * 📣 Notifies observers when a node's value changes
 *
 * Marks dependent computations as dirty and schedules effects for re-execution.
 *
 * @template TValue
 * @param {ReactiveNode<TValue>} node - The node with the changed value
 * @returns {void}
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

/**
 * 🧹 Disposes a reactive node and cleans up resources
 *
 * Releases all resources associated with a node, including
 * running cleanup functions and removing from the dependency graph.
 *
 * @param {ReactiveNode<any>} node - Node to dispose
 * @returns {void}
 */
function disposeNode(node) {
  // Run the node's cleanup function if it exists
  if (node.cleanup) {
    node.cleanup();
    node.cleanup = undefined;
  }

  // Remove dependencies on other nodes
  cleanupSources(node);

  // Remove from observers' dependency lists
  for (const observer of node.observers) {
    observer.sources.delete(node);
  }
  node.observers.clear();

  // Remove from scope's tracking
  node.scopeRef.pendingEffects.delete(node);
  node.scopeRef.nodes.delete(node);

  // Clear computation function to mark as disposed
  node.compute = undefined;

  // Development warning for nodes with lingering relationships
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

// Default equality function for value comparison
const defaultEquals = Object.is;

/**
 * Checks if a value is a reactive signal
 *
 * @param {*} item - Value to check
 * @returns {item is SignalValue<any>} True if the item is a signal
 */
function isSignal(item) {
  return typeof item === "function" && SIGNAL in item;
}

/**
 * 🌱 Creates a reactive signal
 *
 * Signals are the core primitive for storing reactive state.
 * When a signal's value changes, all effects that depend on it
 * are automatically scheduled for re-execution.
 *
 * @template TValue
 * @param {TValue} initialValue - Starting value for the signal
 * @param {SignalOptions<TValue>} [options] - Configuration options
 * @returns {SignalValue<TValue>} The created signal
 *
 * @example
 * // Basic counter with custom label
 * const count = $signal(0, { name: 'counter' });
 * const doubled = $memo(() => count() * 2);
 *
 * // Reading values
 * console.log(count()); // 0
 * console.log(doubled()); // 0
 *
 * // Updating values (automatically updates dependents)
 * count.set(5);
 * console.log(doubled()); // 10
 *
 * // Updating based on previous value
 * count.update(prev => prev + 1);
 * console.log(count()); // 6
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

  // Register automatic cleanup when scope is disposed
  onScopeCleanup(() => disposeNode(node));

  return signal;
}

/************************ ************************/
/**********  COMPUTED DEPENDENCIES  *************/
/************************ ************************/

/**
 * Stack to track computation nesting for cycle detection
 * @type {Set<ReactiveNode<any>>}
 */
const computationStack = new Set();

/**
 * 🔁 Removes dependencies from a node
 *
 * Cleans up all tracked dependencies, ensuring both sides of
 * the dependency relationship are updated.
 *
 * @template TValue
 * @param {ReactiveNode<TValue>} node - Node to clean up
 * @returns {void}
 */
function cleanupSources(node) {
  // Remove this node as an observer from all its sources
  for (const [source] of node.sources) {
    source.observers.delete(node);
  }

  // Clear all tracked sources
  node.sources = new Map();
}

/**
 * 🔁 Executes a node's computation
 *
 * Core function that handles the execution of effects and memos,
 * manages dependency tracking, and detects circular dependencies.
 *
 * @template TValue
 * @param {ReactiveNode<TValue>} node - Node to run
 * @returns {boolean} Whether the node's value changed
 */
function runNode(node) {
  // Skip if node was disposed
  if (!node.compute) return false;

  // Check for excessive recursion
  if (
    process.env.NODE_ENV !== "production" &&
    computationStack.size > MAX_COMPUTATION_DEPTH
  ) {
    const error = new Error(
      `Maximum computation depth exceeded (${MAX_COMPUTATION_DEPTH})`,
    );
    console.error(error);
    node.error = error;
    node.dirty = false;
    return false;
  }

  // Detect circular dependencies
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
    // Handle errors during computation
    node.error = error;
    node.dirty = false; // Prevent continuous retries on error
    console.warn(
      `⚠️ Error in reactive computation${node.name ? ` (${node.name})` : ""}:`,
      error,
    );
    return false;
  } finally {
    // Always clean up, even if an error occurred
    computationStack.delete(node);
    currentScope.activeObserver = prevObserver;
  }
}

/**
 * 👁️ Creates an effect
 *
 * Effects are side-effects that automatically track their dependencies
 * and re-run when any dependency changes. Unlike signals and memos,
 * effects don't have a return value accessible to other reactive code.
 *
 * @template TValue
 * @param {() => TValue} fn - Effect function to run
 * @param {SignalOptions<TValue>} [options] - Configuration options
 * @returns {() => void} Function to manually dispose the effect
 *
 * @example
 * // DOM updating effect
 * const name = $signal("World");
 * const element = document.getElementById("greeting");
 *
 * $effect(() => {
 *   element.textContent = `Hello, ${name()}!`;
 * });
 *
 * // The element will automatically update when name changes
 * name.set("User"); // Element text becomes "Hello, User!"
 */
function $effect(fn, options) {
  const node = createNode(/** @type {TValue} */ (undefined), {
    name: options?.name,
    type: NODE_TYPE.EFFECT,
    equals: options?.equals,
  });
  node.compute = fn;

  // Development warning for potential issues
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

/**
 * 🔁 Updates a node if it's marked as dirty
 *
 * Internal function used by memos to ensure fresh values.
 *
 * @template TValue
 * @param {ReactiveNode<TValue>} node - Node to update if needed
 * @returns {boolean} Whether the node was updated
 */
function updateIfNecessary(node) {
  if (!node.compute || !node.dirty) return false;
  return runNode(node);
}

/**
 * 🔁 Creates a memoized value
 *
 * Memos are cached computations that automatically update when their
 * dependencies change. They're perfect for derived values that are
 * expensive to calculate.
 *
 * @template TValue
 * @param {() => TValue} fn - Function to compute the value
 * @param {SignalOptions<TValue>} [options] - Configuration options
 * @returns {MemoValue<TValue>} The memoized value
 *
 * @example
 * // Filtered list that only recalculates when dependencies change
 * const items = $signal([1, 2, 3, 4, 5]);
 * const threshold = $signal(3);
 *
 * // This computation only runs when items or threshold change
 * const filteredItems = $memo(() => {
 *   console.log('Filtering items'); // Only logs when dependencies change
 *   return items().filter(n => n > threshold());
 * });
 *
 * console.log(filteredItems()); // [4, 5]
 * console.log(filteredItems()); // [4, 5] (no recalculation)
 *
 * threshold.set(2); // Triggers recalculation
 * console.log(filteredItems()); // [3, 4, 5]
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

  // Add debug properties in development
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

  // Register automatic cleanup when scope is disposed
  onScopeCleanup(() => disposeNode(node));

  return memo;
}

/**
 * 📦 Batches multiple signal updates
 *
 * Defers effect execution until all updates in the batch are complete,
 * which improves performance when making multiple related changes.
 *
 * @template TValue
 * @param {() => TValue} fn - Function containing multiple signal updates
 * @returns {TValue} The result of the function
 *
 * @example
 * // Update multiple related signals efficiently
 * batchSignals(() => {
 *   // These won't trigger effects until the batch completes
 *   firstName.set("John");
 *   lastName.set("Doe");
 *   age.set(30);
 * });
 *
 * // Without batching, each set would trigger effects immediately
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

/************************ ************************/
/**************  CONTEXT SYSTEM  ****************/
/************************ ************************/

/**
 * Context provider implementation for passing values down the scope tree
 *
 * @template TValue
 * @template TReturn
 * @param {symbol} id - Context identifier
 * @param {SignalValue<TValue>} value - Signal containing the context value
 * @param {(() => TReturn)} fn - Function to run with the provided context
 * @returns {TReturn} The result of the function
 */
function provideContext(id, value, fn) {
  const parentScope = currentScope;
  const previousValue = parentScope.contexts.get(id);
  const hadPrevValue = parentScope.contexts.has(id);

  // Set the new context value
  parentScope.contexts.set(id, value);

  try {
    return fn();
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    // Restore previous state
    if (hadPrevValue) {
      parentScope.contexts.set(
        id,
        /** @type {NonNullable<typeof previousValue>} */ (previousValue),
      );
    } else {
      parentScope.contexts.delete(id);
    }
  }
}

/**
 * 🌳 Creates a context for passing values down the scope tree
 *
 * Contexts allow passing values to deeply nested components without
 * explicit prop drilling. They're perfect for theme data, authentication
 * state, and other app-wide or section-specific data.
 *
 * @template TValue
 * @param {SignalValue<TValue>|TValue} defaultValue - Default value if no provider is found
 * @param {{ name?: string }} [options] - Configuration options
 * @returns {Context<TValue>} The created context
 *
 * @example
 * // Create a theme context
 * const ThemeContext = createContext({ mode: 'light' });
 *
 * // Provide it at the root level
 * createScope(() => {
 *   const theme = $signal({ mode: 'dark' });
 *
 *   return ThemeContext.Provider(theme, () => {
 *     // Child components can now consume the theme
 *     return renderApp();
 *   });
 * });
 */
function createContext(defaultValue, options) {
  const id = Symbol(options?.name ?? "context");
  const context = {
    id,
    defaultValue,
    /**
     * @template TReturn
     * @param {SignalValue<TValue>|TValue} valueOrSignal
     * @param {() => TReturn} fn
     */
    Provider: (valueOrSignal, fn) => {
      const contextProviderScope = createScope(() => {
        const value = isSignal(valueOrSignal)
          ? valueOrSignal
          : $signal(valueOrSignal);
        return provideContext(id, value, fn);
      });

      onScopeCleanup(contextProviderScope.dispose);
      return contextProviderScope.result;
    },
    /**
     * @param {SignalValue<TValue>|TValue} valueOrSignal
     */
    DeferredProvider:
      (valueOrSignal) =>
      /**
       * @template TReturn
       * @param {() => TReturn} fn
       */
      (fn) => {
        const contextProviderScope = createScope(() => {
          const value = isSignal(valueOrSignal)
            ? valueOrSignal
            : $signal(valueOrSignal);
          return provideContext(id, value, fn);
        });

        onScopeCleanup(contextProviderScope.dispose);
        return contextProviderScope.result;
      },
  };

  return context;
}

/**
 * 🔍 Gets a context value from the current scope or ancestors
 *
 * Retrieves the current value of a context, walking up the scope tree
 * to find the nearest provider. Falls back to default value if no provider
 * is found.
 *
 * @template TValue
 * @param {Context<TValue>} context - The context to read
 * @returns {SignalValue<TValue>} Signal containing the context value
 *
 * @example
 * // Inside a deeply nested component
 * function UserProfile() {
 *   const theme = getContext(ThemeContext);
 *
 *   $effect(() => {
 *     console.log(`Current theme: ${theme().mode}`);
 *   });
 * }
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

    // Development warnings when falling back to default
    if (
      process.env.NODE_ENV !== "production" &&
      !scope // Check if it's the root scope parent (null)
    ) {
      console.warn(
        `Context ${
          context.id.description || "unknown"
        } not found in scope chain, using default value`,
      );

      if (
        !isSignal(defaultValue) // Check if the default value is not a signal
      ) {
        console.warn(
          `Default value for context ${
            context.id.description || "unknown"
          } is not a signal, using default value`,
        );

        if (defaultValue === undefined) {
          console.warn(
            `Default value for context ${
              context.id.description || "unknown"
            } is undefined`,
          );
        }
      }
    }
  }

  // Return default if no provider found, wrapping in signal if needed
  return /** @type {SignalValue<TValue>}*/ (
    isSignal(defaultValue) ? defaultValue : $signal(defaultValue)
  );
}

/**
 * 🔍 Gets a derived value from a context
 *
 * Creates a memo that selects a specific part of a context value,
 * updating only when the selected part changes.
 *
 * @template TValue
 * @template TSelectorReturn
 * @param {Context<TValue>} context - The context to read from
 * @param {(state: TValue) => TSelectorReturn} selector - Function to extract the needed data
 * @returns {MemoValue<TSelectorReturn>} Memoized selected value
 *
 * @example
 * // Theme context contains { mode, colors, fontSizes }
 * // Only select the mode, ignoring other changes
 * const themeMode = getContextSelector(ThemeContext, theme => theme.mode);
 *
 * $effect(() => {
 *   // Only runs when theme.mode changes, not other theme properties
 *   console.log(`Current mode: ${themeMode()}`);
 * });
 */
function getContextSelector(context, selector) {
  const value = getContext(context);
  return $memo(() => selector(value()));
}

export {
  createScope,
  disposeScope,
  onScopeCleanup,
  getScopeId,
  isSignal,
  $signal,
  $effect,
  $memo,
  batchSignals,
  untrack,
  createContext,
  getContext,
  getContextSelector,
};
