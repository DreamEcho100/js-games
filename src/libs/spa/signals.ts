/* eslint-disable @typescript-eslint/no-explicit-any */

import { ChildPrimitive } from "#libs/dom/base.js";

const NODE_TYPE = {
  SIGNAL: 0,
  EFFECT: 1,
  MEMO: 2,
};

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

interface ReactiveNode<TValue> {
  id: number;
  version: number; // incremented when value changes
  sources: Map<ReactiveNode<any>, number>; // dependencies + version seen
  observers: Set<ReactiveNode<any>>; // who depends on me
  // sourceList: ReactiveNode<any>[]; // We can't iterate a WeakMap directly, so we need to track sources separately
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
  // dispose: () => void;
  scopeRef: Scope;
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

let nextScopeId = 0;
let currentScope: Scope = {
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
};

/************************ ************************/
/***************** Create Scope *****************/
/************************ ************************/

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

/**
 * 🧱 Create a new scope
 * @param fn Function to run in the new scope
 */
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

function getScopeId() {
  return currentScope.id;
}
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

/**
 * 🛑 Read a value without tracking dependencies
 */
function untrack<T>(fn: () => T): T {
  const prevObserver = currentScope.activeObserver;
  currentScope.activeObserver = null;
  try {
    return fn();
  } finally {
    currentScope.activeObserver = prevObserver;
  }
}

/**
 * 🧭 Track a read dependency
 */
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

/**
 * 🧹 Flush pending effects on the scope and it's children scopes recursively
 */
function flushPendingEffects(scope: Scope) {
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
 */
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

/**
 * 📣 Notify observers of a change
 */
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

/************************ ************************/
/***************** Create Effect *****************/
/************************ ************************/

/**
 * 🔄 Core computation logic
 * Runs a memo/effect and handles dependency tracking + cleanup
 */
const computationStack: Set<ReactiveNode<unknown>> = new Set();

/**
 * 🔁 Remove source links from a node
 */
function cleanupSources<TValue>(node: ReactiveNode<TValue>) {
  // Remove this node as an observer from all its sources
  for (const [source] of node.sources) {
    source.observers.delete(node);
  }

  // Clear all tracked sources
  node.sources = new Map();
}

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
export {
  createScope,
  disposeScope,
  getScopeId,
  createSignal,
  createEffect,
  createMemo,
  batchSignals,
  untrack,
};
export type { SignalValue, SignalOptions, ReactiveNode };

// ========== Reactive DOM Components ==========
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

      prevAnchor = newNodes.get(nodeKey)?.elems[0] ?? prevAnchor;
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

export { List, Visible, Switch };
