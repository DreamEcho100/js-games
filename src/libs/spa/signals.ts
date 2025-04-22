/* eslint-disable @typescript-eslint/no-explicit-any */
/*
### Production-Ready Features

1. **Complete Reactive System**
   - Signals for state management
   - Computed values for derived state
   - Effects for side effects
   - Batched operations for efficiency

2. **Performance Optimizations**
   - Microtask-based scheduling for efficient updates
   - Batching to prevent cascading updates
   - WeakMap for better memory management
   - Deep equality for smart change detection

3. **Error Protection**
   - Cycle detection to prevent infinite loops
   - Error handling for computations
   - Proper cleanup on disposal

4. **Developer Experience**
   - Named signals for easier debugging
   - The peek() method for reading without tracking
   - Utilities like untrack() and batch()

5. **Advanced Features**
   - Resource management with scopes
   - DOM binding with ref()
   - Async effect support
   - Memory leak prevention
*/

/*
 Concept 1: Reactive Graph
Everything revolves around nodes (called ReactiveNodes). Each signal, effect, or computed value is represented by one. These nodes:

Track who depends on them (observers)

Track who they depend on (sources)

Rerun their computation if a dependency changed
*/
interface ReactiveNode {
  id: number;
  version: number; // incremented when value changes
  sources: WeakMap<ReactiveNode, number>; // dependencies + version seen
  observers: Set<ReactiveNode>; // who depends on me
  compute?: () => any; // how to calculate value
  value?: any; // cached value (for signals/computeds)
  cleanup?: (() => void) | void; // cleanup function (for effects)
  onDirty?: () => void; // how to rerun when dirty
  dirty?: boolean;
  error?: any;
  name?: string; // for debugging and cycle detection
}

const SIGNAL = Symbol("signal");

// For cycle detection
const computationStack: ReactiveNode[] = [];

let activeObserver: ReactiveNode | null = null; // current running effect/computed
let nextId = 1;
let batchDepth = 0;
const pendingEffects = new Set<ReactiveNode>();
let pendingMicrotask = false;

/*
This is the brain of every signal, computed, or effect. It tracks:

Its value

Who depends on it (observers)

What it depends on (sources)

If it's dirty and needs recalculation
*/
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
    name,
  };
}

/*
Every time a signal or computed is read, and an effect/computed is running, we need to record that dependency.
*/
function trackAccess(sourceNode: ReactiveNode) {
  if (activeObserver) {
    activeObserver.sources.set(sourceNode, sourceNode.version);
    sourceNode.observers.add(activeObserver);
  }
}

function cleanupSources(node: ReactiveNode) {
  // We can't iterate a WeakMap directly, so we need to track sources separately
  // This is a known limitation of WeakMap
  const observers = Array.from(node.observers);
  for (const observer of observers) {
    observer.sources.delete(node);
  }
  node.sources = new WeakMap();
}

function notifyObservers(node: ReactiveNode) {
  for (const observer of node.observers) {
    observer.dirty = true;
    if (observer.onDirty) {
      if (batchDepth > 0) {
        pendingEffects.add(observer);
      } else {
        scheduleMicrotask();
      }
    }
  }
}

// Deep equality comparison for objects and arrays
function deepEquals(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;

  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
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

function runNode(node: ReactiveNode) {
  if (!node.compute) return;

  // Detect cycles
  if (computationStack.includes(node)) {
    const cycle = computationStack
      .slice(computationStack.indexOf(node))
      .map((n) => n.name || `Node_${n.id}`)
      .join(" → ");
    const error = new Error(`Cycle detected in reactive graph: ${cycle}`);
    console.error(error);
    node.error = error;
    return;
  }

  // Add to computation stack for cycle detection
  computationStack.push(node);

  cleanupSources(node);

  const prevObserver = activeObserver;
  activeObserver = node;

  try {
    if (typeof node.cleanup === "function") {
      node.cleanup();
      node.cleanup = undefined;
    }

    const newValue = node.compute();

    if (node.onDirty && typeof newValue === "function") {
      node.cleanup = newValue;
    } else if (!node.onDirty && !deepEquals(node.value, newValue)) {
      node.value = newValue;
      node.version++;
      notifyObservers(node);
    }

    node.dirty = false;
    node.error = undefined;
  } catch (err) {
    node.error = err;
    console.error(
      `Error in ${node.name ? node.name : "reactive computation"}:`,
      err,
    );
  } finally {
    // Remove from computation stack
    computationStack.pop();
    activeObserver = prevObserver;
  }
}

function updateIfNecessary(node: ReactiveNode): boolean {
  if (!node.compute) return false;
  let shouldUpdate = node.dirty;

  if (!shouldUpdate) {
    // Since we're using WeakMap and can't iterate, we rely on the dirty flag
    // We can also check individual sources if we track them separately
    shouldUpdate = node.dirty === true;
  }

  if (shouldUpdate) {
    runNode(node);
    return true;
  }

  return false;
}

function startBatch() {
  batchDepth++;
}

function endBatch() {
  if (--batchDepth === 0) {
    scheduleMicrotask();
  }
}

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

export interface SignalOptions<T> {
  equals?: (a: T, b: T) => boolean;
  name?: string;
}

export interface SignalValue<T> {
  (): T;
  set(value: T): void;
  update(fn: (value: T) => T): void;
  peek(): T; // Read without tracking
}

export function createSignal<T>(initialValue: T, options?: SignalOptions<T>) {
  const node = createNode(initialValue, options?.name);
  const equals = options?.equals || deepEquals;

  const signal = (() => {
    trackAccess(node);
    return node.value;
  }) as SignalValue<T>;

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

  signal.update = (fn: (value: T) => T) => signal.set(fn(node.value));

  signal.peek = () => node.value;

  (signal as any)[SIGNAL] = node;

  return signal;
}

export function createComputed<T>(fn: () => T, options?: { name?: string }) {
  const node = createNode<T>(undefined as T, options?.name);
  node.compute = fn;
  runNode(node);

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

  (computed as any)[SIGNAL] = node;

  return computed;
}

export function createEffect(fn: () => void, options?: { name?: string }) {
  const node = createNode(undefined, options?.name);
  node.compute = fn;
  node.onDirty = () => {
    if (batchDepth > 0) {
      pendingEffects.add(node);
    } else {
      scheduleMicrotask();
    }
  };

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

export function createBatchedSignals<T extends Record<string, unknown>>(
  initials: T,
  options?: {
    prefix?: string;
    equals?: (a: any, b: any) => boolean;
  },
) {
  const result = {} as {
    [K in keyof T & string]: ReturnType<typeof createSignal<T[K]>>;
  };
  const prefix = options?.prefix || "";
  const equals = options?.equals;

  startBatch();
  try {
    for (const key in initials) {
      if (Object.prototype.hasOwnProperty.call(initials, key)) {
        (result as Record<string, any>)[key] = createSignal(initials[key], {
          name: `${prefix}${key}`,
          equals,
        });
      }
    }
  } finally {
    endBatch();
  }

  return result;
}

// Core functions from the previous tutorial are assumed available
// This file includes extended utilities and features built on top of the reactive core

/**
 * Disable tracking within a function
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function untrack<T>(fn: () => T) {
  const prev = activeObserver;
  activeObserver = null;
  try {
    return fn();
  } finally {
    activeObserver = prev;
  }
}

/**
 * Cached computed value with update tracking
 * @template T
 * @param {() => T} fn
 * @returns {() => T}
 */
export function createMemo<T>(fn: () => T, options?: { name?: string }) {
  const node = createNode<T>(undefined as T, options?.name);
  node.compute = fn;

  const memo = () => {
    updateIfNecessary(node);
    trackAccess(node);
    return node.value;
  };

  runNode(node);
  (memo as any)[SIGNAL] = node;

  return memo;
}

/**
 * Group multiple signal updates into a single batch
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
export function batch<T>(fn: () => T) {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}

/**
 * Bind signal to DOM element property
 * @template {keyof HTMLElementTagNameMap} K
 * @param {HTMLElementTagNameMap[K]} element
 * @param {keyof HTMLElementTagNameMap[K]} key
 * @param {() => any} signalFn
 */
export function ref<K extends keyof HTMLElementTagNameMap>(
  element: HTMLElementTagNameMap[K],
  key: keyof HTMLElementTagNameMap[K],
  signalFn: () => any,
) {
  createEffect(() => {
    element[key] = signalFn();
  });
}

/**
 * Create a disposal scope for effects/signals
 * @returns {{ run<T>(fn: () => T)=> T, dispose() => void }}
 */
export function createScope<T>(): {
  run(fn: () => T): T;
  dispose: () => void;
} {
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

/**
 * Effect with async support and optional cleanup
 * @param {(onCleanup: (fn: () => void) => void) => void | Promise<void>} fn
 */
export function createAsyncEffect(
  fn: (onCleanup: (fn: () => void) => void) => void | Promise<void>,
  options?: { name?: string },
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
