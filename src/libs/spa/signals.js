const NODE_TYPE = {
  SIGNAL: 0,
  EFFECT: 1,
  MEMO: 2,
};

/**
 * @typedef {object} Scope
 * @property {number} id - unique identifier
 * @property {string} [name] - optional name for debugging
 * @property {number} depth - depth of the scope in the tree
 * @property {number} nextSignalId - next signal ID to be assigned
 * @property {number} batchDepth - current batch depth
 * @property {ReactiveNode<any> | null} activeObserver - current active observer
 * @property {Set<ReactiveNode<any>>} pendingEffects - set of pending effects
 * @property {Set<ReactiveNode<any>>} nodes - set of all nodes (signals, memos, effects)
 * @property {boolean} pendingMicrotask - whether a microtask is pending
 * @property {Scope[]} nextScopes - child scopes
 * @property {Scope | null} prevScope - parent scope
 * @property {(() => void)[]} cleanups - array of cleanup functions
 * @property {Map<symbol, SignalValue<any>>} contexts - Map of context values
 */

/**
 * @template TValue
 * @typedef {object} ReactiveNode
 * @property {number} id
 * @property {number} version - incremented when value changes
 * @property {Map<ReactiveNode<any>, number>} sources - dependencies + version seen
 * @property {Set<ReactiveNode<any>>} observers - who depends on me
 * @property {() => TValue} [compute] - how to calculate value
 * @property {TValue} value - cached value (for signals/computeds)
 * @property {(() => void) | void} [cleanup] - cleanup function (for effects)
 * @property {() => void} [onDirty] - how to rerun when dirty
 * @property {boolean} [dirty]
 * @property {any} [error]
 * @property {string} [name] - for debugging and cycle detection
 * @property {(typeof NODE_TYPE)[keyof typeof NODE_TYPE]} type - type of node
 * @property {((a: TValue, b: TValue) => boolean) | undefined} [equals]
 * @property {Scope} scopeRef - reference to the current scope
 */
// interface SignalOptions<TValue> {
//   equals?: (a: TValue, b: TValue) => boolean;
//   name?: string;
// }
/**
 * @template TValue
 * @typedef {object} SignalOptions
 * @property {((a: TValue, b: TValue) => boolean) | undefined} [equals] - custom equality check
 * @property {string | undefined} [name] - name for debugging
 */
// interface BaseSignalValue<TValue> {
//   _debug?: {
//     node: ReactiveNode<TValue>;
//     peek: () => TValue;
//     dirty: () => boolean | undefined;
//     id: number;
//     name: string | undefined;
//     createdAt?: string; // for stack trace
//   };
//   peek: () => TValue;
// }
/**
 * @template TValue
 * @typedef {object} BaseSignalValue
 * @property {object} [_debug] - debug information
 * @property {ReactiveNode<TValue>} [_debug.node] - node reference
 * @property {() => TValue} [_debug.peek] - function to peek value
 * @property {() => boolean | undefined} [_debug.dirty] - function to check if dirty
 * @property {number} [_debug.id] - node ID
 * @property {string | undefined} [_debug.name] - node name
 * @property {string | undefined} [_debug.createdAt] - stack trace
 * @property {() => TValue} peek - function to get the current value
 */
// interface SignalValue<TValue> extends BaseSignalValue<TValue> {
//   (): TValue;
//   set(value: TValue): void;
//   update(fn: (value: TValue) => TValue): void;
// }
/**
 * @template TValue
 * @typedef {() => TValue} BaseGetter
 */
/**
 * @template TValue
 * @typedef {BaseGetter<TValue> & BaseSignalValue<TValue> & {
 *  set: (value: TValue) => void
 * }} SignalValue
 */
// interface MemoValue<TValue> {
//   (): TValue;
// }
/**
 * @template TValue
 * @typedef {BaseGetter<TValue> & BaseSignalValue<TValue>} MemoValue
 */

/**
 * @template TValue
 * @typedef {{
 *			id: symbol;
 *			defaultValue: TValue | SignalValue<TValue>;
 *			Provider: <TReturn>(valueOrSignal: SignalValue<TValue> | TValue, fn: () => TReturn) => TReturn;
 * 			DeferredProvider: <TReturn>(valueOrSignal: SignalValue<TValue> | TValue) => (fn: () => TReturn) => TReturn;
 *	}} Context
 */

// Symbol used to access internal node (not exported)
const SIGNAL = Symbol("signal");

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
  name: undefined,
  contexts: new Map(),
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rootScope = currentScope;

/************************ ************************/
/***************** Create Scope *****************/
/************************ ************************/

/**
 * 🧹 Dispose a scope and all its child scopes
 *
 * @param {Scope} scope
 * @returns {void}
 */
function disposeScope(scope) {
  // Recursively dispose child scopes first
  for (const child of scope.nextScopes) {
    disposeScope(child);
  }
  scope.nextScopes = [];

  for (const node of scope.nodes) {
    disposeNode(node);
  }
  // ???
  scope.contexts.clear();

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

/**
 * 🧱 Create a new scope
 *
 * @template TValue
 * @param {() => TValue} fn Function to run in the new scope
 * @param {{ detached?: boolean; name?: string; deferredProviders?: ReturnType<Context<any>['DeferredProvider']>[]  }} [options] Options for the scope
 * @returns {{ dispose: () => void; result: TValue }} Result of the function and a dispose function
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

  if (!options?.detached) {
    parentScope.nextScopes.push(newScope);
  }

  // $switch to new scope
  currentScope = newScope;

  /** @type {any} */
  let result;
  try {
    if (options?.deferredProviders) {
      // Apply each lazy provider
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
    currentScope = parentScope; // Restore parent scope
  }

  return {
    result,
    dispose: () => {
      disposeScope(newScope);
    },
  };
}

/**
 * 🧹 Cleanup function
 *
 * @param {() => void} fn Function to run on cleanup
 * @throws {Error} If called outside of a scope
 * @returns {void}
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

function getScopeId() {
  return currentScope.id;
}
/************************ ************************/
/***************** Create Signal *****************/
/************************ ************************/

/**
 * 🧱 Create a fresh node
 *
 * @template TValue
 * @param {TValue} val Initial value
 * @param {{ name?: string; equals?: (a: TValue, b: TValue) => boolean; type: (typeof NODE_TYPE)[keyof typeof NODE_TYPE]; }} options Options for the node
 * @returns {ReactiveNode<TValue>} The created node
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

  currentScope.nodes.add(node);

  return node;
}

/**
 * 🛑 Read a value without tracking dependencies
 *
 * @template TValue
 * @param {() => TValue} fn Function to execute
 * @returns {TValue} The result of the function
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

// Add to options
const MAX_DEPENDENCIES = 10000;

/**
 * 🧭 Track a read dependency
 *
 * @template TValue
 * @param {ReactiveNode<TValue>} sourceNode The node to track
 * @returns {void}
 */
function trackAccess(sourceNode) {
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

  if (currentScope.activeObserver) {
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

    // ✅ Prevent duplicate tracking
    if (!currentScope.activeObserver.sources.has(sourceNode)) {
      currentScope.activeObserver.sources.set(sourceNode, sourceNode.version);
      sourceNode.observers.add(currentScope.activeObserver);
    }
  }
}

/**
 * 🧹 Flush pending effects on the scope and it's children scopes recursively
 *
 * @param {Scope} scope The scope to flush
 * @returns {void}
 */
function flushPendingEffects(scope) {
  for (const effect of scope.pendingEffects) {
    runNode(effect);
  }
  scope.pendingEffects.clear();

  for (const child of scope.nextScopes) {
    flushPendingEffects(child);
  }
}

/**
 * ⏳ Schedule flush of pending effects
 *
 * @returns {void}
 */
function scheduleMicrotask() {
  if (currentScope.pendingMicrotask || currentScope.pendingEffects.size === 0) {
    return;
  }

  currentScope.pendingMicrotask = true;
  queueMicrotask(() => {
    // Check if scope has been disposed
    if (!currentScope.prevScope && currentScope.id !== rootScope.id) {
      return; // Scope has been disposed
    }
    currentScope.pendingMicrotask = false;
    // for (const effect of currentScope.pendingEffects) runNode(effect);
    // currentScope.pendingEffects.clear();

    // Instead of only currentScope → flush all scopes recursively
    flushPendingEffects(currentScope);
  });
}

/**
 * 📣 Notify observers of a change
 *
 * @template TValue
 * @param {ReactiveNode<TValue>} node The node to notify
 * @returns {void}
 */
function notifyObservers(node) {
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

/**
 * 🧹 Dispose a node
 *
 * @param {ReactiveNode<any>} node The node to dispose
 * @returns {void}
 */
function disposeNode(node) {
  if (node.cleanup) {
    node.cleanup();
    node.cleanup = undefined;
  }
  cleanupSources(node);

  // Make sure this node is removed from all observers
  for (const observer of node.observers) {
    observer.sources.delete(node);
  }
  node.observers.clear();

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

const defaultEquals = Object.is;

/**
 * @param {*} item
 * @returns {item is SignalValue<any>}
 */
function isSignal(item) {
  return typeof item === "function" && SIGNAL in item;
}

/**
 * 🌱 Signal primitive
 *
 * @template TValue
 * @param {TValue} initialValue Initial value
 * @param {SignalOptions<TValue>} [options] Options for the signal
 * @returns {SignalValue<TValue>} The created signal
 */
function createSignal(initialValue, options) {
  const node = createNode(initialValue, {
    name: options?.name,
    type: NODE_TYPE.SIGNAL,
    equals: options?.equals,
  });

  /** @type {SignalValue<TValue>} */
  const signal = Object.assign(
    () => {
      trackAccess(node);
      return node.value;
    },
    {
      /** @param {TValue} newValue */
      set: (newValue) => {
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

/************************ ************************/
/***************** Create Effect *****************/
/************************ ************************/

/**
 * 🔄 Core computation logic
 * Runs a memo/effect and handles dependency tracking + cleanup
 *
 * @type {Set<ReactiveNode<any>>} node The node to run
 */
const computationStack = new Set();

/**
 * 🔁 Remove source links from a node
 *
 * @template TValue
 * @param {ReactiveNode<TValue>} node The node to clean up
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

const MAX_COMPUTATION_DEPTH = 10000;

/**
 * 🔁 Run a node and handle cycles
 *
 * @template TValue
 * @param {ReactiveNode<TValue>} node The node to run
 * @returns {boolean} Whether the node was successfully run
 */
function runNode(node) {
  if (!node.compute) return false;

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

/**
 * 👁️ Effect
 *
 * @template TValue
 * @param {() => TValue} fn Function to run as an effect
 * @param {SignalOptions<TValue>} [options] Options for the effect
 * @returns {() => void} Disposal function to clean up the effect
 */
function createEffect(fn, options) {
  const node = createNode(/** @type {TValue} */ (undefined), {
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

/**
 * 🔁 Update a node if necessary
 *
 * @template TValue
 * @param {ReactiveNode<TValue>} node The node to update
 * @returns {boolean} Whether the node was updated
 */
function updateIfNecessary(node) {
  if (!node.compute || !node.dirty) return false;

  return runNode(node);
}

/**
 * 🔁 Memo
 *
 * @template TValue
 * @param {() => TValue} fn Function to run as a memo
 * @param {SignalOptions<TValue>} [options] Options for the memo
 * @returns {MemoValue<TValue>} The created memo
 */
function createMemo(fn, options) {
  const node = createNode(/** @type {TValue} */ (undefined), {
    name: options?.name,
    type: NODE_TYPE.MEMO,
    equals: options?.equals,
  });
  node.compute = fn;

  /**
   * Create memo function that acts like a signal
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

  onScopeCleanup(() => disposeNode(node));

  return memo;
}

/**
 * 📦 Batch signals
 *
 * @template TValue
 * @param {() => TValue} fn Function to run in batch
 * @returns {TValue} The result of the function
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

// // example of usage
// function createScope2() {
//   return createScope(() => {
//     const counter = createSignal(0);
//     const scopeId = getScopeId();

//     const secondScopeSection = document.createElement("div");
//     const incrementButton = document.createElement("button");
//     incrementButton.textContent = "Increment";
//     incrementButton.addEventListener("click", () => {
//       counter.set(counter() + 1);
//     });
//     secondScopeSection.appendChild(incrementButton);
//     const decrementButton = document.createElement("button");
//     decrementButton.textContent = "Decrement";
//     decrementButton.addEventListener("click", () => {
//       counter.set(counter() - 1);
//     });
//     secondScopeSection.appendChild(decrementButton);
//     const resetButton = document.createElement("button");
//     resetButton.textContent = "Reset";
//     resetButton.addEventListener("click", () => {
//       counter.set(0);
//     });
//     secondScopeSection.appendChild(resetButton);
//     const counterDisplay = document.createElement("h2");
//     counterDisplay.id = `second-scope-counter-${scopeId}`;
//     counterDisplay.textContent = `Second Scope Counter: ${counter.peek()}`;
//     secondScopeSection.appendChild(counterDisplay);
//     createEffect(() => {
//       counterDisplay.textContent = `Second Scope Counter: ${counter()}`;
//     });
//     onScopeCleanup(() => {
//       secondScopeSection.remove();
//     });

//     return secondScopeSection;
//   });
// }

// batchSignals(() => {
//   createScope(() => {
//     const scopeId = getScopeId();
//     const counter = createSignal(0);
//     const increment = () => {
//       counter.set(counter() + 1);
//     };
//     const decrement = () => {
//       counter.set(counter() - 1);
//     };
//     const reset = () => {
//       counter.set(0);
//     };
//     const double = createMemo(() => counter() * 2);

//     document.body.innerHTML = `
// 		<div>
// 			<h1 id=${`counter-${scopeId}`}>Counter: ${counter.peek()}</h1>
// 			<button id=${`increment-${scopeId}`}>Increment</button>
// 			<button id=${`decrement-${scopeId}`}>Decrement</button>
// 			<button id=${`reset-${scopeId}`}>Reset</button>
// 			<p id=${`double-${scopeId}`}>Double: ${double.peek()}</p>
// 		</div>
// 		<hr />
// 		<section>
// 			<h1>Second Scope Toggle</h1>
// 			<button id=${`toggleSecondScope-${scopeId}`}>Toggle Second Scope</button>
// 		</section>
// 	`;
//     document
//       .getElementById(`increment-${scopeId}`)
//       ?.addEventListener("click", increment);
//     document
//       .getElementById(`decrement-${scopeId}`)
//       ?.addEventListener("click", decrement);
//     document
//       .getElementById(`reset-${scopeId}`)
//       ?.addEventListener("click", reset);

//     /** @type {ReturnType<typeof createScope2> | null} */
//     let secondScope;
//     document
//       .getElementById(`toggleSecondScope-${scopeId}`)
//       ?.addEventListener("click", () => {
//         if (secondScope) {
//           secondScope.dispose();
//           secondScope = null;
//         } else {
//           secondScope = createScope2();
//           document.body.appendChild(secondScope.result);
//         }
//       });

//     createEffect(() => {
//       const element = document.getElementById(`counter-${scopeId}`);

//       if (element) element.textContent = `Counter: ${counter()}`;
//     });
//     createEffect(() => {
//       const element = document.getElementById(`double-${scopeId}`);

//       if (element) element.textContent = `Double: ${double()}`;
//     });
//   });
// });

/************************ ************************/
/***************** Create Context *****************/
/************************ ************************/

/**
 * @template TValue
 * @template TReturn
 * @param {symbol} id
 * @param {SignalValue<TValue>} value
 * @param {(() => TReturn)} fn
 */
function provideContext(id, value, fn) {
  const parentScope = currentScope;
  const previousValue = parentScope.contexts.get(id);
  const hadPrevValue = parentScope.contexts.has(id);

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
 * @template TValue
 * @param {SignalValue<TValue>|TValue} defaultValue
 * @param {{ name?: string }} [options]
 * @returns {Context<TValue>}
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
      const value = isSignal(valueOrSignal)
        ? valueOrSignal
        : createSignal(valueOrSignal);
      return provideContext(id, value, fn);
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
        const value = isSignal(valueOrSignal)
          ? valueOrSignal
          : createSignal(valueOrSignal);
        return provideContext(id, value, fn);
      },
  };

  return context;
}

/**
 * @template TValue
 * @param {Context<TValue>} context
 * @returns {SignalValue<TValue>}
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
    isSignal(defaultValue) ? defaultValue : createSignal(defaultValue)
  );
}

/**
 *
 * @template TValue
 * @template TSelectorReturn
 * @param {Context<TValue>} context
 * @param {(state: TValue) => TSelectorReturn} selector
 * @returns
 */
function getContextSelector(context, selector) {
  const value = getContext(context);
  return createMemo(() => selector(value()));
}

export {
  createScope,
  disposeScope,
  onScopeCleanup,
  getScopeId,
  createSignal,
  createEffect,
  createMemo,
  batchSignals,
  untrack,
  createContext,
  getContext,
  getContextSelector,
};
