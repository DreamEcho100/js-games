/* eslint-disable @typescript-eslint/no-explicit-any */

const NODE_TYPE = {
  SIGNAL: 0,
  EFFECT: 1,
  MEMO: 2,
};

interface ReactiveNode<TValue> {
  id: number;
  version: number; // incremented when value changes
  sources: WeakMap<ReactiveNode<any>, number>; // dependencies + version seen
  observers: Set<ReactiveNode<any>>; // who depends on me
  sourceList: ReactiveNode<any>[]; // We can't iterate a WeakMap directly, so we need to track sources separately
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
  dispose: () => void;
}
interface SignalOptions<TValue> {
  equals?: (a: TValue, b: TValue) => boolean;
  name?: string;
}
interface BaseSignalValue<TValue> {
  _debug?: {
    node: ReactiveNode<TValue>;
    peek: () => TValue;
    dirty: () => boolean | undefined;
    id: number;
    name: string | undefined;
    createdAt?: string; // for stack trace
  };
  dispose: () => void;
  peek: () => TValue;
}
interface SignalValue<TValue> extends BaseSignalValue<TValue> {
  (): TValue;
  set(value: TValue): void;
  update(fn: (value: TValue) => TValue): void;
}
interface MemoValue<TValue> {
  (): TValue;
}

// Symbol used to access internal node (not exported)
const SIGNAL = Symbol("signal");

let nextId = 0;
let batchDepth = 0;
let activeObserver: ReactiveNode<any> | null = null;
const pendingEffects = new Set<ReactiveNode<any>>();
let pendingMicrotask = false;

/************************ ************************/
/***************** Create Signal *****************/
/************************ ************************/

/**
 * 🧱 Create a fresh node
 */
function createNode<TValue>(
  val: TValue,
  options: {
    name?: string;
    equals?: (a: TValue, b: TValue) => boolean;
    type: (typeof NODE_TYPE)[keyof typeof NODE_TYPE];
    dispose: () => void;
  },
): ReactiveNode<TValue> {
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
    sourceList: [],
    ...options,
  };
}

/**
 * 🛑 Read a value without tracking dependencies
 */
function untrack<T>(fn: () => T): T {
  const prevObserver = activeObserver;
  activeObserver = null;
  try {
    return fn();
  } finally {
    activeObserver = prevObserver;
  }
}

/**
 * 🧭 Track a read dependency
 */
function trackAccess<TValue>(sourceNode: ReactiveNode<TValue>) {
  if (activeObserver) {
    // ✅ Prevent duplicate tracking
    if (!activeObserver.sources.has(sourceNode)) {
      activeObserver.sources.set(sourceNode, sourceNode.version);
      activeObserver.sourceList.push(sourceNode);
      sourceNode.observers.add(activeObserver);
    }
  }
}

/**
 * ⏳ Schedule flush of pending effects
 */
function scheduleMicrotask() {
  if (pendingMicrotask || pendingEffects.size === 0) {
    return;
  }

  pendingMicrotask = true;
  queueMicrotask(() => {
    pendingMicrotask = false;
    // Create a copy to avoid issues if new effects are added during processing
    const effects = Array.from(pendingEffects);
    pendingEffects.clear();
    for (const effect of effects) runNode(effect);
  });
}

/**
 * 📣 Notify observers of a change
 */
function notifyObservers<TValue>(node: ReactiveNode<TValue>) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`📣 notifyObservers: ${node.name || `Node_${node.id}`}`);
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
        pendingEffects.add(observer);
        if (batchDepth === 0) {
          scheduleMicrotask();
        }
      }
    }
  }
}

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
    dispose: () => {
      // Clean up the signal
      if (node.cleanup) {
        node.cleanup();
        node.cleanup = undefined;
      }

      // Remove from dependency graph
      cleanupSources(node);

      // Remove from pending effects
      pendingEffects.delete(node);

      // Remove compute function to mark as disposed
      node.compute = undefined;
    },
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
      // [SIGNAL]: node,
    },
  ) as SignalValue<TValue>;

  // Internal access to node (for system use)
  Object.defineProperty(signal, SIGNAL, {
    value: node,
    enumerable: false,
    writable: false,
  });

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

  return signal;
}

/************************ ************************/
/***************** Create Effect *****************/
/************************ ************************/

/**
 * 🔄 Core computation logic
 * Runs a memo/effect and handles dependency tracking + cleanup
 */
const computationStack: ReactiveNode<unknown>[] = [];

/**
 * 🔁 Remove source links from a node
 */
function cleanupSources<TValue>(node: ReactiveNode<TValue>) {
  // Remove this node as an observer from all its sources
  for (const source of node.sourceList) {
    source.observers.delete(node);
  }

  // Clear all tracked sources
  node.sources = new WeakMap();
  node.sourceList = [];
}

function runNode(node: ReactiveNode<any>) {
  if (!node.compute) return false;

  // 🔁 Detect cycles
  if (computationStack.includes(node)) {
    const cycle = computationStack
      .slice(computationStack.indexOf(node))
      .map((n) => n.name || `Node_${n.id}`)
      .join(" → ");

    const error = new Error(`⚠️ Cycle reference detected: ${cycle}`);
    console.warn(error);
    node.error = error;
    node.dirty = false; // ✅ Stop further propagation

    // Clean up incomplete dependencies to prevent further issues
    cleanupSources(node);
    return false;
  }

  computationStack.push(node);

  // Clean up previous dependencies before recomputing
  const prevCleanup = node.cleanup;
  cleanupSources(node);

  const prevObserver = activeObserver;
  activeObserver = node;

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
    computationStack.pop();
    activeObserver = prevObserver;
  }
}

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
    dispose: () => {
      // Clean up the effect
      if (node.cleanup) {
        node.cleanup();
        node.cleanup = undefined;
      }

      // Remove from dependency graph
      cleanupSources(node);

      // Remove from pending effects
      pendingEffects.delete(node);

      // Remove compute function to mark as disposed
      node.compute = undefined;
    },
  });
  node.compute = fn;
  if (process.env.NODE_ENV !== "production") {
    node.cleanup = () => {
      console.warn(
        `⚠️ Effect '${
          node.name || `Node_${node.id}`
        }' may have leaked — not disposed manually.`,
      );
    };
  }

  // Custom scheduling strategy for this effect
  node.onDirty = () => {
    node.onDirty = undefined; // Reset to prevent reentrance
    if (batchDepth > 0) {
      pendingEffects.add(node);
    } else {
      pendingEffects.add(node);
      scheduleMicrotask();
    }
  };

  // Initial run
  runNode(node);

  // Return disposal function
  return () => {
    // Clean up the effect
    if (node.cleanup) {
      node.cleanup();
      node.cleanup = undefined;
    }

    // Remove from dependency graph
    cleanupSources(node);

    // Remove from pending effects
    pendingEffects.delete(node);

    // Remove compute function to mark as disposed
    node.compute = undefined;
  };
}

function updateIfNecessary<TValue>(node: ReactiveNode<TValue>): boolean {
  if (!node.compute || !node.dirty) return false;

  return runNode(node);
}

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
    dispose: () => {
      // Clean up the memo
      if (node.cleanup) {
        node.cleanup();
        node.cleanup = undefined;
      }

      // Remove from dependency graph
      cleanupSources(node);

      // Remove from pending effects
      pendingEffects.delete(node);

      // Remove compute function to mark as disposed
      node.compute = undefined;
    },
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

  // Internal access to node (for system use)
  Object.defineProperty(memo, SIGNAL, {
    value: node,
    enumerable: false,
    writable: false,
  });

  return memo as MemoValue<TValue>;
}

/**
 * 📦 Batch signals
 */
function batchSignals<TValue>(fn: () => TValue): TValue {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0 && pendingEffects.size > 0) {
      scheduleMicrotask();
    }
  }
}

export { createSignal, createEffect, createMemo, batchSignals, untrack };
export type { SignalValue, SignalOptions, ReactiveNode };
